const viewerVersion = '7.108.0';
const cdn = `https://developer.api.autodesk.com/modelderivative/v2/viewers/${viewerVersion}`;
const tabButtons = [...document.querySelectorAll('[data-sample]')];
const toolButtons = [...document.querySelectorAll('[data-viewer-action]')];
const placeholder = document.getElementById('cad-placeholder');
const stage = document.getElementById('cad-stage');
const card = stage.closest('.cad-card');
const cadBackground = [11, 15, 20, 11, 15, 20];
let viewer;
let active = 'arquitectura';
let models = {};
let loadNumber = 0;
let loadQueue = Promise.resolve();
const sampleNames = { arquitectura: 'Arquitectura', estructuras: 'Estructuras', sanitarias: 'Sanitarias', electricas: 'Eléctricas' };

function setPlaceholder(title, message, loading = false) {
  placeholder.hidden = false;
  placeholder.classList.toggle('is-loading', loading);
  placeholder.querySelector('strong').textContent = title;
  placeholder.querySelector('p').textContent = message;
}
function updateViewerToolbar() {
  viewer?.getToolbar()?.setVisible(!window.matchMedia('(max-width: 720px)').matches);
}
function applyCadAppearance() {
  viewer.setTheme('dark-theme');
  viewer.setBackgroundColor(...cadBackground);
  // DWG 2D sheets use their own paper color, separate from the canvas background.
  viewer.setSwapBlackAndWhite(true);
}
function loadSdk() {
  return new Promise((resolve, reject) => {
    if (window.Autodesk?.Viewing) return resolve();
    const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = `${cdn}/style.min.css`; document.head.append(style);
    const script = document.createElement('script'); script.src = `${cdn}/viewer3D.min.js`; script.onload = resolve; script.onerror = () => reject(new Error('No se pudo cargar el Viewer')); document.head.append(script);
  });
}
async function getToken() {
  const response = await fetch('/api/aps/viewer-token', { cache: 'no-store' });
  if (!response.ok) throw new Error('El token de visualización no está disponible');
  const data = await response.json();
  if (!data.access_token || !data.expires_in) throw new Error('Respuesta de token inválida');
  return data;
}
function initViewer() {
  return new Promise((resolve, reject) => {
    window.Autodesk.Viewing.Initializer({ env: 'AutodeskProduction', api: 'derivativeV2', getAccessToken: async callback => { try { const token = await getToken(); callback(token.access_token, token.expires_in); } catch { setPlaceholder('Visor temporalmente no disponible', 'No se pudo obtener autorización para mostrar los planos. Inténtalo más tarde.'); } } }, () => {
      viewer = new window.Autodesk.Viewing.GuiViewer3D(document.getElementById('aps-viewer'), { extensions: ['Autodesk.LayerManager'] });
      const code = viewer.start();
      if (code > 0) return reject(new Error('No se pudo iniciar el Viewer'));
      applyCadAppearance();
      viewer.addEventListener(window.Autodesk.Viewing.TOOLBAR_CREATED_EVENT, updateViewerToolbar);
      window.addEventListener('resize', updateViewerToolbar);
      updateViewerToolbar();
      resolve();
    });
  });
}
function documentFor(urn) {
  return new Promise((resolve, reject) => window.Autodesk.Viewing.Document.load(`urn:${urn}`, resolve, (_code, message) => reject(new Error(message || 'No se pudo abrir el plano'))));
}
function showSample(key) {
  active = key;
  tabButtons.forEach(button => { const selected = button.dataset.sample === key; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
  const requestNumber = ++loadNumber;
  const urn = models[key];
  if (!urn) { setPlaceholder('Muestra en preparación', 'Esta especialidad estará disponible después de su traducción CAD.'); return; }
  setPlaceholder(`Cargando plano de ${sampleNames[key]}…`, 'Estamos preparando la vista del plano.', true);
  loadQueue = loadQueue.catch(() => {}).then(async () => {
    if (requestNumber !== loadNumber) return;
    try {
      const doc = await documentFor(urn);
      if (requestNumber !== loadNumber) return;
      const geometry = doc.getRoot().getDefaultGeometry();
      if (!geometry) throw new Error('Sin vista CAD disponible');
      const previous = viewer.model;
      const loaded = await viewer.loadDocumentNode(doc, geometry, { keepCurrentModels: Boolean(previous) });
      if (previous && previous !== loaded) viewer.unloadModel(previous);
      applyCadAppearance();
      if (requestNumber !== loadNumber) return;
      placeholder.hidden = true;
      viewer.fitToView();
    } catch { if (requestNumber === loadNumber) setPlaceholder('No se pudo mostrar esta muestra', 'Inténtalo de nuevo o revisa otra especialidad.'); }
  });
  return loadQueue;
}
function handleTool(action, button) {
  if (!viewer) return;
  if (action === 'zoom-in' || action === 'zoom-out') {
    const navigation = viewer.navigation;
    const distance = navigation.getEyeVector().length() * 0.22;
    navigation.dollyFromPoint(action === 'zoom-in' ? -distance : distance, navigation.getTarget().clone());
  }
  if (action === 'fit') viewer.fitToView();
  if (action === 'pan') { const pressed = button.getAttribute('aria-pressed') !== 'true'; viewer.setActiveNavigationTool(pressed ? 'pan' : 'default'); button.setAttribute('aria-pressed', String(pressed)); }
  if (action === 'layers') { const manager = viewer.getExtension('Autodesk.LayerManager'); if (manager?.activate) manager.activate(); else viewer.loadExtension('Autodesk.LayerManager').then(ext => ext.activate()); }
  if (action === 'fullscreen') { if (document.fullscreenElement) document.exitFullscreen(); else card.requestFullscreen?.(); }
}
export async function mountViewer() {
  tabButtons.forEach((button, index) => button.addEventListener('click', () => showSample(button.dataset.sample)));
  document.querySelector('.cad-tabs').addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const index = tabButtons.findIndex(button => button.dataset.sample === active); const next = tabButtons[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabButtons.length) % tabButtons.length]; next.focus(); next.click(); });
  toolButtons.forEach(button => button.addEventListener('click', () => handleTool(button.dataset.viewerAction, button)));
  document.addEventListener('fullscreenchange', () => viewer?.resize());
  try { const response = await fetch('/comprar/ing1/aps-manifest.json', { cache: 'no-store' }); if (response.ok) models = (await response.json()).models || {}; } catch { /* Placeholder is intentional. */ }
  if (!Object.values(models).some(Boolean)) return;
  try { await loadSdk(); await initViewer(); toolButtons.forEach(button => button.disabled = false); await showSample(active); } catch { setPlaceholder('Visor temporalmente no disponible', 'Las muestras CAD estarán disponibles pronto.'); }
}
