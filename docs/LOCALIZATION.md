# Localization System Guide

This project supports three languages: **English (en)**, **Russian (ru)**, and **Armenian (hy)**. This guide covers the complete i18n system so you can add languages, add translation keys, and localize new components.

---

## How It Works — End to End

```
1. App starts → LocalizationService.InitializeAsync()
   ├── Fetches data/en/locale.json (English fallback, always loaded)
   ├── Reads localStorage("language") → e.g., "ru"
   └── Fetches data/ru/locale.json → stores as current resources

2. Component renders → @L["Hero.Title"]
   ├── Looks up "Hero.Title" in current resources (Russian)
   ├── Found? → Returns Russian translation
   └── Not found? → Falls back to English → Still not found? → Returns raw key

3. User clicks "HY" in LanguageSelector
   ├── LanguageSelector calls SetLanguageAsync("hy")
   ├── Service loads data/hy/locale.json
   ├── Service saves "hy" to localStorage
   ├── Service fires OnLanguageChanged event
   ├── All subscribed components call StateHasChanged()
   └── UI re-renders with Armenian text

4. User returns later → browser loads → InitializeAsync()
   └── Reads "hy" from localStorage → loads Armenian automatically
```

---

## Architecture

```
┌────────────────────────────────┐
│      LanguageSelector          │
│  (user picks a language)       │
└──────────┬─────────────────────┘
           │ SetLanguageAsync("ru")
           ▼
┌────────────────────────────────┐
│    LocalizationService         │
│  ┌──────────────────────────┐  │
│  │ _currentLanguage = "ru"  │  │
│  │ _currentResources = {...}│  │    ┌──────────────────────┐
│  │ _fallbackResources = en  │◄─┼────│ data/en/locale.json  │
│  └──────────────────────────┘  │    │ data/ru/locale.json  │
│                                │    │ data/hy/locale.json  │
│  localStorage ◄── "language"   │    └──────────────────────┘
│                                │
│  event OnLanguageChanged ──────┼──► All subscribed components
└────────────────────────────────┘
```

---

## The Interface

`Services/ILocalizationService.cs`:

```csharp
public interface ILocalizationService
{
    string CurrentLanguage { get; }                     // "en", "ru", or "hy"
    string this[string key] { get; }                    // L["Hero.Title"] → translated string
    Task SetLanguageAsync(string languageCode);         // Switch language
    Task InitializeAsync();                             // Load saved preference on startup
    IReadOnlyList<LanguageInfo> GetSupportedLanguages(); // List all languages
    event Action? OnLanguageChanged;                    // Fires when language switches
}

public record LanguageInfo(string Code, string Name, string NativeName);
```

---

## Translation Files

Located at `wwwroot/data/{lang}/locale.json`. Flat key-value format:

```json
{
  "Nav.Careers": "Careers",
  "Nav.Contact": "Contact",
  "Hero.Title": "SECURITY WITHOUT COMPROMISE",
  "Hero.Subtitle": "Elite cybersecurity consulting...",
  "Hero.CTA.Primary": "Start a Conversation",
  "Hero.CTA.Secondary": "Explore Our Work",
  "Careers.Title": "Careers",
  "Careers.Subtitle": "Build your career at the edge of security research",
  "Careers.Requirements": "Requirements",
  "Careers.Apply": "Apply via LinkedIn",
  "Careers.Note": "Our selection process is rigorous by design...",
  "Contact.Title": "Initiate Contact",
  "Contact.Subtitle": "Ready to discuss your security posture?...",
  "Contact.Note": "All initial communications are treated as confidential",
  "Footer.Rights": "All rights reserved.",
  "Footer.Tagline": "Security Beyond Perimeters",
  "Error.Title": "Error",
  "Error.Message": "An unexpected error occurred.",
  "Error.ReturnHome": "Return Home",
  "NotFound.Title": "Not Found",
  "NotFound.Message": "Sorry, there's nothing at this address."
}
```

### Key Naming Convention

Use **dot-notation**: `Section.SubSection.Detail`

| Pattern | Example | Used in |
|---|---|---|
| `Nav.{item}` | `Nav.Careers` | Navbar links |
| `Hero.{part}` | `Hero.Title`, `Hero.CTA.Primary` | Hero section |
| `Careers.{part}` | `Careers.Title`, `Careers.Apply` | Careers section |
| `Contact.{part}` | `Contact.Title` | Contact section |
| `Footer.{part}` | `Footer.Rights` | Footer |
| `Error.{part}` | `Error.Title`, `Error.Message` | Error page |
| `NotFound.{part}` | `NotFound.Title` | 404 page |
| `Common.{part}` | `Common.Loading` | Shared UI strings |

---

## Localized Data Files

Beyond translations, entity data is also per-language:

| File | Content | Model |
|---|---|---|
| `data/{lang}/careers.json` | Job listings array | `List<JobPosition>` |
| `data/{lang}/social-links.json` | Social links array | `List<SocialLink>` |

`JsonDataService` automatically fetches from the current language's folder. When the language changes, it clears its cache and re-fetches.

---

## How to Add a New Language

**Example**: Adding French (fr)

### Step 1: Create data files

```bash
mkdir -p wwwroot/data/fr
cp wwwroot/data/en/locale.json wwwroot/data/fr/locale.json
cp wwwroot/data/en/careers.json wwwroot/data/fr/careers.json
cp wwwroot/data/en/social-links.json wwwroot/data/fr/social-links.json
```

### Step 2: Translate the files

Edit `wwwroot/data/fr/locale.json`:
```json
{
  "Nav.Careers": "Carrieres",
  "Nav.Contact": "Contact",
  "Hero.Title": "SECURITE SANS COMPROMIS",
  ...
}
```

### Step 3: Register the language

In `Services/LocalizationService.cs`, add to the `SupportedLanguagesList`:

```csharp
private static readonly IReadOnlyList<LanguageInfo> SupportedLanguagesList = new List<LanguageInfo>
{
    new("en", "English", "English"),
    new("ru", "Russian", "Русский"),
    new("hy", "Armenian", "Հայերեն"),
    new("fr", "French", "Francais"),    // ← ADD THIS
};
```

That's it. The `LanguageSelector` dropdown, localStorage persistence, and fallback system all work automatically.

---

## How to Add a New Translation Key

### Step 1: Add the key to ALL locale files

`wwwroot/data/en/locale.json`:
```json
"Team.Title": "Our Team"
```

`wwwroot/data/ru/locale.json`:
```json
"Team.Title": "Наша команда"
```

`wwwroot/data/hy/locale.json`:
```json
"Team.Title": "Մեր թիdelays"
```

### Step 2: Use it in a component

```razor
<h2>@L["Team.Title"]</h2>
```

---

## How to Make a Component Localized

Every localized component follows this pattern:

```razor
@inject ILocalizationService L
@implements IDisposable

<section>
    <h2>@L["MySection.Title"]</h2>
    <p>@L["MySection.Description"]</p>
</section>

@code {
    protected override void OnInitialized()
    {
        L.OnLanguageChanged += OnLanguageChanged;     // Subscribe
    }

    private void OnLanguageChanged()
    {
        InvokeAsync(StateHasChanged);                 // Re-render with new language
    }

    public void Dispose()
    {
        L.OnLanguageChanged -= OnLanguageChanged;     // Unsubscribe (prevents memory leak)
    }
}
```

### If the component also fetches data:

```razor
@inject IDataService DataService
@inject ILocalizationService L
@implements IDisposable

@code {
    private List<MyModel> items = new();

    protected override async Task OnInitializedAsync()
    {
        L.OnLanguageChanged += OnLanguageChanged;
        items = await DataService.GetMyItemsAsync();  // Initial load
    }

    private async void OnLanguageChanged()
    {
        items = await DataService.GetMyItemsAsync();  // Re-fetch for new language
        await InvokeAsync(StateHasChanged);
    }

    public void Dispose()
    {
        L.OnLanguageChanged -= OnLanguageChanged;
    }
}
```

---

## Fallback Behavior

| Scenario | What happens |
|---|---|
| Key exists in current language | Returns the translation |
| Key missing in current language | Falls back to English (`_fallbackResources`) |
| Key missing in English too | Returns the raw key string (e.g., `"Hero.Title"`) |
| Locale JSON file fails to load | Uses English for everything |
| localStorage unavailable | Defaults to English, no persistence |

---

## Common Mistakes

| Mistake | Consequence | Fix |
|---|---|---|
| Forgetting `@implements IDisposable` | Memory leak — component stays subscribed after destruction | Always add IDisposable + Dispose method |
| Forgetting `InvokeAsync(StateHasChanged)` | Component won't re-render on language change | Wrap StateHasChanged in InvokeAsync (event fires outside render cycle) |
| Adding key to `en/` but not `ru/` and `hy/` | Russian/Armenian users see English fallback for that key | Always add keys to ALL locale files |
| Typo in key name | Shows raw key instead of translation | Copy-paste keys between code and JSON to avoid typos |
| Using `StateHasChanged()` directly in event | Can throw "not on the dispatcher thread" | Use `InvokeAsync(StateHasChanged)` |
