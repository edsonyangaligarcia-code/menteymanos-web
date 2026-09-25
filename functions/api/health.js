function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
  });
}
export async function onRequestGet({env}){
  return json({ok:true,db:!!env.DB,key_configured:!!env.PANEL_KEY});
}
