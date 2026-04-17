# Nostdlib - Onboarding Guide

Welcome to the **Nostdlib** codebase! This guide will help you understand the project structure, architecture, and key concepts so you can start contributing effectively.

---

## Project Overview

| | |
|---|---|
| **Name** | Nostdlib |
| **Type** | Blazor WebAssembly Frontend |
| **Framework** | .NET 10.0, Blazor WebAssembly |
| **Languages** | C# (primary), JavaScript (interop & PWA) |
| **Key Libraries** | Microsoft.AspNetCore.Components.WebAssembly, Microsoft.Extensions.Localization |
| **Features** | Multi-language localization (EN/RU/AM), Progressive Web App (PWA), Service Worker caching |

Nostdlib is a company website frontend built as a Blazor WebAssembly single-page application. It features a landing page with hero section, careers listings, contact information, and full internationalization support across three languages.

---

## Architecture Layers

The codebase is organized into 7 distinct layers, from top-level bootstrapping down to browser infrastructure:

### 1. Entry & Config (4 files)

Application entry point, root router, global imports, and layout shell. These files bootstrap the Blazor WebAssembly app, configure dependency injection, and define the rendering pipeline.

| File | Purpose |
|---|---|
| `Program.cs` | Entry point: configures DI (HttpClient, IDataService, ILocalizationService), initializes language preference, runs app |
| `App.razor` | Root component: hosts the Router, maps URLs to pages via MainLayout, provides "Not found" fallback |
| `_Imports.razor` | Global `@using` directives for all Nostdlib namespaces — eliminates per-file imports |
| `Layout/MainLayout.razor` | Minimal layout shell inheriting LayoutComponentBase, renders `@Body` only |

### 2. Pages (3 files)

Routed page components corresponding to top-level URL routes.

| File | Route | Purpose |
|---|---|---|
| `Pages/Home.razor` | `/` | Landing page — composes Navbar, Hero, Careers, Contact, Footer in sequence |
| `Pages/Error.razor` | `/Error` | Localized error page with warning symbol and return-home button |
| `Pages/NotFound.razor` | `/not-found` | Localized 404 page |

### 3. Shared UI Sections (7 files)

Reusable section-level components forming the major visual blocks of the site.

| File | Purpose |
|---|---|
| `Shared/Navbar.razor` | Responsive navbar with scroll-aware styling, mobile hamburger menu, localized links, embedded LanguageSelector |
| `Shared/Hero.razor` | Animated typing effect cycling through localized title text with cybersecurity-themed decorative backgrounds |
| `Shared/Careers.razor` | Fetches job positions via IDataService, renders in Slider carousel with job details and LinkedIn apply link |
| `Shared/Contact.razor` | Fetches social links via IDataService, renders as clickable cards with brand icons |
| `Shared/Footer.razor` | Brand logo, company name, dynamic copyright year, localized rights text and tagline |
| `Shared/LanguageSelector.razor` | Dropdown for switching app language via ILocalizationService |
| `Shared/Slider.razor` | Generic infinite-loop carousel with CSS transforms, clone-based wrapping, touch swipe via JS interop |

### 4. Icon Components (3 files)

Pure presentational SVG icon components with a single `Size` parameter and no service dependencies.

| File | Icon |
|---|---|
| `Components/Icons/ArrowIcon.razor` | Diagonal arrow (upper-right) |
| `Components/Icons/GitHubIcon.razor` | GitHub logo |
| `Components/Icons/LinkedInIcon.razor` | LinkedIn logo |

### 5. Services (4 files)

Service interfaces and implementations providing data access and localization, injected via DI.

| File | Purpose |
|---|---|
| `Services/ILocalizationService.cs` | Interface: language switching, initialization, change notification, LanguageInfo record |
| `Services/LocalizationService.cs` | Implementation: JSON locale files via HttpClient, localStorage persistence, English fallback, OnLanguageChanged event |
| `Services/IDataService.cs` | Interface: async retrieval of job positions and social links, cache clearing |
| `Services/JsonDataService.cs` | Implementation: JSON data files via HttpClient, language-aware caching, auto cache invalidation on language change |

### 6. Data Models & Constants (4 files)

Foundational types with no upstream dependencies, consumed by services and components.

| File | Purpose |
|---|---|
| `Models/JobPosition.cs` | Record: id, code, title, level, location, type, description, requirements |
| `Models/SocialLink.cs` | Record: name, URL, description, icon type |
| `Constants/Routes.cs` | Static route constants: Home (`/`), Careers (`#careers`), Contact (`#contact`) |
| `Constants/AppConstants.cs` | Branding (company name, tagline, logo symbol), social URLs, SEO metadata |

### 7. Client Infrastructure (3 files)

Browser-side JavaScript utilities and PWA service workers.

| File | Purpose |
|---|---|
| `wwwroot/js/site.js` | JS interop: scroll listener for Navbar, touch swipe handler for Slider, base64 file download helper |
| `wwwroot/service-worker.js` | Development stub: no-op fetch handler (no caching) |
| `wwwroot/service-worker.published.js` | Production: content-hash precaching, network-first navigation with offline fallback, cache-first static assets |

---

## Key Concepts

### Component Composition
The project follows Blazor's composition-over-inheritance pattern. `Home.razor` has zero logic — it purely declares child components in markup order. Each section component manages its own data fetching and state.

### Event-Driven Localization
The localization system uses a pub/sub pattern: `LocalizationService` fires `OnLanguageChanged` events, and every localized component subscribes in `OnInitialized` and unsubscribes via `IDisposable.Dispose()`. Adding a new language requires only a new JSON locale file.

### JS Interop Bridge
Blazor components interact with browser APIs through `IJSRuntime`. The pattern is:
1. C# passes a `DotNetObjectReference` to a JS function
2. JS stores the reference and calls back via `invokeMethodAsync`
3. The C# method is marked `[JSInvokable]`

This is used for scroll detection (Navbar) and touch gestures (Slider).

### Generic Data Loading
`JsonDataService.LoadDataAsync<T>` is a single generic method that handles fetching, deserializing, caching, and English fallback for any entity type — avoiding duplicate logic for different data types.

### Interface-Based DI
All services use interface/implementation pairs (`IDataService`/`JsonDataService`, `ILocalizationService`/`LocalizationService`) registered in `Program.cs`. This enables testability and swappable implementations.

---

## Guided Tour

Follow these steps to understand the codebase from entry point to infrastructure:

| Step | Title | Key Files |
|---|---|---|
| 1 | **Bootstrapping the App** | `Program.cs` — DI registration, language initialization, app startup |
| 2 | **Router and Layout** | `App.razor`, `MainLayout.razor`, `_Imports.razor` — URL routing and layout shell |
| 3 | **Landing Page Composition** | `Pages/Home.razor` — see how sections are composed together |
| 4 | **Scroll-Aware Navbar** | `Shared/Navbar.razor` — JS interop for scroll detection, LanguageSelector |
| 5 | **Hero Typing Animation** | `Shared/Hero.razor` — Timer-based typewriter effect with localization |
| 6 | **Careers & Generic Slider** | `Shared/Careers.razor`, `Shared/Slider.razor` — data-driven carousel with touch support |
| 7 | **Contact & Icons** | `Shared/Contact.razor`, `Components/Icons/` — social links with SVG icons |
| 8 | **Footer & Constants** | `Shared/Footer.razor`, `Constants/AppConstants.cs` — branding and configuration |
| 9 | **Localization Service** | `Services/ILocalizationService.cs`, `Services/LocalizationService.cs` — multi-language system |
| 10 | **Data Service** | `Services/IDataService.cs`, `Services/JsonDataService.cs` — JSON data with caching |
| 11 | **Data Models** | `Models/JobPosition.cs`, `Models/SocialLink.cs` — C# record types |
| 12 | **Client Infrastructure** | `wwwroot/js/site.js`, service workers — JS interop and PWA |

---

## File Map

```
Nostdlib/
├── Program.cs                          # App entry point, DI config
├── App.razor                           # Root router component
├── _Imports.razor                      # Global @using directives
├── Layout/
│   └── MainLayout.razor                # Root layout shell
├── Pages/
│   ├── Home.razor                      # Landing page (composition root)
│   ├── Error.razor                     # Error page
│   └── NotFound.razor                  # 404 page
├── Shared/
│   ├── Navbar.razor                    # Navigation bar + scroll detection
│   ├── Hero.razor                      # Hero banner + typing animation
│   ├── Careers.razor                   # Job listings in carousel
│   ├── Contact.razor                   # Social link cards
│   ├── Footer.razor                    # Footer with branding
│   ├── LanguageSelector.razor          # Language dropdown
│   └── Slider.razor                    # Generic carousel component
├── Components/Icons/
│   ├── ArrowIcon.razor                 # Arrow SVG
│   ├── GitHubIcon.razor                # GitHub SVG
│   └── LinkedInIcon.razor              # LinkedIn SVG
├── Services/
│   ├── IDataService.cs                 # Data service interface
│   ├── JsonDataService.cs              # Data service implementation
│   ├── ILocalizationService.cs         # Localization interface
│   └── LocalizationService.cs          # Localization implementation
├── Models/
│   ├── JobPosition.cs                  # Job position record
│   └── SocialLink.cs                   # Social link record
├── Constants/
│   ├── AppConstants.cs                 # Branding, URLs, SEO
│   └── Routes.cs                       # Route constants
├── wwwroot/
│   ├── js/site.js                      # JS interop utilities
│   ├── service-worker.js               # Dev service worker (no-op)
│   └── service-worker.published.js     # Production service worker
└── Nostdlib.csproj                     # .NET project file
```

---

## Complexity Hotspots

These files have moderate complexity and are areas to approach carefully when making changes:

| File | Complexity | Why |
|---|---|---|
| `Services/LocalizationService.cs` | Moderate | 133 lines — JSON locale loading, localStorage persistence via JS interop, event-driven language switching, English fallback logic |
| `Services/JsonDataService.cs` | Moderate | 95 lines — Generic data loading with HTTP, language-aware caching, cache invalidation, IDisposable cleanup |
| `Shared/Hero.razor` | Moderate | 134 lines — Timer-based typing animation, language change subscription, complex decorative markup |
| `Shared/Slider.razor` | Moderate | 134 lines — Generic carousel with clone-based infinite looping, CSS transitions, JS interop for touch gestures |
| `Shared/Navbar.razor` | Moderate | 91 lines — JS interop scroll detection, responsive mobile menu, body scroll lock |
| `Shared/Careers.razor` | Moderate | 89 lines — Data fetching, language change handling, Slider integration |
| `wwwroot/js/site.js` | Moderate | 95 lines — Multiple interop functions, touch gesture state machine with threshold detection |
| `wwwroot/service-worker.published.js` | Moderate | 61 lines — Cache management, multiple fetch strategies, asset manifest processing |

---

## Getting Started

1. **Prerequisites**: .NET 10.0 SDK
2. **Run locally**: `dotnet watch run` from the project root
3. **Build for production**: `dotnet publish -c Release`
4. **Add a new language**: Create `wwwroot/data/{langCode}/locale.json` and add the language to `LocalizationService.cs`'s supported languages list
5. **Add a new page section**: Create a `.razor` file in `Shared/`, then add it to `Pages/Home.razor`

---

*Generated from knowledge graph analysis on 2026-03-25. Graph: `.understand-anything/knowledge-graph.json`*
