# Architecture Deep Dive

## System Overview

Nostdlib is a **Blazor WebAssembly** single-page application built with .NET 10.0. It runs entirely in the browser — the .NET runtime is compiled to WebAssembly, so there is no server-side rendering after initial load.

| | |
|---|---|
| **Runtime** | .NET 10.0 on WebAssembly (client-side only) |
| **UI Framework** | Blazor Components (Razor syntax) |
| **State** | Service-level state with event-driven propagation |
| **Data** | Static JSON files fetched via HttpClient |
| **Styling** | CSS custom properties + Blazor scoped CSS |
| **i18n** | Custom JSON-based localization (3 languages) |
| **PWA** | Service worker with content-hash caching |

---

## Request Lifecycle

What happens from URL to pixels:

```
Browser navigates to https://nostdlib.com/
         │
         ▼
┌─────────────────────────────────────────────────┐
│  wwwroot/index.html                             │
│  ├── Loads css/app.css (global styles)          │
│  ├── Loads Nostdlib.styles.css (scoped CSS)     │
│  ├── Loads js/site.js (JS interop functions)    │
│  ├── Loads _framework/blazor.webassembly.js     │
│  │   └── Downloads .NET WASM runtime + app DLLs │
│  └── Registers service worker                   │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Program.cs (entry point)                       │
│  ├── Register services in DI container          │
│  ├── localizationService.InitializeAsync()      │
│  │   ├── Load data/en/locale.json (fallback)    │
│  │   ├── Read localStorage("language")          │
│  │   └── Load data/{saved}/locale.json          │
│  └── host.RunAsync()                            │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  App.razor (Router)                             │
│  ├── URL "/" matches Home.razor (@page "/")     │
│  └── Renders inside MainLayout.razor            │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Home.razor                                     │
│  ├── <Navbar />     → scroll detection, nav     │
│  ├── <Hero />       → typing animation          │
│  ├── <Careers />    → fetches jobs, renders      │
│  ├── <Contact />    → fetches links, renders     │
│  └── <Footer />     → branding, copyright        │
└─────────────────────────────────────────────────┘
```

---

## Dependency Injection

All services are registered in `Program.cs`:

```csharp
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<IDataService, JsonDataService>();
builder.Services.AddScoped<ILocalizationService, LocalizationService>();
```

**Important**: In Blazor WebAssembly, `Scoped` = `Singleton`. There is only one DI scope (the browser tab). Every component gets the same service instance — this is why the event-driven pattern works for cross-component communication.

### Service Dependency Graph

```
Program.cs (registers all)
     │
     ├── HttpClient
     │      │
     │      ├──► LocalizationService (fetches locale JSON)
     │      └──► JsonDataService (fetches data JSON)
     │
     ├── ILocalizationService ──► LocalizationService
     │      │                       ├── Uses HttpClient
     │      │                       ├── Uses IJSRuntime (localStorage)
     │      │                       └── Fires OnLanguageChanged event
     │      │
     │      └── Consumed by: Navbar, Hero, Careers, Contact, Footer,
     │          LanguageSelector, Error, NotFound, JsonDataService
     │
     └── IDataService ──► JsonDataService
            │                ├── Uses HttpClient
            │                ├── Uses ILocalizationService (current language)
            │                └── Subscribes to OnLanguageChanged (cache invalidation)
            │
            └── Consumed by: Careers, Contact
```

### How Components Get Services

Components use `@inject` directives:

```razor
@inject ILocalizationService L        @* Translation service *@
@inject IDataService DataService      @* Data fetching service *@
@inject IJSRuntime JS                 @* JavaScript interop *@
```

These resolve from the same DI container registered in `Program.cs`.

---

## Component Hierarchy

```
App.razor
└── Router
    ├── [Found] → RouteView + MainLayout
    │   ├── Home.razor (/)
    │   │   ├── Navbar.razor
    │   │   │   └── LanguageSelector.razor
    │   │   ├── Hero.razor
    │   │   ├── Careers.razor
    │   │   │   └── Slider.razor<JobPosition>
    │   │   ├── Contact.razor
    │   │   │   ├── LinkedInIcon.razor
    │   │   │   ├── GitHubIcon.razor
    │   │   │   └── ArrowIcon.razor
    │   │   └── Footer.razor
    │   ├── Error.razor (/Error)
    │   └── NotFound.razor (/not-found)
    │
    └── [NotFound] → "Sorry, there's nothing at this address."
```

---

## Data Flow

### Translation Data Flow

```
wwwroot/data/{lang}/locale.json
         │
         ▼ (HttpClient.GetFromJsonAsync)
LocalizationService._currentResources (Dictionary<string, string>)
         │
         ▼ (indexer: service["key"])
Component: @L["Hero.Title"]
         │
         ▼ (Blazor rendering)
<h1>SECURITY WITHOUT COMPROMISE</h1>
```

### Entity Data Flow

```
wwwroot/data/{lang}/careers.json
         │
         ▼ (HttpClient.GetFromJsonAsync<List<JobPosition>>)
JsonDataService._cache["JobPosition"]
         │
         ▼ (GetJobPositionsAsync())
Careers.razor: CurrentOpenings list
         │
         ▼ (foreach in Slider<JobPosition>)
<div class="opening-card">DevSecOps Engineer...</div>
```

### Caching Strategy

```
Request: GetJobPositionsAsync()
    │
    ├── Cache hit + same language? → Return cached List<T>
    │
    ├── Cache miss:
    │   ├── Try: data/{currentLang}/careers.json
    │   ├── Fail? Try: data/en/careers.json (English fallback)
    │   ├── Fail? Return empty List<T>
    │   └── Store result in cache + record language
    │
    └── Language changes → OnLanguageChanged fires → ClearCache()
        → Next request re-fetches for new language
```

---

## Event System

The localization event is the primary cross-component communication mechanism:

```
User clicks "RU" in LanguageSelector
         │
         ▼
LanguageSelector: Localization.SetLanguageAsync("ru")
         │
         ▼
LocalizationService.SetLanguageAsync("ru"):
  1. Load data/ru/locale.json → _currentResources
  2. localStorage.setItem("language", "ru")
  3. OnLanguageChanged?.Invoke()  ←── fires the event
         │
         ▼ (event propagates to all subscribers)
  ┌──────┼──────┬──────┬──────┬──────┬──────┐
  ▼      ▼      ▼      ▼      ▼      ▼      ▼
Navbar  Hero  Careers Contact Footer Error  JsonDataService
  │      │      │      │      │      │      │
  │      │      │      │      │      │      └── ClearCache()
  │      │      ├──────┤      │      │
  │      │      ▼      ▼      │      │
  │      │   Re-fetch data    │      │
  │      │   from JSON files  │      │
  │      │                    │      │
  └──────┴────────────────────┴──────┘
              │
              ▼
    InvokeAsync(StateHasChanged)
              │
              ▼
    Components re-render with new translations
```

### The Subscribe/Unsubscribe Pattern

Every component that displays localized text follows this exact pattern:

```csharp
// Subscribe when component mounts
protected override void OnInitialized()
{
    L.OnLanguageChanged += OnLanguageChanged;
}

// Trigger re-render when language changes
private void OnLanguageChanged()
{
    InvokeAsync(StateHasChanged);  // Must use InvokeAsync — event fires outside render cycle
}

// Unsubscribe when component is destroyed (prevents memory leaks)
public void Dispose()
{
    L.OnLanguageChanged -= OnLanguageChanged;
}
```

---

## Routing

### How It Works

`App.razor` contains the Blazor Router:

```razor
<Router AppAssembly="@typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
    </Found>
    <NotFound>
        <LayoutView Layout="@typeof(MainLayout)">
            <p>Sorry, there's nothing at this address.</p>
        </LayoutView>
    </NotFound>
</Router>
```

The Router scans for `@page` directives at startup:

| Directive | Component | URL |
|---|---|---|
| `@page "/"` | `Pages/Home.razor` | `https://nostdlib.com/` |
| `@page "/Error"` | `Pages/Error.razor` | `https://nostdlib.com/Error` |
| `@page "/not-found"` | `Pages/NotFound.razor` | `https://nostdlib.com/not-found` |

### Anchor Navigation

The site uses hash-based anchors for in-page navigation:

```csharp
// Constants/Routes.cs
public const string Home = "/";
public const string Careers = "#careers";   // scrolls to <section id="careers">
public const string Contact = "#contact";   // scrolls to <section id="contact">
```

---

## CSS Architecture

### Layer Structure

```
wwwroot/css/
├── app.css                    # Entry point: @import for all other files
├── base/
│   ├── _variables.css         # CSS custom properties (colors, fonts, spacing)
│   ├── _reset.css             # Browser reset / normalization
│   └── _utilities.css         # Helper classes
└── components/
    ├── _buttons.css           # Button styles
    ├── _forms.css             # Form elements
    ├── _sections.css          # Section layout
    ├── _loading.css           # Loading spinner
    └── ...
```

### Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --primary-color: #00ffcc;        /* Cyan/green — main brand color */
  --secondary-color: #6600ff;      /* Purple — accent color */
  --accent-gradient: linear-gradient(135deg, #00ffcc 0%, #6600ff 100%);

  /* Backgrounds (dark theme) */
  --dark-bg: #050510;              /* Page background */
  --darker-bg: #030308;            /* Deeper sections */
  --card-bg: #0a0a15;              /* Card surfaces */

  /* Text */
  --text-primary: #e8e8ff;         /* Main text */
  --text-secondary: #9999bb;       /* Secondary text */
  --text-muted: #666688;           /* Muted/disabled text */

  /* Typography */
  --font-display: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Scoped CSS

Each component can have a matching `.razor.css` file:
- `Navbar.razor` → `Navbar.razor.css`
- Blazor auto-generates unique `b-XXXXXXXX` attributes for CSS isolation
- Scoped styles only apply to that component's elements
- Compiled into `Nostdlib.styles.css` at build time

---

## State Management

There is **no dedicated state store** (no Redux/Zustand equivalent). State lives in services:

| State | Location | Scope |
|---|---|---|
| Current language | `LocalizationService._currentLanguage` | App-wide singleton |
| Translation strings | `LocalizationService._currentResources` | App-wide singleton |
| Cached job data | `JsonDataService._cache` | App-wide singleton |
| Scroll position | `Navbar.razor` local state | Component instance |
| Mobile menu open | `Navbar.razor` local state | Component instance |
| Typing animation | `Hero.razor` local state | Component instance |
| Current slide | `Slider.razor` local state | Component instance |

Cross-component communication uses the **event pattern**: services expose `event Action?` events, and components subscribe/unsubscribe via lifecycle methods.

---

## Security Considerations

| Area | How it's handled |
|---|---|
| **XSS** | Blazor auto-escapes all `@expressions` in markup. No raw HTML injection by default. |
| **Content integrity** | Production service worker verifies content hashes from the asset manifest |
| **Data** | All data is static JSON — no user input stored server-side |
| **localStorage** | Only stores language preference (non-sensitive) |
| **External links** | All use `target="_blank" rel="noopener noreferrer"` |
| **JS interop** | Limited surface: scroll listener, touch handler, localStorage. No eval of user data. |

---

## What to Read Next

- **[COMPONENTS.md](COMPONENTS.md)** — how to build components following project patterns
- **[LOCALIZATION.md](LOCALIZATION.md)** — deep dive into the i18n system
- **[JS-INTEROP.md](JS-INTEROP.md)** — how C# and JavaScript communicate
- **[DATA-LAYER.md](DATA-LAYER.md)** — how data flows from JSON to UI
