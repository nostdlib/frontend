# JavaScript Interop Guide

Blazor WebAssembly runs C# in the browser, but some browser APIs (scroll events, touch gestures, localStorage, file downloads) require JavaScript. This guide covers how C# and JS communicate in this project.

---

## Overview

The project has 3 main JS interop features in `wwwroot/js/site.js`:

| Feature | C# Component | JS Function | Direction |
|---|---|---|---|
| Scroll detection | `Navbar.razor` | `setupScrollListener` | C#->JS->C# |
| Touch swipe | `Slider.razor` | `sliderTouch.init/dispose` | C#->JS->C# |
| File download | (available) | `downloadFile` | C#->JS |

Additionally, `LocalizationService.cs` calls `localStorage.setItem`/`getItem` directly via `IJSRuntime`.

---

## C# Calling JavaScript

Use `IJSRuntime` (injected via `@inject IJSRuntime JS`):

```csharp
// Call a JS function, no return value
await JS.InvokeVoidAsync("functionName", arg1, arg2);

// Call a JS function, get a return value
var result = await JS.InvokeAsync<string>("functionName", arg1);
```

Arguments are serialized to JSON automatically. Return values work the same way.

---

## JavaScript Calling C#

1. C# passes a `DotNetObjectReference` to JS
2. JS stores it and calls methods on it later
3. The C# method must be marked `[JSInvokable]`

```csharp
// C# side — pass reference to JS
await JS.InvokeVoidAsync("setupListener", DotNetObjectReference.Create(this));

[JSInvokable]
public void OnEvent(double value) { /* JS calls this */ }
```

```javascript
// JS side — receive reference, call method later
window.setupListener = function(dotNetHelper) {
    window.addEventListener('event', function() {
        dotNetHelper.invokeMethodAsync('OnEvent', 42.0);
    });
};
```

---

## Feature 1: Scroll Detection (Navbar)

The navbar changes appearance when the user scrolls past 50px.

### C# Side (`Shared/Navbar.razor`)

```csharp
@inject IJSRuntime JS

private bool IsScrolled { get; set; } = false;

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        await JS.InvokeVoidAsync("setupScrollListener",
            DotNetObjectReference.Create(this));
    }
}

[JSInvokable]
public void OnScroll(double scrollY)
{
    var shouldBeScrolled = scrollY > 50;
    if (shouldBeScrolled != IsScrolled)
    {
        IsScrolled = shouldBeScrolled;
        StateHasChanged();
    }
}
```

### JS Side (`wwwroot/js/site.js`)

```javascript
window.setupScrollListener = function(dotNetHelper) {
    window.addEventListener('scroll', function() {
        dotNetHelper.invokeMethodAsync('OnScroll', window.scrollY);
    });
};
```

### Data Flow

```
User scrolls browser
       |
       v
window 'scroll' event fires
       |
       v
JS: dotNetHelper.invokeMethodAsync('OnScroll', window.scrollY)
       |
       v (crosses WASM boundary)
C#: OnScroll(scrollY) called
       |
       v
IsScrolled = scrollY > 50
       |
       v
StateHasChanged() -> navbar re-renders with/without "scrolled" CSS class
```

---

## Feature 2: Touch Swipe (Slider)

The carousel supports swipe gestures on mobile devices.

### C# Side (`Shared/Slider.razor`)

```csharp
@inject IJSRuntime JS
@implements IAsyncDisposable

private DotNetObjectReference<Slider<TItem>>? dotNetRef;
private string sliderId = $"slider-{Guid.NewGuid():N}";

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        dotNetRef = DotNetObjectReference.Create(this);
        await JS.InvokeVoidAsync("sliderTouch.init", sliderId, dotNetRef);
    }
}

[JSInvokable]
public async Task OnSwipeNext() => await NextSlide();

[JSInvokable]
public async Task OnSwipePrev() => await PrevSlide();

public async ValueTask DisposeAsync()
{
    await JS.InvokeVoidAsync("sliderTouch.dispose", sliderId);
    dotNetRef?.Dispose();
}
```

### JS Side — How Touch Tracking Works

The `sliderTouch` object in `site.js` manages per-instance touch state:

```javascript
window.sliderTouch = {
    instances: new Map(),

    init: function(elementId, dotNetHelper) {
        const state = {
            startX: 0, startY: 0, currentX: 0,
            isDragging: false,
            isHorizontalSwipe: null,  // null until direction determined
            threshold: 50,            // minimum px to trigger swipe
            dotNetHelper: dotNetHelper
        };
        // Attaches touchstart, touchmove, touchend listeners
        // On touchend: if horizontal delta > 50px, calls OnSwipeNext or OnSwipePrev
        this.instances.set(elementId, state);
    },

    dispose: function(elementId) {
        this.instances.delete(elementId);
    }
};
```

### Key Design Decisions

- **Per-instance state**: Each slider gets its own state via the `instances` Map
- **Direction detection**: First 10px of movement determines horizontal vs vertical
- **Threshold**: 50px minimum prevents accidental swipes
- **Passive listeners**: `touchstart`/`touchend` are passive (performance), `touchmove` is non-passive (needs `preventDefault`)

---

## Feature 3: localStorage (LocalizationService)

```csharp
// Save language preference
await _jsRuntime.InvokeVoidAsync("localStorage.setItem", "language", "ru");

// Read saved preference
var saved = await _jsRuntime.InvokeAsync<string?>("localStorage.getItem", "language");
```

Wrapped in try/catch because localStorage may throw during certain prerendering scenarios.

---

## Feature 4: Body Scroll Lock (Navbar Mobile Menu)

The Navbar currently locks body scroll when the mobile menu opens by setting `document.body.style.overflow` via JS interop. This prevents the background from scrolling while the hamburger menu is visible.

> **Note**: For new features, prefer adding a dedicated function to `site.js` rather than using inline JS strings. A named function is easier to test, debug, and maintain.

---

## How to Add a New JS Interop Feature

**Example**: Adding a clipboard copy function.

### Step 1: Add the JS function to `wwwroot/js/site.js`

```javascript
window.copyToClipboard = async function(text) {
    await navigator.clipboard.writeText(text);
    return true;
};
```

### Step 2: Call from C#

```razor
@inject IJSRuntime JS

<button @onclick="() => CopyCode(someText)">Copy</button>

@code {
    private async Task CopyCode(string code)
    {
        var success = await JS.InvokeAsync<bool>("copyToClipboard", code);
    }
}
```

### Step 3: If JS needs to call back to C#

```csharp
await JS.InvokeVoidAsync("myFunction", DotNetObjectReference.Create(this));

[JSInvokable]
public void OnResult(string value) { /* handle callback */ }
```

---

## Lifecycle Rules

| Rule | Why |
|---|---|
| Setup JS interop in `OnAfterRenderAsync`, not `OnInitialized` | DOM doesn't exist yet during initialization |
| Always check `if (firstRender)` | Prevents re-registering listeners on every re-render |
| Dispose `DotNetObjectReference` in `Dispose`/`DisposeAsync` | Prevents .NET memory leaks |
| Clean up JS listeners in `DisposeAsync` | Prevents JS memory leaks and stale callbacks |
| Use `IAsyncDisposable` when cleanup needs JS calls | `Dispose()` is sync and can't await JS interop |

---

## Debugging Tips

| Issue | Check |
|---|---|
| "No such method" from JS | Ensure C# method has `[JSInvokable]` attribute |
| JS function not found | Ensure `site.js` loads before `blazor.webassembly.js` in `index.html` |
| Arguments are null/wrong type | Check JSON serialization: C# PascalCase maps to JS as-is |
| "Object has been disposed" | DotNetObjectReference was disposed before JS finished using it |
| Touch events not working | Check `passive` vs non-passive listeners; verify element ID matches |
| "JavaScript interop calls cannot be issued during prerendering" | Wrap JS calls in `OnAfterRenderAsync`, never in `OnInitialized` |
