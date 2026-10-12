// Observation is not containment: a process can leave its ancestry, group and environment between scans.
// Persist identities for best-effort stopping after a restart, but never treat an empty scan as proof of quiescence.
import { readFile, readlink, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  readJson,
  safeName,
  writeJsonAtomic,
  type RunnerPaths,
} from '../lib/home.ts';
import { delay } from '../lib/http.ts';
import {
  descendantsOf,
  listProcesses,
  type ProcessEntry,
} from './process-tree.ts';

export interface WriterIdentity {
  pid: number;
  start: string;
}
const ownershipPath = (paths: RunnerPaths, run: string, source: string) =>
  path.join(paths.runsDir, `${safeName(run)}.${source}-writers`);

async function identity(pid: number): Promise<WriterIdentity | undefined> {
  if (process.platform !== 'linux') return undefined;
  try {
    const stat = await readFile(`/proc/${pid}/stat`, 'utf8');
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    if (fields[0] === 'Z' || fields[0] === 'X') return undefined;
    const boot = (
      await readFile('/proc/sys/kernel/random/boot_id', 'utf8')
    ).trim();
    return { pid, start: `${boot}:${fields[19]}` };
  } catch {
    return undefined;
  }
}

export async function observeWriters(
  paths: RunnerPaths,
  run: string,
  root: number,
  source: 'worker' | 'supervisor',
  processes: readonly ProcessEntry[],
): Promise<void> {
  const file = ownershipPath(paths, run, source);
  const previous = (await readJson<WriterIdentity[]>(file)) ?? [];
  const found = await Promise.all(
    descendantsOf(root, processes).map((p) => identity(p.pid)),
  );
  const all = new Map(previous.map((p) => [`${p.pid}:${p.start}`, p]));
  for (const entry of found)
    if (entry !== undefined) all.set(`${entry.pid}:${entry.start}`, entry);
  if (all.size !== previous.length)
    await writeJsonAtomic(file, [...all.values()]);
}

export async function stopRecordedWriters(
  paths: RunnerPaths,
  run: string,
): Promise<number[]> {
  const records = (
    await Promise.all(
      ['worker', 'supervisor'].map((source) =>
        readJson<WriterIdentity[]>(ownershipPath(paths, run, source)),
      ),
    )
  ).flatMap((p) => p ?? []);
  const live = async () => {
    const found: WriterIdentity[] = [];
    for (const entry of records) {
      const current = await identity(entry.pid);
      if (current?.start === entry.start && entry.pid !== process.pid)
        found.push(entry);
    }
    return found;
  };
  for (const entry of await live()) {
    try {
      process.kill(entry.pid, 'SIGKILL');
    } catch {
      /* Verification below retains survivors. */
    }
  }
  for (let round = 0; round < 20; round++) {
    if ((await live()).length === 0) return [];
    await delay(50);
  }
  return (await live()).map((p) => p.pid);
}

/** Additional evidence only: processes holding a cwd or open descriptor in this attempt's directory. */
export async function workspaceWriters(workDir: string): Promise<number[]> {
  if (process.platform !== 'linux') return [];
  const prefix = `${path.resolve(workDir)}${path.sep}`;
  const inWorkspace = (value: string) =>
    value === prefix.slice(0, -1) || value.startsWith(prefix);
  const found: number[] = [];
  for (const entry of await listProcesses()) {
    if (entry.pid === process.pid) continue;
    const proc = `/proc/${entry.pid}`;
    const cwd = await readlink(`${proc}/cwd`).catch(() => '');
    let holds = inWorkspace(cwd);
    for (const fd of holds
      ? []
      : await readdir(`${proc}/fd`).catch(() => [] as string[])) {
      if (inWorkspace(await readlink(`${proc}/fd/${fd}`).catch(() => ''))) {
        holds = true;
        break;
      }
    }
    if (holds && (await identity(entry.pid)) !== undefined)
      found.push(entry.pid);
  }
  return found;
}

export async function removeWriterOwnership(
  paths: RunnerPaths,
  run: string,
): Promise<void> {
  await Promise.all(
    ['worker', 'supervisor'].map((source) =>
      rm(ownershipPath(paths, run, source), { force: true }),
    ),
  );
}
