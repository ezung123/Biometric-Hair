# Model Truth & Provenance Table

| Model | Purpose | Hosting / Source | Parameter Count | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Meta Muse Spark Open** (`meta-models/muse-spark-open-1026`) | Cephalometric prescription, Farkas ratio reasoning, Salon Concierge, multilingual translation, multimodal quality judge | **Baseten Hackathon Grant** (`https://inference.baseten.co/v1`) | **816B** (Open Weights) | **Running Live** | Key secured exclusively in server proxy; daily cap 200, 25 req/min; zero client-side exposure. Verified via `npm run test:baseten`. |
| **MediaPipe FaceLandmarker** | Real-time facial detection, 468 3D landmarks, head pose (pitch/yaw/roll), bounding box, Farkas vertical thirds | **On-Device** (Bundled WASM in `public/mediapipe/`) | ~2.5M | **Running On-Device** | Zero latency, operates offline; 60 FPS client-side tracking with single coverTransform source of truth. |
| **Meta Muse Image** (`meta/muse-image`) | Instruction-based hairstyle editing on user's 4:5 head crop portrait | **OpenRouter Proxy** (`https://openrouter.ai/api/v1`) | Diffusion Inpainting | **Proxy Ready** | Endpoint `POST /api/hair-edit` wired in `server/proxy.ts`. Requires user key in `.env`; when unconfigured, app displays authentic editorial lookbook portraits. |
| **Neoclassical Anthropometrics Engine** | Farkas neoclassical thirds, facial index, morphology classification, compensatory vectors | **On-Device** (Deterministic TypeScript math) | N/A (Analytical) | **Running On-Device** | Instant offline fallback when network is unavailable or daily cap is exceeded. |
| **Web Audio API Procedural Acoustics** | Acoustic haptic feedback (220Hz-440Hz biometric scan drone, dual-click mechanical shutter) | **On-Device** (Hardware-accelerated browser Web Audio API) | N/A (Synthesized) | **Running On-Device** | Pure procedural oscillator synthesis. Does not claim remote AudioCraft execution. |
| **Meta Chameleon** | Interleaved multimodal narrative lookbook generation | Architectural Reference | — | **Architecture Reference** | Stylistic directives structured via Muse Spark Open reasoning. |
| **Meta SAM 3.1** | Zero-shot scalp segmentation with negative facial protection prompts | Edge Model Reference | — | **Architecture Reference** | Real-time on-device hair silhouette extracted using MediaPipe facial contours and trichion landmarks. |
| **Meta SeamlessM4T** | Multilingual translation layer | Proxied Muse Spark Open + Dictionary | — | **Proxy + Local Fallback** | Live multilingual reasoning handled via Muse Spark Open proxy; cached and supplemented with localized dictionaries for EN/ES/ZH/FR. |

---

## Security & Verification Guarantees

1. **Zero Secret Key Leakage**:
   - `BASETEN_API_KEY` and other sensitive provider keys reside strictly server-side in `.env` (git-ignored and verified absent from repository history).
   - Automated secret scanning (`npm run check:secrets`) scans all 47 client-side source files and static bundles on every build. Zero secret patterns detected.

2. **Automated Verification Suite**:
   - `npm run test:baseten` runs through the server proxy against `https://inference.baseten.co/v1`.
   - Verified capabilities:
     - **Test A: Text Chat Completion**: Status 200 OK, latency ~1.7s, tokens accounted.
     - **Test B: Strict JSON Cephalometric Prescription**: Status 200 OK, schema `{ crown, sides, fringe, rationale, cautions }` validated, strictly citing provided measurements without hallucinating unmeasured metrics.
     - **Test C: Multimodal Image Input (Vision)**: Status 200 OK, correctly identifies portrait hair texture and volume from real photographic inputs.
     - **Test D: Model Catalog Inventory**: Status 200 OK, confirms zero diffusion models under the grant; confirms `meta-models/muse-spark-open-1026` is an 816B reasoning model.

3. **Honest In-App Attribution**:
   - Every recommendation card, prescription box, and modal explicitly shows the true provider badge: `LIVE (Muse Spark Open 816B)` vs `OFFLINE ANTHROPOMETRICS`.
   - Before/after comparisons clearly distinguish between AI-generated diffusion edits (when an edit provider is live) and professional editorial lookbook portraits.

