/**
 * card.js - Modal cards
 */
const Card = (() => {
  function show(node, data) {
    const p = node.data;
    const color = node.color;
    const ods = data.raw.ods_relaciones.filter(r => r["ID Práctica"] === p["ID"]);
    const flor = data.raw.flor_enunciados.filter(f => f.practicas_vinculadas.includes(p["ID"]));
    const florByComp = {};
    flor.forEach(f => { if (!florByComp[f.componente]) florByComp[f.componente] = []; florByComp[f.componente].push(f); });
    const ORDER = ["Fortaleza","Logro","Oportunidad","Reto","Debilidad","Amenaza"];
    const SHORT = {Fortaleza:"F",Logro:"L",Oportunidad:"O",Reto:"R",Debilidad:"D",Amenaza:"A"};

    openModal(`
      <div class="card-header">
        <div class="card-tag" style="color:${color}">${p["Categoría PCI"]}</div>
        <div class="card-title" style="color:${color}">${p["Nombre de la práctica"]}</div>
        <div class="card-subtitle">${p["Comunidades vinculadas"]}</div>
      </div>
      <div class="card-bar" style="background:linear-gradient(90deg,${color},${color}44)"></div>
      <div class="card-grid">
        <div class="card-field full"><div class="card-field-label">Historia y origen</div><div class="card-field-value">${p["Historia y origen"]}</div></div>
        <div class="card-field full"><div class="card-field-label">Descripción general</div><div class="card-field-value">${p["Descripción general"]}</div></div>
        <div class="card-field"><div class="card-field-label">Elementos y técnicas</div><div class="card-field-value">${p["Elementos, procesos y técnicas"]}</div></div>
        <div class="card-field"><div class="card-field-label">Función social</div><div class="card-field-value">${p["Función social"]}</div></div>
        <div class="card-field"><div class="card-field-label">Portadores identificados</div><div class="card-field-value">${p["Portadores identificados"]}</div></div>
        <div class="card-field"><div class="card-field-label">Transmisión del conocimiento</div><div class="card-field-value">${p["Transmisión del conocimiento"]}</div></div>
        <div class="card-field"><div class="card-field-label">Estado de vitalidad</div>
          <div class="card-field-value"><span class="vitalidad-badge" style="background:${color}22;color:${color};border:1px solid ${color}44">${p["Estado de vitalidad"]}</span></div></div>
        <div class="card-field"><div class="card-field-label">Cambios e innovaciones</div><div class="card-field-value">${p["Cambios e innovaciones"]}</div></div>
        <div class="card-field"><div class="card-field-label">Calendario</div><div class="card-field-value">${p["Calendario"]}</div></div>
        <div class="card-field"><div class="card-field-label">Potencial turístico</div><div class="card-field-value">${p["Potencial turístico"]}</div></div>
        <div class="card-field"><div class="card-field-label">Portadores (ref.)</div><div class="card-field-value">${p["Núm. portadores referencia"]}</div></div>
        <div class="card-field"><div class="card-field-label">Actores institucionales</div><div class="card-field-value">${p["Actores institucionales"]}</div></div>
        ${p["Notas complementarias"] ? `<div class="card-field full"><div class="card-field-label">Notas complementarias</div><div class="card-field-value">${p["Notas complementarias"]}</div></div>` : ""}
      </div>
      <div class="flor-section"><h4>Análisis FLOR</h4>
        <div class="flor-grid">
          ${ORDER.map(comp => {
            const items = florByComp[comp] || [];
            const fc = data.getFlorColor(comp);
            return `<div class="flor-pill" style="background:${fc}18;border:1px solid ${fc}40">
              <div class="flor-label" style="color:${fc}">${SHORT[comp]} · ${comp}</div>
              ${items.length===0 ? `<div style="font-size:11px;color:#7a8fa8">Sin enunciados</div>` :
                items.map(f => `<div style="font-size:11px;color:#dde3ee;margin-bottom:3px">· ${f.categoria}</div>`).join("")}
            </div>`;
          }).join("")}
        </div>
      </div>
      <div class="ods-section"><h4>ODS vinculados</h4>
        <div class="ods-list">
          ${ods.map(o => { const oc=data.getOdsColor(o["Num. ODS"]);
            return `<div class="ods-chip" style="background:${oc}22;border:1px solid ${oc}55;color:${oc}">
              <strong>${o["Num. ODS"]}</strong> ${o["Nombre ODS"]}
              <span class="ods-nivel">${o["Nivel de vínculo"]}</span>
            </div>`; }).join("")}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${ods.map(o => { const oc=data.getOdsColor(o["Num. ODS"]);
            return `<div style="padding:10px 14px;border-radius:8px;background:${oc}10;border-left:3px solid ${oc}">
              <div style="font-size:11px;font-weight:700;color:${oc};margin-bottom:3px">${o["Num. ODS"]} · ${o["Dimensión del vínculo"]} · ${o["Tipo de impacto"]}</div>
              <div style="font-size:12px;color:#e8edf5">${o["Descripción del vínculo"]}</div>
              ${o["Evidencia / fuente"]?`<div style="font-size:11px;color:#7a8fa8;margin-top:4px;font-style:italic">${o["Evidencia / fuente"]}</div>`:""}
            </div>`; }).join("")}
        </div>
      </div>
    `);
  }

  function showFlor(node, data) {
    const f = node.data, color = node.color;
    openModal(`
      <div class="card-header">
        <div class="card-tag" style="color:${color}">Enunciado FLOR · ${f.componente}</div>
        <div class="card-title" style="color:${color};font-size:20px">${f.categoria}</div>
      </div>
      <div class="card-bar" style="background:linear-gradient(90deg,${color},${color}44)"></div>
      <div class="card-grid">
        <div class="card-field full"><div class="card-field-label">Enunciado consolidado</div><div class="card-field-value" style="font-size:14px;line-height:1.7">${f.enunciado}</div></div>
        ${f.observaciones?`<div class="card-field full"><div class="card-field-label">Observaciones por práctica</div><div class="card-field-value">${f.observaciones}</div></div>`:""}
        <div class="card-field full"><div class="card-field-label">Prácticas vinculadas</div>
          <div class="card-field-value" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:5px">
            ${f.practicas_vinculadas.map(pid => {
              const pc=data.getPracticaColor(pid); const ab=data.getPracticaIcon(pid);
              const pname=data.raw.practicas.find(x=>x["ID"]===pid);
              return `<span style="padding:4px 10px;border-radius:14px;background:${pc}22;border:1px solid ${pc}55;color:${pc};font-size:11px;font-weight:600">${ab} ${pname?pname["Nombre de la práctica"]:pid}</span>`;
            }).join("")}
          </div>
        </div>
      </div>
    `);
  }

  function showOds(node, data) {
    const color = node.color;
    const ods = data.raw.ods_relaciones.filter(r => r["Num. ODS"] === node.id);
    openModal(`
      <div class="card-header">
        <div class="card-tag" style="color:${color}">Objetivo de Desarrollo Sostenible</div>
        <div class="card-title" style="color:${color}">${node.id} · ${node.fullLabel}</div>
      </div>
      <div class="card-bar" style="background:linear-gradient(90deg,${color},${color}44)"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${ods.map(o => {
          const pc=data.getPracticaColor(o["ID Práctica"]); const ab=data.getPracticaIcon(o["ID Práctica"]);
          const lc=o["Nivel de vínculo"]==="Alto"?"#6dbf8a":"#e8a84b";
          return `<div style="padding:14px 16px;border-radius:10px;background:#162033;border:1px solid rgba(255,255,255,0.07);border-left:3px solid ${pc}">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-weight:700;color:${pc};font-size:13px">${ab} ${o["Nombre de la práctica"]}</span>
              <span style="margin-left:auto;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:${lc}22;color:${lc};border:1px solid ${lc}44">${o["Nivel de vínculo"]}</span>
              <span style="padding:2px 8px;border-radius:10px;font-size:10px;background:rgba(255,255,255,0.05);color:#7a8fa8">${o["Dimensión del vínculo"]}</span>
            </div>
            <div style="font-size:13px;color:#e8edf5;margin-bottom:5px">${o["Descripción del vínculo"]}</div>
            ${o["Evidencia / fuente"]?`<div style="font-size:11px;color:#7a8fa8;font-style:italic">· ${o["Evidencia / fuente"]}</div>`:""}
          </div>`;
        }).join("")}
      </div>
    `);
  }

  function openModal(html) {
    document.getElementById("modal-content").innerHTML = html;
    document.getElementById("modal-overlay").classList.remove("hidden");
  }

  function initEvents() {
    document.getElementById("modal-close").addEventListener("click", () =>
      document.getElementById("modal-overlay").classList.add("hidden"));
    document.getElementById("modal-overlay").addEventListener("click", e => {
      if (e.target === document.getElementById("modal-overlay"))
        document.getElementById("modal-overlay").classList.add("hidden");
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") document.getElementById("modal-overlay").classList.add("hidden");
    });
  }

  return { show, showFlor, showOds, initEvents };
})();
