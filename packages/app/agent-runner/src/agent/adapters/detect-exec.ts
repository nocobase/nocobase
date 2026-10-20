import { spawn as nodeSpawn, execFile } from 'node:child_process';
import { withDetectionEnvironment } from './detection.ts';
export interface DetectResult {
  code: number;
  stdout: string;
}
export type DetectExecFn = (
  file: string,
  args: string[],
  options?: { signal?: AbortSignal },
) => Promise<DetectResult>;
/**
 * Runs a detection command in `detectionEnv` (the environment a run gets from the runner; the runner's whitelist when
 * absent), ending its whole process group on timeout or abort.
 */
export const detectExec =
  (detectionEnv?: Record<string, string>): DetectExecFn =>
  (file, args, options) =>
    withDetectionEnvironment(
      options?.signal,
      (cwd, env) =>
        new Promise((resolve) => {
          let stdout = '';
          let failed = false;
          const child = nodeSpawn(file, args, {
            cwd,
            env,
            detached: process.platform !== 'win32',
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          });
          child.on('error', () => {
            failed = true;
          });
          const kill = () => {
            if (child.pid === undefined) return;
            try {
              if (process.platform === 'win32')
                execFile(
                  'taskkill',
                  ['/pid', String(child.pid), '/T', '/F'],
                  { windowsHide: true, timeout: 3000 },
                  () => {},
                );
              else process.kill(-child.pid, 'SIGKILL');
            } catch {
              // The process group is already gone.
            }
          };
          child.stdout?.setEncoding('utf8').on('data', (text: string) => {
            if (
              Buffer.byteLength(stdout) + Buffer.byteLength(text) >
              1024 * 1024
            ) {
              failed = true;
              kill();
            } else stdout += text;
          });
          child.stderr?.resume();
          // End the entire tree before the direct child exits, including descendants holding its pipes.
          const timer = setTimeout(kill, 15_000);
          options?.signal?.addEventListener('abort', kill, { once: true });
          if (options?.signal?.aborted) kill();
          process.once('exit', kill);
          child.once('exit', kill);
          child.once('close', (code) => {
            clearTimeout(timer);
            options?.signal?.removeEventListener('abort', kill);
            process.removeListener('exit', kill);
            resolve({ code: failed ? 1 : (code ?? 1), stdout });
          });
        }),
      detectionEnv,
    );
