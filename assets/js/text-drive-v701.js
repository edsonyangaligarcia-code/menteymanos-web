(function(){
  "use strict";

  function norm(t){return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();}
  function findByText(selector,snippet){const s=norm(snippet);return Array.from(document.querySelectorAll(selector)).find(el=>norm(el.textContent).includes(s))||null;}

  function hideTexts(){
    const snippets=[
      "Muestras visuales de ING 1. Toca una imagen para verla en detalle.",
      "Muestras visuales de ING 3. Toca una imagen para verla en detalle.",
      "Muestras visuales de ING 7. Toca una imagen para verla en detalle.",
      "Los archivos solo se muestran como referencia. No se pueden abrir ni descargar desde esta pÃ¡gina.",
      "Vista previa del contenido incluido. Los archivos se muestran Ãºnicamente como referencia: no se pueden abrir ni descargar desde esta pÃ¡gina."
    ].map(norm);

    document.querySelectorAll("p,small,span,div").forEach(el=>{
      const t=norm(el.textContent);
      if(!t || t.length>500) return;
      if(snippets.some(s=>t.includes(s))) el.style.display="none";
    });

    document.querySelectorAll("p,small,span,div").forEach(el=>{
      const t=norm(el.textContent);
      if(t===norm("Incluye ING 1, ING 2, ING 3, ING 4, ING 5, ING 6 e ING 7 en un solo acceso.")){
        el.textContent="Elige la opciÃ³n que mejor se adapte a lo que necesitas.";
      }
      if(t===norm("Incluye toda la LÃ­nea ING: Planos, expedientes, BIM, coordinaciÃ³n, obra, AutoCAD y cÃ¡lculo estructural.")){
        el.style.display="none";
      }
    });
  }

  function styleExplorer(){
    const heading=findByText("h1,h2,h3,h4","Explora lo que incluye");
    if(!heading) return;
    const section=heading.closest("section")||heading.parentElement;
    if(!section) return;
    section.classList.add("driveLikeV701");

    let back=null,next=null;
    section.querySelectorAll("button,a").forEach(btn=>{
      const t=norm(btn.textContent);
      if(t.includes("atras")){back=btn;btn.classList.add("navBtnV701");}
      if(t.includes("adelante")){next=btn;btn.classList.add("navBtnV701");}
    });
    if(back&&next&&back.parentElement===next.parentElement) back.parentElement.classList.add("driveNavWrapV701");

    section.querySelectorAll("tr").forEach(row=>{
      const cells=row.querySelectorAll("td");
      if(!cells.length) return;
      if(!norm(row.textContent).includes("carpeta")) return;
      row.classList.add("folderRowV701");
      const first=cells[0];
      if(!first || first.querySelector(".folderIconV701")) return;
      const original=first.textContent.trim();
      const wrap=document.createElement("span"); wrap.className="firstColWrapV701 folderNameV701";
      const icon=document.createElement("span"); icon.className="folderIconV701"; icon.textContent="ðŸ“";
      const label=document.createElement("span"); label.textContent=original;
      first.textContent=""; wrap.appendChild(icon); wrap.appendChild(label); first.appendChild(wrap);
    });
  }

  function init(){hideTexts();styleExplorer();}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
