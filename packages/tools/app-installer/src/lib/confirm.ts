import { createInterface } from 'node:readline/promises';
import { EXIT_INVALID, InstallerError } from './errors.ts';

export interface ConfirmOptions {
  yes: boolean;
  json: boolean;
  input?: NodeJS.ReadableStream & { isTTY?: boolean };
  output?: NodeJS.WritableStream;
}

/**
 * Asks before an operation that takes the application down or discards data. `--yes` answers for scripts; without it, a run that
 * cannot ask — `--json`, or no terminal — stops instead of guessing.
 */
export async function confirm(
  lines: readonly string[],
  options: ConfirmOptions,
): Promise<void> {
  if (options.yes) return;
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stderr;
  if (options.json || !input.isTTY) {
    throw new InstallerError(
      'CONFIRMATION_REQUIRED',
      `${lines[0]} Pass --yes to proceed without a prompt.`,
      {
        exitCode: EXIT_INVALID,
        details: { notes: lines.slice(1) },
        suggestions: [
          { message: 'Run it again with --yes once you have read:' },
          ...lines.slice(1).map((message) => ({ message })),
        ],
      },
    );
  }
  output.write(`${lines.map((line) => `  ${line}`).join('\n')}\n`);
  const readline = createInterface({ input, output });
  try {
    const answer = await readline.question('Continue? [y/N] ');
    if (!/^y(es)?$/iu.test(answer.trim())) {
      throw new InstallerError('CANCELLED', 'Cancelled; nothing was changed.', {
        exitCode: EXIT_INVALID,
      });
    }
  } finally {
    readline.close();
  }
}
