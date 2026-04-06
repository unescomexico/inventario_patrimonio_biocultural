/**
 * data.js - Carga y estructura datos desde JSON
 */
const AppData = (() => {
  let _raw = null;

  const PRACTICA_COLORS = {
    "PC-01": "#3a9fd5",
    "PC-02": "#4bbfb0",
    "PC-03": "#7dbf5a",
    "PC-04": "#c4a84f",
    "PC-05": "#e07a4a",
    "PC-06": "#c47ab0",
    "PC-07": "#7a8fd5",
    "PC-08": "#e06880"
  };

  // Abreviaciones de dos letras (sin emojis)
  const PRACTICA_ICONS = {
    "PC-01": "PE",
    "PC-02": "OS",
    "PC-03": "AG",
    "PC-04": "AR",
    "PC-05": "CO",
    "PC-06": "ME",
    "PC-07": "MU",
    "PC-08": "FI"
  };

  const FLOR_COLORS = {
    "Fortaleza":   "#f0a500",
    "Logro":       "#4fa3c7",
    "Oportunidad": "#6dbf8a",
    "Reto":        "#e06070",
    "Debilidad":   "#a07ad5",
    "Amenaza":     "#d5705a"
  };

  const ODS_COLORS = {
    "ODS 1":"#e5243b","ODS 2":"#dda63a","ODS 3":"#4c9f38",
    "ODS 4":"#c5192d","ODS 5":"#ff3a21","ODS 6":"#26bde2",
    "ODS 7":"#fcc30b","ODS 8":"#a21942","ODS 9":"#fd6925",
    "ODS 10":"#dd1367","ODS 11":"#fd9d24","ODS 12":"#bf8b2e",
    "ODS 13":"#3f7e44","ODS 14":"#0a97d9","ODS 15":"#56c02b",
    "ODS 16":"#00689d","ODS 17":"#19486a"
  };

  function getPracticaColor(id) { return PRACTICA_COLORS[id] || "#7a8fa8"; }
  function getPracticaIcon(id)  { return PRACTICA_ICONS[id]  || "??"; }
  function getFlorColor(comp)   { return FLOR_COLORS[comp]   || "#7a8fa8"; }
  function getOdsColor(num)     { return ODS_COLORS[num]     || "#e8a84b"; }

  function buildGraph(raw) {
    const nodes = [];
    const links = [];
    const nodeMap = {};

    // Practica nodes
    raw.practicas.forEach(p => {
      const n = {
        id: p["ID"], type: "practica",
        label: p["Nombre de la práctica"],
        color: getPracticaColor(p["ID"]),
        icon: getPracticaIcon(p["ID"]),
        r: 28, data: p
      };
      nodes.push(n); nodeMap[n.id] = n;
    });

    // FLOR nodes
    raw.flor_enunciados.forEach(f => {
      const nid = `FLOR-${f.id}`;
      const n = {
        id: nid, type: "flor", componente: f.componente,
        label: f.categoria, fullLabel: f.enunciado,
        color: getFlorColor(f.componente), r: 9, data: f
      };
      nodes.push(n); nodeMap[nid] = n;
      f.practicas_vinculadas.forEach(pid => {
        links.push({ source: pid, target: nid, type: "flor-link",
          color: getFlorColor(f.componente), componente: f.componente });
      });
    });

    // ODS nodes
    const odsMap = {};
    raw.ods_relaciones.forEach(r => {
      const oid = r["Num. ODS"];
      if (!odsMap[oid]) {
        const n = {
          id: oid, type: "ods", label: oid,
          fullLabel: r["Nombre ODS"],
          color: getOdsColor(oid), r: 13,
          data: { num: oid, nombre: r["Nombre ODS"] }
        };
        nodes.push(n); nodeMap[oid] = n; odsMap[oid] = true;
      }
      links.push({
        source: r["ID Práctica"], target: oid, type: "ods-link",
        color: getOdsColor(oid), nivel: r["Nivel de vínculo"],
        dimension: r["Dimensión del vínculo"]
      });
    });

    return { nodes, links, nodeMap };
  }

  async function load() {
    const [r1, r2] = await Promise.all([
      fetch("data/datos.json"),
      fetch("data/ciclos.json")
    ]);
    _raw = await r1.json();
    const ciclos = await r2.json();
    _raw.ciclos = ciclos;
    const graph = buildGraph(_raw);
    return {
      raw: _raw, graph,
      PRACTICA_COLORS, FLOR_COLORS, ODS_COLORS, PRACTICA_ICONS,
      getPracticaColor, getPracticaIcon, getFlorColor, getOdsColor
    };
  }

  return { load };
})();
