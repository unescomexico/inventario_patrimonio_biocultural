/**
 * calendario.js - Ciclo calendárico sunburst interactivo
 * Anillo A (interior): Artesanía, Fiestas, Música y danza
 * Anillo B (medio):    Ostricultura, Medicina tradicional
 * Anillo C (exterior): Pesca, Cocina tradicional, Agricultura
 */
const Calendario = (() => {

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const CAT_COLORS = {
    "Fiestas patronales y religiosas": "#E15759",
    "Conmemoraciones y eventos":       "#FF9DA7",
    "Expresión ritual":                "#c04050",
    "Expresión festiva":               "#F28E2B",
    "Expresión cívica":                "#d46b2a",
    "Producción festiva":              "#8B4513",
    "Monitoreo ambiental":             "#76B7B2",
    "Mantenimiento y preparación":     "#E8A84B",
    "Pesca y captura":                 "#4E79A7",
    "Cultivo y acuacultura":           "#59A14F",
    "Remedios estacionales":           "#B07AA1",
    "Recolección de plantas":          "#a0c36e",
    "Veda y descanso":                 "#EDC948",
    "Comercialización":                "#9B59B6",
    "Cosecha y producción":            "#27AE60",
    "Manejo del cocotal":              "#2ECC71",
    "Siembra y renovación":            "#1E8449",
    "Cocina festiva":                  "#E67E22",
    "Ingredientes de temporada":       "#CA6F1E",
  };

  const RING_CONFIG = [
    { id:"A", label:"A", practicas:["Artesanía","Fiestas","Música y danza"], rInner:0.32, rOuter:0.50 },
    { id:"B", label:"B", practicas:["Ostricultura","Medicina tradicional"],  rInner:0.53, rOuter:0.70 },
    { id:"C", label:"C", practicas:["Pesca","Cocina tradicional","Agricultura"], rInner:0.73, rOuter:0.90 },
  ];
  const MES_RING = { rInner: 0.92, rOuter: 1.0 };

  const PRAC_COLORS = {
    "Artesanía":            "#c4a84f",
    "Fiestas":              "#e06880",
    "Música y danza":       "#7a8fd5",
    "Ostricultura":         "#4bbfb0",
    "Medicina tradicional": "#c47ab0",
    "Pesca":                "#3a9fd5",
    "Cocina tradicional":   "#e07a4a",
    "Agricultura":          "#7dbf5a"
  };

  let _data = null;
  let _ciclos = [];
  let activeFilters = new Set();
  let _svgRef = null; // keep d3 selection for reset

  function init(data) {
    _data = data;
    _ciclos = data.raw.ciclos || [];
    buildFilterChips();
    buildResetBtn();
    render();
    buildLegend();
  }

  // ─── Filter chips ─────────────────────────────────────────
  function buildFilterChips() {
    const container = document.getElementById("cal-filter-practica");
    const lbl = document.createElement("span");
    lbl.className = "cal-chip-label";
    lbl.textContent = "Práctica:";
    container.appendChild(lbl);

    const allPracs = [...new Set(_ciclos.map(c => c.practica))].sort();
    allPracs.forEach(prac => {
      const pc = PRAC_COLORS[prac] || "#7a8fa8";
      const btn = document.createElement("button");
      btn.className = "cal-chip";
      btn.dataset.prac = prac;
      btn.textContent = prac;
      btn.addEventListener("click", () => {
        if (activeFilters.has(prac)) {
          activeFilters.delete(prac);
          btn.classList.remove("active");
          btn.style.borderColor = ""; btn.style.color = "";
        } else {
          activeFilters.add(prac);
          btn.classList.add("active");
          btn.style.borderColor = pc; btn.style.color = pc;
        }
        render();
        updateDetail(null);
      });
      container.appendChild(btn);
    });
  }

  // ─── Reset button ─────────────────────────────────────────
  function buildResetBtn() {
    const btn = document.getElementById("cal-btn-reset");
    if (!btn) return;
    btn.addEventListener("click", () => {
      activeFilters.clear();
      document.querySelectorAll("#cal-filter-practica .cal-chip").forEach(c => {
        c.classList.remove("active");
        c.style.borderColor = ""; c.style.color = "";
      });
      render();
      updateDetail(null);
    });
  }

  // ─── Main render ─────────────────────────────────────────
  function render() {
    const svgEl = document.getElementById("cal-svg");
    svgEl.innerHTML = "";

    const SIZE = 540;
    const CX = SIZE / 2, CY = SIZE / 2;
    const R = SIZE * 0.46;

    _svgRef = d3.select(svgEl)
      .attr("viewBox", `0 0 ${SIZE} ${SIZE}`)
      .attr("width", SIZE).attr("height", SIZE);

    const svg = _svgRef;

    // Background circle
    svg.append("circle").attr("cx",CX).attr("cy",CY)
      .attr("r", R * MES_RING.rOuter + 4)
      .attr("fill","#162033").attr("stroke","rgba(255,255,255,0.05)").attr("stroke-width","1");

    // White center
    svg.append("circle").attr("cx",CX).attr("cy",CY)
      .attr("r", R * RING_CONFIG[0].rInner - 4)
      .attr("fill","#0b1220");

    const arc = d3.arc();

    // ─ Month ring
    MESES.forEach((mes, i) => {
      const startAngle = (i / 12) * 2 * Math.PI - Math.PI/2;
      const endAngle   = ((i+1) / 12) * 2 * Math.PI - Math.PI/2;
      const midAngle   = (startAngle + endAngle) / 2;

      svg.append("path")
        .attr("d", arc({ innerRadius: R * MES_RING.rInner, outerRadius: R * MES_RING.rOuter, startAngle, endAngle }))
        .attr("transform", `translate(${CX},${CY})`)
        .attr("fill","#2a3a52").attr("stroke","#0b1220").attr("stroke-width","0.5");

      const labelR = R * (MES_RING.rInner + MES_RING.rOuter) / 2;
      const lx = CX + labelR * Math.cos(midAngle - Math.PI/2);
      const ly = CY + labelR * Math.sin(midAngle - Math.PI/2);
      const rot = (midAngle * 180 / Math.PI) + (midAngle > Math.PI/2 && midAngle < 3*Math.PI/2 ? 180 : 0);

      svg.append("text")
        .attr("x", lx).attr("y", ly)
        .attr("text-anchor","middle").attr("dominant-baseline","middle")
        .attr("font-size","9").attr("font-weight","600")
        .attr("fill","#a0b0c8").attr("letter-spacing","0.5")
        .attr("transform", `rotate(${rot},${lx},${ly})`)
        .text(mes.substring(0,3).toUpperCase());
    });

    // ─ Data rings
    RING_CONFIG.forEach(ring => {
      const filteredCiclos = activeFilters.size > 0
        ? _ciclos.filter(c => ring.practicas.includes(c.practica) && activeFilters.has(c.practica))
        : _ciclos.filter(c => ring.practicas.includes(c.practica));

      MESES.forEach((mes, mi) => {
        const mesData = filteredCiclos.filter(c => c.mes === mes);
        if (mesData.length === 0) return;

        const startMes = (mi / 12) * 2 * Math.PI - Math.PI/2;
        const endMes   = ((mi+1) / 12) * 2 * Math.PI - Math.PI/2;
        const segW = (endMes - startMes) / mesData.length;

        mesData.forEach((item, j) => {
          const startAngle = startMes + j * segW;
          const endAngle   = startMes + (j+1) * segW;
          const midAngle   = (startAngle + endAngle) / 2;
          const color = CAT_COLORS[item.categoria] || "#7a8fa8";
          const segMidR = R * (ring.rInner + ring.rOuter) / 2;

          const path = svg.append("path")
            .attr("class","cal-segment")
            .attr("d", arc({ innerRadius: R*ring.rInner, outerRadius: R*ring.rOuter, startAngle, endAngle }))
            .attr("transform", `translate(${CX},${CY})`)
            .attr("fill", color)
            .attr("stroke","#0b1220").attr("stroke-width","0.6")
            .datum(item);

          // N-label inside segment
          const segArc = endAngle - startAngle;
          if (segArc * segMidR > 12) {
            svg.append("text")
              .attr("x", CX + segMidR * Math.cos(midAngle - Math.PI/2))
              .attr("y", CY + segMidR * Math.sin(midAngle - Math.PI/2))
              .attr("text-anchor","middle").attr("dominant-baseline","middle")
              .attr("font-size","7").attr("font-weight","700")
              .attr("fill","rgba(255,255,255,0.85)").attr("pointer-events","none")
              .text(item.n_actividades);
          }

          path.on("click", function() {
            // Reset all opacity
            svg.selectAll(".cal-segment")
              .attr("opacity", 1).attr("stroke","#0b1220").attr("stroke-width","0.6");
            // Highlight clicked
            d3.select(this)
              .attr("stroke","white").attr("stroke-width","2")
              .raise();
            updateDetail(item);
          });

          path.on("mouseover", function(event) {
            d3.select(this).attr("opacity", 0.78);
            showCalTooltip(event, item);
          });
          path.on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            hideCalTooltip();
          });
        });
      });

      // Divider spokes between months
      MESES.forEach((_, i) => {
        const angle = (i / 12) * 2 * Math.PI - Math.PI/2;
        svg.append("line")
          .attr("x1", CX + R*ring.rInner * Math.cos(angle))
          .attr("y1", CY + R*ring.rInner * Math.sin(angle))
          .attr("x2", CX + R*ring.rOuter * Math.cos(angle))
          .attr("y2", CY + R*ring.rOuter * Math.sin(angle))
          .attr("stroke","#0b1220").attr("stroke-width","0.8");
      });
    });

    // Ring labels in center
    RING_CONFIG.forEach(ring => {
      const labelR = R * ring.rInner - 8;
      svg.append("text")
        .attr("x", CX).attr("y", CY - labelR)
        .attr("text-anchor","middle").attr("dominant-baseline","middle")
        .attr("font-size","9").attr("font-weight","700").attr("fill","#7a8fa8")
        .text(ring.id);
    });
  }

  // ─── Detail panel ─────────────────────────────────────────
  function updateDetail(item) {
    const panel = document.getElementById("cal-detail");
    if (!item) {
      panel.innerHTML = `<div class="cal-detail-placeholder"><p>Haz clic en un segmento del calendario para ver el detalle de actividades de ese mes y práctica.</p></div>`;
      return;
    }
    const color = PRAC_COLORS[item.practica] || "#7a8fa8";
    const allForMonth = _ciclos.filter(c => c.mes === item.mes && c.practica === item.practica);

    panel.innerHTML = `
      <div class="cal-detail-header">
        <div class="cal-detail-mes" style="color:${color}">${item.mes}</div>
        <div class="cal-detail-practica" style="color:${color}">${item.practica}</div>
        <div class="cal-detail-cat">${allForMonth.length} ${allForMonth.length===1?"actividad":"actividades"} registradas este mes</div>
      </div>
      <div class="cal-act-list">
        ${allForMonth.map(act => {
          const cc = CAT_COLORS[act.categoria] || "#7a8fa8";
          return `<div class="cal-act-item" style="border-left-color:${cc};background:${cc}12">
            <div class="cal-act-cat" style="color:${cc}">${act.categoria}</div>
            <div class="cal-act-desc">${act.descripcion}</div>
            <div class="cal-act-n">${act.n_actividades} ${act.n_actividades===1?"actividad":"actividades"}</div>
          </div>`;
        }).join("")}
      </div>
    `;
  }

  // ─── Tooltip ─────────────────────────────────────────────
  function showCalTooltip(event, item) {
    const tip = document.getElementById("tooltip");
    const cc = CAT_COLORS[item.categoria] || "#7a8fa8";
    tip.innerHTML = `<div class="tip-type" style="color:${cc}">${item.mes} · ${item.practica}</div>
                     <div class="tip-name">${item.categoria}</div>
                     <div class="tip-sub">${item.descripcion.substring(0,100)}…</div>`;
    tip.style.left = `${event.clientX + 14}px`;
    tip.style.top  = `${event.clientY - 30}px`;
    tip.classList.add("visible");
  }

  function hideCalTooltip() {
    document.getElementById("tooltip").classList.remove("visible");
  }

  // ─── Legend ───────────────────────────────────────────────
  function buildLegend() {
    const container = document.getElementById("cal-legend");
    container.innerHTML = "";
    RING_CONFIG.forEach(ring => {
      const div = document.createElement("div");
      div.className = "cal-legend-group";

      const title = document.createElement("div");
      title.className = "cal-legend-group-title";
      title.textContent = `Anillo ${ring.id} | ${ring.practicas.join(" · ")}`;
      div.appendChild(title);

      const items = document.createElement("div");
      items.className = "cal-legend-items";

      const cats = [...new Set(
        _ciclos.filter(c => ring.practicas.includes(c.practica)).map(c => c.categoria)
      )].sort();

      cats.forEach(cat => {
        const cc = CAT_COLORS[cat] || "#7a8fa8";
        const item = document.createElement("div");
        item.className = "cal-legend-item";
        const swatch = document.createElement("div");
        swatch.className = "cal-legend-swatch";
        swatch.style.background = cc;
        item.appendChild(swatch);
        item.appendChild(document.createTextNode(cat));
        items.appendChild(item);
      });

      div.appendChild(items);
      container.appendChild(div);
    });
  }

  return { init };
})();
