(() => {
  const NS = "http://www.w3.org/2000/svg";

  function layoutNodes(nodes, edges, width, height) {
    const count = nodes.length;
    if (!count) return;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.34;
    nodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
      node.x = cx + radius * Math.cos(angle);
      node.y = cy + radius * Math.sin(angle);
    });

    const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
    for (let pass = 0; pass < 8; pass += 1) {
      for (const edge of edges) {
        const from = byId[edge.from];
        const to = byId[edge.to];
        if (!from || !to) continue;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = (dist - 42) * 0.04;
        from.x += (dx / dist) * pull;
        from.y += (dy / dist) * pull;
        to.x -= (dx / dist) * pull;
        to.y -= (dy / dist) * pull;
      }
      for (const node of nodes) {
        node.x = Math.max(18, Math.min(width - 18, node.x));
        node.y = Math.max(18, Math.min(height - 18, node.y));
      }
    }
  }

  function truncate(value, max) {
    const s = String(value || "");
    return s.length > max ? `${s.slice(0, max - 1)}…` : s;
  }

  function render(container, graph, onNodeClick) {
    if (!container) return;
    container.innerHTML = "";
    const nodes = graph?.nodes || [];
    const edges = graph?.edges || [];
    if (!nodes.length) {
      container.classList.add("entity-graph-empty");
      container.textContent = "Aucun lien pour le moment.";
      return;
    }
    container.classList.remove("entity-graph-empty");

    const width = container.clientWidth || 248;
    const height = container.clientHeight || 168;
    // Scale node size and label legibility to the available space.
    const large = height >= 280;
    const radius = large ? 13 : 7;
    const fontSize = large ? 13 : 9;
    const labelMax = large ? 28 : 12;
    layoutNodes(nodes, edges, width, height);

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(height));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Graphe des entites du projet");

    const edgeLayer = document.createElementNS(NS, "g");
    edgeLayer.setAttribute("class", "graph-edges");
    for (const edge of edges) {
      const from = nodes.find((node) => node.id === edge.from);
      const to = nodes.find((node) => node.id === edge.to);
      if (!from || !to) continue;
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", String(from.x));
      line.setAttribute("y1", String(from.y));
      line.setAttribute("x2", String(to.x));
      line.setAttribute("y2", String(to.y));
      line.setAttribute("class", "graph-edge");
      edgeLayer.appendChild(line);
    }
    svg.appendChild(edgeLayer);

    const nodeLayer = document.createElementNS(NS, "g");
    nodeLayer.setAttribute("class", "graph-nodes");
    for (const node of nodes) {
      const group = document.createElementNS(NS, "g");
      group.setAttribute("class", "graph-node");
      group.setAttribute("tabindex", "0");
      group.dataset.entityId = node.id;
      group.dataset.entityType = node.type;
      group.dataset.entityValue = node.value;
      if (node.tool?.id) group.dataset.toolId = node.tool.id;

      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      circle.setAttribute("r", String(radius));
      group.appendChild(circle);

      const label = document.createElementNS(NS, "title");
      const toolHint = node.tool?.name ? ` · ${node.tool.name}` : "";
      label.textContent = `${node.type}: ${node.value}${toolHint}`;
      group.appendChild(label);

      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", String(node.x));
      text.setAttribute("y", String(node.y + radius + fontSize + 1));
      text.setAttribute("text-anchor", "middle");
      // Inline style beats the stylesheet's font-size, so the large view scales.
      text.style.fontSize = `${fontSize}px`;
      if (large) text.style.fill = "var(--text)";
      text.textContent = truncate(node.value || node.label, labelMax);
      group.appendChild(text);

      const activate = (event) => {
        event.preventDefault();
        onNodeClick?.({
          id: node.id,
          type: node.type,
          value: node.value,
          suggested_tool: node.tool,
        });
      };
      group.addEventListener("click", activate);
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") activate(event);
      });

      nodeLayer.appendChild(group);
    }
    svg.appendChild(nodeLayer);
    container.appendChild(svg);
  }

  window.OsintEntityGraph = { render };
})();
