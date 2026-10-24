# LabLens: AR Guide for Every Lab Instrument

> **"Think Big. Innovate Bigger."**  
> *A Hackathon Project for Tech Elevate 2026*  
> *Developed by Team Humpty Dumpty (Mech-ARE)*

---

## 🔬 1. Problem & Vision

Engineering and science students frequently encounter unfamiliar laboratory instruments without knowing their ratings, accuracy limitations, or safe operational boundaries. Relying on busy lab instructors or digging through bulky 200-page paper manuals wastes lab time and leads to blown fuses, burned components, and safety hazards.

**LabLens** transforms any student smartphone or lab laptop webcam into an intelligent, on-device Augmented Reality assistant:
1. **Live On-Device Camera Recognition**: Point at any instrument in the lab to identify it instantly (runs locally in browser via TensorFlow.js — zero cloud lag).
2. **Safety First Enforcement**: Institutional safety hazards (electrical, thermal, chemical, mechanical) and mandatory PPE requirements are presented **before use**, requiring the student to acknowledge compliance before operating steps unlock.
3. **Step-by-Step Interactive AR Walkthrough**: Guides the student through real-world operation with highlighted steps, breadcrumbs, and bilingual voice narration (English + Hindi).
4. **Offline PWA Architecture**: Weak Wi-Fi inside basement physics and metrology laboratories is no barrier — LabLens caches the complete instrument catalog, app shell, and detection model via IndexedDB (Dexie.js) and Service Workers.

---

## 🛠️ 2. Tech Stack

- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (custom Tech Elevate dark theme with brand emerald `#22BB80`, high-contrast typography, and glassmorphic HUD overlays)
- **Computer Vision & On-Device ML**: TensorFlow.js (`@tensorflow/tfjs` + `@tensorflow-models/coco-ssd`), architected with a swappable configuration for Google Teachable Machine / converted TFLite models
- **Camera Pipeline**: Native HTML5 `navigator.mediaDevices.getUserMedia` with rear camera `environment` facing mode, flashlight/torch toggle via `MediaTrackConstraints`, camera switcher, and snapshot freeze-frame
- **Local Storage & Database**: Dexie.js (IndexedDB) with schema for instruments, bookmarks, and last 20 scan records
- **Speech Synthesis**: Web Speech API (`SpeechSynthesisUtterance`) with voice pitch/rate tuning for English (`en-US`) and Hindi (`hi-IN`)
- **PWA**: `vite-plugin-pwa` with web manifest, service worker caching, and automatic standalone install prompts

---

## 📁 3. File Structure

```text
humpty-dumpty/
├── index.html                     # HTML5 shell, meta tags, PWA headers, Inter fonts
├── package.json                   # Dependencies & build scripts
├── postcss.config.js              # PostCSS plugins
├── tailwind.config.js             # Tech Elevate custom color theme & animations
├── tsconfig.json                  # TypeScript compiler options
├── tsconfig.node.json             # Vite config TypeScript setup
├── vite.config.ts                 # Vite setup with React & VitePWA plugins
├── public/
│   ├── favicon.svg                # AR target crosshair vector icon
│   └── manifest.json              # Web App Manifest
└── src/
    ├── App.tsx                    # Main controller, router, modals & PWA banner
    ├── main.tsx                   # React root entrypoint
    ├── index.css                  # Tailwind directives & HUD scanline animations
    ├── config/
    │   └── model.config.ts        # Swappable vision config (Teachable Machine / COCO-SSD)
    ├── data/
    │   └── equipment.json         # 15 realistic preloaded lab instruments with bilingual data
    ├── types/
    │   └── equipment.ts           # Interfaces for Equipment, BoundingBox, Detections
    ├── lib/
    │   ├── camera.ts              # getUserMedia, torch, facingMode & freeze frame
    │   ├── db.ts                  # Dexie.js IndexedDB storage, history & bookmarks
    │   ├── detection.ts           # 5-stage vision pipeline (capture→recognise→retrieve→overlay→guide)
    │   ├── speech.ts              # Web Speech API text-to-speech engine
    │   └── translations.ts        # English & Hindi UI translations
    ├── components/
    │   ├── TopNav.tsx             # Brand header, online/offline pill, lang/theme toggles
    │   ├── AROverlay.tsx          # Real-time bounding box, crosshairs, 3D compass & tabs
    │   ├── SafetyCard.tsx         # Safety First gatekeeper, hazard badges & PPE chips
    │   ├── StepsGuide.tsx         # Step-by-step operating walk-through with completion confetti
    │   ├── SpecsView.tsx          # Technical ratings, accuracy & common student mistakes
    │   ├── LowConfidencePicker.tsx# Top 3 candidate fallback picker for ambiguous items (<60%)
    │   ├── DemoModeModal.tsx      # Judge demo mode for testing without physical equipment
    │   ├── OnboardingModal.tsx    # 3-step interactive onboarding on first launch
    │   └── AdminModal.tsx         # Password-protected staff portal & review verifier
    └── pages/
        ├── HomeScreen.tsx         # Hero launcher, category chips & featured tools
        ├── ScanScreen.tsx         # Fullscreen AR camera scanner & detection loop
        ├── LibraryScreen.tsx      # Searchable & filterable offline equipment directory
        ├── EquipmentDetailScreen.tsx # Direct reference guide for classroom study
        └── HistoryScreen.tsx      # Last 20 scans log with timestamps & match percentages
```

---

## ⚡ 4. 5-Stage Pipeline Architecture

LabLens enforces a modular 5-stage pipeline separating vision from user guidance:
1. **CAPTURE**: Camera feed streamed via `cameraService.startCamera()` throttled at 5-10 fps using `requestAnimationFrame` to maintain smooth 60fps UI animations.
2. **RECOGNISE**: On-device neural inference via TensorFlow.js. Matches object detections against class dictionaries and calculates bounding boxes.
3. **RETRIEVE**: Queries the local IndexedDB (Dexie.js) for detailed specs, hazard ratings, required PPE, and certified operating steps.
4. **OVERLAY**: Calculates DOM/Canvas bounding box coordinates with corner brackets, target crosshairs, and floating confidence indicators.
5. **GUIDE**: Safety First modal triggers immediately. Once acknowledged by the user, the operating steps unlock with interactive Next/Previous navigation and speech narration.

---

## 📦 5. Pre-Loaded Instruments (15 Standards)

LabLens comes pre-seeded with accurate engineering specifications, hazards, and steps for 15 foundational instruments:
1. **Digital Multimeter**: 1000V DC / 750V AC, CAT III rating, fuse protection cautions.
2. **Vernier Caliper**: 0-150mm, 0.02mm least count, internal/external/depth measurement.
3. **Micrometer Screw Gauge**: 0-25mm, 0.01mm least count, ratchet stop precautions.
4. **Digital Storage Oscilloscope**: 100 MHz, 1 GSa/s, ground alligator clip safety loop warning.
5. **Function Generator**: 25 MHz arbitrary waveform, 50Ω vs High-Z impedance matching.
6. **DC Power Supply**: 0-30V / 5A regulated dual channel, current limit setup rule.
7. **Breadboard**: 830 tie-point bus layout, 36V/1.5A limit to prevent terminal melting.
8. **Soldering Iron**: 60W-80W ceramic heater, 400°C burn hazards, rosin flux ventilation.
9. **Arduino Uno**: ATmega328P, 5V logic, 20mA max per I/O pin, back-EMF protection.
10. **Raspberry Pi 4**: Cortex-A72, strict 3.3V GPIO tolerance warning (NOT 5V tolerant).
11. **Bunsen Burner**: Luminous yellow safety flame vs 1400°C blue roaring cone.
12. **Beaker / Measuring Cylinder**: Borosilicate 3.3, concave meniscus reading rule.
13. **Digital Weighing Balance**: 220g / 0.1mg precision analytical scale with draft shields.
14. **Stopwatch / Tachometer**: 99,999 RPM non-contact laser with Class II warnings.
15. **Safety Goggles and Lab Coat**: ANSI Z87.1+ impact rating & 100% cotton flame protection.

---

## ⏱️ 6. How to Add a New Instrument in Under 2 Minutes

### Method A: Via the Instructor Portal UI (No code needed)
1. Tap the **Shield Icon** in the top navigation bar.
2. Enter the instructor password: `elevate2026`
3. Click **"+ Add New Instrument"**.
4. Enter ID, Name, Category, Hazard Level, Specs, and Steps.
5. Check **"Mark as Staff-Reviewed"** and enter your name (e.g. `Dr. Sharma`).
6. Click **"Save to IndexedDB Database"**. The instrument is immediately searchable and ready for AR scanning offline!

### Method B: In Code (`src/data/equipment.json`)
Append a JSON record to `src/data/equipment.json`:
```json
{
  "id": "spectrophotometer",
  "name": "UV-Vis Spectrophotometer",
  "category": "Measurement",
  "aliases": ["Spectro", "Absorption Meter"],
  "hazardLevel": "medium",
  "staffReviewed": true,
  "reviewerName": "Dr. V. Sharma",
  "reviewDate": "2026-03-01",
  "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  "manualLink": "https://en.wikipedia.org/wiki/Spectrophotometry",
  "specs": {
    "Wavelength Range": "190 nm – 1100 nm",
    "Spectral Bandwidth": "2.0 nm",
    "Photometric Accuracy": "±0.5% T"
  },
  "safetyPrecautions": [
    "UV Radiation Hazard: Never open sample chamber lid when UV lamp is firing.",
    "Handle optical quartz cuvettes by frosted sides only; optical faces must remain pristine."
  ],
  "requiredPPE": ["UV Safety Goggles", "Nitrile Gloves", "Lab Coat"],
  "operatingSteps": [
    "Switch ON instrument and allow Deuterium and Halogen lamps to warm up for 15 minutes.",
    "Calibrate zero absorbance baseline using matching quartz cuvette filled with reference blank solvent.",
    "Insert sample cuvette with optical windows facing the light path.",
    "Execute wavelength scan and record optical density peaks."
  ],
  "commonMistakes": [
    "Using plastic or standard glass cuvettes for UV wavelengths (<340 nm) which absorb UV light.",
    "Touching optical faces of cuvettes leaving finger grease."
  ]
}
```

---

## 🤖 7. How to Train & Plug in a Custom Model with Google Teachable Machine

1. Visit [Google Teachable Machine](https://teachablemachine.withgoogle.com/) and create an **Image Project**.
2. Add classes for your lab tools (e.g., `Multimeter`, `Vernier`, `Oscilloscope`). Capture 50-100 snapshots of each physical tool from various angles under lab lighting.
3. Train the model directly in your browser.
4. Click **"Export Model"** → Select **TensorFlow.js** → **Upload (shareable link)**.
5. Open `src/config/model.config.ts` in LabLens:
   ```ts
   export const MODEL_CONFIG: ModelConfig = {
     modelType: 'teachable-machine',
     modelUrl: 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/',
     confidenceThreshold: 0.60,
     // ...
   };
   ```
6. Map your class labels to equipment IDs in `classToEquipmentMap`. That's it! LabLens now runs your bespoke custom model live on device.

---

## 🚀 8. Run & Deploy Instructions

### Prerequisites
- Node.js (v18 or v20+ recommended)
- Modern web browser (Chrome, Safari, Edge, or Firefox) with webcam / phone camera

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Launch Vite development server
npm run dev
```
Open `http://localhost:3000` in your browser.

> **Testing on Mobile via Local Wi-Fi**:  
> Vite binds to `--host 0.0.0.0`. Look at the terminal output for the Network IP (e.g., `http://192.168.1.X:3000`). Connect your phone to the same Wi-Fi network and open that address!

### Production Build
```bash
npm run build
npm run preview
```

### Deploy to Vercel / Netlify (HTTPS Required for Camera)
Because browsers mandate HTTPS for `navigator.mediaDevices.getUserMedia`, deploying to Vercel or Netlify gives you free, automatic SSL:
1. **Vercel**:
   - Push repository to GitHub.
   - Import project in Vercel.
   - Framework preset: `Vite`.
   - Build command: `npm run build`, Output directory: `dist`.
   - Click **Deploy**.
2. **Netlify**:
   - Run `npx netlify deploy --prod --dir=dist` or connect your GitHub repo.

---

## 💡 9. Demo Mode for Hackathon Judges

Don't have a physical multimeter or oscilloscope handy during your hackathon presentation?
1. Click the glowing **"Demo"** button in the top navigation bar or on the home screen.
2. Select any instrument from the dropdown list.
3. Tap **"Launch Live AR Simulation"**.
4. LabLens will simulate live camera bounding box tracking, show confidence ratings, trigger the Safety First protocol, and walk you through the operating guide with speech synthesis just like a live physical scan!

---

## 🔮 10. Next Steps & Future Enhancements

1. **WebXR Depth API**: Anchor 3D arrows in true volumetric metric space on devices supporting WebXR depth sensing.
2. **Multi-Model Ensemble**: Combine MobileNet feature embeddings with OCR text recognition to read multimeter LCD values in real-time.
3. **Cloud Sync**: Optional Supabase / Firebase synchronization for university-wide lab equipment registries.
4. **Expanded Language Engine**: Add voice and text support for regional languages (Tamil, Telugu, Marathi, Bengali, Kannada) for diverse engineering colleges across India.
