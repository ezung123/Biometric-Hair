import { HAIRSTYLE_CATALOG } from '../src/constants/catalog.ts';

console.log('===================================================================================================================');
console.log('HAIRSTYLE CATALOG DATA & LENGTHCLASS AUDIT');
console.log('===================================================================================================================');
console.log('| ID | Style Name | Audience | Top (cm) | Sides (cm) | Back (cm) | LengthClass | Category |');
console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

for (const s of HAIRSTYLE_CATALOG) {
  console.log(`| \`${s.id}\` | ${s.name} | **${s.audience}** | ${s.topCm} cm | ${s.sidesCm} cm | ${s.backCm} cm | \`${s.lengthClass}\` | ${s.category} |`);
}
console.log('===================================================================================================================');

