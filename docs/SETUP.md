# Development Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0+ | Build and run the Blazor WebAssembly app |
| [VS Code](https://code.visualstudio.com/) | Latest | Code editor (install "C# Dev Kit" extension) |
| Git | Any | Version control |

Alternative editors: JetBrains Rider (open `Nostdlib.sln` directly) or Visual Studio 2022+.

---

## Quick Start

```bash
git clone https://github.com/nostdlib/frontend.git
cd frontend
dotnet restore
dotnet watch run
```

Open **http://localhost:5170** in your browser. The app hot-reloads on file changes.

### Key Commands

| Command | What it does |
|---|---|
| `dotnet watch run` | Run with hot reload (development) |
| `dotnet build` | Compile without running |
| `dotnet publish -c Release` | Production build (output: `bin/Release/net10.0/publish/wwwroot/`) |
| `dotnet clean` | Remove build artifacts |
| `dotnet restore` | Restore NuGet packages |

---

## Project Structure

```
frontend/
├── Program.cs                          # App entry point: DI registration, localization init
├── App.razor                           # Root router: maps URLs to pages via MainLayout
├── _Imports.razor                      # Global @using directives (15 namespaces)
├── Nostdlib.csproj                     # .NET project file: packages, target framework
├── Nostdlib.sln                        # Solution file (open this in Rider/VS)
│
├── Layout/
│   └── MainLayout.razor                # Root layout shell: just renders @Body
│
├── Pages/                              # Routed page components (have @page directive)
│   ├── Home.razor                      # / — landing page, composes all sections
│   ├── Error.razor                     # /Error — localized error display
│   └── NotFound.razor                  # /not-found — localized 404
│
├── Shared/                             # Reusable UI section components
│   ├── Navbar.razor        (+.css)     # Navigation bar with scroll detection
│   ├── Hero.razor          (+.css)     # Hero banner with typing animation
│   ├── Careers.razor       (+.css)     # Job listings in carousel
│   ├── Contact.razor       (+.css)     # Social link cards
│   ├── Footer.razor        (+.css)     # Footer with branding
│   ├── LanguageSelector.razor (+.css)  # Language dropdown
│   └── Slider.razor        (+.css)     # Generic carousel component
│
├── Components/Icons/                   # SVG icon components
│   ├── ArrowIcon.razor                 # Diagonal arrow
│   ├── GitHubIcon.razor                # GitHub logo
│   └── LinkedInIcon.razor              # LinkedIn logo
│
├── Services/                           # Business logic layer
│   ├── IDataService.cs                 # Data service interface
│   ├── JsonDataService.cs              # Implementation: JSON + HTTP + caching
│   ├── ILocalizationService.cs         # Localization interface + LanguageInfo record
│   └── LocalizationService.cs          # Implementation: JSON locales + localStorage
│
├── Models/                             # Data transfer objects
│   ├── JobPosition.cs                  # Job listing record type
│   └── SocialLink.cs                   # Social link record type
│
├── Constants/
│   ├── AppConstants.cs                 # Company name, URLs, SEO metadata
│   └── Routes.cs                       # Route constants: /, #careers, #contact
│
├── Properties/
│   └── launchSettings.json             # Dev server ports and configuration
│
└── wwwroot/                            # Static files served to browser
    ├── index.html                      # HTML shell: loads Blazor runtime + site.js
    ├── css/                            # Global stylesheets
    │   ├── app.css                     # Main CSS entry point (imports everything)
    │   ├── base/                       # _variables.css, _reset.css, _utilities.css
    │   └── components/                 # Shared component styles (buttons, forms, etc.)
    ├── js/
    │   └── site.js                     # JS interop: scroll listener, touch swipe, file download
    ├── data/                           # Localized JSON data files
    │   ├── en/                         # English: locale.json, careers.json, social-links.json
    │   ├── ru/                         # Russian
    │   └── hy/                         # Armenian
    ├── service-worker.js               # Dev service worker (no-op, no caching)
    ├── service-worker.published.js     # Production service worker (full caching)
    ├── manifest.json                   # PWA manifest
    └── favicon.svg                     # Site icon
```

---

## How the App Boots

Understanding the startup sequence helps when debugging:

```
1. Browser loads wwwroot/index.html
          │
2. <script src="_framework/blazor.webassembly.js"> downloads .NET runtime + app DLLs
          │
3. Program.cs runs:
   ├── Creates WebAssemblyHostBuilder
   ├── Registers root components: App (#app), HeadOutlet (head::after)
   ├── Registers DI services:
   │   ├── HttpClient (scoped, base address = host)
   │   ├── IDataService → JsonDataService (scoped)
   │   └── ILocalizationService → LocalizationService (scoped)
   ├── Calls AddLocalization()
   ├── Builds host
   ├── Calls LocalizationService.InitializeAsync()
   │   ├── Loads English fallback from data/en/locale.json
   │   ├── Reads saved language from localStorage
   │   └── Loads saved language's resources
   └── Calls host.RunAsync()
          │
4. App.razor mounts as root component
   └── Router inspects URL, matches @page directive
          │
5. Matched page renders inside MainLayout.razor
   └── Home.razor (for /) renders: Navbar → Hero → Careers → Contact → Footer
```

---

## Understanding .razor Files

Blazor `.razor` files combine three things in one file:

```razor
@* 1. DIRECTIVES — at the top *@
@page "/example"                    @* URL route (pages only) *@
@inject ILocalizationService L      @* Dependency injection *@
@implements IDisposable             @* Interface implementation *@

@* 2. MARKUP — HTML with C# expressions *@
<h1>@L["Some.Key"]</h1>
<p>@DateTime.Now.Year</p>

@* 3. CODE — C# logic *@
@code {
    private string message = "Hello";

    protected override void OnInitialized()
    {
        // Lifecycle method — runs when component initializes
    }
}
```

Each `.razor` file can have a matching `.razor.css` for scoped styles that only apply to that component.

---

## IDE Setup

### VS Code
1. Install the **C# Dev Kit** extension
2. Open the `frontend/` folder (or `Nostdlib.sln`)
3. Trust the workspace when prompted
4. IntelliSense, debugging, and hot reload will work automatically

### JetBrains Rider
1. Open `Nostdlib.sln`
2. Razor support is built-in
3. Run/debug configurations are auto-detected from `launchSettings.json`

---

## Configuration Files

| File | Purpose |
|---|---|
| `Nostdlib.csproj` | NuGet packages, target framework (net10.0), PWA settings |
| `Properties/launchSettings.json` | Dev server ports, environment settings |
| `appsettings.json` | App configuration (currently minimal) |
| `appsettings.Development.json` | Dev-specific overrides |
| `wwwroot/manifest.json` | PWA manifest (app name, icons, theme color) |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `dotnet: command not found` | Install .NET 10.0 SDK from https://dotnet.microsoft.com/download |
| Port already in use | Edit port in `Properties/launchSettings.json` |
| CSS changes not showing | Scoped CSS needs a build: run `dotnet build`, then refresh |
| JS interop errors in console | Ensure `js/site.js` loads before `blazor.webassembly.js` in `index.html` |
| Blank page on load | Check browser console for .NET runtime download errors |
| Localization keys showing raw | Check `wwwroot/data/{lang}/locale.json` exists and is valid JSON |
| Hot reload not working | Use `dotnet watch run` (not just `dotnet run`) |

---

## What to Read Next

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the whole system fits together
2. **[COMPONENTS.md](COMPONENTS.md)** — how to build and modify Blazor components
3. **[LOCALIZATION.md](LOCALIZATION.md)** — how the multi-language system works
4. **[ONBOARDING.md](ONBOARDING.md)** — high-level overview with guided tour
5. **Interactive Dashboard** — `cd docs/dashboard && python3 -m http.server 8000`
