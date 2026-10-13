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
import {
  observeWriters,
  workspaceWriters,
  stopRecordedWriters,
  liveWriterPids,
} from './writer-ownership.ts';
import {
  killLeftovers,
  killTagged,
  PROCESS_TAG_ENV,
  taggedProcesses,
  listProcesses,
  descendantsOf,
  groupsBelow,
} from './process-tree.ts';
import {
  jobRecordKey,
  recordPath,
  isAlive,
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
  const seenGroups = new Set<number>();
  const observeGroups = async () => {
    const processes = await listProcesses({ strict: true });
    for (const group of groupsBelow(process.pid, processes))
      seenGroups.add(group);
    await observeWriters(
      paths,
      payload.run.id,
      process.pid,
      'worker',
      processes,
    );
  };
  let quiescing = false;
  let observation = Promise.resolve();
  const scan = setInterval(() => {
    if (!quiescing)
      observation = observation.then(observeGroups).catch(() => undefined);
  }, job.timings.processScanMs ?? 1_000);
  const worker = new RunWorker(
    payload,
    job.timings,
    {
      paths,
      connection,
      settings,
      stopWriters: async () => {
        quiescing = true;
        try {
          await observation;
          await observeGroups();
          const left = await killLeftovers(process.pid, {
            groups: seenGroups,
            graceMs: 2_000,
          });
          const tag = process.env[PROCESS_TAG_ENV];
          const tagged = tag === undefined ? 0 : await killTagged([tag]);
          const survivors = await stopRecordedWriters(paths, payload.run.id);
          const processes = await listProcesses({ strict: true });
          const groupWriters = await liveWriterPids(
            processes
              .filter((entry) => seenGroups.has(entry.pgid))
              .map((entry) => entry.pid),
          );
          if (left.groups > 0)
            log(
              `worker: stopped ${left.groups} process group(s) before saving`,
            );
          if (left.processes + tagged > 0)
            log(
              `worker: stopped ${left.processes + tagged} process(es) the run left behind before saving`,
            );
          if (
            survivors.length > 0 ||
            groupWriters.length > 0 ||
            descendantsOf(process.pid, processes).some((entry) =>
              isAlive(entry.pid),
            ) ||
            (tag !== undefined && (await taggedProcesses([tag])).length > 0) ||
            (record.workDir !== undefined &&
              (await workspaceWriters(record.workDir)).length > 0)
          )
            throw new Error(
              'Writers remain after stopping the tool; preserve the worktree for recovery.',
            );
          log(
            `run ${payload.run.id}: writers stopped before workspace cleanup`,
          );
        } finally {
          quiescing = false;
        }
      },
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
  const outcome = await worker.run().finally(() => clearInterval(scan));
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
