import { fork } from 'node:child_process';

/** Wait for exit before callers clean staging files, including on errors. */
function runArtifactWorker(
  mode: 'hash' | 'extract',
  archive: string,
  destination?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new URL(
      import.meta.url.endsWith('.ts')
        ? './artifact-worker.ts'
        : './artifact-worker.js',
      import.meta.url,
    );
    const child = fork(
      worker,
      [mode, archive, ...(destination ? [destination] : [])],
      {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        execArgv: [],
      },
    );
    let result: string | undefined;
    let failure: Error | undefined;
    child.on('message', (message: { result?: string; error?: string }) => {
      if (message.error) failure = new Error(message.error);
      else result = message.result;
    });
    child.on('error', (error) => {
      failure = error;
    });
    child.on('close', (code, signal) => {
      if (failure) reject(failure);
      else if (code !== 0 || result === undefined)
        reject(
          new Error(
            `Artifact worker exited without a result (code ${code}, signal ${signal})`,
          ),
        );
      else resolve(result);
    });
  });
}

let workers: Promise<unknown> = Promise.resolve();
/** A Host runs at most one archive worker, including on-demand materializations. */
export function artifactWorker(
  mode: 'hash' | 'extract',
  archive: string,
  destination?: string,
): Promise<string> {
  const work = workers
    .catch(() => undefined)
    .then(() => runArtifactWorker(mode, archive, destination));
  workers = work;
  return work;
}
