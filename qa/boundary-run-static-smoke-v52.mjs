import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = ['index.html', 'src/game.js', 'src/styles.css', 'README.md', 'SECURITY.md', 'DONATIONS.md'];
for (const f of required) readFileSync(join(root, f), 'utf8');
const runtimeText = ['index.html', 'src/game.js', 'src/styles.css', 'src/manifest.json']
  .map(f => readFileSync(join(root, f), 'utf8'))
  .join('\n');
const forbidden = [/fetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/, /serviceWorker/];
for (const rx of forbidden) {
  if (rx.test(runtimeText)) throw new Error(`Forbidden API found: ${rx}`);
}
const donationText = readFileSync(join(root, 'DONATIONS.md'), 'utf8');
if (!donationText.includes('DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp')) throw new Error('Donation address missing');
console.log('OK: static smoke passed');
