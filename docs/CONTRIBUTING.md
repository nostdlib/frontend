# Contributing Guide

Code style, project conventions, and how to add features to Nostdlib.

---

## Code Style

### C#

| Element | Convention | Example |
|---|---|---|
| Public members | PascalCase | `CurrentLanguage`, `GetJobPositionsAsync()` |
| Private fields | _camelCase | `_httpClient`, `_currentLanguage` |
| Local variables | camelCase | `var savedLanguage = ...` |
| Constants | PascalCase | `CompanyName`, `LinkedInUrl` |
| Data types | Records for DTOs | `public record JobPosition(...)` |
| Interfaces | I-prefix | `IDataService`, `ILocalizationService` |
| Namespaces | Match folder path | `Nostdlib.Services`, `Nostdlib.Models` |
| Async methods | Async suffix | `GetJobPositionsAsync()`, `InitializeAsync()` |

### Razor Components

| Convention | Example |
|---|---|
| One component per file | `Navbar.razor` |
| Scoped CSS in matching file | `Navbar.razor.css` |
| Directives at top | `@inject`, `@implements` before markup |
| `@code` block at bottom | After all markup |
| Component names = PascalCase | `<LanguageSelector />`, `<Slider />` |

### CSS

| Convention | Example |
|---|---|
| Class names: kebab-case | `.hero-content`, `.slider-btn-prev` |
| Use CSS variables | `var(--primary-color)`, not `#00ffcc` |
| Scoped CSS for component styles | `Component.razor.css` |
| Global CSS for shared patterns | `wwwroot/css/components/` |

### Locale Keys

| Convention | Example |
|---|---|
| Dot-notation: `Section.Key` | `Hero.Title`, `Careers.Apply` |
| CTA buttons: `Section.CTA.Action` | `Hero.CTA.Primary` |
| Consistent across all languages | Same keys in en/, ru/, hy/ |

---

## Project Conventions

### Services

Always use **interface + implementation** pairs:
- `IDataService` -> `JsonDataService`
- `ILocalizationService` -> `LocalizationService`
- Register in `Program.cs` with `AddScoped`

### Components with Events

If a component subscribes to service events, it **must**:
1. Add `@implements IDisposable`
2. Subscribe in `OnInitialized()` or `OnInitializedAsync()`
3. Use `InvokeAsync(StateHasChanged)` in the handler
4. Unsubscribe in `Dispose()`

### Data Models

Use C# **records**, not classes:
```csharp
public record MyModel(string Name, int Value);  // Yes
public class MyModel { ... }                     // No
```

### Constants

Static classes in `Constants/`:
```csharp
public static class MyConstants
{
    public const string Value = "...";
}
```

---

## Adding Features — Checklists

### New Section Component

- [ ] Create `Shared/MySectionName.razor`
- [ ] Create `Shared/MySectionName.razor.css`
- [ ] Add locale keys to ALL 3 `locale.json` files (en, ru, hy)
- [ ] Add `<MySectionName />` to `Pages/Home.razor`
- [ ] (Optional) Add route constant to `Constants/Routes.cs`
- [ ] (Optional) Add nav link to `Shared/Navbar.razor`

### New Page

- [ ] Create `Pages/MyPage.razor` with `@page "/my-page"`
- [ ] Add route constant to `Constants/Routes.cs`
- [ ] Include `<Navbar />` and `<Footer />` for consistent layout

### New Data Entity

- [ ] Create record in `Models/MyEntity.cs`
- [ ] Create JSON files: `wwwroot/data/{en,ru,hy}/my-entities.json`
- [ ] Add method to `IDataService` interface
- [ ] Add implementation to `JsonDataService` using `LoadDataAsync<T>`

### New Icon

- [ ] Create `Components/Icons/MyIcon.razor` with SVG markup
- [ ] Add `[Parameter] public int Size { get; set; } = 28;`

### New Language

- [ ] Create `wwwroot/data/{code}/locale.json` (copy from en, translate)
- [ ] Create `wwwroot/data/{code}/careers.json` (translate)
- [ ] Create `wwwroot/data/{code}/social-links.json` (translate)
- [ ] Add `LanguageInfo` entry in `LocalizationService.cs` `SupportedLanguagesList`

---

## CSS Design System

### Color Palette

| Variable | Value | Use |
|---|---|---|
| `--primary-color` | `#00ffcc` | Buttons, links, accents |
| `--secondary-color` | `#6600ff` | Secondary accents |
| `--dark-bg` | `#050510` | Page background |
| `--darker-bg` | `#030308` | Deeper sections |
| `--card-bg` | `#0a0a15` | Card surfaces |
| `--text-primary` | `#e8e8ff` | Main text |
| `--text-secondary` | `#9999bb` | Secondary text |
| `--text-muted` | `#666688` | Muted/disabled text |
| `--border-color` | `#1a1a2e` | Borders and dividers |

### Typography

| Variable | Value |
|---|---|
| `--font-display` | `'Inter', sans-serif` |
| `--font-mono` | `'JetBrains Mono', monospace` |

Use the `.mono` class for monospace text in markup.

### Spacing and Layout

| Variable | Value |
|---|---|
| `--border-radius` | `4px` |
| `--header-height` | `70px` |
| `--transition` | `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` |

---

## Git Workflow

### Branch Naming

```
feature/add-team-section
fix/navbar-scroll-bug
docs/update-onboarding
```

### Commit Messages

Follow the `type: description` format:
```
feat: Add team section with member cards
fix: Resolve navbar scroll detection on mobile
docs: Update localization guide with French example
refactor: Extract generic data loader from JsonDataService
```

### PR Process

1. Create a feature branch from `main`
2. Make your changes
3. Test all 3 languages (en, ru, hy)
4. Test responsive layout (mobile + desktop)
5. Open PR with description of changes

---

## Testing Checklist

No automated tests yet — use this manual checklist:

- [ ] **All 3 languages**: Switch between EN, RU, HY — all text updates
- [ ] **Language persistence**: Select a language, reload page — same language loads
- [ ] **Data reload**: Switch language — careers and contact sections show translated data
- [ ] **Mobile responsive**: Test hamburger menu, touch swipe on slider
- [ ] **Scroll detection**: Navbar style changes on scroll
- [ ] **All pages**: Visit `/`, `/Error`, `/not-found`
- [ ] **PWA**: Production build — service worker registers, offline works

---

## Deployment

### Build

```bash
dotnet publish -c Release
```

Output: `bin/Release/net10.0/publish/wwwroot/`

### What Gets Published

The `wwwroot/` folder contains everything needed:
- `index.html` — entry point
- `_framework/` — .NET WASM runtime + app DLLs
- `css/`, `js/`, `data/` — static assets
- `service-worker.js` — production caching

### Deploy

Upload the `publish/wwwroot/` folder to any static host:
- GitHub Pages
- Netlify
- Cloudflare Pages
- nginx / Apache serving static files
- Azure Static Web Apps

The app is 100% client-side — no server-side runtime needed.

---

## What to Read Next

| Doc | When to read it |
|---|---|
| [SETUP.md](SETUP.md) | First time setting up the project |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Understanding how the system fits together |
| [COMPONENTS.md](COMPONENTS.md) | Building or modifying components |
| [LOCALIZATION.md](LOCALIZATION.md) | Working with translations |
| [JS-INTEROP.md](JS-INTEROP.md) | Adding browser API features |
| [DATA-LAYER.md](DATA-LAYER.md) | Working with data and JSON files |
| [ONBOARDING.md](ONBOARDING.md) | High-level overview + guided tour |
