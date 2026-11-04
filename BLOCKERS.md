# BLOCKERS & ARCHITECTURAL RESOLUTIONS

This document records the architectural constraints, edge cases, and engineering decisions encountered during the implementation of Biometric Hair AI (Phases 0 through 7).

---

## 1. 2D Hair Overlay & Inpainting vs. Editorial Reference Photography
- **Constraint**: Real-time generative inpainting (e.g. Meta Muse Image or GAN overlays) requires massive GPU compute clusters, introduce 10–25s latency per hairstyle, hallucinate non-deterministic facial changes, or produce low-fidelity pasted wig cutouts that undermine clinical credibility.
- **Resolution**: Deprecated 2D hair overlay synthesizers and inpainting from the recommendation flow (`FEATURE_AI_PREVIEW = false`). The product is re-architected into a truthful biometric consultation system:
  1. Real Neoclassical anthropometric face analysis (Farkas thirds, facial index, canonical harmony scoring).
  2. Multi-factor algorithmic ranking against a curated catalog of 16 professional hairstyles.
  3. Studio-grade multi-angle reference lookbooks (Front, Side, Back at 1200x1500 WebP) giving users and barbers pixel-crisp, realistic guidance.
- **Wording Invariant**: UI strictly uses truthful terminology: "Reference looks", never "On you" or "Transformed".

---

## 2. Baseten Grant & Security Isolation
- **Constraint**: Baseten API keys must never be exposed to the client bundle (`EXPO_PUBLIC_`). Additionally, upstream cloud inference may face transient cold starts, rate limits, or network interruptions.
- **Resolution**:
  - All Baseten calls are isolated behind the local Express/Modal proxy (`server/proxy.ts`) with `X-App-Token` authentication and per-IP rate limiting.
  - Added `scripts/check-bundle-keys.ts` (`npm run check:secrets`) to verify no `b10_` or OpenAI key substrings exist in client code.
  - Implemented an anthropometric fallback in `server/proxy.ts`: if Baseten is offline or times out, the server proxy returns a deterministic cephalometric prescription based on Neoclassical rules with honest provenance (`offline_anthropometrics`), ensuring zero client crashes and 100% service uptime.

---

## 3. Metro Web Static Routing vs. Dynamic Asset Interception
- **Constraint**: In Expo Web, requests prefixed with `/assets/...` are intercepted by Metro's dynamic asset bundler, which expects hashed asset queries (e.g. `?platform=web&hash=...`) and throws 404s for static filesystem assets.
- **Resolution**:
  - Re-routed catalog image URLs to `/catalog/${id}/${view}.webp`.
  - Mirrored all 48 WebP reference images (and 48 thumbnails) directly into `public/catalog/` and `public/assets/catalog/`.
  - Web requests are served cleanly by static file middleware with zero 404s.

---

## 4. MediaPipe Tasks-Vision Webpack/Metro Dynamic Import Syntax
- **Constraint**: `@mediapipe/tasks-vision`'s Emscripten bundle contains an ES module dynamic import `await import(t.toString())`. Metro's Babel transform worker treats this as an invalid dynamic call and fails bundle compilation.
- **Resolution**:
  - Created `scripts/patch-mediapipe.js` to patch `vision_bundle.mjs`, `.cjs`, and `.js`, wrapping the dynamic call in `await (new Function("url", "return import(url)"))(t.toString())`.
  - Added `npm run patch:mediapipe` into `postinstall` so any install or clean build remains reproducible.

---

## 5. Static Single-Shot Image Quality Gate Latch Bug
- **Constraint**: `FaceStatusTracker` in `src/lib/faceStatus.ts` was designed for live video tracking with a 4-to-6 frame hysteresis window before latching from `NO_FACE` to `OK`. Single-shot photo captures (demo photo or uploaded image) only evaluate a single frame, causing the tracker to retain `NO_FACE` and reject the capture.
- **Resolution**:
  - Added `const isStaticEvaluation = source === 'mediapipe_image' || source === 'mediapipe_local'` in `src/lib/faceStatus.ts`.
  - For single-shot captures, hysteresis is bypassed and rules are evaluated instantaneously, correctly allowing qualified captures to proceed immediately.

