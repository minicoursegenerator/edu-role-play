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

export function askSecret(question: string): Promise<string> {
  // Suppress echo by muting stdout while the user types.
  return withRl(
    (rl) =>
      new Promise((resolve) => {
        const rlAny = rl as unknown as { _writeToOutput?: (s: string) => void };
        const origWrite = rlAny._writeToOutput;
        rlAny._writeToOutput = (s: string) => {
          // Allow the prompt itself through, mute the rest.
          if (s.startsWith(question)) origWrite?.call(rl, s);
          else origWrite?.call(rl, "");
        };
        rl.question(`${question} `, (answer) => {
          rlAny._writeToOutput = origWrite;
          stdout.write("\n");
          resolve(answer.trim());
        });
      }),
  );
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
