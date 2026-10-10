// How the adapters run a tool's detection commands (`--version`, its login status, its models): with a timeout, and in
// the environment a run gets from the runner (`detectionEnv` in env.ts), so what detection reports holds for a run.
import { execFile } from 'node:child_process';

export interface DetectResult {
  code: number;
  stdout: string;
}

export type DetectExecFn = (
  file: string,
  args: string[],
) => Promise<DetectResult>;

/** Runs a detection command in `env`; the runner's own environment when absent. */
export function detectExec(env?: Record<string, string>): DetectExecFn {
  return (file, args) =>
    new Promise((resolve) => {
      execFile(
        file,
        args,
        {
          timeout: 15_000,
          maxBuffer: 1024 * 1024,
          ...(env === undefined ? {} : { env }),
        },
        (error, stdout) => {
          const code = error
            ? typeof error.code === 'number'
              ? error.code
              : 1
            : 0;
          resolve({ code, stdout: String(stdout ?? '') });
        },
      );
    });
}
