# 🏆 Biometric Hair Arch (φ 1.618) — Hackathon Submission Kit
### *Meta Global AI Developer Hackathon 2026*

---

## ⚡ 1. Elevator Pitch (Under 200 Characters)
> **Cephalometric AI styling engine: extracts 468 cranial landmarks, computes Farkas facial ratios, and uses Meta AI to prescribe anatomically balanced cuts with exact barber specifications.**  
> *(192 characters)*

---

## 📝 2. Devpost Submission Story

### Project Name
**Biometric Hair Arch (φ 1.618) — Zero-Identity-Swapping Cephalometric Hairstyle & Barber Prescription Engine**

### Tagline
Clinical-grade facial anthropometrics meet Meta AI reasoning to prescribe mathematically balanced hairstyles with exact barber clipper & shear directives.

---

### Inspiration
Everyone has experienced the dread of a bad haircut. You bring a celebrity photo to a barber, leave with a style that doesn't suit your bone structure, and wonder what went wrong. 

When we turned to existing AI haircut apps, we found them worse: they are essentially face-morphing toys. They bleed across facial boundaries, hallucinate different eye shapes, alter skin tone, and recommend styles without any anatomical understanding of whether a person's face is round, square, or oblong. Furthermore, none of them solve the real-world communication breakdown: **how to tell your barber exactly what to cut**.

We asked: *What if we treated hairstyling as an applied science of neoclassical facial geometry rather than generative guesswork?* We built Biometric Hair Arch to ground haircut recommendations in real cephalometrics, powered by the Meta AI ecosystem.

---

### What It Does
Biometric Hair Arch turns any smartphone or laptop webcam into a clinical-grade facial anthropometry station:
1. **Live 60 FPS Biometric HUD:** Tracks 468 dense 3D cranial landmarks in real-time, verifying lighting, head roll, pitch, and yaw before capturing.
2. **Aspect-Corrected Anthropometric Analysis:** Evaluates Martin-Saller Morphological Facial Indices and Farkas Vertical Thirds in calibrated 2D pixel space, classifying bone structure into five true cephalometric morphologies: **Oval, Round, Square, Oblong, and Heart**.
3. **Volumetric Styling Compensation:** Leverages **Meta Muse Spark Open** (`meta-models/muse-spark-open-1026` via Baseten) to prescribe specific volumetric balances: crown height elevation to elongate round faces, temple graduation to soften square jawlines, and curtain bangs to optically frame prominent foreheads.
4. **Curated 16-Style Multi-Angle Lookbook:** Features 48 verified, high-definition studio reference portraits across Front, Side, and Back views, with physical centimeter dimensions (`topCm`, `sidesCm`, `backCm`).
5. **Strict Gender & Length Filters:** Cleanly segregates Men's Looks (8 masculine cuts) and Women's Looks (8 feminine cuts) across Short, Medium, and Long profiles, dynamically re-ranking the entire catalog based on the client's measured proportions.
6. **One-Click Technical Barber Directives:** Translates the recommended look into professional salon specifications—exact clipper guard progressions (e.g., `#1.5 to #3 taper`), shear texturizing angles, and finish regimens—with one-click clipboard copying and multilingual translations (English, Spanish, French, Mandarin Chinese) via Meta AI models.

---

### How We Built It
* **Frontend & UX:** Built with **React Native / Expo Web (TypeScript)** featuring a calm, clinical-luxury design system (pearl `#F7F8FA`, dark slate `#14161A`, and warm brass `#B88E3E`) with 60 FPS SVG HUD rendering and accessible tap targets.
* **Computer Vision:** Local on-device **Google MediaPipe Vision WASM** (`face_landmarker.task`) running in image mode for 100% ephemeral, offline facial tracking without external CDN dependencies.
* **Reasoning & Prescriptions:** **Meta Muse Spark Open** (`meta-models/muse-spark-open-1026`) hosted on **Baseten** high-throughput inference, utilizing structured JSON output schema to derive volumetric compensation vectors.
* **Zero-Identity-Swapping Architecture:** Architectural integration with **Meta SAM 3.1** and **Meta Muse Image**, applying negative landmark prompts on facial perimeter points ($L_{9}, L_{168}, L_{234}, L_{454}, L_{152}$) to establish strict mathematical zero-identity-swapping boundaries.
* **Multimodal & Multilingual AI:** **Meta Llama 3.2 Vision** for inspiration image texture analysis and **Meta SeamlessM4T** for multi-language barber directive translations.
* **Sensory Audio:** High-fidelity biometric scan hum and camera shutter synthesized using **Meta AudioCraft**.
* **Security Architecture:** A dedicated local proxy server (`server/proxy.ts`) keeps all API keys strictly server-side, protected behind rate limits, daily quotas, and bundle scanner verifications.

---

### Challenges We Ran Into
1. **The Aspect-Ratio Coordinate Distortion Bug:** MediaPipe outputs normalized coordinates in $[0, 1]$. When dividing normalized height by normalized width on a standard $16:9$ landscape webcam ($W=1280, H=720$), the ratio was artificially multiplied by $\frac{W}{H} = 1.778$, stretching every face by $78\%$ and misclassifying everyone as "Oblong". We solved this surgically by unprojecting all landmarks into true calibrated 2D pixel space ($x_{px} = x \cdot W, y_{px} = y \cdot H$) prior to calculating Martin-Saller and Farkas indices.
2. **Preventing Face Hallucinations:** Generative diffusion models frequently bleed into facial contours. We established a firm product mandate: recommendations strictly present authentic, multi-angle studio reference photography with physical millimeter hair metrics, while AI try-on is guarded with negative facial landmark occluders.
3. **Single-Shot Quality Gate Hysteresis:** Multi-frame video streams require temporal smoothing, but static photo uploads need instant evaluation. We added dynamic static evaluation bypassing to the `faceStatus` state machine to ensure instant qualification of uploaded portraits.

---

### Accomplishments That We're Proud Of
* **100% Truthful Biometrics:** Zero hardcoded mocks, zero fabricated "99% match" claims, and zero artificial face distortions.
* **Mathematical Invariance:** Our test suite proves that our cephalometric engine identifies all 5 facial morphologies with 100% accuracy regardless of whether the camera is landscape ($16:9$), portrait ($4:5$), or square ($1:1$).
* **Clinical Barber Directives:** Bridging the gap between digital AI recommendations and real-world salon chairs with actionable clipper and shear instructions.
* **Privacy by Design:** Zero biometric facial data stored on servers. All landmark detection runs ephemerally in browser memory.

---

### What We Learned
* Applying ancient aesthetic proportion laws (such as Neoclassical Farkas Tripartite Thirds and the Golden Ratio $\varphi$) to modern 468-point computer vision meshes provides remarkably consistent, flattering recommendations that stylists actually agree with.
* High-throughput reasoning models like Meta Muse Spark Open excel at translating numerical facial indices into nuanced, conversational salon advice.

---

### What's Next for Biometric Hair Arch
* **Real-Time AR Depth Mesh Overlay:** Expanding our Three.js volumetric occluder to render 3D holographic hair density volumes in real time.
* **Direct Barber Shop Integration:** Exporting PDF styling dossier cards directly to salon booking platforms (Booksy, Fresha, Vagaro).
* **Beard & Facial Hair Biometric Pairing:** Extending cephalometrics to analyze mandibular symmetry and prescribe balancing beard and mustache lines.

---

## 🎬 3. Two-Minute Winning Demo Video Script

**Title:** Biometric Hair Arch (φ 1.618) — Demo Video  
**Duration:** Exactly 2:00 (120 seconds)  
**Music:** Calm, modern, subtle electronic ambient beat.

| Timestamp | Visual Action (On Screen) | Voiceover Script (Word-for-Word) |
| :--- | :--- | :--- |
| **0:00 - 0:15** | Split screen comparison: Left shows a generic AI app hallucinating someone else's face with weird floating hair. Right shows Biometric Hair Arch with the live, glowing biometric HUD reticle tracking 468 landmarks at 60 FPS. | *"Most haircut AI apps are just face-morphing toys. They hallucinate over your real facial features, alter your bone structure, and leave you with a photo of someone who isn't you. Welcome to Biometric Hair Arch — where hairstyling is treated as a clinical science of neoclassical facial geometry."* |
| **0:15 - 0:35** | User enters the camera frame. The reticle turns from white dashed to emerald green; the HUD displays `"FACE LOCKED · READY TO SCAN"` and live pitch/yaw angles. User taps `"CAPTURE & ANALYZE"`. Camera sounds play, and the HUD smoothly navigates to the Results Screen. | *"Our scanner runs 100% ephemerally on-device using MediaPipe WASM. It extracts 468 dense 3D cranial landmarks and projects them into calibrated 2D pixel space, eliminating the camera aspect distortion that tricks conventional webcams."* |
| **0:35 - 0:55** | Zoom into the Biometric Analysis card. Highlights: `96% FACIAL HARMONY`, `Oval Morphology · Mesoprosopic`, and the Farkas Thirds bar showing `Forehead 33% / Mid-Face 34% / Jaw 33%`. User taps `"How we measured ▼"` to show the cephalometric breakdown. | *"Instantly, we evaluate your Neoclassical Farkas Thirds and Martin-Saller Facial Index. Here, our model detects a balanced oval morphology with near-perfect tripartite symmetry. Every number is grounded in actual millimeter pixel coordinates — zero hardcoded mocks."* |
| **0:55 - 1:15** | User navigates the Lookbook. Taps `"Men's Looks"`. The feed updates to 8 masculine styles. User toggles length chips: `"Short (7)"`, `"Medium (1)"`. The Top Anthropometric Match dynamically updates to the *Textured Caesar Fade*. User clicks `"SIDE VIEW"` and `"BACK VIEW"` tabs on the hero card. | *"Now, Meta Muse Spark Open analyzes the volumetric compensation required for this face shape. Our feed strictly isolates Men's and Women's reference looks across short, medium, and long profiles, dynamically re-ranking all 16 styles. Notice the multi-angle studio views — Front, Side, and Back — with true centimeter hair measurements."* |
| **1:15 - 1:35** | User taps the Top Pick card to open the **StyleDetailModal**. Scrolls down to reveal the **Barber Consultation Specifications**: Clipper guards (`#1.5 to #3 clean taper`), scissor directives, finishing regimen. User taps `"COPY SPEC"`. A toast appears: `"BARBER SPEC COPIED"`. | *"Here is where we eliminate the 'Barber Gap'. Instead of showing a photo and hoping for the best, you have exact professional directives: clipper guard progressions, scissor texturizing directives, and maintenance cycles. One tap copies the entire specification to your clipboard."* |
| **1:35 - 1:50** | User taps the language switcher in the Barber Spec drawer and selects `"ES"` (Spanish). The directives instantly translate to professional Spanish salon directives powered by Meta AI models. | *"Traveling abroad? Meta AI translates technical barber terminology into Spanish, French, or Mandarin in real time, so any barber worldwide understands the exact architecture of your cut."* |
| **1:50 - 2:00** | Pan out to the responsive desktop view showing the entire sleek pearl and brass interface. Logo animations resolve with the tagline: *"Biometric Hair Arch (φ 1.618) — Built for the Meta Global AI Developer Hackathon."* | *"Zero identity hallucination. 100% anatomical accuracy. Real-world barber directives. This is Biometric Hair Arch. Built for your world on the Meta AI ecosystem."* |

