import fs from 'node:fs';
import path from 'node:path';

// Search Wikimedia Commons for real photos of hairstyles
async function searchWikimedia(term: string): Promise<any[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
    term + ' filetype:bitmap'
  )}&gsrlimit=10&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BiometricHairAI/1.0 (academic-dev@antigravity.internal)' },
    });
    const data = await res.json();
    const results = [];
    for (const k in data.query?.pages || {}) {
      const p = data.query.pages[k];
      const info = p.imageinfo?.[0];
      if (
        info &&
        (info.mime === 'image/jpeg' || info.mime === 'image/png') &&
        info.width >= 800 &&
        info.height >= 800
      ) {
        const license = info.extmetadata?.LicenseShortName?.value || 'CC BY-SA';
        const artist = info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '').trim() || 'Wikimedia Contributor';
        results.push({
          title: p.title.replace('File:', ''),
          width: info.width,
          height: info.height,
          url: info.url,
          license,
          author: artist,
          sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        });
      }
    }
    return results;
  } catch (err: any) {
    console.error(`Error searching ${term}:`, err.message);
    return [];
  }
}

async function run() {
  const targets = [
    { style: 'linear-buzz-cut', queries: ['buzz cut front', 'buzz cut profile', 'buzz cut back'] },
    { style: 'parisian-bob', queries: ['bob haircut front', 'bob haircut side', 'bob haircut back'] },
    { style: 'sleek-pixie', queries: ['pixie haircut front', 'pixie cut side view', 'pixie cut back view'] },
    { style: 'knotless-box-braids', queries: ['box braids front', 'braids side view', 'box braids back'] },
    { style: 'afro-taper-fade', queries: ['afro hair front', 'afro side view', 'afro hair back'] },
    { style: 'low-taper-fade', queries: ['taper fade haircut', 'fade haircut side', 'taper fade back'] },
  ];

  for (const t of targets) {
    console.log(`\n=== Style: ${t.style} ===`);
    for (const q of t.queries) {
      const found = await searchWikimedia(q);
      console.log(`Query "${q}" -> ${found.length} items`);
      if (found.length > 0) {
        console.log(`  [1] ${found[0].title} (${found[0].width}x${found[0].height}) - ${found[0].license}`);
      }
    }
  }
}

run();

