import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const path of ['index.html', '.nojekyll', 'assets', 'ing1', 'ing3', 'ing7', 'panel', 'comprar']) {
  await cp(resolve(root, path), resolve(output, path), { recursive: true });
}
console.log('Sitio público construido en dist/ (sin private/ ni .dev.vars).');
