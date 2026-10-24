# LabLens

**An AR guide for every lab instrument** — a mobile-first, offline-ready field guide built for Tech Elevate 2026 by Team Humpty Dumpty (Mech-ARE).

LabLens combines live camera capture, on-device object recognition, a local equipment database, and an AR-style guide overlay. It puts hazards and required PPE before operating steps. Use the Demo Mode picker to explore the full guide flow without a camera or physical instrument.

> **Safety note:** LabLens is a learning aid, not a substitute for your institution's risk assessment, equipment manual, instructor, or approved procedure. Do not rely on automated recognition to identify hazardous equipment.

## Features

- Camera scan using `getUserMedia`, rear-facing camera preference, camera switch, freeze frame and supported torch control.
- TensorFlow.js COCO-SSD inference with a configurable confidence threshold and equipment class map.
- Optional custom TensorFlow.js Layers model configuration for a Teachable Machine image model.
- Animated detection box, low-confidence manual matching, and stable-match guide handoff.
- Mandatory safety/PPE card before the operating steps unlock.
- Equipment library with search, category filters, detail guides, favourites and last-20 local scan history.
- Offline-first IndexedDB storage through Dexie and a Vite PWA service worker.
- Demo detection picker, first-run onboarding, English/Hindi interface labels, dark/light theme and browser speech synthesis.
- Staff review desk for local add/edit/delete and reviewed-by details.

## Tech stack

- Vite and modern JavaScript modules.
- Tailwind CSS 4 (with a small project stylesheet for the app's visual system).
- TensorFlow.js and `@tensorflow-models/coco-ssd`.
- Dexie.js / IndexedDB.
- `vite-plugin-pwa` / Workbox.

## Requirements

- Node.js 20.19+ or 22.12+ recommended.
- npm.
- A current browser. Camera access requires HTTPS in deployment; `localhost` is allowed for development.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Allow camera access when asked. The initial model download can take a little while; once downloaded, the browser and service worker can reuse cached assets. Select **Demo mode** to see the guide without a camera.

Build and preview the production app:

```bash
npm run build
npm run preview
```

The production files are written to `dist/`.

## Deploy

Deploy the project root to Vercel or Netlify. The build command is `npm run build` and the output directory is `dist`. Both platforms provide HTTPS by default. For a static host, configure SPA fallback to `index.html` if your host requires it. Keep the PWA service worker and generated `manifest.webmanifest` available at the deployed origin.

Camera capture is unavailable on plain HTTP sites except localhost. The model and application bundle may require a first online visit before offline use; the app's equipment database itself is bundled and saved in IndexedDB at startup.

## Add equipment

In `src/data/equipment.json`, copy a record and fill its unique `id`, `name`, `category`, `aliases`, `specs`, `operatingSteps`, `safetyPrecautions`, `requiredPPE`, `hazardLevel`, `commonMistakes`, `imageUrl`, and `manualLink`. This is designed to take under two minutes for a prepared entry. The local database is seeded from this file on first launch. If a browser already has a prior database, clear the LabLens site data to reseed it; staff-created entries are stored locally and are not overwritten.

For changes made through the staff desk, use a unique lowercase ID with hyphens. The demo staff password is `lablens-demo`. This is a client-side demo gate only; it is not authentication and must not protect production or sensitive content.

## Train and plug in a custom model

1. In Teachable Machine, create an **Image Project** with representative classes and train it using varied lighting, angles, backgrounds and object instances.
2. Export the model as **TensorFlow.js Layers** and host the `model.json` plus its weight files alongside your application (or a trusted HTTPS model host).
3. Edit `src/config/model.config.js`: set `customModel.modelUrl` to the hosted `model.json`; list labels in `classLabels` in the exact model output order; map those names to equipment IDs in `classLabelToEquipmentId`.
4. Ensure every mapped ID exists in the equipment database. Test across devices and lighting; don't use the model as the only safety check.

Example:

```js
customModel: {
  modelUrl: "/models/lab-instruments/model.json",
  classLabels: ["digital_multimeter", "vernier_caliper"],
  classLabelToEquipmentId: {
    digital_multimeter: "multimeter",
    vernier_caliper: "vernier-caliper"
  }
}
```

COCO-SSD detects general objects, not most laboratory instruments. Its default instrument-label map is intentionally empty rather than pretending generic object classes are accurate instrument identification. Before a custom model is configured, the scan UI still runs recognition and offers manual match choices; Demo Mode always provides a deterministic end-to-end guide preview.

## Known limitations

- The bundled COCO-SSD model is generic and may not recognize lab instruments. Equipment identification should be treated as a suggestion; choose a guide manually or configure a trained model.
- Custom-model support currently expects a TensorFlow.js **Layers** image classification model and its ordered class labels. Detection boxes for a classifier are approximate frame regions.
- The staff password is a demo-only browser-side gate. There is no cloud identity, shared database, or cloud sync.
- Device torch control depends on browser/device support. Flash controls may not appear on every camera.
- English and Hindi UI labels are available; the equipment records currently use English technical content. Hindi translations and richer localization should be reviewed by a fluent domain expert.
- Offline behavior depends on a successful initial installation/model load and the browser retaining its cache and IndexedDB data.
- Specs and procedures vary by manufacturer and lab setup. Always verify them against the exact instrument manual and local safety rules.
