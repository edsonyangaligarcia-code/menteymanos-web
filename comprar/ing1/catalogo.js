const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
const sortNodes = nodes => [...nodes].sort((a, b) => (a.type === 'folder' ? 0 : 1) - (b.type === 'folder' ? 0 : 1) || collator.compare(a.name, b.name));
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export async function mountCatalog() {
  const list = document.getElementById('catalog-list');
  const crumbs = document.getElementById('catalog-crumbs');
  const search = document.getElementById('catalog-search');
  const back = document.getElementById('catalog-back');
  const forward = document.getElementById('catalog-forward');
  const home = document.getElementById('catalog-home');
  const count = document.getElementById('catalog-count');
  const total = document.getElementById('catalog-total');
  let root, path = [], backStack = [], forwardStack = [];
  try {
    const response = await fetch('/comprar/ing1/catalogo-ing1.json');
    if (!response.ok) throw new Error('No se pudo cargar el catálogo');
    const data = await response.json();
    total.textContent = `${new Intl.NumberFormat('es-PE').format(data.folders)} carpetas · ${new Intl.NumberFormat('es-PE').format(data.files)} archivos`;
    const main = data.tree.find(node => node.type === 'folder' && /colección maestra de planos/i.test(node.name));
    root = sortNodes(main?.children || data.tree);
  } catch {
    list.innerHTML = '<p class="empty-state">El catálogo no está disponible en este momento.</p>';
    return;
  }
  function current() { return path.length ? path.at(-1).children || [] : root; }
  function navigate(next) {
    if (path.length === next.length && path.every((node, index) => node === next[index])) { search.value = ''; render(); return; }
    backStack.push([...path]);
    forwardStack = [];
    path = next;
    search.value = '';
    render();
    list.scrollTop = 0;
  }
  function findPath(nodes, target, trail = []) {
    for (const node of nodes) {
      if (node === target) return [...trail, node];
      if (node.type === 'folder') {
        const found = findPath(node.children || [], target, [...trail, node]);
        if (found) return found;
      }
    }
    return null;
  }
  function render() {
    const query = normalize(search.value.trim());
    let nodes;
    if (query) {
      nodes = [];
      const visit = items => { for (const node of items) { if (normalize(node.name).includes(query)) nodes.push(node); if (node.type === 'folder') visit(node.children || []); } };
      visit(root);
      nodes = sortNodes(nodes).slice(0, 100);
    } else nodes = sortNodes(current());
    count.textContent = query ? `${nodes.length}${nodes.length === 100 ? '+' : ''} resultados` : `${nodes.length} elementos`;
    back.disabled = backStack.length === 0;
    forward.disabled = forwardStack.length === 0;
    home.disabled = path.length === 0 && !query;
    crumbs.replaceChildren();
    const rootButton = document.createElement('button'); rootButton.type = 'button'; rootButton.textContent = 'ING 1'; rootButton.addEventListener('click', () => navigate([])); crumbs.append(rootButton);
    for (const [index, node] of path.entries()) {
      const slash = document.createElement('span'); slash.textContent = '/'; crumbs.append(slash);
      const button = document.createElement('button'); button.type = 'button'; button.textContent = node.name; button.addEventListener('click', () => navigate(path.slice(0, index + 1))); crumbs.append(button);
    }
    list.replaceChildren();
    if (!nodes.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'No se encontraron elementos.'; list.append(empty); return; }
    const fragment = document.createDocumentFragment();
    for (const node of nodes) {
      const row = document.createElement(node.type === 'folder' ? 'button' : 'div');
      row.className = `catalog-row ${node.type}`;
      if (node.type === 'folder') { row.type = 'button'; row.addEventListener('click', () => navigate(query ? findPath(root, node) || [node] : [...path, node])); }
      const icon = document.createElement('span'); icon.className = 'catalog-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = node.type === 'folder' ? '▣' : '·';
      const name = document.createElement('span'); name.className = 'row-name'; name.textContent = node.name;
      const meta = document.createElement('span'); meta.className = 'row-meta'; meta.textContent = node.type === 'folder' ? 'Abrir ›' : (node.name.split('.').at(-1) || 'Archivo').slice(0, 6).toUpperCase();
      row.append(icon, name, meta); fragment.append(row);
    }
    list.append(fragment);
  }
  search.addEventListener('input', render);
  back.addEventListener('click', () => { if (!backStack.length) return; forwardStack.push([...path]); path = backStack.pop(); search.value = ''; render(); });
  forward.addEventListener('click', () => { if (!forwardStack.length) return; backStack.push([...path]); path = forwardStack.pop(); search.value = ''; render(); });
  home.addEventListener('click', () => navigate([]));
  render();
}
