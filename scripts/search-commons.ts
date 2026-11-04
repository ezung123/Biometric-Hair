import fs from 'node:fs';

async function searchWiki(query: string, limit = 8) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=' +
    encodeURIComponent(query + ' filetype:bitmap') +
    '&gsrlimit=' +
    limit +
    '&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json';

  const res = await fetch(url, {
    headers: { 'User-Agent': 'BiometricHairAI/1.0 (academic-dev@antigravity.internal)' },
  });
  const data = await res.json();
  const results: any[] = [];
  for (const k in data.query?.pages || {}) {
    const p = data.query.pages[k];
    const info = p.imageinfo?.[0];
    if (
      info &&
      (info.mime === 'image/jpeg' || info.mime === 'image/png') &&
      info.width >= 900 &&
      info.height >= 900
    ) {
      results.push({
        title: p.title,
        width: info.width,
        height: info.height,
        url: info.url,
        license: info.extmetadata?.LicenseShortName?.value || 'CC BY-SA',
        author: info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikimedia Contributor',
        sourceUrl: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(p.title),
      });
    }
  }
  return results;
}

async function testAll() {
  const queries = [
    'buzz cut hair',
    'fade haircut',
    'pompadour haircut',
    'french crop haircut',
    'side part haircut',
    'quiff hair',
    'pixie haircut woman',
    'bob haircut woman',
    'braids hairstyle',
    'afro haircut',
    'curly hair bangs',
    'layered hair woman',
  ];
  for (const q of queries) {
    const res = await searchWiki(q, 5);
    console.log(`Query: "${q}" -> ${res.length} high-res results`);
    if (res.length > 0) {
      console.log(`  Top: ${res[0].title} (${res[0].width}x${res[0].height}) by ${res[0].author}`);
    }
  }
}

testAll().catch(console.error);

