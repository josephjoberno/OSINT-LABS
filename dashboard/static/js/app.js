(() => {
  const projectGate = document.getElementById("project-gate");
  const workspace = document.getElementById("workspace");
  const createProjectForm = document.getElementById("create-project-form");
  const projectList = document.getElementById("project-list");
  const projectListEmpty = document.getElementById("project-list-empty");
  const sidebarProjectName = document.getElementById("sidebar-project-name");
  const projectMeta = document.getElementById("project-meta");
  const btnLeaveProject = document.getElementById("btn-leave-project");
  const openFiles = document.getElementById("open-files");
  const btnUpdate = document.getElementById("btn-update");
  const btnReset = document.getElementById("btn-reset");
  const systemModal = document.getElementById("system-modal");
  const systemBackdrop = document.getElementById("system-backdrop");
  const closeSystemModal = document.getElementById("close-system-modal");
  const systemModalTitle = document.getElementById("system-modal-title");
  const systemModalDesc = document.getElementById("system-modal-desc");
  const systemOutput = document.getElementById("system-output");
  const resetFormWrap = document.getElementById("reset-form-wrap");
  const resetConfirm = document.getElementById("reset-confirm");
  const confirmReset = document.getElementById("confirm-reset");

  const categoryNav = document.getElementById("category-nav");
  const toolsGrid = document.getElementById("tools-grid");
  const toolSearch = document.getElementById("tool-search");
  const sectionTitle = document.getElementById("section-title");
  const sectionDesc = document.getElementById("section-desc");
  const runPanel = document.getElementById("run-panel");
  const runForm = document.getElementById("run-form");
  const runTarget = document.getElementById("run-target");
  const runToolName = document.getElementById("run-tool-name");
  const runToolDesc = document.getElementById("run-tool-desc");
  const terminalOutput = document.getElementById("terminal-output");
  const runSubmit = document.getElementById("run-submit");
  const runStop = document.getElementById("run-stop");
  const closePanel = document.getElementById("close-panel");
  const toggleHistory = document.getElementById("toggle-history");
  const historyPanel = document.getElementById("history-panel");
  const historyList = document.getElementById("history-list");
  const clearHistory = document.getElementById("clear-history");
  const openXterm = document.getElementById("open-xterm");
  const closeXterm = document.getElementById("close-xterm");
  const xtermReconnect = document.getElementById("xterm-reconnect");
  const helpModal = document.getElementById("help-modal");
  const helpBackdrop = document.getElementById("help-backdrop");
  const closeHelp = document.getElementById("close-help");
  const helpTitle = document.getElementById("help-title");
  const helpSummary = document.getElementById("help-summary");
  const helpBody = document.getElementById("help-body");
  const runHelpBtn = document.getElementById("run-help-btn");
  const ctxSubject = document.getElementById("ctx-subject");
  const ctxPrimary = document.getElementById("ctx-primary");
  const btnSaveContext = document.getElementById("btn-save-context");
  const btnRefreshContext = document.getElementById("btn-refresh-context");
  const entityList = document.getElementById("entity-list");
  const entityCount = document.getElementById("entity-count");
  const addEntityForm = document.getElementById("add-entity-form");
  const addEntityValue = document.getElementById("add-entity-value");
  const targetSuggestions = document.getElementById("target-suggestions");
  const entityGraph = document.getElementById("entity-graph");
  const linkCount = document.getElementById("link-count");
  const graphExpand = document.getElementById("graph-expand");
  const graphModal = document.getElementById("graph-modal");
  const graphBackdrop = document.getElementById("graph-backdrop");
  const closeGraph = document.getElementById("close-graph");
  const entityGraphLarge = document.getElementById("entity-graph-large");
  const openBoard = document.getElementById("open-board");
  const boardModal = document.getElementById("board-modal");
  const boardBackdrop = document.getElementById("board-backdrop");
  const closeBoard = document.getElementById("close-board");
  const boardAdd = document.getElementById("board-add");
  const boardCanvas = document.getElementById("board-canvas");
  const boardWorld = document.getElementById("board-world");
  const boardNodes = document.getElementById("board-nodes");
  const boardGroups = document.getElementById("board-groups");
  const boardLinks = document.getElementById("board-links");
  const boardFit = document.getElementById("board-fit");
  const boardZoomIn = document.getElementById("board-zoom-in");
  const boardZoomOut = document.getElementById("board-zoom-out");
  const boardZoomLabel = document.getElementById("board-zoom-label");
  const boardShowHidden = document.getElementById("board-show-hidden");
  const boardDrawings = document.getElementById("board-drawings");
  const boardUndo = document.getElementById("board-undo");
  const boardRedo = document.getElementById("board-redo");
  const boardDeleteDrawing = document.getElementById("board-delete-drawing");
  const chatSettingsToggle = document.getElementById("chat-settings-toggle");
  const chatSettingsForm = document.getElementById("chat-settings-form");
  const chatApiKey = document.getElementById("chat-api-key");
  const chatModel = document.getElementById("chat-model");
  const chatWeb = document.getElementById("chat-web");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  let pendingAiActionId = null;

  let activeCategory = "all";
  let currentToolId = null;
  let currentJobId = null;
  let activeProject = null;
  let investigationContext = null;
  let autocompleteTimer = null;

  const categoryMeta = {};
  document.querySelectorAll(".cat-btn[data-category]").forEach((btn) => {
    if (btn.dataset.category !== "all") {
      categoryMeta[btn.dataset.category] = btn.textContent.trim();
    }
  });

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function appendTo(el, text, className = "") {
    const line = document.createElement("div");
    line.className = `terminal-line ${className}`.trim();
    line.textContent = text;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }

  function appendLine(text, className = "") {
    appendTo(terminalOutput, text, className);
  }

  function clearTerminal() {
    terminalOutput.innerHTML = "";
  }

  function showGate() {
    activeProject = null;
    workspace.classList.add("hidden");
    projectGate.classList.remove("hidden");
    window.OsintTerminal?.close();
    loadProjectList();
  }

  function showWorkspace(project) {
    activeProject = project;
    projectGate.classList.add("hidden");
    workspace.classList.remove("hidden");
    sidebarProjectName.textContent = project.name;
    projectMeta.textContent = project.description || "Aucune description.";
    sectionTitle.textContent = project.name;
    sectionDesc.textContent = project.description || "Espace de travail OSINT.";
    filterTools();
    loadContext();
  }

  function renderEntityList(entities = []) {
    entityList.innerHTML = "";
    entityCount.textContent = String(investigationContext?.entity_count ?? entities.length);
    if (!entities.length) {
      entityList.innerHTML = "<li class='entity-empty muted'>Aucune entite pour le moment.</li>";
      return;
    }
    for (const entity of entities.slice().reverse()) {
      const li = document.createElement("li");
      li.className = "entity-item";
      const tool = entity.suggested_tool;
      const toolLabel = tool ? tool.name : "Utiliser";
      const toolTitle = tool
        ? `Ouvrir ${tool.name} avec cette cible`
        : "Definir comme cible principale";
      li.innerHTML = `
        <button type="button" class="entity-chip" data-entity-type="${escapeHtml(entity.type)}" data-entity-value="${escapeHtml(entity.value)}"${tool ? ` data-tool-id="${escapeHtml(tool.id)}" data-tool-name="${escapeHtml(tool.name)}"` : ""} title="${escapeHtml(toolTitle)}">
          <span class="entity-type">${escapeHtml(entity.type)}</span>
          <span class="entity-value">${escapeHtml(entity.value)}</span>
          <span class="entity-action">${escapeHtml(toolLabel)}</span>
        </button>
      `;
      entityList.appendChild(li);
    }
  }

  let currentGraph = { nodes: [], edges: [] };

  function renderContextGraph(graph) {
    currentGraph = graph || { nodes: [], edges: [] };
    linkCount.textContent = String(investigationContext?.link_count ?? graph?.edges?.length ?? 0);
    window.OsintEntityGraph?.render(entityGraph, currentGraph, openEntityTool);
    if (graphModal && !graphModal.classList.contains("hidden")) renderLargeGraph();
  }

  async function renderLargeGraph() {
    const el = document.getElementById("entity-graph-large");
    if (!el) return;
    let graph = currentGraph;
    try {
      const res = await fetch("/api/projects/context");
      if (res.ok) {
        const ctx = await res.json();
        if (ctx.graph) graph = ctx.graph;
      }
    } catch {
      /* keep last known graph */
    }
    window.OsintEntityGraph?.render(el, graph, (entity) => {
      closeGraphModal();
      openEntityTool(entity);
    });
  }

  function openGraphModal() {
    if (!graphModal) return;
    graphModal.classList.remove("hidden");
    // Called directly (not via requestAnimationFrame): the dock has a fixed
    // height so its size is available immediately, and headless browsers may
    // never fire rAF for an offscreen page.
    renderLargeGraph();
  }

  function closeGraphModal() {
    graphModal?.classList.add("hidden");
  }

  graphExpand?.addEventListener("click", openGraphModal);
  closeGraph?.addEventListener("click", closeGraphModal);
  graphBackdrop?.addEventListener("click", closeGraphModal);
  window.addEventListener("resize", () => {
    if (graphModal && !graphModal.classList.contains("hidden")) renderLargeGraph();
  });

  /* ---- Investigation canvas. Notes and entity layout are persisted in SQLite. ---- */

  let boardView = { x: 0, y: 0, scale: 1 };
  let boardDrag = null;
  let boardAnnotations = [];
  let showHiddenEntities = false;
  let boardPersistedState = { positions: {}, hidden: [] };
  let boardSaveTimer = null;
  let drawingTool = "select";
  let drawingElements = [];
  let drawingGesture = null;
  let selectedDrawingId = null;
  let drawingUndoStack = [];
  let drawingRedoStack = [];
  let drawingSaveTimer = null;

  const socialHosts = ["facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com", "tiktok.com", "github.com", "reddit.com", "youtube.com", "pinterest.com", "mastodon", "threads.net"];

  function readBoardState() {
    return boardPersistedState;
  }

  function writeBoardState(mutator) {
    mutator(boardPersistedState);
    clearTimeout(boardSaveTimer);
    boardSaveTimer = setTimeout(() => fetch("/api/projects/canvas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(boardPersistedState),
    }), 250);
  }

  async function loadCanvasState() {
    const res = await fetch("/api/projects/canvas");
    boardPersistedState = res.ok ? await res.json() : { positions: {}, hidden: [] };
  }

  function drawingSnapshot() {
    return JSON.stringify(drawingElements);
  }

  function updateDrawingHistoryButtons() {
    if (boardUndo) boardUndo.disabled = drawingUndoStack.length === 0;
    if (boardRedo) boardRedo.disabled = drawingRedoStack.length === 0;
    if (boardDeleteDrawing) boardDeleteDrawing.disabled = !selectedDrawingId;
  }

  function persistDrawings() {
    clearTimeout(drawingSaveTimer);
    drawingSaveTimer = setTimeout(() => fetch("/api/projects/canvas/drawings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elements: drawingElements }),
    }), 250);
  }

  function commitDrawingChange(before) {
    if (before === drawingSnapshot()) return;
    drawingUndoStack.push(before);
    if (drawingUndoStack.length > 100) drawingUndoStack.shift();
    drawingRedoStack = [];
    persistDrawings();
    updateDrawingHistoryButtons();
  }

  function svgDrawingElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function drawingPath(element) {
    return (element.points || []).map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  }

  function renderDrawings() {
    if (!boardDrawings) return;
    boardDrawings.innerHTML = "";
    drawingElements.forEach((element) => {
      let shape;
      if (element.type === "pencil") shape = svgDrawingElement("path", { d: drawingPath(element) });
      if (element.type === "rectangle") shape = svgDrawingElement("rect", {
        x: Math.min(element.x1, element.x2), y: Math.min(element.y1, element.y2),
        width: Math.abs(element.x2 - element.x1), height: Math.abs(element.y2 - element.y1), rx: 3,
      });
      if (element.type === "arrow") {
        const group = svgDrawingElement("g");
        const line = svgDrawingElement("line", { x1: element.x1, y1: element.y1, x2: element.x2, y2: element.y2 });
        line.classList.add("drawing-element");
        const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1);
        const size = 12;
        const points = [[element.x2, element.y2], [element.x2 - size * Math.cos(angle - 0.5), element.y2 - size * Math.sin(angle - 0.5)], [element.x2 - size * Math.cos(angle + 0.5), element.y2 - size * Math.sin(angle + 0.5)]];
        const head = svgDrawingElement("polygon", { points: points.map((p) => p.join(",")).join(" ") });
        head.classList.add("drawing-element"); head.style.fill = "var(--text)";
        group.append(line, head); shape = group;
      }
      if (element.type === "text") {
        shape = svgDrawingElement("text", { x: element.x1, y: element.y1 });
        shape.textContent = element.text || "";
      }
      if (!shape) return;
      shape.dataset.drawingId = element.id;
      shape.classList.add("drawing-element");
      if (element.id === selectedDrawingId) shape.classList.add("drawing-selected");
      boardDrawings.appendChild(shape);
    });
    updateDrawingHistoryButtons();
  }

  function boardPoint(event) {
    const rect = boardCanvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left - boardView.x) / boardView.scale, y: (event.clientY - rect.top - boardView.y) / boardView.scale };
  }

  function setDrawingTool(tool) {
    drawingTool = tool;
    selectedDrawingId = null;
    document.querySelectorAll("[data-board-tool]").forEach((button) => button.classList.toggle("is-active", button.dataset.boardTool === tool));
    boardDrawings?.classList.toggle("is-drawing", !["select", "eraser"].includes(tool));
    renderDrawings();
  }

  async function loadDrawings() {
    const response = await fetch("/api/projects/canvas/drawings");
    drawingElements = response.ok ? await response.json() : [];
    drawingUndoStack = []; drawingRedoStack = []; selectedDrawingId = null;
    renderDrawings();
  }

  function entityCategory(entity) {
    const value = String(entity.value || "").toLowerCase();
    if ((entity.type === "url" || entity.type === "username") && socialHosts.some((host) => value.includes(host))) return "social";
    const categories = { person: "identity", username: "social", email: "contact", phone: "contact", domain: "web", url: "web", ip: "network" };
    return categories[entity.type] || "other";
  }

  const boardCategoryLabels = {
    identity: "Identite", social: "Reseaux sociaux", contact: "Coordonnees",
    web: "Presence web", network: "Infrastructure", other: "Autres elements", notes: "Notes"
  };

  function defaultEntityPosition(entity, index, categoryIndex) {
    const columns = 3;
    return { x: 70 + categoryIndex * 310, y: 100 + (index % 8) * 92 + Math.floor(index / 8) * 30 * columns };
  }

  function applyBoardTransform() {
    if (!boardWorld) return;
    boardWorld.style.transform = `translate(${boardView.x}px, ${boardView.y}px) scale(${boardView.scale})`;
    boardZoomLabel.textContent = `${Math.round(boardView.scale * 100)} %`;
  }

  function setBoardZoom(next, anchor = null) {
    const old = boardView.scale;
    const scale = Math.max(0.45, Math.min(1.8, next));
    if (anchor && old !== scale) {
      boardView.x = anchor.x - ((anchor.x - boardView.x) / old) * scale;
      boardView.y = anchor.y - ((anchor.y - boardView.y) / old) * scale;
    }
    boardView.scale = scale;
    applyBoardTransform();
  }

  function renderBoardLinks() {
    if (!boardLinks || !boardNodes) return;
    boardLinks.innerHTML = "";
    const nodes = Object.fromEntries([...boardNodes.querySelectorAll(".board-entity")].map((el) => [el.dataset.entityId, el]));
    for (const edge of investigationContext?.graph?.edges || []) {
      const from = nodes[edge.from];
      const to = nodes[edge.to];
      if (!from || !to) continue;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", parseFloat(from.style.left) + from.offsetWidth / 2);
      line.setAttribute("y1", parseFloat(from.style.top) + from.offsetHeight / 2);
      line.setAttribute("x2", parseFloat(to.style.left) + to.offsetWidth / 2);
      line.setAttribute("y2", parseFloat(to.style.top) + to.offsetHeight / 2);
      boardLinks.appendChild(line);
    }
  }

  function renderEntityCanvas() {
    if (!boardNodes || !boardGroups) return;
    const state = readBoardState();
    const entities = investigationContext?.top_entities || [];
    const orderedCategories = ["identity", "social", "contact", "web", "network", "other"];
    boardNodes.querySelectorAll(".board-entity").forEach((node) => node.remove());
    boardGroups.innerHTML = "";
    const grouped = Object.groupBy ? Object.groupBy(entities, entityCategory) : entities.reduce((acc, item) => {
      (acc[entityCategory(item)] ||= []).push(item); return acc;
    }, {});
    orderedCategories.forEach((category, categoryIndex) => {
      const items = grouped[category] || [];
      if (!items.length) return;
      const group = document.createElement("section");
      group.className = "board-group";
      group.style.left = `${40 + categoryIndex * 310}px`;
      group.style.top = "48px";
      group.style.height = `${Math.max(150, items.length * 92 + 62)}px`;
      group.innerHTML = `<h4>${boardCategoryLabels[category]}</h4>`;
      boardGroups.appendChild(group);
      items.forEach((entity, index) => {
        if (state.hidden?.includes(entity.id) && !showHiddenEntities) return;
        const position = state.positions?.[entity.id] || defaultEntityPosition(entity, index, categoryIndex);
        const node = document.createElement("article");
        node.className = `board-entity${state.hidden?.includes(entity.id) ? " is-hidden" : ""}`;
        node.dataset.entityId = entity.id;
        node.style.left = `${position.x}px`;
        node.style.top = `${position.y}px`;
        node.innerHTML = `<div class="board-node-bar"><span>${escapeHtml(entity.type || "element")}</span><button type="button" class="board-hide" title="Masquer">×</button></div><strong>${escapeHtml(entity.value || "")}</strong><small>${escapeHtml(entity.source_tool || "Projet")}</small>`;
        boardNodes.appendChild(node);
      });
    });
    requestAnimationFrame(renderBoardLinks);
  }

  function renderNote(note) {
    const el = document.createElement("div");
    el.className = "board-note";
    el.dataset.id = note.id;
    el.style.left = `${note.x || 0}px`;
    el.style.top = `${note.y || 0}px`;
    el.innerHTML = `
      <div class="board-note-bar">
        <button type="button" class="board-note-del" title="Supprimer">&times;</button>
      </div>
      <textarea class="board-note-text" maxlength="2000" placeholder="Note..." spellcheck="false"></textarea>
    `;
    el.querySelector(".board-note-text").value = note.text || "";
    boardNodes.appendChild(el);
    return el;
  }

  async function loadBoard() {
    if (!boardCanvas) return;
    await Promise.all([loadCanvasState(), loadDrawings()]);
    const res = await fetch("/api/projects/annotations");
    if (!res.ok) return;
    boardAnnotations = await res.json();
    boardNodes.querySelectorAll(".board-note").forEach((node) => node.remove());
    boardAnnotations.forEach(renderNote);
    renderEntityCanvas();
  }

  function saveNote(id, body) {
    return fetch(`/api/projects/annotations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  boardAdd?.addEventListener("click", async () => {
    const n = boardNodes.querySelectorAll(".board-note").length;
    const offset = (n % 6) * 26;
    const res = await fetch("/api/projects/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "", x: 40 + offset, y: 40 + offset }),
    });
    if (!res.ok) return;
    const note = await res.json();
    const el = renderNote(note);
    el.querySelector(".board-note-text")?.focus();
  });

  boardCanvas?.addEventListener("input", (event) => {
    const ta = event.target.closest(".board-note-text");
    if (!ta) return;
    const id = ta.closest(".board-note").dataset.id;
    clearTimeout(ta._saveTimer);
    ta._saveTimer = setTimeout(() => saveNote(id, { text: ta.value }), 500);
  });

  // Flush immediately when a note loses focus, so nothing is lost if the user
  // closes the board or navigates away right after typing.
  boardCanvas?.addEventListener("focusout", (event) => {
    const ta = event.target.closest(".board-note-text");
    if (!ta) return;
    clearTimeout(ta._saveTimer);
    saveNote(ta.closest(".board-note").dataset.id, { text: ta.value });
  });

  boardCanvas?.addEventListener("click", async (event) => {
    const del = event.target.closest(".board-note-del");
    if (!del) return;
    const note = del.closest(".board-note");
    await fetch(`/api/projects/annotations/${note.dataset.id}`, { method: "DELETE" });
    note.remove();
  });

  boardCanvas?.addEventListener("pointerdown", (event) => {
    if (drawingTool !== "select" || event.target.closest(".drawing-element")) return;
    const bar = event.target.closest(".board-note-bar, .board-node-bar");
    if (bar && !event.target.closest("button")) {
      const note = bar.closest(".board-note, .board-entity");
      const noteRect = note.getBoundingClientRect();
      boardDrag = { kind: "node", note, dx: event.clientX - noteRect.left, dy: event.clientY - noteRect.top };
      note.classList.add("dragging");
      bar.setPointerCapture(event.pointerId);
      return;
    }
    if (!event.target.closest(".board-note, .board-entity, .board-toolbar")) {
      boardDrag = { kind: "pan", startX: event.clientX, startY: event.clientY, originX: boardView.x, originY: boardView.y };
      boardCanvas.setPointerCapture(event.pointerId);
    }
  });

  boardCanvas?.addEventListener("pointermove", (event) => {
    if (!boardDrag) return;
    if (boardDrag.kind === "pan") {
      boardView.x = boardDrag.originX + event.clientX - boardDrag.startX;
      boardView.y = boardDrag.originY + event.clientY - boardDrag.startY;
      applyBoardTransform(); return;
    }
    const canvasRect = boardCanvas.getBoundingClientRect();
    const x = Math.max(0, (event.clientX - canvasRect.left - boardView.x) / boardView.scale - boardDrag.dx / boardView.scale);
    const y = Math.max(0, (event.clientY - canvasRect.top - boardView.y) / boardView.scale - boardDrag.dy / boardView.scale);
    boardDrag.note.style.left = `${x}px`;
    boardDrag.note.style.top = `${y}px`;
  });

  boardCanvas?.addEventListener("pointerup", () => {
    if (!boardDrag) return;
    if (boardDrag.kind === "pan") { boardDrag = null; return; }
    const note = boardDrag.note;
    boardDrag = null;
    note.classList.remove("dragging");
    const position = { x: parseFloat(note.style.left) || 0, y: parseFloat(note.style.top) || 0 };
    if (note.classList.contains("board-note")) saveNote(note.dataset.id, position);
    else writeBoardState((state) => { (state.positions ||= {})[note.dataset.entityId] = position; });
    renderBoardLinks();
  });

  boardCanvas?.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const rect = boardCanvas.getBoundingClientRect();
    setBoardZoom(boardView.scale + (event.deltaY < 0 ? 0.1 : -0.1), { x: event.clientX - rect.left, y: event.clientY - rect.top });
  }, { passive: false });

  boardCanvas?.addEventListener("click", (event) => {
    const hide = event.target.closest(".board-hide");
    if (!hide) return;
    const id = hide.closest(".board-entity").dataset.entityId;
    writeBoardState((state) => {
      const hidden = new Set(state.hidden || []);
      if (hidden.has(id)) hidden.delete(id);
      else hidden.add(id);
      state.hidden = [...hidden];
    });
    renderEntityCanvas();
  });

  boardZoomIn?.addEventListener("click", () => setBoardZoom(boardView.scale + 0.1));
  boardZoomOut?.addEventListener("click", () => setBoardZoom(boardView.scale - 0.1));
  boardFit?.addEventListener("click", () => { boardView = { x: 0, y: 0, scale: 0.8 }; applyBoardTransform(); });
  boardShowHidden?.addEventListener("click", () => { showHiddenEntities = !showHiddenEntities; boardShowHidden.classList.toggle("is-active", showHiddenEntities); renderEntityCanvas(); });

  document.querySelectorAll("[data-board-tool]").forEach((button) => button.addEventListener("click", () => setDrawingTool(button.dataset.boardTool)));

  boardDrawings?.addEventListener("pointerdown", (event) => {
    const targetId = event.target.closest("[data-drawing-id]")?.dataset.drawingId;
    if (drawingTool === "select" && targetId) {
      event.preventDefault(); event.stopPropagation();
      const element = drawingElements.find((item) => item.id === targetId);
      if (!element) return;
      selectedDrawingId = targetId;
      drawingGesture = { element, before: drawingSnapshot(), kind: "move", start: boardPoint(event), original: JSON.parse(JSON.stringify(element)) };
      boardDrawings.setPointerCapture(event.pointerId); renderDrawings(); return;
    }
    if (["select", "eraser"].includes(drawingTool)) return;
    event.preventDefault(); event.stopPropagation();
    const point = boardPoint(event);
    const before = drawingSnapshot();
    if (drawingTool === "text") {
      const textValue = window.prompt("Texte a ajouter");
      if (textValue?.trim()) {
        drawingElements.push({ id: crypto.randomUUID(), type: "text", x1: point.x, y1: point.y, text: textValue.trim().slice(0, 500) });
        commitDrawingChange(before); renderDrawings();
      }
      return;
    }
    const element = { id: crypto.randomUUID(), type: drawingTool, x1: point.x, y1: point.y, x2: point.x, y2: point.y };
    if (drawingTool === "pencil") element.points = [point];
    drawingElements.push(element);
    drawingGesture = { element, before };
    boardDrawings.setPointerCapture(event.pointerId);
    renderDrawings();
  });

  boardDrawings?.addEventListener("pointermove", (event) => {
    if (!drawingGesture) return;
    const point = boardPoint(event);
    if (drawingGesture.kind === "move") {
      const dx = point.x - drawingGesture.start.x, dy = point.y - drawingGesture.start.y;
      const original = drawingGesture.original, element = drawingGesture.element;
      if (original.points) element.points = original.points.map((item) => ({ x: item.x + dx, y: item.y + dy }));
      else {
        element.x1 = original.x1 + dx; element.y1 = original.y1 + dy;
        if (original.x2 !== undefined) { element.x2 = original.x2 + dx; element.y2 = original.y2 + dy; }
      }
      renderDrawings(); return;
    }
    if (drawingGesture.element.type === "pencil") drawingGesture.element.points.push(point);
    else { drawingGesture.element.x2 = point.x; drawingGesture.element.y2 = point.y; }
    renderDrawings();
  });

  boardDrawings?.addEventListener("pointerup", (event) => {
    if (!drawingGesture) return;
    boardDrawings.releasePointerCapture(event.pointerId);
    const gesture = drawingGesture; drawingGesture = null;
    commitDrawingChange(gesture.before); renderDrawings();
  });

  boardDrawings?.addEventListener("click", (event) => {
    const shape = event.target.closest(".drawing-element");
    const id = shape?.dataset.drawingId || shape?.closest("[data-drawing-id]")?.dataset.drawingId;
    if (!id) return;
    event.stopPropagation();
    if (drawingTool === "eraser") {
      const before = drawingSnapshot();
      drawingElements = drawingElements.filter((element) => element.id !== id);
      selectedDrawingId = null; commitDrawingChange(before);
    } else if (drawingTool === "select") selectedDrawingId = id;
    renderDrawings();
  });

  function deleteSelectedDrawing() {
    if (!selectedDrawingId) return;
    const before = drawingSnapshot();
    drawingElements = drawingElements.filter((element) => element.id !== selectedDrawingId);
    selectedDrawingId = null; commitDrawingChange(before); renderDrawings();
  }

  boardDeleteDrawing?.addEventListener("click", deleteSelectedDrawing);
  boardUndo?.addEventListener("click", () => {
    if (!drawingUndoStack.length) return;
    drawingRedoStack.push(drawingSnapshot());
    drawingElements = JSON.parse(drawingUndoStack.pop()); selectedDrawingId = null;
    persistDrawings(); renderDrawings();
  });
  boardRedo?.addEventListener("click", () => {
    if (!drawingRedoStack.length) return;
    drawingUndoStack.push(drawingSnapshot());
    drawingElements = JSON.parse(drawingRedoStack.pop()); selectedDrawingId = null;
    persistDrawings(); renderDrawings();
  });
  window.addEventListener("keydown", (event) => {
    if (boardModal?.classList.contains("hidden")) return;
    if ((event.key === "Delete" || event.key === "Backspace") && !event.target.matches("input, textarea")) deleteSelectedDrawing();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      (event.shiftKey ? boardRedo : boardUndo)?.click();
    }
  });

  function openBoardModal() {
    if (!boardModal) return;
    boardModal.classList.remove("hidden");
    boardView = { x: 0, y: 0, scale: 0.8 };
    applyBoardTransform();
    loadBoard();
  }
  function closeBoardModal() {
    boardModal?.classList.add("hidden");
  }
  openBoard?.addEventListener("click", openBoardModal);
  closeBoard?.addEventListener("click", closeBoardModal);
  boardBackdrop?.addEventListener("click", closeBoardModal);

  function appendChatMessage(message) {
    chatMessages.querySelector(".muted")?.remove();
    const item = document.createElement("div");
    item.className = `chat-message ${message.role === "user" ? "is-user" : "is-assistant"}`;
    const label = message.role === "user" ? "Vous" : "Assistant";
    item.innerHTML = `<strong>${label}</strong><p>${escapeHtml(message.content || message.text || "")}</p>`;
    chatMessages.appendChild(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendToolSuggestion(suggestion) {
    if (!suggestion) return;
    const item = document.createElement("div");
    item.className = "chat-message is-assistant";
    item.innerHTML = `<strong>Recherche proposee</strong><p>${escapeHtml(suggestion.rationale || "")}</p><p><strong>${escapeHtml(suggestion.tool_name)}</strong>: ${escapeHtml(suggestion.target)}</p>`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary btn-sm";
    button.textContent = "Confirmer et preparer";
    button.addEventListener("click", async () => {
      button.disabled = true;
      const response = await fetch(`/api/projects/chat/tool-actions/${encodeURIComponent(suggestion.action_id)}/confirm`, { method: "POST" });
      if (!response.ok) { button.textContent = "Confirmation impossible"; return; }
      const action = await response.json();
      pendingAiActionId = action.action_id;
      await openCliPrompt(action.tool_id);
      runTarget.value = action.target;
      button.textContent = "Recherche preparee";
    });
    item.appendChild(button);
    chatMessages.appendChild(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function loadChat() {
    const [settingsRes, messagesRes] = await Promise.all([
      fetch("/api/projects/ai/settings"), fetch("/api/projects/chat")
    ]);
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      chatApiKey.value = settings.api_key || "";
      chatModel.value = settings.model || "openai/gpt-4.1-mini";
      chatWeb.checked = Boolean(settings.web_search);
    }
    if (messagesRes.ok) {
      const data = await messagesRes.json();
      const messages = Array.isArray(data) ? data : data.messages || [];
      chatMessages.innerHTML = "";
      if (!messages.length) chatMessages.innerHTML = '<p class="muted">Posez une question sur les elements du projet.</p>';
      messages.forEach(appendChatMessage);
    }
  }

  chatSettingsToggle?.addEventListener("click", () => chatSettingsForm.classList.toggle("hidden"));
  chatSettingsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await fetch("/api/projects/ai/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: chatApiKey.value.trim(), model: chatModel.value.trim(), web_search: chatWeb.checked })
    });
    if (response.ok) chatSettingsForm.classList.add("hidden");
    else alert("Impossible d'enregistrer les reglages de l'assistant.");
  });

  chatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = chatInput.value.trim();
    if (!content) return;
    appendChatMessage({ role: "user", content });
    chatInput.value = "";
    const button = chatForm.querySelector("button");
    button.disabled = true;
    const response = await fetch("/api/projects/chat", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: content, web_search: chatWeb.checked })
    });
    if (response.ok) {
      const data = await response.json();
      const answer = data.message || data;
      appendChatMessage(answer);
      const suggestionResponse = await fetch("/api/projects/chat/tool-suggestion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, answer: answer.content || answer.text || "" })
      });
      if (suggestionResponse.ok) appendToolSuggestion((await suggestionResponse.json()).suggestion);
    } else {
      appendChatMessage({ role: "assistant", content: "La reponse n'a pas pu etre generee. Verifiez les reglages OpenRouter." });
    }
    button.disabled = false;
  });

  openBoard?.addEventListener("click", loadChat);

  function fillTargetSuggestions(items = []) {
    targetSuggestions.innerHTML = "";
    for (const item of items) {
      const opt = document.createElement("option");
      opt.value = item.value;
      opt.label = `${item.type}: ${item.value}`;
      targetSuggestions.appendChild(opt);
    }
  }

  async function loadContext() {
    const res = await fetch("/api/projects/context");
    if (!res.ok) return;
    investigationContext = await res.json();
    ctxSubject.value = investigationContext.subject_name || activeProject?.name || "";
    const primary = investigationContext.primary || {};
    ctxPrimary.value =
      primary.username ||
      primary.email ||
      primary.person ||
      primary.domain ||
      primary.phone ||
      primary.url ||
      "";
    renderEntityList(investigationContext.top_entities || []);
    fillTargetSuggestions(investigationContext.top_entities || []);
    renderContextGraph(investigationContext.graph || { nodes: [], edges: [] });
  }

  async function saveContextFields() {
    const res = await fetch("/api/projects/context", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_name: ctxSubject.value.trim(),
        primary_target: ctxPrimary.value.trim(),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Impossible d'enregistrer le contexte");
      return;
    }
    investigationContext = await res.json();
    renderEntityList(investigationContext.top_entities || []);
    fillTargetSuggestions(investigationContext.top_entities || []);
    renderContextGraph(investigationContext.graph || { nodes: [], edges: [] });
  }

  async function suggestTargetForTool(toolId) {
    const res = await fetch(`/api/projects/context/suggest?tool_id=${encodeURIComponent(toolId)}`);
    if (!res.ok) return "";
    const data = await res.json();
    fillTargetSuggestions(data.suggestions || []);
    return data.target || "";
  }

  async function refreshAutocomplete(query) {
    const q = query.trim();
    const url = q
      ? `/api/projects/context/autocomplete?q=${encodeURIComponent(q)}`
      : "/api/projects/context/autocomplete";
    const res = await fetch(url);
    if (!res.ok) return;
    const items = await res.json();
    fillTargetSuggestions(items);
  }

  async function loadProjectList() {
    const res = await fetch("/api/projects");
    const projects = await res.json();
    projectList.innerHTML = "";
    projectListEmpty.classList.toggle("hidden", projects.length > 0);
    for (const p of projects) {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="project-list-item">
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <p>${escapeHtml(p.description || "Sans description")}</p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-open-id="${escapeHtml(p.id)}">Ouvrir</button>
        </div>
      `;
      projectList.appendChild(li);
    }
  }

  projectList?.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-open-id]");
    if (!btn) return;
    const res = await fetch(`/api/projects/${btn.dataset.openId}/open`, { method: "POST" });
    if (!res.ok) return;
    showWorkspace(await res.json());
  });

  createProjectForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("project-name").value.trim();
    const description = document.getElementById("project-description").value.trim();
    const primaryTarget = document.getElementById("project-primary-target").value.trim();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, primary_target: primaryTarget, subject_name: name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Impossible de creer le projet");
      return;
    }
    createProjectForm.reset();
    showWorkspace(await res.json());
  });

  btnLeaveProject?.addEventListener("click", async () => {
    await fetch("/api/projects/close", { method: "POST" });
    showGate();
  });

  openFiles?.addEventListener("click", () => {
    const url = activeProject?.id
      ? `/files/files/${encodeURIComponent(activeProject.id)}/uploads/`
      : "/files/";
    window.open(url, "_blank", "noopener");
  });

  async function initApp() {
    const res = await fetch("/api/projects/active");
    const data = await res.json();
    if (data.active && data.project) {
      showWorkspace(data.project);
    } else {
      showGate();
    }
  }

  function openSystemModal(title, desc, mode = "log") {
    systemModalTitle.textContent = title;
    systemModalDesc.textContent = desc;
    systemOutput.innerHTML = "";
    resetFormWrap.classList.toggle("hidden", mode !== "reset");
    systemModal.classList.remove("hidden");
  }

  function closeSystemModalFn() {
    systemModal.classList.add("hidden");
  }

  closeSystemModal?.addEventListener("click", closeSystemModalFn);
  systemBackdrop?.addEventListener("click", closeSystemModalFn);

  async function streamSystemEndpoint(url, body = null) {
    const response = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      appendTo(systemOutput, err.error || "Erreur", "error");
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        if (!part.trim().startsWith("data: ")) continue;
        try {
          const payload = JSON.parse(part.trim().slice(6));
          if (payload.line) appendTo(systemOutput, payload.line);
          if (payload.type === "done") {
            appendTo(systemOutput, `Termine (code ${payload.exit_code})`, payload.exit_code === 0 ? "success" : "error");
          }
        } catch {
          /* ignore */
        }
      }
    }
  }

  btnUpdate?.addEventListener("click", async () => {
    openSystemModal(
      "Mettre a jour le systeme",
      "Mise a jour pip, Go, git et templates dans le conteneur. Les images Docker externes (Seekr, Web-Check) ne sont pas mises a jour ici."
    );
    await streamSystemEndpoint("/api/system/update");
  });

  btnReset?.addEventListener("click", () => {
    resetConfirm.value = "";
    openSystemModal(
      "Reinitialiser",
      "Efface les donnees du projet actif ou de tous les projets. Les outils installes ne sont pas desinstalles.",
      "reset"
    );
  });

  confirmReset?.addEventListener("click", async () => {
    const scope = document.querySelector('input[name="reset-scope"]:checked')?.value || "project";
    systemOutput.innerHTML = "";
    appendTo(systemOutput, "Reinitialisation...", "muted");
    const res = await fetch("/api/system/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, confirm: resetConfirm.value.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      appendTo(systemOutput, data.error || "Erreur", "error");
      return;
    }
    appendTo(systemOutput, scope === "all" ? "Tous les projets effaces." : "Projet reinitialise.", "success");
    resetFormWrap.classList.add("hidden");
    if (scope === "all") {
      setTimeout(showGate, 800);
    } else if (data.project) {
      showWorkspace(data.project);
      loadContext();
    }
  });

  function filterTools() {
    const query = toolSearch.value.trim().toLowerCase();
    document.querySelectorAll(".tool-group").forEach((group) => {
      const catMatch = activeCategory === "all" || group.dataset.group === activeCategory;
      const catName = (group.querySelector(".tool-group-title")?.textContent || "").toLowerCase();
      let anyVisible = false;
      group.querySelectorAll(".tool-card").forEach((card) => {
        const text = `${card.dataset.toolName} ${card.textContent} ${catName}`.toLowerCase();
        const matchesSearch = !query || text.includes(query);
        const show = catMatch && matchesSearch;
        card.classList.toggle("hidden", !show);
        if (show) anyVisible = true;
      });
      group.classList.toggle("hidden", !anyVisible);
    });
  }

  function renderHelpSection(title, content, asCode = false) {
    if (!content || (Array.isArray(content) && !content.length)) return "";
    if (Array.isArray(content)) {
      const items = content.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      return `<section class="help-section"><h4>${escapeHtml(title)}</h4><ul>${items}</ul></section>`;
    }
    const body = asCode
      ? `<code class="help-example">${escapeHtml(content)}</code>`
      : `<p>${escapeHtml(content)}</p>`;
    return `<section class="help-section"><h4>${escapeHtml(title)}</h4>${body}</section>`;
  }

  function showHelp(toolId, toolName = "") {
    const help = window.TOOLS_HELP?.[toolId];
    if (!help) return;
    helpTitle.textContent = toolName || toolId;
    helpSummary.textContent = help.summary || "";
    helpBody.innerHTML = [
      renderHelpSection("Qu'est-ce que c'est ?", help.what),
      renderHelpSection("Comment l'utiliser", help.usage),
      renderHelpSection("Exemple", help.example, true),
      renderHelpSection("Cible attendue", help.target),
      renderHelpSection("Conseils", help.tips),
      help.github
        ? `<section class="help-section"><h4>Projet open source</h4><a class="help-link" href="${escapeHtml(help.github)}" target="_blank" rel="noopener">${escapeHtml(help.github)}</a></section>`
        : "",
    ].join("");
    helpModal.classList.remove("hidden");
  }

  function closeHelpModal() {
    helpModal.classList.add("hidden");
  }

  closeHelp?.addEventListener("click", closeHelpModal);
  helpBackdrop?.addEventListener("click", closeHelpModal);
  runHelpBtn?.addEventListener("click", () => {
    if (currentToolId) showHelp(currentToolId, runToolName.textContent);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!helpModal.classList.contains("hidden")) closeHelpModal();
    if (!systemModal.classList.contains("hidden")) closeSystemModalFn();
    if (graphModal && !graphModal.classList.contains("hidden")) closeGraphModal();
    if (boardModal && !boardModal.classList.contains("hidden")) closeBoardModal();
  });

  function getToolCard(toolId) {
    return document.querySelector(`.tool-card[data-tool-id="${CSS.escape(toolId)}"]`);
  }

  // "port:8090" -> "http://<current-host>:8090/" so apps served on their own
  // host port work whether reached via localhost or a remote address.
  function resolveToolUrl(url) {
    if (url && url.startsWith("port:")) {
      const port = url.slice(5).replace(/\/+$/, "");
      return `${location.protocol}//${location.hostname}:${port}/`;
    }
    return url;
  }

  async function openCliPrompt(toolId, presetTarget = "", options = {}) {
    const card = getToolCard(toolId);
    if (!card) {
      alert("Outil introuvable dans le catalogue.");
      return false;
    }
    if (card.dataset.locked === "1") {
      showHelp(toolId, card.dataset.toolName || "");
      return true;
    }
    if (card.dataset.type === "web") {
      const url = resolveToolUrl(card.dataset.url);
      if (url) window.open(url, "_blank", "noopener");
      return true;
    }
    if (card.dataset.type === "terminal") {
      showXtermPanel(presetTarget || card.dataset.commandHint || "");
      return true;
    }

    currentToolId = toolId;
    runToolName.textContent = card.dataset.toolName;
    runToolDesc.textContent = card.querySelector("p").textContent;
    runTarget.placeholder = card.dataset.placeholder || "cible";
    runTarget.value = presetTarget || "";
    runHelpBtn.classList.remove("hidden");
    showRunPanel();
    dockTerminal();

    if (!presetTarget && !options.skipSuggest) {
      const suggested = await suggestTargetForTool(toolId);
      if (suggested) runTarget.value = suggested;
    }
    if (options.autoRun && runTarget.value.trim()) {
      runForm.requestSubmit();
    } else {
      runTarget.focus();
    }
    return true;
  }

  function openEntityTool(entity) {
    const toolId = entity.suggested_tool?.id || entity.tool?.id;
    const value = entity.value || entity.dataset?.entityValue;
    if (toolId && value) {
      openCliPrompt(toolId, value, { autoRun: true });
      return;
    }
    if (value) {
      ctxPrimary.value = value;
      if (runPanel && !runPanel.classList.contains("hidden")) {
        runTarget.value = value;
        runTarget.focus();
      }
    }
  }

  // Dock the integrated PTY terminal on the right. open() removes the panel's
  // .hidden class; the CSS split layout does the docking. A hint (command) is
  // injected into the live shell.
  function dockTerminal(hint = "") {
    window.OsintTerminal?.open(hint);
  }

  function showRunPanel() {
    runForm.classList.remove("hidden");
    runPanel.classList.remove("hidden");
  }

  // Terminal-only focus (terminal-type tools, "Terminal integre" button).
  function showXtermPanel(hint = "") {
    runPanel.classList.add("hidden");
    dockTerminal(hint);
  }

  openXterm?.addEventListener("click", () => showXtermPanel());
  closeXterm?.addEventListener("click", () => window.OsintTerminal?.close());
  xtermReconnect?.addEventListener("click", () => {
    window.OsintTerminal?.close();
    dockTerminal();
  });

  categoryNav.addEventListener("click", (event) => {
    const btn = event.target.closest(".cat-btn");
    if (!btn) return;
    categoryNav.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    if (activeCategory === "all") {
      sectionTitle.textContent = activeProject?.name || "Espace de travail";
      sectionDesc.textContent = activeProject?.description || "Outils OSINT du projet.";
    } else {
      sectionTitle.textContent = categoryMeta[activeCategory] || activeCategory;
      sectionDesc.textContent = "Outils disponibles dans cette categorie.";
    }
    filterTools();
  });

  toolSearch.addEventListener("input", filterTools);

  btnSaveContext?.addEventListener("click", () => saveContextFields());
  btnRefreshContext?.addEventListener("click", () => loadContext());

  addEntityForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = addEntityValue.value.trim();
    if (!value) return;
    const res = await fetch("/api/projects/context/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Impossible d'ajouter l'entite");
      return;
    }
    addEntityValue.value = "";
    const data = await res.json();
    investigationContext = data.summary;
    renderEntityList(investigationContext.top_entities || []);
    fillTargetSuggestions(investigationContext.top_entities || []);
    renderContextGraph(investigationContext.graph || { nodes: [], edges: [] });
  });

  entityList?.addEventListener("click", (event) => {
    const btn = event.target.closest(".entity-chip");
    if (!btn) return;
    openEntityTool({
      value: btn.dataset.entityValue,
      suggested_tool: btn.dataset.toolId
        ? { id: btn.dataset.toolId, name: btn.dataset.toolName }
        : null,
    });
  });

  runTarget?.addEventListener("input", () => {
    clearTimeout(autocompleteTimer);
    autocompleteTimer = setTimeout(() => refreshAutocomplete(runTarget.value), 200);
  });

  toolsGrid.addEventListener("click", async (event) => {
    if (event.target.closest(".help-btn")) {
      const btn = event.target.closest(".help-btn");
      const card = btn.closest(".tool-card");
      showHelp(btn.dataset.helpId, card?.dataset.toolName || "");
      return;
    }
    const launchBtn = event.target.closest(".launch-btn");
    if (!launchBtn) return;
    const card = launchBtn.closest(".tool-card");
    if (!card) return;

    if (card.dataset.locked === "1") {
      showHelp(card.dataset.toolId, card.dataset.toolName || "");
      return;
    }

    if (card.dataset.type === "web") {
      const url = resolveToolUrl(card.dataset.url);
      if (url === "/terminal/") {
        showXtermPanel();
        return;
      }
      if (url) window.open(url, "_blank", "noopener");
      return;
    }
    if (card.dataset.type === "terminal") {
      showXtermPanel(card.dataset.commandHint || "");
      return;
    }

    await openCliPrompt(card.dataset.toolId);
  });

  closePanel.addEventListener("click", () => {
    stopCurrentJob();
    runPanel.classList.add("hidden");
    runHelpBtn.classList.add("hidden");
  });

  function stopCurrentJob() {
    if (currentJobId) {
      fetch(`/api/stop/${currentJobId}`, { method: "POST" }).catch(() => {});
      currentJobId = null;
    }
    runSubmit.classList.remove("hidden");
    runStop.classList.add("hidden");
  }

  runStop.addEventListener("click", () => {
    stopCurrentJob();
    appendLine("[ARRETE] Execution interrompue.", "error");
  });

  runForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentToolId) return;
    const target = runTarget.value.trim();
    if (!target) {
      runTarget.focus();
      return;
    }

    clearTerminal();
    terminalOutput.classList.remove("hidden");
    runSubmit.classList.add("hidden");
    runStop.classList.remove("hidden");
    appendLine(`Lancement de ${runToolName.textContent}...`, "muted");

    const runPayload = { target };
    if (pendingAiActionId) runPayload.action_id = pendingAiActionId;
    const response = await fetch(`/api/run/${currentToolId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(runPayload),
    });
    pendingAiActionId = null;

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Erreur inconnue" }));
      if (response.status === 401) {
        showGate();
        return;
      }
      appendLine(err.error || "Impossible de lancer la commande", "error");
      stopCurrentJob();
      return;
    }
    if (!response.body) {
      appendLine("Flux de sortie indisponible.", "error");
      stopCurrentJob();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const block of events) {
          const raw = block.split("\n").find((line) => line.startsWith("data:"));
          if (!raw) continue;
          const data = JSON.parse(raw.slice(5).trim());
          if (data.type === "start") {
            currentJobId = data.job_id;
            appendLine(`$ ${data.command}`, "success");
          } else if (data.type === "output") {
            appendLine(data.line);
          } else if (data.type === "done") {
            appendLine(`Execution terminee, code ${data.exit_code}.`, data.exit_code === 0 ? "success" : "error");
          } else if (data.type === "context") {
            appendLine(`${data.discovered_count || 0} nouvel element trouve.`, "success");
          }
        }
      }
    } catch (error) {
      appendLine(`Flux interrompu: ${error.message}`, "error");
    } finally {
      currentJobId = null;
      runSubmit.classList.remove("hidden");
      runStop.classList.add("hidden");
      await Promise.all([loadHistory(), loadContext()]);
      if (boardModal && !boardModal.classList.contains("hidden")) await loadBoard();
    }
  });

  async function loadHistory() {
    const res = await fetch("/api/history");
    if (!res.ok) return;
    const items = await res.json();
    historyList.innerHTML = "";
    if (!items.length) {
      historyList.innerHTML = "<li><span class='meta'>Aucun scan enregistre.</span></li>";
      return;
    }
    for (const item of items) {
      const li = document.createElement("li");
      const status =
        item.exit_code === null || item.exit_code === undefined
          ? "terminal integre"
          : `code ${item.exit_code}`;
      li.innerHTML = `
        <div class="meta">${escapeHtml(item.tool_name)} · ${escapeHtml(item.started_at)} · ${escapeHtml(status)}</div>
        <div class="cmd">${escapeHtml(item.command)}</div>
        <div class="preview">${escapeHtml(item.output_preview || "")}</div>
      `;
      historyList.appendChild(li);
    }
  }

  toggleHistory.addEventListener("click", async () => {
    historyPanel.classList.toggle("hidden");
    if (!historyPanel.classList.contains("hidden")) await loadHistory();
  });

  clearHistory.addEventListener("click", async () => {
    await fetch("/api/history", { method: "DELETE" });
    await loadHistory();
  });

  initApp();
})();
