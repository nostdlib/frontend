# Data Layer Guide

How data flows from static JSON files on disk to rendered UI in the browser.

---

## Data Flow Overview

```
wwwroot/data/{lang}/careers.json        wwwroot/data/{lang}/locale.json
wwwroot/data/{lang}/social-links.json
         |                                       |
         v (HttpClient.GetFromJsonAsync)         v
   JsonDataService                         LocalizationService
   ._cache (Dictionary<string,object>)     ._currentResources (Dictionary<string,string>)
         |                                       |
         v (GetJobPositionsAsync())              v (L["key"] indexer)
   Careers.razor / Contact.razor           Every localized component
         |                                       |
         v (Blazor rendering)                    v
   <div class="card">DevSecOps...</div>    <h2>Careers</h2>
```

---

## Data Models

Both models use C# **records** — immutable value types with built-in equality.

### JobPosition (`Models/JobPosition.cs`)

```csharp
public record JobPosition(
    int Id,
    string Code,          // e.g., "DEVSEC-01"
    string Title,         // e.g., "DevSecOps Engineer"
    string Level,         // e.g., "Senior"
    string Location,      // e.g., "Yerevan, Armenia"
    string Type,          // e.g., "Full-time"
    string? Description = null,
    List<string>? Requirements = null
);
```

### SocialLink (`Models/SocialLink.cs`)

```csharp
public record SocialLink(
    string Name,          // e.g., "LinkedIn"
    string Url,           // e.g., "https://linkedin.com/company/nostdlib"
    string Description,   // e.g., "Professional updates and team news"
    string IconType       // e.g., "linkedin" or "github"
);
```

---

## JSON File Structure

Files live at `wwwroot/data/{lang}/`:

```
wwwroot/data/
├── en/
│   ├── locale.json         # Translation strings
│   ├── careers.json        # Job listings (9 positions)
│   └── social-links.json   # Social links (2 entries)
├── ru/
│   ├── locale.json
│   ├── careers.json        # Same jobs, translated to Russian
│   └── social-links.json
└── hy/
    ├── locale.json
    ├── careers.json        # Same jobs, translated to Armenian
    └── social-links.json
```

### careers.json format

```json
[
  {
    "id": 1,
    "code": "DEVSEC-01",
    "title": "DevSecOps Engineer",
    "level": "Senior",
    "location": "Yerevan, Armenia",
    "type": "Full-time",
    "description": "Design and maintain secure CI/CD pipelines...",
    "requirements": [
      "4+ years in DevOps with strong security focus",
      "Expertise in container security...",
      ...
    ]
  },
  ...
]
```

### social-links.json format

```json
[
  {
    "name": "LinkedIn",
    "url": "https://www.linkedin.com/company/nostdlib",
    "description": "Professional updates and team news",
    "iconType": "linkedin"
  },
  {
    "name": "GitHub",
    "url": "https://github.com/nostdlib",
    "description": "Open source security tooling",
    "iconType": "github"
  }
]
```

---

## Service Interface

`Services/IDataService.cs`:

```csharp
public interface IDataService
{
    Task<List<JobPosition>> GetJobPositionsAsync();
    Task<JobPosition?> GetJobPositionByIdAsync(int id);
    Task<List<SocialLink>> GetSocialLinksAsync();
    void ClearCache();
}
```

---

## Implementation: JsonDataService

`Services/JsonDataService.cs` — the core data engine.

### Constructor

```csharp
public JsonDataService(HttpClient httpClient, ILocalizationService localizationService)
{
    _httpClient = httpClient;
    _localizationService = localizationService;
    _localizationService.OnLanguageChanged += OnLanguageChanged;  // Auto-invalidate cache
}
```

### The Generic Loader

```csharp
private async Task<List<T>> LoadDataAsync<T>(string filename, string cacheKey)
{
    // 1. Check cache
    if (_cache.TryGetValue(cacheKey, out var cached) && cached is List<T> list && IsCacheValid())
        return list;

    // 2. Try current language
    try { result = await _httpClient.GetFromJsonAsync<List<T>>(GetDataPath(filename)); }
    catch {
        // 3. Fallback to English
        try { result = await _httpClient.GetFromJsonAsync<List<T>>($"data/en/{filename}"); }
        catch { /* 4. Return empty list */ }
    }

    // 5. Store in cache
    result ??= new List<T>();
    _cache[cacheKey] = result;
    _cachedLanguage = _localizationService.CurrentLanguage;
    return result;
}
```

### Cache Invalidation

```
User switches language
       |
       v
LocalizationService fires OnLanguageChanged
       |
       v
JsonDataService.OnLanguageChanged() -> ClearCache()
       |
       v
_cache.Clear(), _cachedLanguage = ""
       |
       v
Next data request re-fetches from data/{newLang}/ via HTTP
```

### Path Construction

```csharp
private string GetDataPath(string filename)
{
    var lang = _localizationService.CurrentLanguage;
    return $"data/{lang}/{filename}";  // e.g., "data/ru/careers.json"
}
```

### Disposal

```csharp
public void Dispose()
{
    _localizationService.OnLanguageChanged -= OnLanguageChanged;
    _cache.Clear();
    GC.SuppressFinalize(this);
}
```

---

## How to Add a New Data Entity

**Example**: Adding a "TeamMember" entity.

### Step 1: Create the model

`Models/TeamMember.cs`:
```csharp
namespace Nostdlib.Models;

public record TeamMember(
    int Id,
    string Name,
    string Role,
    string Bio
);
```

### Step 2: Create JSON data files

`wwwroot/data/en/team.json`:
```json
[
  { "id": 1, "name": "Alice", "role": "Security Lead", "bio": "..." },
  { "id": 2, "name": "Bob", "role": "Developer", "bio": "..." }
]
```

Copy and translate for `ru/team.json` and `hy/team.json`.

### Step 3: Add to the interface

`Services/IDataService.cs`:
```csharp
Task<List<TeamMember>> GetTeamMembersAsync();
```

### Step 4: Add to the implementation

`Services/JsonDataService.cs`:
```csharp
public Task<List<TeamMember>> GetTeamMembersAsync()
    => LoadDataAsync<TeamMember>("team.json", nameof(TeamMember));
```

That's it. The generic `LoadDataAsync<T>` handles HTTP fetching, caching, language awareness, and English fallback automatically.

### Step 5: Use in a component

```razor
@inject IDataService DataService

@code {
    private List<TeamMember> members = new();

    protected override async Task OnInitializedAsync()
    {
        members = await DataService.GetTeamMembersAsync();
    }
}
```

---

## How to Edit Job Positions

Just edit the JSON files — no code changes needed:

1. Open `wwwroot/data/en/careers.json`
2. Add, edit, or remove entries
3. Repeat for `ru/careers.json` and `hy/careers.json`
4. The app auto-loads the new data on next page load (or language switch)

---

## Error Handling

| Scenario | What happens |
|---|---|
| JSON file not found for current language | Falls back to `data/en/{file}` |
| English file also not found | Returns empty `List<T>` |
| Malformed JSON | `GetFromJsonAsync` throws, caught by try/catch, falls back |
| Network error | Same as file not found — fallback chain applies |

---

## Cache Behavior Summary

| Event | Cache action |
|---|---|
| First data request | Miss -> fetch -> store in cache |
| Same request, same language | Hit -> return cached data |
| Language changes | OnLanguageChanged -> ClearCache() -> next request re-fetches |
| `ClearCache()` called manually | Cache cleared, next request re-fetches |
