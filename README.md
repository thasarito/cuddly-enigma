# Courtyard House Massing (React Three Fiber)

This project boots a Vite + React + React Three Fiber scene that rebuilds the editable 3D massing described in the provided Three.js snippet.

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Run the dev server
   ```bash
   npm run dev
   ```
3. Open the printed URL in your browser. Orbit with the mouse (drag to rotate, <kbd>Shift</kbd> + drag to pan, wheel to zoom).

## Features

- Coordinates follow the house plan convention (X → East, Z → North, 1 unit = 1 m).
- Toggle ground floor, second floor, courtyard glass, roof plates, and blueprint overlays from the control panel.
- Optional plan overlays: add `plan_1f.png` and `plan_2f.png` to the `public/` folder to align your drawings. Adjust opacity in the panel.
- Parameterized dimensions (courtyard size, wing extents, floor heights) defined at the top of `src/components/SceneContents.jsx` for quick refinement.

## Building for production

```bash
npm run build
```

Serve the generated `dist/` folder with any static web host or via `npm run preview`.
