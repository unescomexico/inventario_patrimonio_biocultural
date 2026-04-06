/**
 * filters.js - Sidebar filters con checkboxes y collapsibles
 */
const Filters = (() => {
  const state = {
    practicas: new Set(),
    flor:      new Set(),
    ods:       new Set()
  };

  let _data = null;
  let _onChange = null;

  function init(data, onChange) {
    _data = data;
    _onChange = onChange;
    buildPracticasFilter();
    buildFlorFilter();
    buildOdsFilter();
    buildCollapsibles();
    document.getElementById("btn-reset").addEventListener("click", reset);
  }

  function buildPracticasFilter() {
    const c = document.getElementById("filter-practicas");
    c.innerHTML = "";
    _data.raw.practicas.forEach(p => {
      c.appendChild(makeChip(
        p["ID"], "practicas",
        p["Nombre de la práctica"],
        _data.getPracticaColor(p["ID"])
      ));
    });
  }

  function buildFlorFilter() {
    const c = document.getElementById("filter-flor");
    c.innerHTML = "";
    ["Fortaleza","Logro","Oportunidad","Reto","Debilidad","Amenaza"].forEach(comp => {
      c.appendChild(makeChip(comp, "flor", comp, _data.getFlorColor(comp)));
    });
  }

  function buildOdsFilter() {
    const c = document.getElementById("filter-ods");
    c.innerHTML = "";
    const odsSet = {};
    _data.raw.ods_relaciones.forEach(r => {
      if (!odsSet[r["Num. ODS"]]) odsSet[r["Num. ODS"]] = r["Nombre ODS"];
    });
    Object.entries(odsSet)
      .sort((a,b) => parseInt(a[0].replace("ODS ","")) - parseInt(b[0].replace("ODS ","")))
      .forEach(([num, nombre]) => {
        c.appendChild(makeChip(
          num, "ods",
          `${num.replace("ODS ","ODS ")} · ${nombre}`,
          _data.getOdsColor(num)
        ));
      });
  }

  function makeChip(id, group, label, color) {
    const chip = document.createElement("label");
    chip.className = "filter-chip";
    chip.dataset.id = id;
    chip.dataset.group = group;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.addEventListener("change", () => {
      if (cb.checked) {
        state[group].add(id);
        chip.classList.add("checked");
        chip.style.color = color;
      } else {
        state[group].delete(id);
        chip.classList.remove("checked");
        chip.style.color = "";
      }
      if (_onChange) _onChange(getState());
    });

    const dot = document.createElement("span");
    dot.className = "chip-dot";
    dot.style.background = color;
    dot.style.boxShadow = `0 0 4px ${color}`;

    chip.appendChild(cb);
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(label));
    return chip;
  }

  function buildCollapsibles() {
    document.querySelectorAll(".collapsible-header").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        const isOpen = btn.classList.contains("open");
        if (isOpen) {
          btn.classList.remove("open");
          target.style.display = "none";
        } else {
          btn.classList.add("open");
          target.style.display = "flex";
        }
      });
    });
  }

  function reset() {
    state.practicas.clear();
    state.flor.clear();
    state.ods.clear();
    document.querySelectorAll(".filter-chip").forEach(c => {
      c.classList.remove("checked");
      c.style.color = "";
      const cb = c.querySelector("input");
      if (cb) cb.checked = false;
    });
    if (_onChange) _onChange(getState());
  }

  function getState() {
    return {
      practicas: new Set(state.practicas),
      flor:      new Set(state.flor),
      ods:       new Set(state.ods)
    };
  }

  return { init, getState };
})();
