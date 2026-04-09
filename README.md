# NoStdLib Frontend

**Corporate website for NoStdLib -- a cybersecurity consulting firm specializing in security assessments, incident response, and secure architecture design.**

![Language](https://img.shields.io/badge/language-C%23-239120?style=flat-square&logo=csharp)
![Framework](https://img.shields.io/badge/framework-Blazor%20WebAssembly-512BD4?style=flat-square&logo=blazor)
![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat-square&logo=dotnet)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA-00ffcc?style=flat-square)
![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-222?style=flat-square&logo=github)

---

## Features

- **Blazor WebAssembly SPA** -- fully client-side rendered, no server required after initial load
- **Progressive Web App (PWA)** -- installable with offline support via service worker
- **Multi-language support** -- English, Russian, and Armenian with runtime language switching and persistent preference via localStorage
- **JSON-driven content** -- careers listings and social links loaded from static JSON files, with per-language data directories
- **Animated hero section** -- typing effect, binary data streams, neural network visualization, radar sweep, and floating cryptographic elements
- **Infinite carousel slider** -- touch-enabled card slider with wrap-around cloning for seamless looping
- **Responsive design** -- mobile-first layout with hamburger navigation and scroll-aware sticky navbar
- **Component-scoped CSS** -- isolated styles per Razor component using Blazor CSS isolation
- **Automated CI/CD** -- GitHub Actions workflow builds and deploys to GitHub Pages on every push to `main`

## Requirements

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) or later
- A modern web browser (Chrome, Firefox, Edge, Safari)

## Installation

```bash
git clone https://github.com/mrzaxaryan/nostdlib-frontend.git
cd nostdlib-frontend
dotnet restore
```

## Usage

Start the development server:

```bash
dotnet run
```

The application will be available at `http://localhost:5090` (or `https://localhost:7210` for HTTPS).

## Build

Build a release version:

```bash
dotnet build --configuration Release
```

Publish for deployment:

```bash
dotnet publish Nostdlib.csproj --configuration Release -o release
```

The publishable output will be in `release/wwwroot/`. This is a static site that can be served from any web server or static hosting provider.

## Project Structure

```
.
├── Components/Icons/     # SVG icon Razor components
├── Constants/            # Application constants and route definitions
├── Layout/               # Main layout component
├── Models/               # Data models (JobPosition, SocialLink)
├── Pages/                # Routable page components (Home, Error, NotFound)
├── Services/             # Data and localization services
├── Shared/               # Reusable UI components (Navbar, Hero, Careers, Contact, Footer, Slider)
├── wwwroot/
│   ├── css/              # Global styles (reset, variables, utilities, component styles)
│   ├── data/{en,ru,hy}/  # Localized JSON data files
│   ├── js/               # JavaScript interop
│   └── index.html        # Host page
├── Program.cs            # Application entry point and DI configuration
├── App.razor             # Root Blazor component with router
└── Nostdlib.csproj       # Project file targeting .NET 10
```

## Disclaimer

This repository is part of a security research and education project collection. All tools and materials are intended **exclusively** for:

- Authorized security testing and assessments
- Educational purposes and academic research
- Capture The Flag (CTF) competitions
- Improving defensive security posture

**Do not** use any content from this project for unauthorized access, malicious activities, or any purpose that violates applicable laws or regulations. Users are solely responsible for ensuring their use complies with all relevant legal and ethical standards.

See [RESPONSIBLE_USE.md](RESPONSIBLE_USE.md) for the full responsible use policy.
