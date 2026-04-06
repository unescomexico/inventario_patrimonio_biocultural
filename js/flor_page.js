/**
 * flor_page.js - Sección de análisis FLOR tabular
 * Badges de prácticas con nombre completo y clic para abrir ficha
 */
const FlorPage = (() => {
  const COMP_ORDER = ["Fortaleza","Logro","Oportunidad","Reto","Debilidad","Amenaza"];
  let _data = null;
  let activeComps = new Set();
  let activePracs = new Set();

  function init(data) {
    _data = data;
    buildFilters();
    render();
  }

  function buildFilters() {
    // Componentes
    const compRow = document.getElementById("flor-filter-comp");
    const labelC = document.createElement("span");
    labelC.className = "flor-filter-label";
    labelC.textContent = "Componente:";
    compRow.appendChild(labelC);

    COMP_ORDER.forEach(comp => {
      const fc = _data.getFlorColor(comp);
      const btn = document.createElement("button");
      btn.className = "flor-chip";
      btn.textContent = comp;
      btn.addEventListener("click", () => {
        if (activeComps.has(comp)) {
          activeComps.delete(comp);
          btn.classList.remove("active");
          btn.style.borderColor = ""; btn.style.color = "";
        } else {
          activeComps.add(comp);
          btn.classList.add("active");
          btn.style.borderColor = fc; btn.style.color = fc;
        }
        render();
      });
      compRow.appendChild(btn);
    });

    // Prácticas
    const pracRow = document.getElementById("flor-filter-prac");
    const labelP = document.createElement("span");
    labelP.className = "flor-filter-label";
    labelP.textContent = "Práctica:";
    pracRow.appendChild(labelP);

    _data.raw.practicas.forEach(p => {
      const pc = _data.getPracticaColor(p["ID"]);
      const btn = document.createElement("button");
      btn.className = "flor-chip";
      btn.textContent = p["Nombre de la práctica"];
      btn.addEventListener("click", () => {
        const id = p["ID"];
        if (activePracs.has(id)) {
          activePracs.delete(id);
          btn.classList.remove("active");
          btn.style.borderColor = ""; btn.style.color = "";
        } else {
          activePracs.add(id);
          btn.classList.add("active");
          btn.style.borderColor = pc; btn.style.color = pc;
        }
        render();
      });
      pracRow.appendChild(btn);
    });
  }

  function render() {
    const container = document.getElementById("flor-table-container");
    container.innerHTML = "";

    const compsToShow = activeComps.size > 0
      ? COMP_ORDER.filter(c => activeComps.has(c))
      : COMP_ORDER;

    compsToShow.forEach(comp => {
      let enunciados = _data.raw.flor_enunciados.filter(f => f.componente === comp);
      if (activePracs.size > 0) {
        enunciados = enunciados.filter(f => f.practicas_vinculadas.some(p => activePracs.has(p)));
      }
      if (enunciados.length === 0) return;

      const fc = _data.getFlorColor(comp);
      const block = document.createElement("div");
      block.className = "flor-component-block";

      // Component title bar
      const title = document.createElement("div");
      title.className = "flor-comp-title";
      title.style.background = fc + "22";
      title.style.borderBottom = `1px solid ${fc}44`;
      title.style.color = fc;
      title.textContent = comp.toUpperCase();
      block.appendChild(title);

      enunciados.forEach(f => {
        const row = document.createElement("div");
        row.className = "flor-enunciado-row";
        row.style.background = "var(--surface)";

        // ── Main content (enunciado)
        const main = document.createElement("div");
        main.className = "flor-enunciado-main";

        const cat = document.createElement("div");
        cat.className = "flor-enunciado-cat";
        cat.style.color = fc;
        cat.textContent = f.categoria;
        main.appendChild(cat);

        const text = document.createElement("div");
        text.className = "flor-enunciado-text";
        text.textContent = f.enunciado;
        main.appendChild(text);

        if (f.observaciones) {
          const obs = document.createElement("div");
          obs.className = "flor-enunciado-obs";
          obs.textContent = f.observaciones;
          main.appendChild(obs);
        }
        row.appendChild(main);

        // ── Practice badges (right column)
        const pracs = document.createElement("div");
        pracs.className = "flor-enunciado-practicas";

        const pracsToShow = activePracs.size > 0
          ? f.practicas_vinculadas.filter(p => activePracs.has(p))
          : f.practicas_vinculadas;

        pracsToShow.forEach(pid => {
          const pc = _data.getPracticaColor(pid);
          const pracData = _data.raw.practicas.find(x => x["ID"] === pid);
          const nombre = pracData ? pracData["Nombre de la práctica"] : pid;

          const badge = document.createElement("button");
          badge.className = "flor-prac-badge";
          badge.style.background = pc + "1a";
          badge.style.border = `1px solid ${pc}44`;
          badge.style.color = pc;
          badge.textContent = nombre;
          badge.title = `Ver ficha: ${nombre}`;

          // Click opens the practice card
          badge.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!pracData) return;
            // Build a node-like object matching what Card.show expects
            const nodeObj = {
              id: pracData["ID"],
              type: "practica",
              label: pracData["Nombre de la práctica"],
              color: pc,
              icon: _data.getPracticaIcon(pracData["ID"]),
              data: pracData
            };
            Card.show(nodeObj, _data);
          });

          pracs.appendChild(badge);
        });

        row.appendChild(pracs);
        block.appendChild(row);
      });

      container.appendChild(block);
    });
  }

  return { init };
})();
