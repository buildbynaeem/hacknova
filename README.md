## Routezy

Routezy is a sustainable logistics and delivery platform built on Vite + React.
It focuses on secure custody, OTP-verified handoffs, carbon efficiency tracking,
and a modern landing page with scroll-based animations.

### Tech Stack

- Vite
- React (TypeScript)
- shadcn/ui
- Tailwind CSS
- Zustand
- React Router
- Leaflet / React‑Leaflet

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

```bash
git clone <YOUR_REPO_URL>
cd hacknova
npm install
```

### Development

Run the local dev server:

```bash
npm run dev
```

Then open the printed localhost URL in your browser.

### Production Build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## Key Features

- Landing page with hero scroll sequence built from frame images
- "Our Mission" light-mode section
- Navigation to How It Works, Mission, FAQ, and About
- Carbon efficiency tracker with live emission stats
- Driver data surfaced inside the emissions tracker
- Route, map, and geolocation integrations

---

## Project Structure

High-level structure (not exhaustive):

- `src/pages` – main routes (e.g. `LandingPage`)
- `src/components` – UI, emissions, driver, and animation components
- `src/store` – Zustand stores (driver state, etc.)
- `public/scroll` – frame images for the hero scroll animation

---

## Deployment

This project is configured as a Vite SPA and can be deployed to
any static hosting provider (for example, Vercel) using the
`npm run build` output in the `dist` directory.

Make sure your hosting is configured to serve `index.html` for
all SPA routes.

---

## Contributing

1. Create a new branch for your change.
2. Make updates and ensure `npm run lint` passes.
3. Open a pull request with a clear description of the change.
