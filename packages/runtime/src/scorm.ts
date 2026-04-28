import type { ResultSnapshot } from "./types";

type ScormValue = string | number;

interface Scorm12Api {
  LMSInitialize(arg: string): string;
  LMSFinish(arg: string): string;
  LMSGetValue(key: string): string;
  LMSSetValue(key: string, value: string): string;
  LMSCommit(arg: string): string;
  LMSGetLastError(): string;
  LMSGetErrorString(errorCode: string): string;
  LMSGetDiagnostic(errorCode: string): string;
}

export interface ScormAdapter {
  available: boolean;
  initialize(): void;
  finish(): void;
  setIncomplete(): void;
  reportResult(snapshot: ResultSnapshot): void;
}

export function createScorm12Adapter(enabled: boolean): ScormAdapter {
  const api = enabled ? findScorm12Api() : null;
  let initialized = false;
  let finished = false;

  function setValue(key: string, value: ScormValue): void {
    if (!api || !initialized || finished) return;
    api.LMSSetValue(key, String(value));
  }

  function commit(): void {
    if (!api || !initialized || finished) return;
    api.LMSCommit("");
  }

  return {
    available: !!api,
    initialize() {
      if (!api || initialized || finished) return;
      initialized = api.LMSInitialize("") === "true";
      if (initialized) {
        setValue("cmi.core.lesson_status", "incomplete");
        commit();
      }
    },
    finish() {
      if (!api || !initialized || finished) return;
      commit();
      api.LMSFinish("");
      finished = true;
    },
    setIncomplete() {
      setValue("cmi.core.lesson_status", "incomplete");
      commit();
    },
    reportResult(snapshot) {
      if (!api || !initialized || finished) return;
      setValue("cmi.core.lesson_status", "completed");
      setValue("cmi.core.score.raw", snapshot.score.percent);
      setValue("cmi.core.score.min", 0);
      setValue("cmi.core.score.max", 100);
      setValue("cmi.core.session_time", formatScorm12Time(snapshot.session.durationSeconds));

      snapshot.score.perObjective.forEach((objective, index) => {
        const max = Math.max(0, objective.maxScore);
        const pct = max > 0 ? Math.round((objective.score / max) * 100) : 0;
        setValue(`cmi.objectives.${index}.id`, objective.id);
        setValue(`cmi.objectives.${index}.score.raw`, Math.max(0, Math.min(100, pct)));
        setValue(`cmi.objectives.${index}.score.min`, 0);
        setValue(`cmi.objectives.${index}.score.max`, 100);
        setValue(`cmi.objectives.${index}.status`, "completed");
      });

      setValue("cmi.suspend_data", compactSuspendData(snapshot));
      commit();
    },
  };
}

export function findScorm12Api(): Scorm12Api | null {
  const maxDepth = 8;
  let win: Window | null = window;
  for (let i = 0; win && i < maxDepth; i += 1) {
    const api = getApi(win);
    if (api) return api;
    if (win.parent === win) break;
    win = win.parent;
  }

  win = window.opener;
  for (let i = 0; win && i < maxDepth; i += 1) {
    const api = getApi(win);
    if (api) return api;
    if (win.parent === win) break;
    win = win.parent;
  }

  return null;
}

function getApi(win: Window): Scorm12Api | null {
  try {
    const candidate = (win as Window & { API?: unknown }).API;
    if (candidate && typeof (candidate as Scorm12Api).LMSInitialize === "function") {
      return candidate as Scorm12Api;
    }
  } catch {
    return null;
  }
  return null;
}

export function formatScorm12Time(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(4, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function compactSuspendData(snapshot: ResultSnapshot): string {
  const compact = {
    sid: snapshot.session.id,
    cid: snapshot.composition.id,
    status: snapshot.score.status,
    score: snapshot.score.percent,
    duration: snapshot.session.durationSeconds,
    completed: snapshot.completedObjectives,
    events: snapshot.events.slice(-40).map((event) => ({
      t: event.type,
      at: event.at,
      d: event.data,
    })),
  };
  const text = JSON.stringify(compact);
  return text.length <= 3800 ? text : text.slice(0, 3799);
}
