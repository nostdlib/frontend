# Blazor Component Guide

How to build components in this project — from basic concepts to the advanced patterns used throughout the codebase.

---

## Component Basics

A `.razor` file is a Blazor component. It combines HTML markup with C# code:

```razor
@* Directives *@
@inject ILocalizationService L

@* Markup *@
<h1>@L["Title"]</h1>
<p>Current year: @DateTime.Now.Year</p>

@* Code *@
@code {
    private string message = "Hello";
}
```

Every `.razor` file compiles to a C# class. `Shared/Footer.razor` becomes `Nostdlib.Shared.Footer`.

---

## Component Hierarchy

```
App.razor (Router)
└── MainLayout.razor (@Body placeholder)
    └── Home.razor (/ route)
        ├── Navbar.razor
        │   └── LanguageSelector.razor
        ├── Hero.razor
        ├── Careers.razor
        │   └── Slider.razor<JobPosition>
        ├── Contact.razor
        │   ├── LinkedInIcon.razor
        │   ├── GitHubIcon.razor
        │   └── ArrowIcon.razor
        └── Footer.razor
```

---

## Lifecycle Methods

| Method | When it fires | Used for |
|---|---|---|
| `OnInitialized()` | Component created (sync) | Subscribe to events, set initial state |
| `OnInitializedAsync()` | Component created (async) | Fetch data on first load |
| `OnParametersSet()` | Parameters changed | React to parent data changes |
| `OnAfterRenderAsync(firstRender)` | After DOM render (async) | JS interop setup (DOM must exist) |
| `Dispose()` | Component destroyed | Unsubscribe from events, cleanup |
| `DisposeAsync()` | Component destroyed (async) | Cleanup JS interop resources |

### What this project uses:

- **`OnInitialized`** — Every localized component subscribes to `OnLanguageChanged`
- **`OnInitializedAsync`** — Data-driven components fetch initial data (Careers, Contact)
- **`OnAfterRenderAsync`** — JS interop setup (Navbar scroll, Slider touch)
- **`Dispose`** — Every subscribed component unsubscribes from events
- **`DisposeAsync`** — Slider disposes JS touch handlers

---

## The 5 Component Patterns

### Pattern 1: Pure Presentational (Icon Components)

Simplest pattern — just markup and optional parameters.

`Components/Icons/ArrowIcon.razor`:
```razor
<svg width="@Size" height="@Size" viewBox="0 0 24 24">
    <path d="..." />
</svg>

@code {
    [Parameter] public int Size { get; set; } = 20;
}
```

**When to use**: SVG icons, static UI elements, anything with no logic or data.

---

### Pattern 2: Localized Section (Footer, Error, NotFound)

Displays translated text and re-renders when language changes.

```razor
@inject ILocalizationService L
@implements IDisposable

<footer>
    <span>@AppConstants.CompanyName</span>
    <span>&copy; @DateTime.Now.Year @L["Footer.Rights"]</span>
    <span>@L["Footer.Tagline"]</span>
</footer>

@code {
    protected override void OnInitialized()
    {
        L.OnLanguageChanged += OnLanguageChanged;
    }

    private void OnLanguageChanged()
    {
        InvokeAsync(StateHasChanged);
    }

    public void Dispose()
    {
        L.OnLanguageChanged -= OnLanguageChanged;
    }
}
```

**When to use**: Any section that displays translated strings but doesn't fetch data.

---

### Pattern 3: Data-Driven (Careers, Contact)

Fetches data from a service AND handles localization.

```razor
@inject IDataService DataService
@inject ILocalizationService L
@implements IDisposable

<section id="careers">
    <h2>@L["Careers.Title"]</h2>
    @foreach (var job in CurrentOpenings)
    {
        <div>@job.Title — @job.Level</div>
    }
</section>

@code {
    private List<JobPosition> CurrentOpenings = new();

    protected override async Task OnInitializedAsync()
    {
        L.OnLanguageChanged += OnLanguageChanged;
        CurrentOpenings = await DataService.GetJobPositionsAsync();
    }

    private async void OnLanguageChanged()
    {
        CurrentOpenings = await DataService.GetJobPositionsAsync();
        await InvokeAsync(StateHasChanged);
    }

    public void Dispose()
    {
        L.OnLanguageChanged -= OnLanguageChanged;
    }
}
```

**When to use**: Sections that display data from JSON files and need to reload on language change.

---

### Pattern 4: JS Interop (Navbar, Slider)

Communicates with JavaScript for browser APIs.

```razor
@inject IJSRuntime JS
@implements IDisposable

@code {
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)  // Only setup once, after DOM exists
        {
            await JS.InvokeVoidAsync("setupScrollListener",
                DotNetObjectReference.Create(this));
        }
    }

    [JSInvokable]  // JS can call this method
    public void OnScroll(double scrollY)
    {
        IsScrolled = scrollY > 50;
        StateHasChanged();
    }
}
```

**When to use**: When you need browser APIs (scroll, touch, clipboard, etc.) that C# can't access directly.

---

### Pattern 5: Generic/Templated (Slider)

Works with any data type using `@typeparam`.

```razor
@typeparam TItem

<div class="slider">
    @foreach (var item in Items)
    {
        <div class="slide">@ItemTemplate(item)</div>
    }
</div>

@code {
    [Parameter, EditorRequired]
    public IList<TItem> Items { get; set; } = new List<TItem>();

    [Parameter, EditorRequired]
    public RenderFragment<TItem> ItemTemplate { get; set; } = default!;
}
```

Usage by parent:
```razor
<Slider Items="jobs" TItem="JobPosition">
    <ItemTemplate Context="job">
        <div class="card">@job.Title</div>
    </ItemTemplate>
</Slider>
```

**When to use**: Reusable container components (carousels, lists, grids) that work with any data type.

---

## Walkthrough: Creating a New Section

**Example**: Adding a "Team" section to the landing page.

### Step 1: Create the component file

`Shared/Team.razor`:
```razor
@inject ILocalizationService L
@implements IDisposable

<section class="team" id="team">
    <div class="container">
        <h2>@L["Team.Title"]</h2>
        <p>@L["Team.Subtitle"]</p>
    </div>
</section>

@code {
    protected override void OnInitialized()
    {
        L.OnLanguageChanged += OnLanguageChanged;
    }

    private void OnLanguageChanged()
    {
        InvokeAsync(StateHasChanged);
    }

    public void Dispose()
    {
        L.OnLanguageChanged -= OnLanguageChanged;
    }
}
```

### Step 2: Add scoped CSS

`Shared/Team.razor.css`:
```css
.team { padding: 6rem 0; }
.team h2 { color: var(--text-primary); }
```

### Step 3: Add translation keys to ALL locale files

`wwwroot/data/en/locale.json`: `"Team.Title": "Our Team"`
`wwwroot/data/ru/locale.json`: `"Team.Title": "Наша команда"`
`wwwroot/data/hy/locale.json`: `"Team.Title": "Մեր թիմը"`

### Step 4: Add to the landing page

`Pages/Home.razor`:
```razor
<Navbar />
<Hero />
<Team />          @* ← New section *@
<Careers />
<Contact />
<Footer />
```

### Step 5: (Optional) Add navigation

`Constants/Routes.cs`: `public const string Team = "#team";`

`Shared/Navbar.razor`:
```razor
<li class="nav-item">
    <a href="@Routes.Team" class="nav-link">@L["Nav.Team"]</a>
</li>
```

---

## Walkthrough: Creating a New Page

### Step 1: Create the page

`Pages/About.razor`:
```razor
@page "/about"
<PageTitle>About - NOSTDLIB</PageTitle>
<Navbar />
<section class="about">
    <div class="container">
        <h1>About Us</h1>
    </div>
</section>
<Footer />
```

The `@page "/about"` directive registers the route automatically — no other config needed.

### Step 2: Add route constant

`Constants/Routes.cs`: `public const string About = "/about";`

---

## Parameters

| Type | Syntax | Example |
|---|---|---|
| Basic | `[Parameter] public int Size { get; set; } = 20;` | Icon size |
| Required | `[Parameter, EditorRequired] public string Title { get; set; } = "";` | Slider items |
| Render fragment | `[Parameter] public RenderFragment<TItem> ItemTemplate { get; set; }` | Slider template |
| Event callback | `[Parameter] public EventCallback<string> OnSelected { get; set; }` | Child→parent |

---

## Available Services

| Service | Inject as | Purpose |
|---|---|---|
| `ILocalizationService` | `@inject ILocalizationService L` | Translations, language switching |
| `IDataService` | `@inject IDataService DataService` | Job positions, social links |
| `IJSRuntime` | `@inject IJSRuntime JS` | Call JavaScript from C# |
| `HttpClient` | `@inject HttpClient Http` | Direct HTTP requests |
| `NavigationManager` | `@inject NavigationManager Nav` | URL navigation |

---

## Common Mistakes

| Mistake | What happens | Fix |
|---|---|---|
| Forgot `@implements IDisposable` | Memory leak — events fire to dead components | Always add when subscribing to events |
| Used `StateHasChanged()` in event handler | Exception: wrong synchronization context | Use `InvokeAsync(StateHasChanged)` |
| Called JS interop in `OnInitialized` | Exception: JS not ready, DOM doesn't exist | Use `OnAfterRenderAsync(firstRender)` |
| Forgot `if (firstRender)` check | JS setup runs on every re-render | Guard with `if (firstRender)` |
| Missing `EditorRequired` on required params | No compile error when parent omits it | Add `[EditorRequired]` attribute |
| Added locale key to `en/` only | Other languages silently fall back to English | Always update all 3 locale.json files |
