/* Respaldos portables. El archivo nunca se aplica al borrador ni se mezcla con objetos sin validar. */
(() => {
  "use strict";
  const FORMAT = "estilos-studio-projects", VERSION = 1, MAX_BYTES = 8 * 1024 * 1024;
  let pending = null, readTicket = 0;
  const record = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const fail = message => { throw new Error(message); };
  function stateFrom(raw) {
    if (!record(raw)) fail("Estado de proyecto inválido.");
    const state = JSON.parse(INITIAL_STATE);
    if (typeof raw.brief !== "string" || raw.brief.length > 240) fail("Brief inválido.");
    if (!Object.hasOwn(RECIPES, raw.vertical)) fail("Sector no compatible.");
    if (!["light", "dark"].includes(raw.theme) || !["comoda", "compacta"].includes(raw.density)) fail("Tema o densidad no compatibles.");
    if (!Number.isFinite(raw.radius) || raw.radius < 0 || raw.radius > 32) fail("Radio fuera de rango.");
    Object.assign(state, { brief: raw.brief, vertical: raw.vertical, theme: raw.theme, density: raw.density, radius: raw.radius });
    if (!record(raw.palette)) fail("Paleta inválida.");
    ["acc", "acc2", "page"].forEach(k => {
      if (typeof raw.palette[k] !== "string" || !HEX_RE.test(raw.palette[k])) fail("Color inválido en la paleta.");
      state.palette[k] = safeColor(raw.palette[k]);
    });
    if (!record(raw.blocks) || !record(raw.hidden) || !record(raw.locked)) fail("Bloques o candados inválidos.");
    SLOTS.forEach(slot => {
      const id = raw.blocks[slot.key];
      if (id !== null && (typeof id !== "string" || !Object.hasOwn(ENTRY, id) || ENTRY[id].tab !== slot.tab)) fail("Diseño no compatible con el bloque " + slot.label + ".");
      state.blocks[slot.key] = id;
      ["hidden", "locked"].forEach(k => {
        const v = raw[k][slot.key];
        if (v !== undefined && typeof v !== "boolean") fail("Visibilidad o candado inválidos.");
        state[k][slot.key] = !!v;
      });
    });
    if (!Object.values(state.blocks).some(Boolean)) fail("El proyecto no contiene diseños compatibles.");
    const order = raw.order;
    if (!Array.isArray(order) || order.length !== INITIAL_ORDER.length || new Set(order).size !== INITIAL_ORDER.length || !order.every(k => INITIAL_ORDER.includes(k))) fail("Orden de bloques inválido.");
    state.order = [...order];
    if (!record(raw.content)) fail("Contenido inválido.");
    Object.keys(raw.content).forEach(id => {
      if (!Object.hasOwn(ENTRY, id)) fail("El contenido usa un diseño desconocido.");
      const values = raw.content[id];
      if (!Array.isArray(values) || values.length > 200 || !values.every(v => v === null || (typeof v === "string" && v.length <= 500))) fail("Textos fuera de los límites permitidos.");
      state.content[id] = [...values];
    });
    state.assets = studioAssets(raw.assets, true);
    return state;
  }
  function validateBackup(raw) {
    if (!record(raw) || raw.format !== FORMAT || raw.version !== VERSION) fail("Formato o versión de respaldo no compatible. Usa un JSON exportado desde Proyectos.");
    if (!Array.isArray(raw.projects) || !raw.projects.length || raw.projects.length > PROJECT_LIMIT) fail("El respaldo debe contener entre 1 y 30 proyectos.");
    return raw.projects.map((p, i) => {
      if (!record(p) || typeof p.name !== "string" || !p.name.trim() || p.name.length > 80) fail("Nombre inválido en el proyecto " + (i + 1) + ".");
      return { id: projectId(), name: p.name.trim(), updated: new Date().toISOString(), state: stateFrom(p.state) };
    });
  }
  function clearImport() {
    pending = null; readTicket++; $("mProjects").setAttribute("aria-busy", "false"); $("backupPreview").hidden = true; $("backupNames").replaceChildren(); $("backupFile").value = "";
  }
  function downloadBackup(items) {
    if (!items.length) { projectMessage("No hay proyectos guardados para exportar. Guarda primero una copia de tu pantalla."); return; }
    try {
      const data = { format: FORMAT, version: VERSION, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), projects: items.map(p => ({ name: p.name, state: p.state })) };
      validateBackup(data); // no generar un archivo que esta versión no pueda restaurar
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      if (blob.size > MAX_BYTES) fail("El respaldo supera 8 MB. Exporta los proyectos individualmente.");
      const fileName = "estilos-proyectos-" + new Date().toISOString().slice(0,10) + ".json";
      if (nativeSave(blob, fileName)) { projectMessage("Elige dónde guardar el respaldo de " + items.length + " proyecto(s)."); return; }
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = fileName;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      projectMessage("Respaldo preparado: " + items.length + " proyecto(s). Incluye las copias guardadas, no los cambios del borrador sin actualizar.");
    } catch (e) { projectMessage("No se pudo exportar: " + e.message); }
  }
  $("btnProjects").addEventListener("click", clearImport);
  $("mProjects").addEventListener("click", ev => {
    const button = ev.target.closest("[data-act]"); if (!button) return;
    const act = button.dataset.act;
    if (act === "exportbackup") { if (readProjects()) downloadBackup(projects); }
    if (act === "exportproject") {
      const row = button.closest("[data-project]");
      if (row && readProjects()) downloadBackup(projects.filter(p => p.id === row.dataset.project));
    }
    if (act === "importbackup") $("backupFile").click();
    if (act === "cancelimport") { clearImport(); projectMessage("Importación cancelada. No se ha cambiado ningún proyecto."); }
    if (act === "confirmimport" && pending) {
      if (!readProjects()) return;
      if (projects.length + pending.length > PROJECT_LIMIT) { projectMessage("No hay espacio para todas las copias. El límite es de 30 proyectos. No se importó ninguno."); return; }
      const count = pending.length;
      if (writeProjects([...pending, ...projects])) { clearImport(); projectPending = null; renderProjects(); projectMessage("Importados " + count + " proyectos como copias nuevas. Tu pantalla actual no cambió."); }
    }
  });
  $("backupFile").addEventListener("change", async ev => {
    const file = ev.target.files[0]; clearImport(); if (!file) return;
    const ticket = readTicket;
    $("mProjects").setAttribute("aria-busy", "true");
    try {
      if (file.size > MAX_BYTES) fail("El archivo supera el límite de 8 MB.");
      const text = await file.text(); if (ticket !== readTicket) return;
      let data; try { data = JSON.parse(text); } catch (e) { fail("El archivo no contiene JSON válido."); }
      const incoming = validateBackup(data);
      if (!readProjects()) return;
      if (projects.length + incoming.length > PROJECT_LIMIT) fail("No hay espacio para todas las copias. El límite es de 30 proyectos.");
      pending = incoming;
      incoming.forEach(p => { const li = document.createElement("li"); li.textContent = p.name; $("backupNames").appendChild(li); });
      $("backupPreview").hidden = false;
      projectMessage("Archivo validado: " + incoming.length + " proyecto(s). Confirma para añadir copias nuevas; no se sobrescribirá ningún proyecto.");
      $("backupPreview").scrollIntoView({ block: "nearest" });
    } catch (e) { projectMessage("No se importó ningún proyecto: " + e.message); }
    finally { if (ticket === readTicket) $("mProjects").setAttribute("aria-busy", "false"); }
  });
})();
