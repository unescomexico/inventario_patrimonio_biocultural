/**
 * graph.js - D3 force-directed network graph with layer toggles
 */
const Graph = (() => {
  let svg, g, simulation;
  let appData;
  let width, height;
  let nodeSelection, linkSelection, labelSelection;

  // Layer visibility state
  const layers = {
    practica: true,
    flor:     true,
    ods:      true
  };

  // Active filter state (from sidebar)
  let activeFilters = { practicas: new Set(), flor: new Set(), ods: new Set() };

  // ─── Init ───────────────────────────────────────────────
  function init(data) {
    appData = data;
    const container = document.getElementById("graph-container");
    svg = d3.select("#graph-svg");
    width  = container.clientWidth;
    height = container.clientHeight;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // SVG defs
    const defs = svg.append("defs");
    const addGlow = (id, std) => {
      const f = defs.append("filter").attr("id", id)
        .attr("x","-40%").attr("y","-40%").attr("width","180%").attr("height","180%");
      f.append("feGaussianBlur").attr("stdDeviation", std).attr("result","blur");
      const fm = f.append("feMerge");
      fm.append("feMergeNode").attr("in","blur");
      fm.append("feMergeNode").attr("in","SourceGraphic");
    };
    addGlow("glow-p", 6); addGlow("glow-o", 4);

    const rg = defs.append("radialGradient").attr("id","bg-glow")
      .attr("cx","50%").attr("cy","50%").attr("r","55%");
    rg.append("stop").attr("offset","0%").attr("stop-color","#1a3060").attr("stop-opacity",0.35);
    rg.append("stop").attr("offset","100%").attr("stop-color","#0b1220").attr("stop-opacity",0);

    svg.append("rect").attr("width","100%").attr("height","100%").attr("fill","#0b1220");
    svg.append("ellipse").attr("cx","50%").attr("cy","50%")
      .attr("rx","46%").attr("ry","42%").attr("fill","url(#bg-glow)");

    const zoom = d3.zoom().scaleExtent([0.2,3]).on("zoom", e => g.attr("transform", e.transform));
    svg.call(zoom);
    g = svg.append("g").attr("class","graph-root");

    buildLayerToggles();
    buildGraph();

    window.addEventListener("resize", () => {
      width  = container.clientWidth;
      height = container.clientHeight;
      svg.attr("viewBox", `0 0 ${width} ${height}`);
      simulation.force("center", d3.forceCenter(width/2, height/2));
      simulation.alpha(0.3).restart();
    });
  }

  // ─── Layer toggles UI ────────────────────────────────────
  const LAYER_DEFS = [
    { key: "practica", label: "Práctica cultural", color: "#4fa3c7" },
    { key: "flor",     label: "Enunciado FLOR",    color: "#f0a500" },
    { key: "ods",      label: "ODS",               color: "#e8a84b" }
  ];

  function buildLayerToggles() {
    const container = document.getElementById("layer-toggles");
    if (!container) return;
    container.innerHTML = "";

    LAYER_DEFS.forEach(def => {
      const btn = document.createElement("button");
      btn.className = "layer-toggle";
      btn.dataset.layer = def.key;
      btn.innerHTML = `
        <span class="lt-dot" style="background:${def.color};box-shadow:0 0 5px ${def.color}44"></span>
        <span class="lt-name">${def.label}</span>
        <span class="lt-switch"></span>
      `;
      btn.addEventListener("click", () => {
        layers[def.key] = !layers[def.key];
        btn.classList.toggle("off", !layers[def.key]);
        applyVisibility();
      });
      container.appendChild(btn);
    });
  }

  // ─── Build graph ─────────────────────────────────────────
  function buildGraph() {
    const { nodes, links } = appData.graph;
    const cx = width/2, cy = height/2;
    const ringR = Math.min(width, height) * 0.22;

    const practicas = nodes.filter(n => n.type === "practica");
    practicas.forEach((n, i) => {
      const angle = (i / practicas.length) * 2 * Math.PI - Math.PI/2;
      n.x = cx + ringR * Math.cos(angle);
      n.y = cy + ringR * Math.sin(angle);
      n.fx = n.x; n.fy = n.y;
    });

    simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d =>
        d.type === "flor-link" ? 85 : 125
      ).strength(0.35))
      .force("charge", d3.forceManyBody().strength(d =>
        d.type === "practica" ? -500 : d.type === "flor" ? -70 : -110
      ))
      .force("center", d3.forceCenter(cx, cy))
      .force("collision", d3.forceCollide().radius(d => d.r + 10))
      .alphaDecay(0.02);

    // Links
    linkSelection = g.append("g").attr("class","links")
      .selectAll(".link").data(links).enter().append("line")
        .attr("class", d => `link link-${d.type}`)
        .attr("stroke", d => d.color)
        .attr("stroke-width", d => d.type === "ods-link" && d.nivel === "Alto" ? 1.4 : 0.7)
        .attr("stroke-dasharray", d => d.type === "flor-link" ? "4 3" : "none");

    // Nodes
    nodeSelection = g.append("g").attr("class","nodes")
      .selectAll(".node").data(nodes).enter().append("g")
        .attr("class", d => `node node-${d.type}`)
        .attr("id", d => `node-${d.id.replace(/[\s.]/g,"_")}`)
        .call(d3.drag()
          .on("start", (e,d) => { if(!e.active) simulation.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
          .on("drag",  (e,d) => { d.fx=e.x; d.fy=e.y; })
          .on("end",   (e,d) => { if(!e.active) simulation.alphaTarget(0); d.fx=null; d.fy=null; }))
        .on("click", onNodeClick)
        .on("mouseover", onNodeOver)
        .on("mouseout",  onNodeOut);

    nodeSelection.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => d.type === "practica" ? d.color : d.color + "20")
      .attr("stroke", d => d.color)
      .attr("stroke-width", d => d.type === "practica" ? 2.5 : 1.2)
      .attr("filter", d => d.type === "practica" ? "url(#glow-p)" : d.type === "ods" ? "url(#glow-o)" : null);

    nodeSelection.filter(d => d.type === "practica").append("circle")
      .attr("r", d => d.r + 6).attr("fill","none")
      .attr("stroke", d => d.color).attr("stroke-width","1").attr("stroke-opacity","0.22");

    nodeSelection.filter(d => d.type === "practica").append("text")
      .attr("class","node-label").attr("text-anchor","middle")
      .attr("dominant-baseline","middle").attr("font-size","10")
      .attr("font-weight","700").attr("fill","white").attr("letter-spacing","0.5")
      .text(d => d.icon);

    nodeSelection.filter(d => d.type === "practica").append("text")
      .attr("class","node-label node-name-label").attr("text-anchor","middle")
      .attr("dominant-baseline","middle").attr("font-size","9")
      .attr("fill","rgba(255,255,255,0.8)").attr("dy","22")
      .text(d => abbrev(d.label, 14));

    nodeSelection.filter(d => d.type === "ods").append("text")
      .attr("class","node-label").attr("text-anchor","middle")
      .attr("dominant-baseline","middle").attr("font-size","8")
      .attr("font-weight","700").attr("fill","white")
      .text(d => d.label.replace("ODS ",""));

    nodeSelection.filter(d => d.type === "flor").append("text")
      .attr("class","node-label").attr("text-anchor","middle")
      .attr("dominant-baseline","middle").attr("font-size","7")
      .attr("font-weight","700").attr("fill","rgba(255,255,255,0.65)")
      .text(d => d.componente[0]);

    labelSelection = g.append("g").attr("class","labels")
      .selectAll(".ext-label").data(nodes.filter(n => n.type === "practica")).enter()
      .append("text")
        .attr("class","ext-label node-label").attr("text-anchor","middle")
        .attr("font-size","9.5").attr("font-weight","600")
        .attr("fill", d => d.color).attr("pointer-events","none")
        .text(d => d.label);

    simulation.on("tick", () => {
      linkSelection
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      nodeSelection.attr("transform", d => `translate(${d.x},${d.y})`);
      labelSelection.attr("x", d => d.x).attr("y", d => d.y + d.r + 18);
    });

    setTimeout(() => {
      practicas.forEach(n => { n.fx=null; n.fy=null; });
      simulation.alpha(0.2).restart();
    }, 1800);
  }

  // ─── Tooltip ─────────────────────────────────────────────
  function onNodeOver(event, d) {
    // Don't tooltip invisible nodes
    if (!layers[d.type]) return;
    const tip = document.getElementById("tooltip");
    const rect = document.getElementById("graph-container").getBoundingClientRect();
    const typeLabel = d.type === "practica" ? "Práctica cultural" :
                      d.type === "flor"     ? `FLOR · ${d.componente}` : "ODS";
    const sub = d.type === "practica" ? d.data["Comunidades vinculadas"].substring(0,80)+"…" :
                d.type === "flor"     ? d.data.enunciado.substring(0,110)+"…" : d.data.nombre;
    tip.innerHTML = `<div class="tip-type">${typeLabel}</div><div class="tip-name">${d.label}</div><div class="tip-sub">${sub}</div>`;
    tip.style.left = `${event.clientX - rect.left + 14}px`;
    tip.style.top  = `${event.clientY - rect.top  - 30}px`;
    tip.classList.add("visible");
    highlightConnected(d);
  }

  function onNodeOut() {
    document.getElementById("tooltip").classList.remove("visible");
    clearHighlight();
  }

  function highlightConnected(d) {
    const { links } = appData.graph;
    const connected = new Set([d.id]);
    links.forEach(l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      if (s === d.id) connected.add(t);
      if (t === d.id) connected.add(s);
    });
    nodeSelection.classed("faded", n => !connected.has(n.id) && layers[n.type])
                 .classed("hidden-layer", n => !layers[n.type])
                 .classed("highlighted", n => connected.has(n.id));
    linkSelection.classed("faded", l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      return !(connected.has(s) && connected.has(t));
    }).classed("highlighted", l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      return connected.has(s) && connected.has(t);
    });
  }

  function clearHighlight() {
    nodeSelection.classed("faded",false).classed("highlighted",false);
    linkSelection.classed("faded",false).classed("highlighted",false);
    applyVisibility(); // re-apply layer state after clearing highlight
  }

  function onNodeClick(event, d) {
    event.stopPropagation();
    if (!layers[d.type]) return;
    if (d.type === "practica") Card.show(d, appData);
    else if (d.type === "flor") Card.showFlor(d, appData);
    else if (d.type === "ods")  Card.showOds(d, appData);
  }

  // ─── Layer visibility ─────────────────────────────────────
  function applyVisibility() {
    if (!nodeSelection) return;

    nodeSelection.classed("hidden-layer", n => !layers[n.type]);

    // Links: hide if either endpoint's layer is off
    linkSelection.classed("hidden-layer", l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      const sNode = appData.graph.nodeMap[s];
      const tNode = appData.graph.nodeMap[t];
      return (sNode && !layers[sNode.type]) || (tNode && !layers[tNode.type]);
    });

    // Also re-apply filter fading on top
    _applyFilterFade();
  }

  // ─── Filter (from sidebar) ────────────────────────────────
  function applyFilters(filters) {
    activeFilters = filters;
    _applyFilterFade();
  }

  function _applyFilterFade() {
    if (!nodeSelection) return;
    const { nodes, links } = appData.graph;
    const hasFilters = activeFilters.practicas.size > 0 || activeFilters.flor.size > 0 || activeFilters.ods.size > 0;

    if (!hasFilters) {
      nodeSelection.classed("faded", false);
      linkSelection.classed("faded", false);
      applyLayerClasses();
      return;
    }

    const visible = new Set();
    activeFilters.practicas.forEach(id => visible.add(id));

    nodes.filter(n => n.type === "flor").forEach(n => {
      const compOk = activeFilters.flor.size === 0 || activeFilters.flor.has(n.componente);
      if (!compOk) return;
      const linked = n.data.practicas_vinculadas;
      const pracOk = activeFilters.practicas.size === 0 || linked.some(p => activeFilters.practicas.has(p));
      if (pracOk) {
        visible.add(n.id);
        linked.forEach(p => { if (activeFilters.practicas.size === 0 || activeFilters.practicas.has(p)) visible.add(p); });
      }
    });

    nodes.filter(n => n.type === "ods").forEach(n => {
      const odsOk = activeFilters.ods.size === 0 || activeFilters.ods.has(n.id);
      if (!odsOk) return;
      links.filter(l => {
        const t = typeof l.target === "object" ? l.target.id : l.target;
        return t === n.id && l.type === "ods-link";
      }).forEach(l => {
        const s = typeof l.source === "object" ? l.source.id : l.source;
        if (activeFilters.practicas.size === 0 || activeFilters.practicas.has(s)) {
          visible.add(n.id); visible.add(s);
        }
      });
    });

    if (activeFilters.practicas.size > 0 && activeFilters.flor.size === 0 && activeFilters.ods.size === 0) {
      links.forEach(l => {
        const s = typeof l.source === "object" ? l.source.id : l.source;
        const t = typeof l.target === "object" ? l.target.id : l.target;
        if (activeFilters.practicas.has(s)) { visible.add(t); visible.add(s); }
        if (activeFilters.practicas.has(t)) { visible.add(s); visible.add(t); }
      });
    }

    nodeSelection.classed("faded", n => !visible.has(n.id));
    linkSelection.classed("faded", l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      return !(visible.has(s) && visible.has(t));
    });

    applyLayerClasses();
  }

  function applyLayerClasses() {
    if (!nodeSelection) return;
    nodeSelection.classed("hidden-layer", n => !layers[n.type]);
    linkSelection.classed("hidden-layer", l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      const sNode = appData.graph.nodeMap[s];
      const tNode = appData.graph.nodeMap[t];
      return (sNode && !layers[sNode.type]) || (tNode && !layers[tNode.type]);
    });
  }

  function abbrev(str, n) { return str && str.length > n ? str.substring(0,n)+"…" : str || ""; }

  document.addEventListener("click", e => { if (!e.target.closest(".node")) clearHighlight(); });

  return { init, applyFilters };
})();
