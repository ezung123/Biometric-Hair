# Hairstyle Reference Image Sourcing Guide

This document outlines how hairstyle reference imagery is sourced, ingested, and maintained in Biometric Hair AI.

## 1. Sourcing Hierarchy

1. **Official Free APIs** (with keys configured in `.env`):
   - **Pexels API**: Set `PEXELS_API_KEY` in `.env`. Allows 200 requests/hour.
   - **Unsplash API**: Set `UNSPLASH_ACCESS_KEY` in `.env`. Allows 50 requests/hour.
2. **Wikimedia Commons** (Open Access):
   - Direct queries via `https://commons.wikimedia.org/w/api.php` filtering for CC0, CC-BY, and CC-BY-SA licensed media.
3. **Manual Drop-in Directory** (`assets/incoming/`):
   - Users or curators may place high-resolution photos into:
     `assets/incoming/{styleId}/front.jpg`
     `assets/incoming/{styleId}/side.jpg`
     `assets/incoming/{styleId}/back.jpg`
   - The pipeline will automatically crop, resize, and optimize these files.

## 2. Ingestion & Quality Gates

Run the automated pipeline at any time with:
```bash
npm run ingest:catalog
```

The pipeline enforces:
- **Aspect Ratio**: Standard 4:5 vertical portrait.
- **Headroom**: Hair envelope is 100% visible with comfortable cranial headroom.
- **Resolution**: 1200x1500 primary WebP (q82) and 600x750 thumbnail WebP (q75).
- **Placeholders**: Generates 24px blurred base64 placeholders for instant zero-CLS loading.
- **Metadata**: Strips EXIF metadata to preserve user privacy.
