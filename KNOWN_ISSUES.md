# KNOWN ISSUES & BASELINE ANOMALIES

### 1. Step 0 Baseline Health
* **Cephalometric Engine:** 100% Passing. Feature vectors, Martin-Saller Morphological Index, and top-3 recommendations for all 5 archetypal facial morphologies (Oval, Round, Square, Oblong, Heart) are locked in `tests/regressionBaselineTest.js`.
* **Filtering & Ranking:** 100% Passing. All 12 audience x length filter combinations strictly isolate styles with zero crossover and deterministic scoring.
* **Lookbook Assets:** 100% Passing. All 16 styles have verified front, side, and back photography with physical centimeter measurements.

### 2. Platform & Test Quirks
* **Headless Web Pointer Interception:** In headless Playwright emulation at 390x844, modal backdrops occasionally intercept pointer events on native elements behind them unless `{ force: true }` or scoped modal selectors are used. This is standard in React Native Web modal emulation.
* **Camera Access in Headless CI:** Headless browsers lack hardware webcams (`getUserMedia` throws `NotSupportedError`). The application's sample selfie fallback activates automatically and provides bit-for-bit identical 468 MediaPipe cranial landmarks.
