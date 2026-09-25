async function ensureTable(db){
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff"
    }
  });
}
function authorized(request,env){
  const expected=String(env.PANEL_KEY||"");
  const received=String(request.headers.get("X-Panel-Key")||"");
  return expected && received && expected===received;
}
export async function onRequestGet({request,env}){
  if(!env.DB)return json({error:"D1 binding DB no configurado"},503);
  if(!authorized(request,env))return json({error:"No autorizado"},401);
  await ensureTable(env.DB);
  const row=await env.DB.prepare("SELECT data, updated_at FROM app_state WHERE id = ?").bind("main").first();
  if(!row)return json({exists:false,state:null});
  try{return json({exists:true,state:JSON.parse(row.data),updated_at:row.updated_at})}
  catch{return json({error:"El estado guardado está dañado"},500)}
}
export async function onRequestPut({request,env}){
  if(!env.DB)return json({error:"D1 binding DB no configurado"},503);
  if(!authorized(request,env))return json({error:"No autorizado"},401);
  const raw=await request.text();
  if(raw.length>3000000)return json({error:"Respaldo demasiado grande"},413);
  let state;
  try{state=JSON.parse(raw)}catch{return json({error:"JSON inválido"},400)}
  if(!state || !Array.isArray(state.sales) || !Array.isArray(state.ads))return json({error:"Estructura de respaldo inválida"},400);
  await ensureTable(env.DB);
  const updatedAt=new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO app_state (id,data,updated_at) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at
  `).bind("main",JSON.stringify(state),updatedAt).run();
  return json({ok:true,updated_at:updatedAt});
}
