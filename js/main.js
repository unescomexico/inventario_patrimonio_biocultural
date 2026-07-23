/**
 * main.js - Entry point
 */
(async () => {
  const loading = document.createElement("div");
  loading.style.cssText = "position:fixed;inset:0;background:#0b1220;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;font-family:'DM Sans',sans-serif;color:#7a8fa8";
  loading.innerHTML = `
    <div style="font-family:'Playfair Display',serif;font-size:26px;color:#e8edf5;margin-bottom:10px">
      Red Patrimonial <em style="color:#e8a84b">Biocultural</em>
    </div>
    <div style="font-size:12px;letter-spacing:1px;margin-bottom:28px">Sánchez Magallanes, Tabasco</div>
    <div style="display:flex;gap:7px">
      ${[0,1,2].map(i=>`<div style="width:7px;height:7px;border-radius:50%;background:#4fa3c7;animation:p 1.1s ${i*0.18}s infinite"></div>`).join("")}
    </div>
    <style>@keyframes p{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}</style>
  `;
  document.body.appendChild(loading);

  try {
    const appData = await AppData.load();
    loading.remove();

    // Init modal
    Card.initEvents();

    // Init graph (layer toggles built inside)
    Graph.init(appData);

    // Init sidebar filters — pass changes to graph
    Filters.init(appData, filters => Graph.applyFilters(filters));

    // Init FLOR page
    FlorPage.init(appData);

    // Init calendario
    Calendario.init(appData);

    // Intro overlay — shown once per page load
    const introOverlay = document.getElementById("intro-overlay");
    const closeIntro = () => introOverlay.classList.add("hidden");
    introOverlay.classList.remove("hidden");
    document.getElementById("intro-close").addEventListener("click", closeIntro);
    document.getElementById("intro-start").addEventListener("click", closeIntro);
    introOverlay.addEventListener("click", e => { if (e.target === introOverlay) closeIntro(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !introOverlay.classList.contains("hidden")) closeIntro();
    });

    // Tab switching
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".app-section").forEach(s => s.classList.remove("active"));
        tab.classList.add("active");
        const section = document.getElementById(`section-${tab.dataset.section}`);
        if (section) section.classList.add("active");
      });
    });

  } catch (err) {
    console.error(err);
    loading.innerHTML = `<div style="color:#e06070;text-align:center;padding:40px;font-family:'DM Sans',sans-serif">
      <div style="font-size:16px;margin-bottom:8px">Error al cargar los datos</div>
      <div style="font-size:12px;color:#7a8fa8">${err.message}</div>
      <div style="font-size:11px;color:#7a8fa8;margin-top:8px">Sirve el proyecto desde un servidor local: python3 -m http.server 8080</div>
    </div>`;
  }
})();
