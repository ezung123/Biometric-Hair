# 🧬 Biometric Hair Arch

> **Meta Global AI Developer Hackathon — Oct 26–Nov 4, 2026**
> Track: Indie Developer | Theme: Build for Your World

---

## What it does

Biometric Hair Arch is a mobile app that analyzes your face shape using dense biometric landmarks and prescribes personalized haircuts — then simulates them on your photo.

**The pipeline:**
1. **MediaPipe** — 468-point facial landmark detection
2. **Neoclassical Anthropometrics** — Farkas facial thirds + golden ratio deviation scoring
3. **Meta Llama 3.3** — Reasoning agent that generates volumetric haircut prescriptions (crown height, lateral taper, forehead coverage)
4. **Meta SAM 3.1** — Zero-shot scalp segmentation / masking
5. **ControlNet + IP-Adapter** — Inpainting pipeline to simulate the recommended style on your photo

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile UI | React Native + Expo (TypeScript) |
| Computer Vision | MediaPipe (468 landmarks) |
| Reasoning Agent | Meta Llama 3.3 via Baseten |
| Segmentation | Meta SAM 3.1 via Modal |
| Generative | ControlNet / IP-Adapter inpainting via Fireworks AI |
| API Credits | Meta Model API ($150) + Baseten ($100) + Modal ($100) |

---

## Project Structure

```
src/
├── types/index.ts           # FacialMetrics, HairstyleOption, StylingPrescription
├── constants/mockData.ts    # Mock data for all 3 face presets (Oblong/Round/Oval)
├── components/
│   ├── BiometricOverlay.tsx # SVG HUD — facial thirds lines + golden ratio rectangle
│   ├── MetricCards.tsx      # Dark metric panel with progress bars and φ gauge
│   └── StyleCard.tsx        # Hairstyle card with match score + Try-On CTA
└── screens/HomeScreen.tsx   # Main screen — all components wired together
```

---

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Run on web
npm run web
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

| Variable | Source |
|---|---|
| `META_API_KEY` | [developers.facebook.com](https://developers.facebook.com) |
| `BASETEN_API_KEY` | [baseten.co](https://baseten.co) |
| `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` | [modal.com](https://modal.com) |
| `FIREWORKS_API_KEY` | [fireworks.ai](https://fireworks.ai) |

---

## Hackathon Notes

- **Muse integration points** are marked `TODO (Muse)` in `src/screens/HomeScreen.tsx`
- `handleAnalyse()` — wire MediaPipe + Llama 3.3 pipeline
- `handleTryOn(styleId)` — wire SAM 3.1 segmentation + ControlNet inpaint
- Baseten model ID: `meta-models/muse-spark-open-1026`

---

## Team

Built during the Meta Global AI Developer Hackathon (Oct 26–Nov 4, 2026).
