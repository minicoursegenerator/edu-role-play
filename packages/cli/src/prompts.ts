import { createInterface, type Interface } from "node:readline";
import { stdin, stdout } from "node:process";

// Tiny prompt helpers built on node:readline. We use these instead of
// pulling in @clack/prompts so the CLI stays dependency-light. The
// interface is small on purpose: `ask`, `askSecret`, `select`, `confirm`.

function withRl<T>(fn: (rl: Interface) => Promise<T>): Promise<T> {
  const rl = createInterface({ input: stdin, output: stdout });
  return fn(rl).finally(() => rl.close());
}

export function ask(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  return withRl(
    (rl) =>
      new Promise((resolve) => {
        rl.question(`${question}${suffix} `, (answer) => {
          const trimmed = answer.trim();
          resolve(trimmed || defaultValue || "");
        });
      }),
  );
}

const CTRL_C = String.fromCharCode(3);
const BACKSPACE = String.fromCharCode(127);
const BACKSPACE_ALT = String.fromCharCode(8);

export function askSecret(question: string): Promise<string> {
  // Read with the TTY in raw mode so the terminal itself does no echoing,
  // then write `*` per keystroke. Falls back to plain readline for non-TTY
  // (piped) input. The previous _writeToOutput hack suppressed Node's echo
  // but not the terminal's, so secrets like API keys still leaked.
  return new Promise((resolve, reject) => {
    const tty = stdin as NodeJS.ReadStream & { isRaw?: boolean };
    if (!tty.isTTY || typeof tty.setRawMode !== "function") {
      withRl(
        (rl) =>
          new Promise<void>((done) => {
            rl.question(`${question} `, (answer) => {
              resolve(answer.trim());
              done();
            });
          }),
      ).catch(reject);
      return;
    }
    stdout.write(`${question} `);
    const prevRaw = tty.isRaw === true;
    tty.setRawMode(true);
    tty.resume();
    tty.setEncoding("utf8");
    let buf = "";
    const cleanup = (): void => {
      tty.off("data", onData);
      tty.setRawMode(prevRaw);
      tty.pause();
    };
    const onData = (chunk: string): void => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(buf.trim());
          return;
        }
        if (ch === CTRL_C) {
          cleanup();
          stdout.write("\n");
          reject(new Error("aborted"));
          return;
        }
        if (ch === BACKSPACE || ch === BACKSPACE_ALT) {
          if (buf.length > 0) {
            buf = buf.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        // Skip other control bytes silently.
        if (ch.charCodeAt(0) < 32) continue;
        buf += ch;
        stdout.write("*");
      }
    };
    tty.on("data", onData);
  });
}

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  hint?: string;
}

export async function select<V extends string>(
  question: string,
  options: SelectOption<V>[],
  defaultIndex = 0,
): Promise<V> {
  stdout.write(`${question}\n`);
  options.forEach((opt, i) => {
    const marker = i === defaultIndex ? "›" : " ";
    const hint = opt.hint ? `  — ${opt.hint}` : "";
    stdout.write(`  ${marker} ${i + 1}. ${opt.label}${hint}\n`);
  });
  const answer = await ask(`Choose [1-${options.length}]:`, String(defaultIndex + 1));
  const n = Number.parseInt(answer, 10);
  if (Number.isFinite(n) && n >= 1 && n <= options.length) {
    return options[n - 1].value;
  }
  return options[defaultIndex].value;
}

export async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const suffix = defaultYes ? "Y/n" : "y/N";
  const answer = (await ask(`${question} (${suffix})`)).toLowerCase();
  if (!answer) return defaultYes;
  return answer === "y" || answer === "yes";
}
