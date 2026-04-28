import type {
  ChatMessage,
  CompositionData,
  Difficulty,
  ProviderId,
  ResultSnapshot,
  ScoreResult,
  UserKeyConfig,
} from "./types";
import { DEFAULT_MODELS, clearUserKey, readUserKey, writeUserKey } from "./user-key";

interface SpeechRecognitionAlt {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionAlt;
const TTS_KEY = "edu-role-play:tts";

const CSS = `
:host { all: initial; display: block; height: 100vh; overflow: hidden; }
* { box-sizing: border-box; }
.root {
  font-family: 'Outfit', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: oklch(16% 0.015 255);
  font-size: 14px;
  line-height: 1.5;
  background: oklch(97.5% 0.006 240);
  height: 100%;
  min-height: 560px;
  display: flex;
  flex-direction: column;
}
button { font: inherit; cursor: pointer; border: none; background: none; color: inherit; padding: 0; }
button:disabled { cursor: default; }
textarea { font: inherit; color: inherit; }

/* Scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: oklch(82% 0.008 240); border-radius: 99px; }

/* Toolbar */
.toolbar {
  display: flex; align-items: center; gap: 10px; padding: 11px 16px;
  border-bottom: 1px solid oklch(92% 0.006 240); background: white;
  flex-wrap: wrap; flex-shrink: 0;
}
.toolbar-who { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.toolbar-who .name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toolbar-who .sub { font-size: 11.5px; color: oklch(55% 0.01 255); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chip-diff {
  padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600;
  text-transform: capitalize; flex-shrink: 0;
}
.chip-diff.easy { background: oklch(95% 0.06 155); color: oklch(42% 0.18 155); }
.chip-diff.realistic { background: oklch(94% 0.06 255); color: oklch(42% 0.20 255); }
.chip-diff.tough { background: oklch(95% 0.06 30); color: oklch(48% 0.18 30); }
.timer-box { display: flex; align-items: center; gap: 6px; color: oklch(50% 0.01 255); font-size: 12.5px; }
.tbtn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid oklch(90% 0.006 240);
  background: oklch(97.5% 0.006 240);
  display: flex; align-items: center; justify-content: center;
  color: oklch(40% 0.01 255); transition: all 0.12s;
}
.tbtn:hover:not(:disabled) { background: oklch(95% 0.006 240); }
.tbtn:disabled { color: oklch(75% 0.01 255); }
.finish-btn {
  height: 32px; padding: 0 12px; border-radius: 8px;
  background: oklch(52% 0.20 255); color: white;
  font-weight: 600; font-size: 12.5px;
  display: flex; align-items: center; gap: 6px;
  white-space: nowrap; transition: all 0.15s;
}
.finish-btn:disabled { background: oklch(88% 0.006 240); color: oklch(65% 0.01 255); }
/* Avatar */
.avatar {
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; color: white; flex-shrink: 0;
}
.avatar.you { background: oklch(52% 0.20 255); }

/* Chat log */
.chat-area { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 0; position: relative; display: flex; flex-direction: column; justify-content: flex-end; }
.chat-inner {
  max-width: 680px; margin: 0 auto; padding: 0 16px 16px; width: 100%;
  display: flex; flex-direction: column; gap: 14px;
}
.chat-inner.wide { max-width: none; padding: 16px; }

.msg-row { display: flex; gap: 10px; align-items: flex-end; }
.msg-row.user { justify-content: flex-end; }
.msg-col { max-width: 70%; display: flex; flex-direction: column; }
.msg-meta { font-size: 11px; color: oklch(55% 0.01 255); margin-bottom: 4px; padding-left: 2px; }
.bubble {
  padding: 11px 15px; font-size: 14px; line-height: 1.6;
  box-shadow: 0 1px 3px oklch(0% 0 0 / 0.06);
  white-space: pre-wrap; word-wrap: break-word;
}
.bubble.assistant {
  background: white; color: oklch(16% 0.015 255);
  border: 1px solid oklch(92% 0.006 240);
  border-radius: 16px 16px 16px 4px;
}
.bubble.user {
  background: oklch(52% 0.20 255); color: white;
  border-radius: 16px 16px 4px 16px;
}
.tip-inline {
  margin-top: 6px; padding: 8px 12px;
  background: oklch(96% 0.06 155); border: 1px solid oklch(88% 0.12 155);
  border-radius: 10px; font-size: 12.5px; color: oklch(30% 0.14 155); line-height: 1.5;
}
.tip-inline b { font-weight: 600; }
.system-note { text-align: center; padding: 6px 0; }
.system-note span {
  font-size: 12px; color: oklch(55% 0.01 255);
  background: oklch(94% 0.006 240); padding: 4px 12px; border-radius: 99px;
}

/* Typing dots */
.typing {
  padding: 12px 16px; border-radius: 16px 16px 16px 4px;
  background: white; border: 1px solid oklch(92% 0.006 240);
  display: inline-flex; gap: 4px; align-items: center;
}
.typing i {
  display: block; width: 6px; height: 6px; border-radius: 50%;
  background: oklch(70% 0.01 255); animation: bounce 1.2s infinite;
}
.typing i:nth-child(2) { animation-delay: 0.2s; }
.typing i:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid oklch(88% 0 0); border-top-color: oklch(52% 0.20 255);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.spinner.white { border-color: #ffffff44; border-top-color: white; }

/* Input bar */
.input-bar {
  padding: 12px 16px; border-top: 1px solid oklch(92% 0.006 240);
  background: white; flex-shrink: 0;
}
.input-inner { max-width: 680px; margin: 0 auto; display: flex; gap: 8px; align-items: center; }
.input-inner.wide { max-width: none; }
.icon-btn {
  width: 38px; height: 38px; border-radius: 10px;
  border: 1px solid oklch(88% 0.008 240);
  background: oklch(97% 0.006 240);
  display: flex; align-items: center; justify-content: center;
  color: oklch(52% 0.20 255); flex-shrink: 0;
}
.icon-btn:disabled { opacity: 0.5; }
.input-pill {
  flex: 1; border: 1px solid oklch(88% 0.008 240); border-radius: 12px;
  background: oklch(98.5% 0.004 240);
  display: flex; align-items: center; padding: 0 4px 0 12px; min-height: 38px;
}
.input-pill textarea {
  flex: 1; border: none; background: transparent; resize: none;
  outline: none; padding: 6px 0; max-height: 120px; font-size: 14px; line-height: 1.6;
}
.mic-btn {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: oklch(55% 0.01 255); flex-shrink: 0; transition: all 0.15s;
}
.mic-btn.listening { background: oklch(58% 0.18 30); color: white; }
.send-btn {
  width: 38px; height: 38px; border-radius: 10px;
  background: oklch(88% 0.006 240); color: oklch(65% 0.01 255);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: all 0.15s;
}
.send-btn.active { background: oklch(52% 0.20 255); color: white; }

/* Hint toast */
.hint-toast {
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  background: oklch(16% 0.015 255); color: white; border-radius: 14px;
  padding: 12px 18px; font-size: 13.5px; line-height: 1.55;
  max-width: 400px; width: calc(100% - 40px);
  box-shadow: 0 8px 32px oklch(0% 0 0 / 0.2); z-index: 50;
  display: flex; gap: 10px; align-items: flex-start;
}
.hint-toast button { color: oklch(70% 0.01 255); flex-shrink: 0; padding-top: 1px; }

/* Split layout sidebar */
.main-row { display: flex; flex: 1; min-height: 0; }
.sidebar {
  width: 320px; flex-shrink: 0; background: white;
  border-right: 1px solid oklch(92% 0.006 240);
  display: flex; flex-direction: column; padding: 20px; gap: 16px;
  overflow-y: auto; min-height: 0;
}
.sidebar h5 {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: oklch(55% 0.01 255); margin-bottom: 10px;
}
.counterpart { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.counterpart .who-name { font-weight: 600; font-size: 14px; }
.counterpart .who-sub { font-size: 12px; color: oklch(50% 0.01 255); }
.diff-pill {
  padding: 4px 8px; border-radius: 99px; display: inline-block;
  font-size: 11px; font-weight: 600;
  background: oklch(94% 0.006 240); color: oklch(42% 0.01 255);
  text-transform: capitalize;
}
.scenario-card {
  padding: 10px 12px; background: oklch(95% 0.04 255); border-radius: 10px;
  font-size: 12.5px; color: oklch(36% 0.18 255); font-weight: 500; line-height: 1.4;
}
.objective-list { display: flex; flex-direction: column; gap: 6px; }
.objective-item {
  padding: 9px 11px; background: white;
  border: 1px solid oklch(88% 0.008 240);
  border-left: 3px solid oklch(52% 0.20 255);
  border-radius: 0 10px 10px 0;
  font-size: 12.5px; color: oklch(22% 0.012 255); line-height: 1.45;
  display: flex; gap: 8px; align-items: flex-start;
}
.objective-item.done { border-left-color: oklch(52% 0.18 155); background: oklch(98% 0.03 155); }
.objective-item .check {
  width: 16px; height: 16px; border-radius: 50%;
  border: 1.5px solid oklch(78% 0.01 255);
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  margin-top: 1px;
}
.objective-item.done .check { background: oklch(52% 0.18 155); border-color: oklch(52% 0.18 155); color: white; }

/* Chat column */
.chat-col { flex: 1; display: flex; flex-direction: column; background: oklch(97.5% 0.006 240); min-width: 0; min-height: 0; position: relative; }
.mini-top {
  padding: 10px 16px; border-bottom: 1px solid oklch(92% 0.006 240);
  background: white; display: flex; gap: 8px; justify-content: flex-end; align-items: center;
  flex-shrink: 0;
}

/* Debrief modal */
.modal-backdrop {
  position: fixed; inset: 0; background: oklch(0% 0 0 / 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
  font-family: 'Outfit', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: oklch(16% 0.015 255);
}
.modal-card {
  background: white; border-radius: 20px; padding: 32px 28px;
  max-width: 520px; width: 100%; max-height: 80vh; overflow-y: auto;
  box-shadow: 0 24px 64px oklch(0% 0 0 / 0.18);
}
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.modal-eyebrow {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: oklch(55% 0.01 255); margin-bottom: 4px;
}
.modal-title { font-size: 22px; font-weight: 700; margin: 0; }
.score-row { text-align: center; padding: 18px 0 22px; margin-bottom: 20px; border-bottom: 1px solid oklch(93% 0.006 240); }
.score-num { font-size: 52px; font-weight: 700; }
.score-num.good { color: oklch(52% 0.18 155); }
.score-num.ok { color: oklch(52% 0.20 255); }
.score-num.low { color: oklch(58% 0.18 30); }
.score-num span { font-size: 24px; color: oklch(65% 0.01 255); }
.stars { margin-top: 6px; display: flex; justify-content: center; gap: 2px; }
.summary { font-size: 14px; line-height: 1.7; color: oklch(22% 0.012 255); margin-bottom: 16px; }
.per-obj { margin-top: 10px; padding-top: 10px; border-top: 1px solid oklch(93% 0.006 240); }
.per-obj h4 { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.per-obj .sc { font-size: 12.5px; color: oklch(50% 0.01 255); }
.per-obj .tip { font-size: 13px; color: oklch(30% 0.01 255); margin-top: 3px; }
.close-btn {
  margin-top: 24px; width: 100%; padding: 12px 0;
  background: oklch(52% 0.20 255); color: white;
  border-radius: 12px; font-size: 14px; font-weight: 600;
}

/* Briefing modal (single column, sectioned with dividers) */
.modal-card.brief-card { max-width: 640px; padding: 28px 28px 24px; }
.brief-head { margin-bottom: 20px; }
.brief-head .modal-eyebrow { margin-bottom: 6px; }
.brief-head .modal-title { font-size: 26px; }
.brief-divider {
  height: 1px; background: oklch(92% 0.006 240); margin: 0 -28px;
}
.brief-persona-row {
  display: flex; align-items: center; gap: 18px;
  padding: 18px 0;
}
.brief-avatar {
  width: 72px; height: 72px; border-radius: 50%; overflow: hidden;
  flex-shrink: 0;
  background: oklch(97% 0.006 240);
}
.brief-avatar-initials {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 600; font-size: 26px;
}
.brief-persona-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.brief-persona-name { font-size: 18px; font-weight: 700; color: oklch(20% 0.012 255); }
.brief-persona-role { font-size: 14px; color: oklch(50% 0.01 255); line-height: 1.4; }
.brief-scenario-block { padding: 18px 0 20px; }
.brief-label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: oklch(55% 0.01 255); margin-bottom: 12px;
}
.scenario-hero-card {
  padding: 18px 22px;
  background: oklch(96% 0.012 240);
  border-left: 4px solid oklch(52% 0.20 255);
  border-radius: 10px;
  font-size: 14.5px; line-height: 1.8;
  color: oklch(22% 0.012 255);
  font-weight: 400;
}
.scenario-hero-card p { margin: 0 0 12px 0; }
.scenario-hero-card p:last-child { margin-bottom: 0; }
.brief-objectives-block { padding: 18px 0; }
.brief-obj-row {
  display: flex; align-items: center; gap: 12px;
  font-size: 14px; color: oklch(22% 0.012 255); line-height: 1.5;
}
.brief-obj-row b { font-weight: 700; }
.brief-obj-icon { display: inline-flex; align-items: center; flex-shrink: 0; }
.brief-obj-list {
  margin: 10px 0 0 30px; padding: 0;
  display: flex; flex-direction: column; gap: 8px;
  font-size: 14px; color: oklch(22% 0.012 255); line-height: 1.55;
}
.brief-obj-list li { padding-left: 0; }
.modal-card.brief-card .close-btn { margin-top: 18px; padding: 14px 0; font-size: 15px; }
.brief-footer {
  margin-top: 12px; text-align: center;
  font-size: 12.5px; color: oklch(58% 0.01 255);
}

/* BYO panel */
.byo-wrap { position: relative; }
.byo-panel {
  position: absolute; top: 38px; right: 0; z-index: 20;
  background: white; border: 1px solid oklch(92% 0.006 240);
  border-radius: 12px; padding: 14px; width: 280px;
  box-shadow: 0 12px 32px oklch(0% 0 0 / 0.12);
  display: none;
}
.byo-panel.open { display: block; }
.byo-panel label { display: block; font-size: 11px; color: oklch(50% 0.01 255); margin: 8px 0 3px; font-weight: 600; }
.byo-panel select, .byo-panel input {
  font: inherit; width: 100%; padding: 6px 8px; border: 1px solid oklch(88% 0.008 240);
  border-radius: 8px; background: oklch(98.5% 0.004 240);
}
.byo-panel .row-buttons { display: flex; gap: 8px; margin-top: 10px; }
.byo-panel .row-buttons button {
  padding: 7px 12px; font-size: 12.5px; border-radius: 8px; font-weight: 600;
}
.byo-panel .save { background: oklch(52% 0.20 255); color: white; }
.byo-panel .clear { background: oklch(97% 0.006 240); color: oklch(40% 0.01 255); border: 1px solid oklch(90% 0.006 240); }
.byo-panel .hint { margin-top: 8px; font-size: 11px; color: oklch(55% 0.01 255); line-height: 1.4; }
.byo-status { font-size: 11.5px; color: oklch(55% 0.01 255); }

.privacy { text-align: center; padding: 8px 16px; font-size: 11px; color: oklch(60% 0.01 255); background: white; border-top: 1px solid oklch(94% 0.006 240); flex-shrink: 0; }
`;

const PROVIDER_LABELS: Record<ProviderId, string> = {
  cloudflare: "Cloudflare",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const ICONS = {
  mic: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6"/></svg>`,
  micOff: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12M5 10a7 7 0 0 0 12.9 2.23M15 9.34V5a3 3 0 0 0-5.68-1.33M9 9v4a3 3 0 0 0 5.12 2.12M12 19v3M9 22h6"/></svg>`,
  send: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  hint: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-linecap="round" stroke-width="2.5"/></svg>`,
  restart: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`,
  exp: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  close: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  key: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  vol: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  volOff: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  timer: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  check: `<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  starFilled: `<svg width="16" height="16" fill="oklch(75% 0.18 75)" stroke="none" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starEmpty: `<svg width="16" height="16" fill="none" stroke="oklch(75% 0.18 75)" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

export interface UIHandlers {
  onSend: (text: string) => Promise<void> | void;
  onEnd: () => Promise<void> | void;
  onHint: () => Promise<string | null> | string | null;
  onRestart: () => Promise<void> | void;
  onUserKeyChange: () => void;
  onDownloadResults: () => ResultSnapshot | null;
}

interface MsgRecord {
  role: ChatMessage["role"] | "system-note";
  content: string;
  tip?: string;
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s === null) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
function writeStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function avatarColor(name: string): string {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `oklch(72% 0.15 ${hue})`;
}
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}
function fmtTime(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function formatScenarioBody(raw: string): string {
  const text = (raw || "Practice conversation").trim();
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) {
    return `<p>🎯 ${escapeHtml(text)}</p>`;
  }
  const [first, ...rest] = sentences;
  const firstHtml = `<p>🎯 ${escapeHtml(first)}</p>`;
  const restHtml = rest.map((s) => `<p>${escapeHtml(s)}</p>`).join("");
  return firstHtml + restHtml;
}

function parseTip(raw: string): { text: string; tip: string | null } {
  const m = raw.match(/\[TIP:\s*([\s\S]+?)\]/);
  const tip = m ? m[1].trim() : null;
  const text = raw.replace(/\[TIP:[\s\S]*?\]/g, "").trim();
  return { text, tip };
}

export class UI {
  private root: ShadowRoot;
  private handlers: UIHandlers;
  private comp: CompositionData;

  private ttsEnabled: boolean;
  private messages: MsgRecord[] = [];
  private objectivesDone = new Set<string>();
  private busy = false;
  private ended = false;
  private resultsReady = false;
  private turn = 0;
  private turnCap?: number;

  // timer
  private seconds = 0;
  private timerRunning = false;
  private timerId: number | null = null;

  // speech
  private recognition: SpeechRecognitionAlt | null = null;
  private listening = false;

  // containers / nodes
  private host: HTMLElement;
  private stage!: HTMLElement;
  private debriefNode: HTMLElement | null = null;
  private hintNode: HTMLElement | null = null;
  private byoPanelOpen = false;

  constructor(host: HTMLElement, comp: CompositionData, handlers: UIHandlers) {
    this.host = host;
    this.comp = comp;
    this.handlers = handlers;
    this.ttsEnabled = readStored<boolean>(TTS_KEY, true);

    host.innerHTML = "";
    this.root = host.attachShadow({ mode: "open" });

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap";
    this.root.appendChild(fontLink);

    const style = document.createElement("style");
    style.textContent = CSS;
    this.root.appendChild(style);

    this.stage = document.createElement("div");
    this.stage.className = "root";
    this.root.appendChild(this.stage);

    this.render();
  }

  // ─── Public API ──────────────────────────────────────────────────
  setTurn(n: number, cap?: number): void {
    this.turn = n;
    this.turnCap = cap;
  }

  setBusy(busy: boolean): void {
    this.busy = busy;
    this.renderInput();
    this.renderTyping();
  }

  disableInput(reason?: string): void {
    this.ended = true;
    if (reason) this.addSystemNote(reason);
    this.renderInput();
  }

  showRestartAction(): void {
    this.ended = true;
    this.messages = this.messages.map((m) =>
      m.role === "system-note" && m.content === "Scoring the conversation…"
        ? { ...m, content: "Conversation scored." }
        : m,
    );
    this.renderMessages();
    const finish = this.root.querySelector(".finish-btn") as HTMLButtonElement | null;
    if (finish) {
      finish.disabled = false;
      finish.innerHTML = "Restart";
      finish.title = "Restart";
    }
    this.renderInput();
  }

  setResultsReady(ready: boolean): void {
    this.resultsReady = ready;
    this.renderInput();
  }

  getDurationSeconds(): number {
    return this.seconds;
  }

  appendMessage(msg: ChatMessage): void {
    if (msg.role === "system") return;
    if (msg.role === "assistant") {
      const { text, tip } = parseTip(msg.content);
      this.messages.push({ role: "assistant", content: text, tip: tip ?? undefined });
      this.speak(text);
    } else {
      this.messages.push({ role: "user", content: msg.content });
    }
    this.startTimer();
    this.renderMessages();
  }

  addSystemNote(text: string): void {
    this.messages.push({ role: "system-note", content: text });
    this.renderMessages();
  }

  showTyping(on: boolean): void {
    this.busy = on;
    this.renderTyping();
  }

  showError(message: string): void {
    this.addSystemNote(`Error: ${message}`);
  }

  setObjectiveStatus(done: Set<string>): void {
    this.objectivesDone = new Set(done);
    this.renderObjectives();
  }

  resetLog(): void {
    this.messages = [];
    this.objectivesDone.clear();
    this.ended = false;
    this.resultsReady = false;
    this.busy = false;
    this.turn = 0;
    this.seconds = 0;
    this.stopTimer();
    window.speechSynthesis?.cancel();
    this.debriefNode?.remove();
    this.debriefNode = null;
    const finish = this.root.querySelector(".finish-btn") as HTMLButtonElement | null;
    if (finish) {
      finish.disabled = false;
      finish.innerHTML = "Finish";
      finish.title = "Finish & debrief";
    }
    this.renderMessages();
    this.renderObjectives();
    this.renderInput();
    this.updateTimerDisplay();
  }

  showBriefing(): Promise<void> {
    return new Promise<void>((resolve) => {
      const p = this.comp.persona;
      const avatarHtml = p.avatar
        ? `<img src="${escapeHtml(p.avatar)}" alt="${escapeHtml(p.name || "Practice partner")}" style="width:100%;height:100%;object-fit:cover;display:block" />`
        : `<div class="brief-avatar-initials" style="background:${avatarColor(p.name || "?")}">${escapeHtml(initials(p.name || "?"))}</div>`;
      const turnLimit = this.comp.termination.turnLimit ?? 20;
      const minutes = Math.max(5, Math.round(turnLimit / 2));
      const footerLine = `~${minutes} min session · ${escapeHtml(this.comp.difficulty)} difficulty`;
      const targetIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(52% 0.20 255)" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="oklch(52% 0.20 255)"/></svg>`;
      const objectivesBlockHtml = this.comp.objectives.length === 0
        ? ""
        : this.comp.objectives.length === 1
          ? `<div class="brief-obj-row">
               <span class="brief-obj-icon">${targetIcon}</span>
               <span><b>Your objective:</b> ${escapeHtml(this.comp.objectives[0].text || this.comp.objectives[0].id)}</span>
             </div>`
          : `<div class="brief-obj-row">
               <span class="brief-obj-icon">${targetIcon}</span>
               <span><b>Your objectives</b></span>
             </div>
             <ul class="brief-obj-list">${this.comp.objectives
               .map((o) => `<li>${escapeHtml(o.text || o.id)}</li>`)
               .join("")}</ul>`;
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.innerHTML = `
        <div class="modal-card brief-card">
          <div class="brief-head">
            <div class="modal-eyebrow">Role-play briefing</div>
          </div>
          <div class="brief-persona-row">
            <div class="brief-avatar">${avatarHtml}</div>
            <div class="brief-persona-text">
              ${p.name ? `<div class="brief-persona-name">${escapeHtml(p.name)}</div>` : ""}
              ${p.role ? `<div class="brief-persona-role">${escapeHtml(p.role)}</div>` : ""}
            </div>
          </div>
          <div class="brief-divider"></div>
          <div class="brief-scenario-block">
            <div class="brief-label">Scenario</div>
            <div class="scenario-hero-card">${formatScenarioBody(this.comp.scenario)}</div>
          </div>
          ${
            objectivesBlockHtml
              ? `<div class="brief-divider"></div><div class="brief-objectives-block">${objectivesBlockHtml}</div>`
              : ""
          }
          <button class="close-btn brief-ok-btn">Start role-play</button>
          <div class="brief-footer">${footerLine}</div>
        </div>
      `;
      const ok = () => {
        backdrop.remove();
        resolve();
      };
      backdrop.querySelector(".brief-ok-btn")!.addEventListener("click", ok);
      this.root.appendChild(backdrop);
      const btn = backdrop.querySelector(".brief-ok-btn") as HTMLButtonElement | null;
      btn?.focus();
    });
  }

  showResults(result: ScoreResult): void {
    this.debriefNode?.remove();
    const out10 = result.maxTotal > 0 ? Math.round((result.total / result.maxTotal) * 10) : 0;
    const grade = out10 >= 8 ? "good" : out10 >= 6 ? "ok" : "low";
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <div class="modal-eyebrow">Session Complete</div>
            <h2 class="modal-title">Your Debrief</h2>
          </div>
          <button class="modal-close" title="Close">${ICONS.close}</button>
        </div>
        <div class="score-row">
          <div class="score-num ${grade}">${out10}<span>/10</span></div>
          <div class="stars">${Array.from({ length: 10 }, (_, i) =>
            i < out10 ? ICONS.starFilled : ICONS.starEmpty,
          ).join("")}</div>
          <div style="margin-top:8px;font-size:12.5px;color:oklch(55% 0.01 255)">Total ${result.total} / ${result.maxTotal}</div>
        </div>
        <div class="summary">${escapeHtml(result.summary)}</div>
        ${result.perObjective
          .map(
            (o) => `
          <div class="per-obj">
            <h4>${escapeHtml(this.objectiveLabel(o.id))}</h4>
            <div class="sc">Score ${o.score} / ${o.maxScore}</div>
            <div class="tip">${escapeHtml(o.improvement)}</div>
          </div>`,
          )
          .join("")}
        <button class="close-btn">Close & Continue</button>
      </div>
    `;
    const close = () => {
      this.showRestartAction();
      backdrop.remove();
    };
    backdrop.querySelector(".modal-close")!.addEventListener("click", close);
    backdrop.querySelector(".close-btn")!.addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
    this.debriefNode = backdrop;
    this.root.appendChild(backdrop);
    this.showRestartAction();
  }

  // ─── Internal helpers ────────────────────────────────────────────
  private objectiveLabel(id: string): string {
    const o = this.comp.objectives.find((x) => x.id === id);
    return o?.text || humanizeId(id);
  }

  private startTimer(): void {
    if (this.timerRunning) return;
    this.timerRunning = true;
    this.timerId = window.setInterval(() => {
      this.seconds += 1;
      this.updateTimerDisplay();
    }, 1000);
  }

  private stopTimer(): void {
    this.timerRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateTimerDisplay(): void {
    this.root.querySelectorAll(".timer-value").forEach((el) => {
      (el as HTMLElement).textContent = fmtTime(this.seconds);
    });
    this.root.querySelectorAll(".msg-count").forEach((el) => {
      const n = this.messages.filter((m) => m.role !== "system-note").length;
      (el as HTMLElement).textContent = `${n} message${n === 1 ? "" : "s"}`;
    });
  }

  private speak(text: string): void {
    if (!this.ttsEnabled) return;
    const ss = window.speechSynthesis;
    if (!ss) return;
    ss.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    const voices = ss.getVoices();
    const pref =
      voices.find((v) => v.lang === "en-US" && /female/i.test(v.name)) ||
      voices.find((v) => v.lang === "en-US") ||
      voices[0];
    if (pref) utt.voice = pref;
    ss.speak(utt);
  }

  private speechSupported(): boolean {
    return !!(
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );
  }

  private toggleMic(): void {
    if (this.listening) {
      this.recognition?.stop();
      this.listening = false;
      this.renderInput();
      return;
    }
    const SR =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
        .webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) void this.handlers.onSend(text);
    };
    rec.onend = () => {
      this.listening = false;
      this.renderInput();
    };
    rec.onerror = () => {
      this.listening = false;
      this.renderInput();
    };
    this.recognition = rec;
    rec.start();
    this.listening = true;
    this.renderInput();
  }

  private async doHint(): Promise<void> {
    if (this.busy || this.ended) return;
    const btn = this.root.querySelector(".hint-btn") as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
    try {
      const tip = await this.handlers.onHint();
      if (tip) this.showHint(tip);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  private showHint(text: string): void {
    this.hintNode?.remove();
    const overlay = document.createElement("div");
    overlay.className = "hint-toast";
    overlay.innerHTML = `<span style="font-size:16px;flex-shrink:0">💭</span><span>${escapeHtml(
      text,
    )}</span><button title="Dismiss">${ICONS.close}</button>`;
    const close = () => {
      overlay.remove();
      this.hintNode = null;
    };
    overlay.querySelector("button")!.addEventListener("click", close);
    this.hintNode = overlay;
    const area = this.root.querySelector(".chat-col") || this.stage;
    area.appendChild(overlay);
    setTimeout(close, 8000);
  }

  private downloadResults(): void {
    const snapshot = this.handlers.onDownloadResults();
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify(snapshot, null, 2) + "\n"], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const slug = (this.comp.id || "roleplay").toLowerCase().replace(/\s+/g, "-");
    a.download = `${slug}-results.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private handleSend(): void {
    const ta = this.root.querySelector(".input-pill textarea") as HTMLTextAreaElement | null;
    if (!ta) return;
    const text = ta.value.trim();
    if (!text || this.busy || this.ended) return;
    ta.value = "";
    ta.style.height = "auto";
    void this.handlers.onSend(text);
  }

  // ─── Render ──────────────────────────────────────────────────────
  private render(): void {
    this.stage.innerHTML = "";
    this.renderSplit();
    this.updateTimerDisplay();
  }

  private renderToolbar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "toolbar";
    const p = this.comp.persona;
    const whoName = p.name || "Practice partner";
    const sub = p.role || "";
    bar.innerHTML = `
      <div class="toolbar-who">
        <div class="avatar" style="width:36px;height:36px;font-size:13px;background:${avatarColor(whoName)}">${escapeHtml(initials(whoName))}</div>
        <div style="min-width:0">
          <div class="name">${escapeHtml(whoName)}</div>
          <div class="sub">${escapeHtml(sub)}</div>
        </div>
      </div>
      <div class="timer-box">${ICONS.timer}<span class="timer-value">${fmtTime(this.seconds)}</span></div>
      <div style="display:flex;gap:4px;align-items:center">
        <button class="tbtn tts-btn" title="${this.ttsEnabled ? "Mute" : "Unmute"} voice">${
          this.ttsEnabled ? ICONS.vol : ICONS.volOff
        }</button>
        <button class="tbtn restart-btn" title="Restart">${ICONS.restart}</button>
        <button class="tbtn export-btn" title="Download results" disabled>${ICONS.exp}</button>
        <div class="byo-wrap">
          <button class="tbtn byo-btn" title="Use my own API key">${ICONS.key}</button>
        </div>
        <button class="finish-btn" title="${this.ended ? "Restart" : "Finish & debrief"}">${this.ended ? "Restart" : "Finish"}</button>
      </div>
    `;
    this.wireToolbar(bar);
    return bar;
  }

  private wireToolbar(bar: HTMLElement): void {
    bar.querySelector(".tts-btn")!.addEventListener("click", () => {
      this.ttsEnabled = !this.ttsEnabled;
      writeStored(TTS_KEY, this.ttsEnabled);
      if (!this.ttsEnabled) window.speechSynthesis?.cancel();
      const b = bar.querySelector(".tts-btn")!;
      b.innerHTML = this.ttsEnabled ? ICONS.vol : ICONS.volOff;
      (b as HTMLElement).title = `${this.ttsEnabled ? "Mute" : "Unmute"} voice`;
    });
    bar.querySelector(".restart-btn")!.addEventListener("click", () => {
      void this.handlers.onRestart();
    });
    bar.querySelector(".export-btn")!.addEventListener("click", () => this.downloadResults());
    const finish = bar.querySelector(".finish-btn") as HTMLButtonElement;
    finish.addEventListener("click", () => {
      if (this.ended) {
        void this.handlers.onRestart();
        return;
      }
      if (this.messages.filter((m) => m.role !== "system-note").length < 2) return;
      finish.disabled = true;
      finish.innerHTML = `<span class="spinner white"></span> Scoring…`;
      void this.handlers.onEnd();
    });
    bar.querySelector(".byo-btn")!.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleByoPanel(bar);
    });
  }

  private toggleByoPanel(bar: HTMLElement): void {
    const wrap = bar.querySelector(".byo-wrap") as HTMLElement;
    const existing = wrap.querySelector(".byo-panel") as HTMLElement | null;
    if (existing) {
      existing.remove();
      this.byoPanelOpen = false;
      return;
    }
    this.byoPanelOpen = true;
    const panel = this.buildByoPanel();
    wrap.appendChild(panel);
    const closeOnOutside = (ev: MouseEvent) => {
      if (!wrap.contains(ev.target as Node)) {
        panel.remove();
        this.byoPanelOpen = false;
        document.removeEventListener("click", closeOnOutside);
      }
    };
    setTimeout(() => document.addEventListener("click", closeOnOutside), 0);
  }

  private buildByoPanel(): HTMLElement {
    const stored = readUserKey();
    const panel = document.createElement("div");
    panel.className = "byo-panel open";
    panel.innerHTML = `
      <div class="byo-status">${
        stored ? `Using your ${PROVIDER_LABELS[stored.provider]} key` : "Using the bundled key"
      }</div>
      <label>Provider</label>
      <select class="byo-provider">
        ${(["cloudflare", "openai", "anthropic"] as ProviderId[])
          .map(
            (p) =>
              `<option value="${p}"${stored?.provider === p ? " selected" : ""}>${PROVIDER_LABELS[p]}</option>`,
          )
          .join("")}
      </select>
      <label>API key</label>
      <input class="byo-key" type="password" autocomplete="off" spellcheck="false" value="${escapeAttr(stored?.apiKey ?? "")}" />
      <div class="byo-acct-row">
        <label>Cloudflare account ID</label>
        <input class="byo-acct" type="text" autocomplete="off" spellcheck="false" value="${escapeAttr(stored?.accountId ?? "")}" />
      </div>
      <label>Model (optional)</label>
      <input class="byo-model" type="text" autocomplete="off" spellcheck="false" value="${escapeAttr(stored?.model ?? "")}" />
      <div class="row-buttons">
        <button class="save">Save</button>
        <button class="clear">Clear</button>
      </div>
      <div class="hint">Stored in this browser only. Overrides the bundled key for this session.</div>
    `;
    const providerSel = panel.querySelector(".byo-provider") as HTMLSelectElement;
    const acctRow = panel.querySelector(".byo-acct-row") as HTMLElement;
    const modelInput = panel.querySelector(".byo-model") as HTMLInputElement;
    const updateForProvider = () => {
      const p = providerSel.value as ProviderId;
      acctRow.style.display = p === "cloudflare" ? "" : "none";
      modelInput.placeholder = DEFAULT_MODELS[p];
    };
    providerSel.addEventListener("change", updateForProvider);
    updateForProvider();
    panel.addEventListener("click", (e) => e.stopPropagation());

    panel.querySelector(".save")!.addEventListener("click", () => {
      const provider = providerSel.value as ProviderId;
      const apiKey = (panel.querySelector(".byo-key") as HTMLInputElement).value.trim();
      const accountId = (panel.querySelector(".byo-acct") as HTMLInputElement).value.trim();
      const model = (modelInput.value || "").trim();
      if (!apiKey) {
        this.addSystemNote("API key is required.");
        return;
      }
      if (provider === "cloudflare" && !accountId) {
        this.addSystemNote("Cloudflare account ID is required.");
        return;
      }
      const cfg: UserKeyConfig = {
        provider,
        apiKey,
        accountId: provider === "cloudflare" ? accountId : undefined,
        model: model || undefined,
      };
      writeUserKey(cfg);
      panel.remove();
      this.byoPanelOpen = false;
      this.handlers.onUserKeyChange();
      this.addSystemNote(`Now using your ${PROVIDER_LABELS[provider]} key.`);
    });
    panel.querySelector(".clear")!.addEventListener("click", () => {
      clearUserKey();
      panel.remove();
      this.byoPanelOpen = false;
      this.handlers.onUserKeyChange();
      this.addSystemNote("Cleared your key; using the bundled key.");
    });
    return panel;
  }

  private renderSplit(): void {
    const row = document.createElement("div");
    row.className = "main-row";

    // Sidebar
    const side = document.createElement("aside");
    side.className = "sidebar";
    row.appendChild(side);

    // Chat column
    const col = document.createElement("div");
    col.className = "chat-col";
    col.appendChild(this.renderToolbar());
    const area = document.createElement("div");
    area.className = "chat-area";
    const inner = document.createElement("div");
    inner.className = "chat-inner wide";
    inner.dataset.log = "1";
    area.appendChild(inner);
    col.appendChild(area);
    col.appendChild(this.renderInputBarNode(true));
    row.appendChild(col);

    this.stage.appendChild(row);
    this.renderSidebar(side);
    this.renderMessages();
  }

  private renderSidebar(side: HTMLElement): void {
    const p = this.comp.persona;
    side.innerHTML = `
      <div>
        <h5>Scenario</h5>
        <div class="scenario-card">🎯 ${escapeHtml(this.comp.scenario || "Practice conversation")}</div>
      </div>

      <div>
        <h5>Objectives</h5>
        <div class="objective-list" data-objectives="1"></div>
        <div style="margin-top:7px;font-size:11.5px;color:oklch(58% 0.01 255);line-height:1.5">
          Your debrief score reflects how well you hit these.
        </div>
      </div>

      ${
        p.background || p.goals || p.constraints
          ? `<div>
        <h5>Context</h5>
        ${p.background ? `<div style="font-size:12.5px;color:oklch(30% 0.01 255);margin-bottom:6px;line-height:1.5"><b>Background.</b> ${escapeHtml(p.background)}</div>` : ""}
        ${p.goals ? `<div style="font-size:12.5px;color:oklch(30% 0.01 255);margin-bottom:6px;line-height:1.5"><b>Goals.</b> ${escapeHtml(p.goals)}</div>` : ""}
        ${p.constraints ? `<div style="font-size:12.5px;color:oklch(30% 0.01 255);line-height:1.5"><b>Constraints.</b> ${escapeHtml(p.constraints)}</div>` : ""}
      </div>`
          : ""
      }

    `;
    this.renderObjectives();
  }

  private renderObjectives(): void {
    const host = this.root.querySelector("[data-objectives]") as HTMLElement | null;
    if (!host) return;
    if (this.comp.objectives.length === 0) {
      host.innerHTML = `<div style="font-size:12.5px;color:oklch(60% 0.01 255)">No explicit objectives set.</div>`;
      return;
    }
    host.innerHTML = this.comp.objectives
      .map((o) => {
        const done = this.objectivesDone.has(o.id);
        return `<div class="objective-item${done ? " done" : ""}">
          <span class="check">${done ? ICONS.check : ""}</span>
          <span>${escapeHtml(o.text || o.id)}</span>
        </div>`;
      })
      .join("");
  }

  private renderInputBarNode(wide = false): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "input-bar";
    bar.innerHTML = `
      <div class="input-inner${wide ? " wide" : ""}">
        <button class="icon-btn hint-btn" title="Get a hint">${ICONS.hint}</button>
        <div class="input-pill">
          <textarea rows="1" placeholder="Type your message…"></textarea>
          ${this.speechSupported() ? `<button class="mic-btn" title="Voice input">${ICONS.mic}</button>` : ""}
        </div>
        <button class="send-btn" title="Send">${ICONS.send}</button>
      </div>
    `;
    const ta = bar.querySelector("textarea") as HTMLTextAreaElement;
    const sendBtn = bar.querySelector(".send-btn") as HTMLButtonElement;
    const updateSend = () => {
      const has = ta.value.trim().length > 0;
      const enabled = has && !this.busy && !this.ended;
      sendBtn.classList.toggle("active", enabled);
      sendBtn.disabled = !enabled;
    };
    ta.addEventListener("input", () => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
      updateSend();
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    sendBtn.addEventListener("click", () => this.handleSend());
    bar.querySelector(".hint-btn")!.addEventListener("click", () => void this.doHint());
    const mic = bar.querySelector(".mic-btn");
    if (mic) mic.addEventListener("click", () => this.toggleMic());
    return bar;
  }

  private renderInput(): void {
    const ta = this.root.querySelector(".input-pill textarea") as HTMLTextAreaElement | null;
    const sendBtn = this.root.querySelector(".send-btn") as HTMLButtonElement | null;
    const mic = this.root.querySelector(".mic-btn") as HTMLButtonElement | null;
    const hintBtn = this.root.querySelector(".hint-btn") as HTMLButtonElement | null;
    const exportBtn = this.root.querySelector(".export-btn") as HTMLButtonElement | null;
    if (ta) {
      ta.disabled = this.busy || this.ended;
      ta.placeholder = this.listening ? "Listening…" : this.ended ? "Session ended" : "Type your message…";
    }
    if (sendBtn) {
      const has = (ta?.value.trim().length ?? 0) > 0;
      sendBtn.classList.toggle("active", has && !this.busy && !this.ended);
      sendBtn.disabled = !has || this.busy || this.ended;
    }
    if (mic) {
      mic.classList.toggle("listening", this.listening);
      mic.innerHTML = this.listening ? ICONS.micOff : ICONS.mic;
    }
    if (hintBtn) hintBtn.disabled = this.busy || this.ended;
    if (exportBtn) exportBtn.disabled = !this.resultsReady;
  }

  private renderMessages(): void {
    const log = this.root.querySelector("[data-log]") as HTMLElement | null;
    if (!log) return;
    log.innerHTML = this.messages
      .map((m) => {
        if (m.role === "system-note") {
          return `<div class="system-note"><span>${escapeHtml(m.content)}</span></div>`;
        }
        const isUser = m.role === "user";
        const tip = m.tip
          ? `<div class="tip-inline"><b>💡 Tip:</b> ${escapeHtml(m.tip)}</div>`
          : "";
        return `
          <div class="msg-row ${isUser ? "user" : "assistant"}">
            <div class="msg-col">
              <div class="bubble ${isUser ? "user" : "assistant"}">${escapeHtml(m.content)}</div>
              ${tip}
            </div>
          </div>
        `;
      })
      .join("");
    this.renderTyping();
    const area = log.parentElement;
    if (area) area.scrollTop = area.scrollHeight;
    this.updateTimerDisplay();
  }

  private renderTyping(): void {
    const log = this.root.querySelector("[data-log]") as HTMLElement | null;
    if (!log) return;
    const existing = log.querySelector(".typing-row");
    if (this.busy && !this.ended) {
      if (existing) return;
      const personaName = this.comp.persona.name || "Practice partner";
      const row = document.createElement("div");
      row.className = "msg-row assistant typing-row";
      row.innerHTML = `
        <div class="avatar" style="width:32px;height:32px;font-size:12px;background:${avatarColor(personaName)}">${escapeHtml(initials(personaName))}</div>
        <div class="typing"><i></i><i></i><i></i></div>
      `;
      log.appendChild(row);
      const area = log.parentElement;
      if (area) area.scrollTop = area.scrollHeight;
    } else if (existing) {
      existing.remove();
    }
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

function humanizeId(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}
