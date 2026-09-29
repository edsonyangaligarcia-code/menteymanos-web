import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const samples = ['arquitectura', 'estructuras', 'sanitarias', 'electricas'];
const manifestPath = resolve(root, 'comprar/ing1/aps-manifest.json');
const api = 'https://developer.api.autodesk.com';
const wait = ms => new Promise(done => setTimeout(done, ms));

async function localEnv() {
  const vars = {};
  try {
    const lines = (await readFile(resolve(root, '.dev.vars'), 'utf8')).split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*(APS_CLIENT_ID|APS_CLIENT_SECRET|APS_BUCKET_KEY)\s*=\s*(.*)\s*$/);
      if (match) vars[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return { ...vars, ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('APS_'))) };
}
async function request(url, { token, ...options } = {}) {
  const response = await fetch(url, { ...options, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (response.status === 404) return null;
  if (!response.ok) {
    let detail = '';
    try { const body = await response.json(); detail = body.reason || body.developerMessage || body.error || ''; } catch { /* avoid logging response bodies */ }
    throw new Error(`APS HTTP ${response.status}${detail ? `: ${String(detail).slice(0, 160)}` : ''}`);
  }
  if (response.status === 204) return {};
  return response.json();
}
async function tokenFor(clientId, clientSecret, scopes) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await request(`${api}/authentication/v2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: scopes.join(' ') })
  });
  return response.access_token;
}
async function ensureBucket(key, token) {
  const exists = await request(`${api}/oss/v2/buckets/${encodeURIComponent(key)}/details`, { token });
  if (exists) return;
  await request(`${api}/oss/v2/buckets`, {
    token, method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketKey: key, policyKey: 'persistent' })
  });
}
async function ensureObject(key, objectKey, bytes, token) {
  const objectUrl = `${api}/oss/v2/buckets/${encodeURIComponent(key)}/objects/${encodeURIComponent(objectKey)}`;
  const existing = await request(`${objectUrl}/details`, { token });
  if (existing?.objectId) return existing.objectId;
  const signed = await request(`${objectUrl}/signeds3upload?parts=1&firstPart=1`, { token });
  if (!signed?.urls?.[0] || !signed.uploadKey) throw new Error('APS no entregó URL de carga');
  const upload = await fetch(signed.urls[0], { method: 'PUT', body: bytes });
  if (!upload.ok) throw new Error(`Carga S3 HTTP ${upload.status}`);
  const completed = await request(`${objectUrl}/signeds3upload`, {
    token, method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ads-meta-Content-Type': 'application/acad' },
    body: JSON.stringify({ uploadKey: signed.uploadKey })
  });
  if (!completed?.objectId) throw new Error('APS no devolvió objectId después de cargar');
  return completed.objectId;
}
const urnFromObjectId = objectId => Buffer.from(objectId).toString('base64url');
async function getManifest(urn, token) {
  return request(`${api}/modelderivative/v2/designdata/${encodeURIComponent(urn)}/manifest`, { token });
}
async function translate(urn, token) {
  await request(`${api}/modelderivative/v2/designdata/job`, {
    token, method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { urn }, output: { formats: [{ type: 'svf2', views: ['2d', '3d'] }] } })
  });
}
async function waitForTranslation(urn, token) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const result = await getManifest(urn, token);
    if (result?.status === 'success') return;
    if (result?.status === 'failed' || result?.status === 'timeout') throw new Error(`Traducción ${result.status}`);
    if (attempt % 4 === 0) console.log(`  Traducción en curso (${result?.progress || 'pendiente'})`);
    await wait(15000);
  }
  throw new Error('Tiempo de espera agotado; vuelve a ejecutar el script para retomar');
}
async function saveManifest(models) {
  await writeFile(manifestPath, `${JSON.stringify({ models }, null, 2)}\n`, 'utf8');
}
async function main() {
  const files = [];
  for (const name of samples) {
    const path = resolve(root, 'private/cad-samples', `${name}.dwg`);
    const info = await stat(path);
    if (!info.isFile() || info.size < 100) throw new Error(`DWG inválido: ${name}`);
    const bytes = await readFile(path);
    if (!/^AC10\d{2}$/.test(bytes.subarray(0, 6).toString('ascii'))) throw new Error(`Cabecera DWG inválida: ${name}`);
    files.push({ name, bytes, hash: createHash('sha256').update(bytes).digest('hex').slice(0, 16) });
  }
  console.log('Cuatro DWG locales validados.');
  const env = await localEnv();
  if (!env.APS_CLIENT_ID || !env.APS_CLIENT_SECRET) {
    console.log('Configura APS_CLIENT_ID y APS_CLIENT_SECRET en .dev.vars o en el entorno y vuelve a ejecutar este script.');
    return;
  }
  const bucketKey = env.APS_BUCKET_KEY || `menteymanos-ing1-${createHash('sha256').update(env.APS_CLIENT_ID).digest('hex').slice(0, 16)}`;
  if (!/^[a-z0-9._-]{3,128}$/.test(bucketKey)) throw new Error('APS_BUCKET_KEY debe usar minúsculas, números, punto, guion o guion bajo');
  const token = await tokenFor(env.APS_CLIENT_ID, env.APS_CLIENT_SECRET, ['bucket:create', 'bucket:read', 'data:create', 'data:write', 'data:read']);
  await ensureBucket(bucketKey, token);
  const current = JSON.parse(await readFile(manifestPath, 'utf8'));
  const models = { arquitectura: null, estructuras: null, sanitarias: null, electricas: null, ...(current.models || {}) };
  let failed = false;
  for (const file of files) {
    try {
      console.log(`Preparando ${file.name}…`);
      const objectId = await ensureObject(bucketKey, `${file.name}-${file.hash}.dwg`, file.bytes, token);
      const urn = urnFromObjectId(objectId);
      const existing = await getManifest(urn, token);
      if (existing?.status !== 'success' && existing?.status !== 'pending' && existing?.status !== 'inprogress') await translate(urn, token);
      if (existing?.status !== 'success') await waitForTranslation(urn, token);
      models[file.name] = urn;
      await saveManifest(models);
      console.log(`  ${file.name}: listo`);
    } catch (error) { failed = true; console.error(`  ${file.name}: ${error.message}`); }
  }
  if (failed) process.exitCode = 1;
  else console.log('Cuatro muestras traducidas; manifest público actualizado solo con URN.');
}
main().catch(error => { console.error(`No se pudieron preparar las muestras: ${error.message}`); process.exitCode = 1; });
