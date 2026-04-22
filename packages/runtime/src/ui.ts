import type { ChatMessage, CompositionData, ProviderId, ScoreResult, UserKeyConfig } from "./types";
import { DEFAULT_MODELS, clearUserKey, readUserKey, writeUserKey } from "./user-key";

const CSS = `
:host, .wrap { all: initial; }
.wrap {
  display: block;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #111;
  font-size: 15px;
  line-height: 1.5;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  max-width: 720px;
  margin: 0 auto;
  box-sizing: border-box;
}
.scenario {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
  white-space: pre-wrap;
}
.scenario strong { display: block; margin-bottom: 4px; color: #111; }
.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.context-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #4f46e5;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: #374151;
  white-space: pre-wrap;
}
.context-card .title {
  display: block;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #4f46e5;
  margin-bottom: 4px;
}
.log {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 420px;
  overflow-y: auto;
  padding: 4px 2px;
  margin-bottom: 12px;
}
.msg {
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 85%;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.msg.user { background: #eef2ff; align-self: flex-end; }
.msg.assistant { background: #f5f5f5; border: 1px solid #e5e7eb; align-self: flex-start; }
.msg.system-note { background: transparent; color: #666; font-size: 12px; text-align: center; align-self: center; }
.row { display: flex; gap: 8px; }
.input {
  flex: 1;
  font: inherit;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  resize: vertical;
  min-height: 40px;
  max-height: 120px;
  box-sizing: border-box;
}
.input:focus { outline: 2px solid #2563eb; outline-offset: -1px; border-color: transparent; }
button {
  font: inherit;
  cursor: pointer;
  border-radius: 8px;
  padding: 8px 14px;
  border: 1px solid transparent;
}
button:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-ghost { background: transparent; color: #555; border-color: #ccc; }
.btn-ghost:hover:not(:disabled) { background: #f5f5f5; }
.foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px; color: #666; }
.results { margin-top: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }
.results h3 { margin: 0 0 8px 0; font-size: 16px; }
.score { font-size: 22px; font-weight: 600; color: #111; }
.obj { margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee; }
.obj-title { font-weight: 600; font-size: 14px; }
.obj-score { color: #555; font-size: 13px; }
.obj-tip { margin-top: 4px; font-size: 13px; color: #333; }
.privacy { margin-top: 10px; font-size: 11px; color: #888; text-align: center; }
.spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #ccc; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: -2px; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }
.byo-link { background: none; border: none; padding: 0; color: #2563eb; font: inherit; cursor: pointer; text-decoration: underline; }
.byo-link:hover { color: #1d4ed8; }
.byo-panel { margin-top: 8px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; font-size: 13px; color: #333; display: none; }
.byo-panel.open { display: block; }
.byo-panel label { display: block; font-size: 12px; color: #555; margin: 6px 0 2px; }
.byo-panel select, .byo-panel input { font: inherit; font-size: 13px; width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
.byo-panel .row-buttons { display: flex; gap: 8px; margin-top: 10px; }
.byo-panel .row-buttons button { padding: 6px 12px; font-size: 13px; }
.byo-panel .hint { margin-top: 8px; font-size: 11px; color: #666; }
`;

export interface UIHandlers {
  onSend: (text: string) => Promise<void> | void;
  onEnd: () => Promise<void> | void;
  onUserKeyChange: () => void;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  cloudflare: "Cloudflare",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

export class UI {
  private root: ShadowRoot;
  private log: HTMLElement;
  private input: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private endBtn: HTMLButtonElement;
  private foot: HTMLElement;
  private wrap: HTMLElement;
  private handlers: UIHandlers;
  private byoLink!: HTMLButtonElement;
  private byoPanel!: HTMLElement;
  private byoProvider!: HTMLSelectElement;
  private byoApiKey!: HTMLInputElement;
  private byoAccountRow!: HTMLElement;
  private byoAccountId!: HTMLInputElement;
  private byoModel!: HTMLInputElement;

  constructor(host: HTMLElement, comp: CompositionData, handlers: UIHandlers) {
    this.handlers = handlers;
    host.innerHTML = "";
    this.root = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = CSS;
    this.root.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    this.wrap = wrap;

    const scenario = document.createElement("div");
    scenario.className = "scenario";
    const who = comp.persona.name
      ? `${comp.persona.name}${comp.persona.role ? `, ${comp.persona.role}` : ""}`
      : "your practice partner";
    scenario.innerHTML = `<strong>Role-play: ${escapeHtml(who)}</strong>${escapeHtml(comp.scenario)}`;
    wrap.appendChild(scenario);

    if (comp.contextBlocks.length) {
      const grid = document.createElement("div");
      grid.className = "context-grid";
      for (const b of comp.contextBlocks) {
        const card = document.createElement("div");
        card.className = "context-card";
        const titleHtml = b.title ? `<span class="title">${escapeHtml(b.title)}</span>` : "";
        card.innerHTML = `${titleHtml}${escapeHtml(b.body)}`;
        grid.appendChild(card);
      }
      wrap.appendChild(grid);
    }

    this.log = document.createElement("div");
    this.log.className = "log";
    wrap.appendChild(this.log);

    const row = document.createElement("div");
    row.className = "row";
    this.input = document.createElement("textarea");
    this.input.className = "input";
    this.input.placeholder = "Type your message… (Enter to send, Shift+Enter for newline)";
    this.input.rows = 2;
    this.sendBtn = document.createElement("button");
    this.sendBtn.className = "btn-primary";
    this.sendBtn.textContent = "Send";
    row.appendChild(this.input);
    row.appendChild(this.sendBtn);
    wrap.appendChild(row);

    this.foot = document.createElement("div");
    this.foot.className = "foot";
    const turnInfo = document.createElement("span");
    turnInfo.className = "turn-info";
    turnInfo.textContent = "Turn 0";
    this.endBtn = document.createElement("button");
    this.endBtn.className = "btn-ghost";
    this.endBtn.textContent = "End conversation";
    this.foot.appendChild(turnInfo);
    this.byoLink = document.createElement("button");
    this.byoLink.className = "byo-link";
    this.byoLink.type = "button";
    this.foot.appendChild(this.byoLink);
    this.foot.appendChild(this.endBtn);
    wrap.appendChild(this.foot);

    this.byoPanel = this.buildByoPanel();
    wrap.appendChild(this.byoPanel);

    const privacy = document.createElement("div");
    privacy.className = "privacy";
    privacy.textContent = "Conversations are not stored. This role-play runs locally in your browser.";
    wrap.appendChild(privacy);

    this.root.appendChild(wrap);

    this.sendBtn.addEventListener("click", () => this.handleSend());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    this.endBtn.addEventListener("click", () => this.handleEnd());
    this.byoLink.addEventListener("click", () => this.toggleByoPanel());
    this.refreshByoLabel();
  }

  private buildByoPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "byo-panel";

    const providerLabel = document.createElement("label");
    providerLabel.textContent = "Provider";
    this.byoProvider = document.createElement("select");
    for (const p of ["cloudflare", "openai", "anthropic"] as ProviderId[]) {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = PROVIDER_LABELS[p];
      this.byoProvider.appendChild(opt);
    }
    panel.appendChild(providerLabel);
    panel.appendChild(this.byoProvider);

    const keyLabel = document.createElement("label");
    keyLabel.textContent = "API key";
    this.byoApiKey = document.createElement("input");
    this.byoApiKey.type = "password";
    this.byoApiKey.autocomplete = "off";
    this.byoApiKey.spellcheck = false;
    panel.appendChild(keyLabel);
    panel.appendChild(this.byoApiKey);

    this.byoAccountRow = document.createElement("div");
    const acctLabel = document.createElement("label");
    acctLabel.textContent = "Cloudflare account ID";
    this.byoAccountId = document.createElement("input");
    this.byoAccountId.type = "text";
    this.byoAccountId.autocomplete = "off";
    this.byoAccountId.spellcheck = false;
    this.byoAccountRow.appendChild(acctLabel);
    this.byoAccountRow.appendChild(this.byoAccountId);
    panel.appendChild(this.byoAccountRow);

    const modelLabel = document.createElement("label");
    modelLabel.textContent = "Model (optional)";
    this.byoModel = document.createElement("input");
    this.byoModel.type = "text";
    this.byoModel.autocomplete = "off";
    this.byoModel.spellcheck = false;
    panel.appendChild(modelLabel);
    panel.appendChild(this.byoModel);

    const buttons = document.createElement("div");
    buttons.className = "row-buttons";
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn-primary";
    saveBtn.type = "button";
    saveBtn.textContent = "Save";
    const clearBtn = document.createElement("button");
    clearBtn.className = "btn-ghost";
    clearBtn.type = "button";
    clearBtn.textContent = "Clear";
    buttons.appendChild(saveBtn);
    buttons.appendChild(clearBtn);
    panel.appendChild(buttons);

    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent =
      "Stored in this browser only. Overrides the baked key for this session. Use a rate-limited key.";
    panel.appendChild(hint);

    this.byoProvider.addEventListener("change", () => this.updateByoPanelForProvider());
    saveBtn.addEventListener("click", () => this.saveByoKey());
    clearBtn.addEventListener("click", () => this.clearByoKey());

    this.loadByoPanelFromStorage();
    return panel;
  }

  private loadByoPanelFromStorage() {
    const stored = readUserKey();
    if (stored) {
      this.byoProvider.value = stored.provider;
      this.byoApiKey.value = stored.apiKey;
      this.byoAccountId.value = stored.accountId ?? "";
      this.byoModel.value = stored.model ?? "";
    }
    this.updateByoPanelForProvider();
  }

  private updateByoPanelForProvider() {
    const p = this.byoProvider.value as ProviderId;
    this.byoAccountRow.style.display = p === "cloudflare" ? "" : "none";
    this.byoModel.placeholder = DEFAULT_MODELS[p];
  }

  private toggleByoPanel() {
    this.byoPanel.classList.toggle("open");
  }

  private saveByoKey() {
    const provider = this.byoProvider.value as ProviderId;
    const apiKey = this.byoApiKey.value.trim();
    if (!apiKey) {
      this.showError("API key is required.");
      return;
    }
    const cfg: UserKeyConfig = {
      provider,
      apiKey,
      accountId:
        provider === "cloudflare" ? this.byoAccountId.value.trim() || undefined : undefined,
      model: this.byoModel.value.trim() || undefined,
    };
    if (provider === "cloudflare" && !cfg.accountId) {
      this.showError("Cloudflare account ID is required.");
      return;
    }
    writeUserKey(cfg);
    this.byoPanel.classList.remove("open");
    this.refreshByoLabel();
    this.handlers.onUserKeyChange();
  }

  private clearByoKey() {
    clearUserKey();
    this.byoApiKey.value = "";
    this.byoAccountId.value = "";
    this.byoModel.value = "";
    this.byoPanel.classList.remove("open");
    this.refreshByoLabel();
    this.handlers.onUserKeyChange();
  }

  private refreshByoLabel() {
    const stored = readUserKey();
    if (stored) {
      this.byoLink.textContent = `Using your own ${PROVIDER_LABELS[stored.provider]} key · change`;
    } else {
      this.byoLink.textContent = "Use my own key ▾";
    }
  }

  private async handleSend() {
    const text = this.input.value.trim();
    if (!text) return;
    this.input.value = "";
    await this.handlers.onSend(text);
  }

  private async handleEnd() {
    this.endBtn.disabled = true;
    this.sendBtn.disabled = true;
    this.input.disabled = true;
    await this.handlers.onEnd();
  }

  setTurn(n: number, cap?: number) {
    const info = this.foot.querySelector(".turn-info") as HTMLElement;
    info.textContent = cap ? `Turn ${n} / ${cap}` : `Turn ${n}`;
  }

  setBusy(busy: boolean) {
    this.sendBtn.disabled = busy;
    this.input.disabled = busy;
  }

  disableInput(reason?: string) {
    this.sendBtn.disabled = true;
    this.input.disabled = true;
    this.endBtn.disabled = true;
    if (reason) this.addSystemNote(reason);
  }

  appendMessage(msg: ChatMessage) {
    if (msg.role === "system") return;
    const div = document.createElement("div");
    div.className = `msg ${msg.role}`;
    div.textContent = msg.content;
    this.log.appendChild(div);
    this.log.scrollTop = this.log.scrollHeight;
  }

  addSystemNote(text: string) {
    const div = document.createElement("div");
    div.className = "msg system-note";
    div.textContent = text;
    this.log.appendChild(div);
    this.log.scrollTop = this.log.scrollHeight;
  }

  showTyping(on: boolean) {
    const existing = this.log.querySelector(".typing");
    if (on) {
      if (existing) return;
      const div = document.createElement("div");
      div.className = "msg assistant typing";
      div.innerHTML = `<span class="spinner"></span>thinking…`;
      this.log.appendChild(div);
      this.log.scrollTop = this.log.scrollHeight;
    } else if (existing) {
      existing.remove();
    }
  }

  showError(message: string) {
    this.addSystemNote(`Error: ${message}`);
  }

  showResults(result: ScoreResult) {
    const el = document.createElement("div");
    el.className = "results";
    const objHtml = result.perObjective
      .map(
        (o) => `
      <div class="obj">
        <div class="obj-title">${escapeHtml(o.id)}</div>
        <div class="obj-score">Score: ${o.score} / ${o.maxScore}</div>
        <div class="obj-tip">${escapeHtml(o.improvement)}</div>
      </div>`,
      )
      .join("");
    el.innerHTML = `
      <h3>Session score</h3>
      <div class="score">${result.total} / ${result.maxTotal}</div>
      <div class="obj-tip">${escapeHtml(result.summary)}</div>
      ${objHtml}
    `;
    this.wrap.appendChild(el);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
