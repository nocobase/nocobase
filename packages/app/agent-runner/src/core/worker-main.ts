// The entry point of a run's worker process (see supervisor.ts). It reads its job from stdin, which keeps the run
// token and any secrets off the command line and off the disk, runs the run, and exits.
//
// Signals: SIGUSR2 polls the run's status now (the daemon learned of a cancel); SIGTERM stops the run because the
// runner is stopping.
import { loadAdapters } from '../agent/adapters/registry.ts';
import { readConnection, readSettings } from '../lib/config.ts';
import { runnerPaths, readJson } from '../lib/home.ts';
import { JobPayloadSchema, RunPayloadSchema } from '../protocol/index.ts';
import { JobWorker } from './job-worker.ts';
import { killLeftovers } from './process-tree.ts';
import {
  jobRecordKey,
  recordPath,
  type RunRecord,
  type WorkerJob,
} from './supervisor.ts';
import { RunWorker } from '../agent/worker.ts';

function log(message: string): void {
  process.stdout.write(`${new Date().toISOString()} ${message}\n`);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

/** A job (a build): no agent, no tool; see job-worker.ts. */
async function runJob(
  job: Extract<WorkerJob, { kind: 'job' }>,
): Promise<number> {
  const payload = JobPayloadSchema.parse(job.payload);
  const paths = runnerPaths();
  const connection = await readConnection(job.appKey, paths);
  if (connection === undefined) {
    log(`worker: this runner is not registered with ${job.appKey}`);
    return 1;
  }
  const key = jobRecordKey(payload.job.id);
  const record = (await readJson<RunRecord>(recordPath(paths, key))) ?? {
    runId: key,
    kind: 'job',
    jobId: payload.job.id,
    appKey: job.appKey,
    attempt: payload.job.attempt,
    firstSeq: payload.job.firstSeq,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    phase: 'spawned',
    log: '',
  };
  const worker = new JobWorker(
    payload,
    job.timings,
    { paths, connection, log },
    record,
  );
  process.on('SIGUSR2', () => void worker.pollStatus());
  process.on('SIGTERM', () => worker.end('shutdown'));
  process.on('SIGINT', () => worker.end('shutdown'));
  const outcome = await worker.run();
  log(`job ${payload.job.id}: worker done (${outcome})`);
  return 0;
}

async function main(): Promise<number> {
  const job = JSON.parse(await readStdin()) as WorkerJob;
  if (job.kind === 'job') return runJob(job);
  const payload = RunPayloadSchema.parse(job.payload);
  const paths = runnerPaths();
  const connection = await readConnection(job.appKey, paths);
  if (connection === undefined) {
    log(`worker: this runner is not registered with ${job.appKey}`);
    return 1;
  }
  const record = (await readJson<RunRecord>(
    recordPath(paths, payload.run.id),
  )) ?? {
    runId: payload.run.id,
    appKey: job.appKey,
    attempt: payload.run.attempt,
    firstSeq: payload.run.firstSeq,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    phase: 'spawned',
    log: '',
  };
  const settings = await readSettings(paths);
  const worker = new RunWorker(
    payload,
    job.timings,
    {
      paths,
      connection,
      settings,
      adapters: loadAdapters(
        process.env,
        settings.passEnv,
        Object.fromEntries(
          Object.entries(connection.registration.variables).filter(([name]) =>
            payload.workspace.passthrough?.includes(name),
          ),
        ),
      ),
      log,
    },
    record,
  );
  process.on('SIGUSR2', () => void worker.pollStatus());
  process.on('SIGTERM', () => worker.end({ kind: 'shutdown' }));
  process.on('SIGINT', () => worker.end({ kind: 'shutdown' }));
  const outcome = await worker.run();
  log(`run ${payload.run.id}: worker done (${outcome})`);
  // The outcome was reported to the server; the exit code only tells the daemon the worker did not crash.
  return 0;
}

/**
 * Stops whatever the run left running below this worker, in any process group (a development server, a test watcher,
 * the coding tool's own server), before the worker exits: once it has exited, they would be adopted by init and no
 * longer be found below it.
 */
async function exit(code: number): Promise<never> {
  const left = await killLeftovers(process.pid, { graceMs: 2_000 }).catch(
    () => ({ processes: 0, groups: 0 }),
  );
  if (left.processes > 0)
    log(`worker: stopped ${left.processes} process(es) the run left behind`);
  process.exit(code);
}

main().then(
  (code) => exit(code),
  (error: unknown) => {
    log(
      `worker: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    );
    return exit(1);
  },
);
