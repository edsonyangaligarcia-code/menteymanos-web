const STORAGE_KEY = "mym_panel_state_v1";
const CLOUD_KEY_STORAGE = "mym_panel_cloud_key";
const STATE_API = "/api/state";
const HEALTH_API = "/api/health";

let state = null;
let charts = {};
let activePeriod = "7d";
let customRange = null;
let activeCampaign = "ALL";
let cloudAvailable = false;
let cloudKey = localStorage.getItem(CLOUD_KEY_STORAGE) || "";
let cloudTimer = null;
let deferredPrompt = null;

const $ = (id) => document.getElementById(id);
const money = (v) => `S/ ${Number(v || 0).toFixed(2)}`;
const pct = (v) => `${Number(v || 0).toFixed(1)}%`;
const escapeHtml = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};
const parseDate = (s) => new Date(`${s}T00:00:00`);
const unique = (arr) => [...new Set(arr.filter(Boolean))];
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function toast(message){
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove("show"), 2400);
}

async function fetchSeed(){
  const r = await fetch("./data/historico.json", {cache:"no-store"});
  if(!r.ok) throw new Error("No se pudo cargar el historial inicial.");
  const seed = await r.json();
  return {
    schema_version: 1,
    metadata: {...seed.metadata, local_created_at:new Date().toISOString(), updated_at:new Date().toISOString()},
    products: seed.products || [],
    campaigns: seed.campaigns || [],
    current_campaigns: seed.current_campaigns || ["ING 1","ING 3","ING 7"],
    sales: seed.sales || [],
    ads: seed.ads || [],
    events: seed.events || [],
    migration_issues: seed.migration_issues || []
  };
}

async function loadLocal(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{return JSON.parse(raw)}catch(e){console.warn("Copia local inválida",e)}
  }
  const seed = await fetchSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveLocal(){
  state.metadata = state.metadata || {};
  state.metadata.updated_at = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function cloudHealth(){
  try{
    const r = await fetch(HEALTH_API, {cache:"no-store"});
    if(!r.ok) return false;
    const j = await r.json();
    cloudAvailable = !!j.db;
    return cloudAvailable;
  }catch{
    cloudAvailable = false;
    return false;
  }
}

function cloudHeaders(){
  return {"Content-Type":"application/json","X-Panel-Key":cloudKey};
}

async function cloudGet(){
  if(!cloudAvailable || !cloudKey) throw new Error("Falta configurar nube o clave privada.");
  const r = await fetch(STATE_API, {headers:{"X-Panel-Key":cloudKey}, cache:"no-store"});
  if(r.status === 401) throw new Error("Clave privada incorrecta.");
  if(!r.ok) throw new Error("No pude leer la nube.");
  return await r.json();
}

async function cloudPut(){
  if(!cloudAvailable || !cloudKey) return false;
  setSyncStatus("syncing","Sincronizando…");
  const r = await fetch(STATE_API, {method:"PUT",headers:cloudHeaders(),body:JSON.stringify(state)});
  if(r.status === 401){setSyncStatus("error","Clave incorrecta");throw new Error("Clave privada incorrecta.");}
  if(!r.ok){setSyncStatus("error","Nube con error");throw new Error("No pude guardar en la nube.");}
  const j = await r.json();
  setSyncStatus("cloud","Guardado en nube");
  return j;
}

function scheduleCloud(){
  if(!cloudAvailable || !cloudKey){
    setSyncStatus("local","Guardado local");
    return;
  }
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(()=>cloudPut().catch(e=>console.warn(e)), 600);
}

function saveState(){
  saveLocal();
  scheduleCloud();
  renderAll();
}

function setSyncStatus(mode,text){
  const pill = $("syncPill");
  pill.classList.remove("cloud","error");
  if(mode==="cloud") pill.classList.add("cloud");
  if(mode==="error") pill.classList.add("error");
  $("syncText").textContent = text;
}

function setView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active", v.dataset.view===name));
  document.querySelectorAll("[data-view-go]").forEach(b=>b.classList.toggle("active", b.dataset.viewGo===name && b.closest(".bottom-nav")));
  window.scrollTo({top:0,behavior:"smooth"});
  if(name==="sale") prepareSaleDefaults();
  if(name==="ads") prepareAdsDefaults();
  if(name==="history") renderHistory();
  if(name==="settings") renderSettings();
}

function getCampaigns(){
  return unique([...(state.current_campaigns||[]), ...(state.campaigns||[]), ...state.sales.map(x=>x.campaign), ...state.ads.map(x=>x.campaign)]);
}

function fillSelect(select, values, includeAll=false){
  const current = select.value;
  select.innerHTML = "";
  if(includeAll){
    const o=document.createElement("option");o.value="ALL";o.textContent="Todas";select.appendChild(o);
  }
  values.forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;select.appendChild(o)});
  if([...select.options].some(x=>x.value===current)) select.value=current;
}

function fillProductSelect(){
  const sel=$("saleProduct"), current=sel.value;
  sel.innerHTML="";
  state.products.filter(x=>x.active!==false).forEach(p=>{
    const o=document.createElement("option");
    o.value=p.code;o.textContent=`${p.code} — ${p.name}`;
    o.dataset.price=p.price ?? "";
    sel.appendChild(o);
  });
  // Producto histórico combinado.
  if(![...sel.options].some(x=>x.value==="ING 3 y 4")){
    const o=document.createElement("option");o.value="ING 3 y 4";o.textContent="ING 3 y 4 — Campaña histórica";o.dataset.price="11.9";sel.appendChild(o);
  }
  if([...sel.options].some(x=>x.value===current)) sel.value=current;
}

function periodBounds(){
  if(customRange) return customRange;
  const today=parseDate(todayIso());
  if(activePeriod==="today") return {from:todayIso(),to:todayIso()};
  if(activePeriod==="all") return {from:"1900-01-01",to:"2999-12-31"};
  if(activePeriod==="month"){
    const from = new Date(today.getFullYear(),today.getMonth(),1);
    const y=from.getFullYear(),m=String(from.getMonth()+1).padStart(2,"0");
    return {from:`${y}-${m}-01`,to:todayIso()};
  }
  const days=activePeriod==="30d"?29:6;
  const from=new Date(today);from.setDate(from.getDate()-days);
  const y=from.getFullYear(),m=String(from.getMonth()+1).padStart(2,"0"),d=String(from.getDate()).padStart(2,"0");
  return {from:`${y}-${m}-${d}`,to:todayIso()};
}

function inPeriod(date){
  const {from,to}=periodBounds();
  return date>=from && date<=to;
}

function filteredSales(){
  return state.sales.filter(s=>inPeriod(s.date) && (activeCampaign==="ALL" || s.campaign===activeCampaign));
}

function filteredAds(){
  return state.ads.filter(a=>inPeriod(a.date) && (activeCampaign==="ALL" || a.campaign===activeCampaign));
}

function sum(arr, fn){return arr.reduce((acc,x)=>acc+(Number(fn(x))||0),0)}

function metrics(){
  const sales=filteredSales(), ads=filteredAds();
  const revenue=sum(sales,x=>x.sold_price);
  const spend=sum(ads,x=>x.spend);
  const convs=sum(ads,x=>x.conversations);
  const n=sales.length;
  const ups=sales.filter(x=>x.upsell);
  const follow=sales.filter(x=>x.follow_up);
  return {
    sales,ads,revenue,spend,profit:revenue-spend,convs,n,
    roas:spend?revenue/spend:0,
    conversion:convs?n/convs*100:0,
    cpa:n?spend/n:0,
    ticket:n?revenue/n:0,
    upsells:ups.length,upsellRevenue:sum(ups,x=>x.sold_price),
    followups:follow.length,followRevenue:sum(follow,x=>x.sold_price)
  };
}

function renderKpis(){
  const m=metrics();
  $("kpiRevenue").textContent=money(m.revenue);
  $("kpiRevenueSub").textContent=`${m.n} venta${m.n===1?"":"s"}`;
  $("kpiProfit").textContent=money(m.profit);
  $("kpiRoas").textContent=m.roas.toFixed(2);
  $("kpiConversion").textContent=pct(m.conversion);
  $("kpiConversations").textContent=`${m.convs} conversaciones`;
  $("kpiCpa").textContent=money(m.cpa);
  $("kpiTicket").textContent=money(m.ticket);
  $("kpiUpsells").textContent=m.upsells;
  $("kpiUpsellRevenue").textContent=`${money(m.upsellRevenue)} facturados`;
  $("kpiFollowups").textContent=m.followups;
  $("kpiFollowRevenue").textContent=`${money(m.followRevenue)} facturados`;
  const {from,to}=periodBounds();
  $("periodLabel").textContent=`${from} → ${to}${activeCampaign!=="ALL"?` · ${activeCampaign}`:""}`;
}

function destroyChart(name){if(charts[name]){charts[name].destroy();delete charts[name]}}

function renderCharts(){
  if(typeof Chart==="undefined") return;
  const m=metrics();
  Chart.defaults.color="#94a2b5";
  Chart.defaults.borderColor="rgba(148,162,181,.13)";
  Chart.defaults.font.family='Inter, ui-sans-serif, system-ui, sans-serif';

  const byDate={};
  [...m.sales.map(x=>x.date),...m.ads.map(x=>x.date)].forEach(d=>byDate[d]??={revenue:0,spend:0});
  m.sales.forEach(x=>{byDate[x.date]??={revenue:0,spend:0};byDate[x.date].revenue+=Number(x.sold_price||0)});
  m.ads.forEach(x=>{byDate[x.date]??={revenue:0,spend:0};byDate[x.date].spend+=Number(x.spend||0)});
  const dates=Object.keys(byDate).sort();
  destroyChart("daily");
  charts.daily=new Chart($("dailyChart"),{
    type:"line",
    data:{labels:dates.map(d=>d.slice(5)),datasets:[
      {label:"Facturación",data:dates.map(d=>byDate[d].revenue),borderColor:"#2dd4bf",backgroundColor:"rgba(45,212,191,.12)",tension:.3,fill:true},
      {label:"Gasto Ads",data:dates.map(d=>byDate[d].spend),borderColor:"#fbbf24",backgroundColor:"transparent",tension:.3},
      {label:"Utilidad",data:dates.map(d=>byDate[d].revenue-byDate[d].spend),borderColor:"#22c55e",backgroundColor:"transparent",tension:.3}
    ]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{position:"bottom"}},scales:{y:{ticks:{callback:v=>`S/ ${v}`}}}}
  });

  const campaigns=getCampaigns().map(c=>{
    const ss=m.sales.filter(x=>x.campaign===c), aa=m.ads.filter(x=>x.campaign===c);
    const rev=sum(ss,x=>x.sold_price), sp=sum(aa,x=>x.spend);
    return {c,rev,sp,roas:sp?rev/sp:0};
  }).filter(x=>x.rev||x.sp).sort((a,b)=>b.roas-a.roas).slice(0,8);
  destroyChart("roas");
  charts.roas=new Chart($("roasChart"),{
    type:"bar",
    data:{labels:campaigns.map(x=>x.c),datasets:[{label:"ROAS",data:campaigns.map(x=>x.roas),backgroundColor:"#2dd4bf",borderRadius:8}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}
  });

  const hours=Array.from({length:24},(_,i)=>i), hc=Array(24).fill(0);
  m.sales.forEach(s=>{if(s.time){const h=Number(String(s.time).slice(0,2));if(Number.isFinite(h)&&h>=0&&h<24)hc[h]++}});
  destroyChart("hour");
  charts.hour=new Chart($("hourChart"),{
    type:"bar",
    data:{labels:hours.map(h=>`${String(h).padStart(2,"0")}h`),datasets:[{label:"Ventas",data:hc,backgroundColor:"#22c55e",borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:12}},y:{beginAtZero:true,ticks:{precision:0}}}}
  });

  const follow=m.sales.filter(x=>x.follow_up).length,direct=m.sales.length-follow;
  destroyChart("follow");
  charts.follow=new Chart($("followChart"),{
    type:"doughnut",
    data:{labels:["Directas","Seguimiento"],datasets:[{data:[direct,follow],backgroundColor:["#2dd4bf","#8b5cf6"],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:"68%",plugins:{legend:{position:"bottom"}}}
  });
}

function renderCampaignRanking(){
  const m=metrics(), map={};
  m.sales.forEach(s=>{map[s.campaign]??=0;map[s.campaign]+=Number(s.sold_price||0)});
  const rows=Object.entries(map).sort((a,b)=>b[1]-a[1]);
  const max=rows[0]?.[1]||1;
  $("campaignRanking").innerHTML=rows.length?rows.slice(0,8).map(([c,v])=>`
    <div class="rank-row"><strong>${escapeHtml(c)}</strong><div class="bar"><i style="width:${Math.max(3,v/max*100)}%"></i></div><span>${money(v)}</span></div>
  `).join(""):`<div class="empty">Sin ventas en este período.</div>`;
}

function renderEvents(){
  const ev=(state.events||[]).filter(e=>inPeriod(e.date));
  $("eventChips").innerHTML=ev.map(e=>`<span class="event-chip">${escapeHtml(e.date)} · ${escapeHtml(e.label)}</span>`).join("");
}

function renderRecent(){
  const rows=[...filteredSales()].sort((a,b)=>`${b.date} ${b.time||""}`.localeCompare(`${a.date} ${a.time||""}`)).slice(0,8);
  $("recentSales").innerHTML=rows.length?rows.map(s=>`
    <div class="recent-item">
      <time>${escapeHtml(s.date.slice(5))}<br>${escapeHtml(s.time||"")}</time>
      <div><b>${escapeHtml(s.campaign)} · ${escapeHtml(offerLabel(s.offer))}</b><small>${escapeHtml((s.items||[s.product]).join(" + "))}${s.follow_up?" · Seguimiento":""}</small></div>
      <div class="money">${money(s.sold_price)}</div>
    </div>`).join(""):`<div class="empty">Todavía no hay ventas en este período.</div>`;
}

function renderDashboard(){
  renderKpis();renderCharts();renderCampaignRanking();renderEvents();renderRecent();
}

function renderAll(){
  const campaigns=getCampaigns();
  fillSelect($("campaignFilter"),campaigns,true);$("campaignFilter").value=activeCampaign;
  fillSelect($("saleCampaign"),campaigns,false);
  fillSelect($("adsCampaign"),campaigns,false);
  fillSelect($("historyCampaign"),campaigns,true);
  fillProductSelect();
  renderDashboard();
  renderTodayAds();
  renderHistory();
  renderSettings();
}

function offerLabel(v){
  return ({OP1:"Opción 1",COMBO:"Combo Pro",VIP:"VIP Full",VENTA_DIRECTA:"Venta directa",LEGACY_UPSELL:"Upsell histórico",OTRA:"Otra"})[v]||v||"";
}

function productPrice(code){
  if(code==="ING 3 y 4") return 11.9;
  const p=state.products.find(x=>x.code===code);
  return Number(p?.price||0);
}

function currentOfferPrice(){
  const offer=$("saleOffer").value, campaign=$("saleCampaign").value, product=$("saleProduct").value;
  const base=productPrice(product||campaign);
  if(offer==="COMBO") return 15.90;
  if(offer==="VIP") return 29.90;
  return base;
}

function syncSalePrice(force=false){
  const canonical=$("saleCanonicalPrice"), sold=$("saleSoldPrice");
  const p=currentOfferPrice();
  if(force || !canonical.value) canonical.value=p.toFixed(2);
  if(force || !sold.value) sold.value=p.toFixed(2);
  if(["COMBO","VIP","LEGACY_UPSELL"].includes($("saleOffer").value)) $("saleUpsell").checked=true;
  updateSalePreview();
}

function updateSalePreview(){
  const product=$("saleProduct").value;
  const base=productPrice(product);
  const canonical=Number($("saleCanonicalPrice").value||0);
  const sold=Number($("saleSoldPrice").value||0);
  const discount=Math.max(canonical-sold,0);
  const increment=Math.max(sold-base,0);
  $("saleCalcPreview").innerHTML=`Descuento real: <b>${money(discount)}</b> · Incremento sobre precio base: <b>${money(increment)}</b>`;
}

function prepareSaleDefaults(){
  if(!$("saleId").value){
    $("saleDate").value=todayIso();$("saleTime").value=nowTime();
    if(!$("saleCampaign").value) $("saleCampaign").value=state.current_campaigns?.[0]||"ING 1";
    const c=$("saleCampaign").value;
    if([...$("saleProduct").options].some(o=>o.value===c)) $("saleProduct").value=c;
    syncSalePrice(false);
  }
}

function clearSaleForm(){
  $("saleForm").reset();$("saleId").value="";$("saleHeading").textContent="Nueva venta";
  $("saleDate").value=todayIso();$("saleTime").value=nowTime();
  $("saleCampaign").value=state.current_campaigns?.[0]||getCampaigns()[0];
  if([...$("saleProduct").options].some(o=>o.value===$("saleCampaign").value)) $("saleProduct").value=$("saleCampaign").value;
  $("saleOffer").value="OP1";syncSalePrice(true);$("parseResult").textContent="";
}

function saveSale(e){
  e.preventDefault();
  const id=$("saleId").value||uuid();
  const product=$("saleProduct").value;
  const base=productPrice(product);
  const canonical=Number($("saleCanonicalPrice").value||0);
  const sold=Number($("saleSoldPrice").value||0);
  const rec={
    id,source:$("saleId").value?"panel-edit":"panel",
    date:$("saleDate").value,time:$("saleTime").value||null,
    campaign:$("saleCampaign").value,product,
    items:$("saleItems").value.split(",").map(x=>x.trim()).filter(Boolean).length?$("saleItems").value.split(",").map(x=>x.trim()).filter(Boolean):[product],
    offer:$("saleOffer").value,
    base_price:base,canonical_price:canonical,sold_price:sold,
    follow_up:$("saleFollowUp").checked,
    upsell:$("saleUpsell").checked || sold>base,
    discount:Math.max(canonical-sold,0),
    upsell_increment:Math.max(sold-base,0),
    ref_web:$("saleRef").value.trim()||null,
    notes:$("saleNotes").value.trim(),
    created_at:new Date().toISOString()
  };
  const i=state.sales.findIndex(x=>x.id===id);
  if(i>=0)state.sales[i]=rec;else state.sales.push(rec);
  saveState();toast(i>=0?"Venta actualizada":"Venta guardada");clearSaleForm();setView("dashboard");
}

function parseWhatsapp(){
  const text=$("whatsappPaste").value.trim();
  if(!text){$("parseResult").className="parse-result error";$("parseResult").textContent="Pega primero el mensaje completo.";return}
  const refMatch=text.match(/Ref:\s*(WEB-(ING1|ING3|ING7)-(OP1|COMBO|VIP))/i);
  const planMatch=text.match(/quiero adquirir la (Opción 1|Combo Pro|VIP Full) por S\/\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
  const itemMatches=[...text.matchAll(/^(ING\s*\d+)\s*-\s*(.+)$/gmi)];
  if(!planMatch && !refMatch){$("parseResult").className="parse-result error";$("parseResult").textContent="No reconocí el formato de la landing.";return}
  const mapRef={"ING1":"ING 1","ING3":"ING 3","ING7":"ING 7"};
  const mapOffer={"OP1":"OP1","COMBO":"COMBO","VIP":"VIP"};
  let campaign=refMatch?mapRef[refMatch[2].toUpperCase()]:null;
  let offer=refMatch?mapOffer[refMatch[3].toUpperCase()]:null;
  if(!offer && planMatch) offer=planMatch[1].toLowerCase().includes("combo")?"COMBO":planMatch[1].toLowerCase().includes("vip")?"VIP":"OP1";
  const price=planMatch?Number(planMatch[2].replace(",",".")):currentOfferPrice();
  const items=itemMatches.map(m=>m[1].replace(/\s+/g," ").trim());
  const product=items[0]||campaign||"ING 1";
  if(campaign) $("saleCampaign").value=campaign;
  if([...$("saleProduct").options].some(o=>o.value===product)) $("saleProduct").value=product;
  $("saleOffer").value=offer||"OTRA";
  $("saleCanonicalPrice").value=price.toFixed(2);$("saleSoldPrice").value=price.toFixed(2);
  $("saleRef").value=refMatch?refMatch[1].toUpperCase():"";
  $("saleItems").value=items.join(", ");
  $("saleDate").value=todayIso();$("saleTime").value=nowTime();
  $("saleUpsell").checked=["COMBO","VIP"].includes(offer);
  updateSalePreview();
  $("parseResult").className="parse-result success";
  $("parseResult").innerHTML=`Reconocido: <b>${escapeHtml(campaign||"campaña no indicada")}</b> · ${escapeHtml(offerLabel(offer))} · ${money(price)} · ${items.length} ING.`;
  toast("Pedido cargado al formulario");
}

function prepareAdsDefaults(){
  $("adsDate").value=$("adsDate").value||todayIso();
  if(!$("adsCampaign").value)$("adsCampaign").value=state.current_campaigns?.[0]||getCampaigns()[0];
}

function saveAds(e){
  e.preventDefault();
  const date=$("adsDate").value,campaign=$("adsCampaign").value;
  const rec={
    id:`ads-${date}-${campaign.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,
    source:"panel",date,campaign,
    conversations:Number($("adsConversations").value||0),
    spend:Number($("adsSpend").value||0),
    notes:$("adsNotes").value.trim(),
    updated_at:new Date().toISOString()
  };
  const i=state.ads.findIndex(x=>x.date===date&&x.campaign===campaign);
  if(i>=0)state.ads[i]=rec;else state.ads.push(rec);
  saveState();toast(i>=0?"Ads del día actualizados":"Ads guardados");$("adsConversations").value="";$("adsSpend").value="";$("adsNotes").value="";
}

function renderTodayAds(){
  const date=todayIso(), rows=state.ads.filter(x=>x.date===date).sort((a,b)=>b.spend-a.spend);
  $("todayAdsList").innerHTML=rows.length?rows.map(x=>`<div class="rank-row"><strong>${escapeHtml(x.campaign)}</strong><div class="bar"><i style="width:${Math.min(100,(x.spend/Math.max(...rows.map(r=>r.spend),1))*100)}%"></i></div><span>${x.conversations} conv · ${money(x.spend)}</span></div>`).join(""):`<div class="empty">Aún no registraste Ads de hoy.</div>`;
}

function renderHistory(){
  if(!state)return;
  const q=($("historySearch")?.value||"").toLowerCase().trim();
  const camp=$("historyCampaign")?.value||"ALL";
  let rows=[...state.sales].sort((a,b)=>`${b.date} ${b.time||""}`.localeCompare(`${a.date} ${a.time||""}`));
  if(camp!=="ALL")rows=rows.filter(x=>x.campaign===camp);
  if(q)rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
  $("historyBody").innerHTML=rows.slice(0,500).map(s=>`
    <tr>
      <td>${escapeHtml(s.date)}<br><span class="muted">${escapeHtml(s.time||"")}</span></td>
      <td>${escapeHtml(s.campaign)}</td>
      <td>${escapeHtml(offerLabel(s.offer))}</td>
      <td class="money">${money(s.sold_price)}</td>
      <td>${s.follow_up?'<span class="tag good">Sí</span>':'<span class="tag">No</span>'}</td>
      <td>${s.ref_web?`<span class="tag warn">${escapeHtml(s.ref_web)}</span>`:"—"}</td>
      <td><div class="row-actions"><button class="icon-btn" data-edit-sale="${s.id}">Editar</button><button class="icon-btn" data-delete-sale="${s.id}">Eliminar</button></div></td>
    </tr>`).join("");
  $("historyCount").textContent=`${rows.length} registro${rows.length===1?"":"s"}`;
}

function editSale(id){
  const s=state.sales.find(x=>x.id===id);if(!s)return;
  setView("sale");$("saleId").value=s.id;$("saleHeading").textContent="Editar venta";
  $("saleDate").value=s.date;$("saleTime").value=s.time||"";
  $("saleCampaign").value=s.campaign;
  if([...$("saleProduct").options].some(o=>o.value===s.product))$("saleProduct").value=s.product;
  $("saleOffer").value=s.offer||"OTRA";$("saleCanonicalPrice").value=Number(s.canonical_price??s.sold_price??0).toFixed(2);
  $("saleSoldPrice").value=Number(s.sold_price||0).toFixed(2);$("saleRef").value=s.ref_web||"";
  $("saleItems").value=(s.items||[s.product]).join(", ");$("saleFollowUp").checked=!!s.follow_up;$("saleUpsell").checked=!!s.upsell;$("saleNotes").value=s.notes||"";
  updateSalePreview();
}

function deleteSale(id){
  const s=state.sales.find(x=>x.id===id);if(!s)return;
  if(!confirm(`¿Eliminar la venta ${s.date} · ${s.campaign} · ${money(s.sold_price)}?`))return;
  state.sales=state.sales.filter(x=>x.id!==id);saveState();toast("Venta eliminada");
}

function renderSettings(){
  if(!state)return;
  $("cloudKey").value=cloudKey;
  const box=$("cloudStatusBox");
  if(cloudAvailable){
    box.innerHTML=cloudKey?`<strong>Cloudflare D1 detectado.</strong><br>La copia local se sincroniza automáticamente cuando realizas cambios.`:`<strong>D1 detectado, falta la clave privada.</strong><br>Escribe la misma clave que configuraste como <code>PANEL_KEY</code>.`;
  }else{
    box.innerHTML=`<strong>Nube aún no configurada.</strong><br>El panel está guardando en este navegador. Configura el binding D1 <code>DB</code> para tener persistencia entre dispositivos.`;
  }
  const meta=state.metadata||{};
  const issues=state.migration_issues||[];
  $("migrationInfo").innerHTML=`
    <p class="muted"><b>${meta.sales_imported||state.sales.length}</b> ventas importadas · <b>${meta.ads_rows_imported||state.ads.length}</b> filas de Ads · <b>${issues.length}</b> correcciones controladas.</p>
    ${issues.map(i=>`<div class="issue"><b>VENTAS fila ${i.source_row} · ${escapeHtml(i.date)} · ${escapeHtml(i.product)}</b><span>${escapeHtml(i.notes.join(" · "))}</span></div>`).join("")}
  `;
}

function download(filename,text,type="application/json"){
  const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function exportJson(){download(`mym-panel-backup-${todayIso()}.json`,JSON.stringify(state,null,2))}
function csvEscape(v){const s=String(v??"");return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function exportCsv(){
  const headers=["fecha","hora","campaña","producto","oferta","precio_referencia","precio_vendido","seguimiento","upsell","descuento","incremento_upsell","ref_web","items","notas"];
  const lines=[headers.join(",")];
  [...state.sales].sort((a,b)=>`${a.date} ${a.time||""}`.localeCompare(`${b.date} ${b.time||""}`)).forEach(s=>{
    lines.push([s.date,s.time,s.campaign,s.product,offerLabel(s.offer),s.canonical_price,s.sold_price,s.follow_up?"Sí":"No",s.upsell?"Sí":"No",s.discount,s.upsell_increment,s.ref_web,(s.items||[]).join(" + "),s.notes].map(csvEscape).join(","));
  });
  download(`ventas-mym-${todayIso()}.csv`,"\uFEFF"+lines.join("\n"),"text/csv;charset=utf-8");
}

async function importJsonFile(file){
  try{
    const j=JSON.parse(await file.text());
    if(!Array.isArray(j.sales)||!Array.isArray(j.ads))throw new Error("El archivo no parece un respaldo válido.");
    if(!confirm(`Importar ${j.sales.length} ventas y reemplazar la copia local actual?`))return;
    state=j;saveState();toast("Respaldo importado");
  }catch(e){alert(e.message)}
}

async function connectCloud(){
  cloudKey=$("cloudKey").value.trim();
  if(!cloudKey){toast("Escribe primero la clave privada");return}
  localStorage.setItem(CLOUD_KEY_STORAGE,cloudKey);
  try{
    const j=await cloudGet();
    if(j.exists && j.state){
      const cloudUpdated=j.state?.metadata?.updated_at||j.updated_at||"";
      const localUpdated=state?.metadata?.updated_at||"";
      if(confirm(`La nube ya tiene datos${cloudUpdated?` (${cloudUpdated})`:""}. ¿Descargarlos ahora y reemplazar la copia local?`)){
        state=j.state;saveLocal();renderAll();toast("Datos descargados de la nube");
      }else{
        await cloudPut();toast("Copia local subida a la nube");
      }
    }else{
      await cloudPut();toast("Historial inicial subido a la nube");
    }
    setSyncStatus("cloud","Guardado en nube");renderSettings();
  }catch(e){setSyncStatus("error","Revisa la clave");alert(e.message)}
}

async function pushCloud(){
  cloudKey=$("cloudKey").value.trim()||cloudKey;
  if(cloudKey)localStorage.setItem(CLOUD_KEY_STORAGE,cloudKey);
  try{await cloudPut();toast("Datos subidos a la nube")}catch(e){alert(e.message)}
}

async function pullCloud(){
  cloudKey=$("cloudKey").value.trim()||cloudKey;
  if(cloudKey)localStorage.setItem(CLOUD_KEY_STORAGE,cloudKey);
  try{
    const j=await cloudGet();if(!j.exists)throw new Error("La nube todavía no tiene un respaldo.");
    if(confirm("¿Reemplazar la copia local con la versión de la nube?")){state=j.state;saveLocal();renderAll();toast("Datos descargados")}
  }catch(e){alert(e.message)}
}

async function resetLocal(){
  if(!confirm("Esto reemplazará tu copia local por la migración original del Excel. ¿Continuar?"))return;
  if(!confirm("Última confirmación: cualquier venta nueva no respaldada se perderá de este navegador."))return;
  state=await fetchSeed();saveLocal();renderAll();toast("Historial inicial restaurado");
}

function bindEvents(){
  document.querySelectorAll("[data-view-go]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.viewGo)));
  document.querySelectorAll("[data-period]").forEach(b=>b.addEventListener("click",()=>{
    activePeriod=b.dataset.period;customRange=null;
    document.querySelectorAll("[data-period]").forEach(x=>x.classList.toggle("active",x===b));
    document.querySelectorAll(".custom-date").forEach(x=>x.classList.remove("show"));
    renderDashboard();
  }));
  $("campaignFilter").addEventListener("change",e=>{activeCampaign=e.target.value;renderDashboard()});
  $("applyCustomRange").addEventListener("click",()=>{
    document.querySelectorAll(".custom-date").forEach(x=>x.classList.add("show"));
    const from=$("filterFrom").value,to=$("filterTo").value;
    if(from&&to){customRange={from,to};document.querySelectorAll("[data-period]").forEach(x=>x.classList.remove("active"));renderDashboard()}
  });
  $("saleForm").addEventListener("submit",saveSale);
  $("saleOffer").addEventListener("change",()=>syncSalePrice(true));
  $("saleProduct").addEventListener("change",()=>syncSalePrice(true));
  $("saleCampaign").addEventListener("change",()=>{
    const c=$("saleCampaign").value;if([...$("saleProduct").options].some(o=>o.value===c))$("saleProduct").value=c;syncSalePrice(true);
  });
  $("saleCanonicalPrice").addEventListener("input",updateSalePreview);$("saleSoldPrice").addEventListener("input",updateSalePreview);
  $("cancelEditSale").addEventListener("click",clearSaleForm);
  $("parseWhatsapp").addEventListener("click",parseWhatsapp);
  $("adsForm").addEventListener("submit",saveAds);
  $("historySearch").addEventListener("input",renderHistory);$("historyCampaign").addEventListener("change",renderHistory);
  $("historyBody").addEventListener("click",e=>{
    const ed=e.target.closest("[data-edit-sale]"),del=e.target.closest("[data-delete-sale]");
    if(ed)editSale(ed.dataset.editSale);if(del)deleteSale(del.dataset.deleteSale);
  });
  $("saveCloudKey").addEventListener("click",connectCloud);$("pushCloud").addEventListener("click",pushCloud);$("pullCloud").addEventListener("click",pullCloud);
  $("exportJson").addEventListener("click",exportJson);$("exportCsv").addEventListener("click",exportCsv);
  $("importJson").addEventListener("change",e=>{if(e.target.files?.[0])importJsonFile(e.target.files[0])});
  $("resetLocal").addEventListener("click",resetLocal);
  $("installPwa").addEventListener("click",async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installPwa").disabled=true}});
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installPwa").disabled=false});
}

async function init(){
  state=await loadLocal();
  bindEvents();
  fillSelect($("campaignFilter"),getCampaigns(),true);
  fillSelect($("saleCampaign"),getCampaigns(),false);
  fillSelect($("adsCampaign"),getCampaigns(),false);
  fillSelect($("historyCampaign"),getCampaigns(),true);
  fillProductSelect();
  clearSaleForm();prepareAdsDefaults();
  await cloudHealth();
  if(cloudAvailable && cloudKey){
    try{
      const j=await cloudGet();
      if(j.exists && j.state){
        const cloudUpdated=j.state?.metadata?.updated_at||"";
        const localUpdated=state?.metadata?.updated_at||"";
        if(cloudUpdated>localUpdated){state=j.state;saveLocal()}
      }else{
        await cloudPut();
      }
      setSyncStatus("cloud","Guardado en nube");
    }catch(e){setSyncStatus("error","Nube sin conectar")}
  }else setSyncStatus("local",cloudAvailable?"Falta clave nube":"Guardado local");
  renderAll();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
}

init().catch(e=>{console.error(e);alert("No pude iniciar el panel: "+e.message)});
