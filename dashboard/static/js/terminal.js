(() => {
  // ttyd 1.7 message opcodes are ASCII characters, not numeric 0/1:
  //   client -> server: INPUT '0' (0x30), RESIZE_TERMINAL '1' (0x31)
  //   server -> client: OUTPUT '0' (0x30), SET_WINDOW_TITLE '1' (0x31)
  const INPUT = 0x30;
  const RESIZE = 0x31;
  const OUTPUT = 0x30;
  const TITLE = 0x31;

  class EmbeddedTerminal {
    constructor(containerId, panelId) {
      this.container = document.getElementById(containerId);
      this.panel = document.getElementById(panelId);
      this.term = null;
      this.fitAddon = null;
      this.ws = null;
      this.onResizeBound = () => this.handleResize();
    }

    isOpen() {
      return this.panel && !this.panel.classList.contains("hidden");
    }

    open(hint = "") {
      if (!this.panel || !this.container) return;
      this.panel.classList.remove("hidden");
      const wasConnected = this.ws && this.ws.readyState === WebSocket.OPEN;
      this.connect();
      if (hint) {
        if (wasConnected) {
          this.sendInput(`${hint}\n`);
        } else {
          this.pendingHint = hint;
        }
      }
      requestAnimationFrame(() => {
        this.handleResize();
        this.term?.focus();
      });
    }

    close() {
      this.disconnect();
      this.panel?.classList.add("hidden");
      this.pendingHint = "";
    }

    connect() {
      if (this.ws || typeof Terminal === "undefined") return;

      this.container.innerHTML = "";
      this.term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
        theme: {
          background: "#06070a",
          foreground: "#e8ebf0",
          cursor: "#6aa5ff",
          selectionBackground: "#243041",
        },
        allowProposedApi: true,
      });

      this.fitAddon = new (window.FitAddon?.FitAddon || window.FitAddon)();
      this.term.loadAddon(this.fitAddon);
      this.term.open(this.container);
      this.fitAddon.fit();

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/terminal/ws`;
      this.ws = new WebSocket(wsUrl, ["tty"]);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        const dims = this.fitAddon.proposeDimensions() || { cols: 80, rows: 24 };
        this.ws.send(
          JSON.stringify({
            AuthToken: "",
            columns: dims.cols,
            rows: dims.rows,
          })
        );

        this.term.onData((data) => {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
          const payload = new Uint8Array(data.length + 1);
          payload[0] = INPUT;
          for (let i = 0; i < data.length; i += 1) {
            payload[i + 1] = data.charCodeAt(i);
          }
          this.ws.send(payload);
        });

        if (this.pendingHint) {
          const hint = this.pendingHint;
          this.pendingHint = "";
          window.setTimeout(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.sendInput(`${hint}\n`);
            }
          }, 400);
        }
      };

      this.ws.onmessage = (event) => {
        const raw = new Uint8Array(event.data);
        if (!raw.length) return;
        const cmd = raw[0];
        const data = raw.slice(1);
        if (cmd === OUTPUT) {
          this.term.write(data);
        } else if (cmd === TITLE) {
          const title = new TextDecoder().decode(data);
          if (title) document.title = `OSINT Labs · ${title}`;
        }
      };

      this.ws.onclose = () => {
        this.term?.writeln("\r\n\r\n[Connexion fermee]");
      };

      this.ws.onerror = () => {
        this.term?.writeln("\r\n\r\n[Erreur WebSocket terminal]");
      };

      window.addEventListener("resize", this.onResizeBound);
    }

    sendInput(text) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const payload = new Uint8Array(text.length + 1);
      payload[0] = INPUT;
      for (let i = 0; i < text.length; i += 1) {
        payload[i + 1] = text.charCodeAt(i);
      }
      this.ws.send(payload);
    }

    handleResize() {
      if (!this.fitAddon || !this.term) return;
      this.fitAddon.fit();
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const dims = this.fitAddon.proposeDimensions();
      if (!dims) return;
      const encoded = new TextEncoder().encode(
        JSON.stringify({ columns: dims.cols, rows: dims.rows })
      );
      const payload = new Uint8Array(encoded.length + 1);
      payload[0] = RESIZE;
      payload.set(encoded, 1);
      this.ws.send(payload);
    }

    disconnect() {
      window.removeEventListener("resize", this.onResizeBound);
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      if (this.term) {
        this.term.dispose();
        this.term = null;
      }
      this.fitAddon = null;
      if (this.container) {
        this.container.innerHTML = "";
      }
      document.title = "OSINT Labs";
    }
  }

  window.OsintTerminal = new EmbeddedTerminal("xterm-container", "xterm-panel");
})();
