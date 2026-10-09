// The processes below a process, and the process groups they run in, read from `ps` (its output has the same columns
// on Linux and macOS).
//
// What an agent starts does not always stay in its worker's process group: Codex and OpenCode run in groups of their
// own, and a tool may start a shell, a development server or a test watcher in yet another one. A process whose
// parent exits is adopted by init or a subreaper and leaves the tree, but not its group, so the groups seen below a
// worker while it runs are what can still be stopped after it ends.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { delay } from '../lib/http.ts';

const execFileAsync = promisify(execFile);

export interface ProcessEntry {
  pid: number;
  ppid: number;
  pgid: number;
}

/** Every process `ps` lists; empty when `ps` cannot be run. */
export async function listProcesses(): Promise<ProcessEntry[]> {
  try {
    const { stdout } = await execFileAsync(
      'ps',
      ['-A', '-o', 'pid=,ppid=,pgid='],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    );
    const entries: ProcessEntry[] = [];
    for (const line of stdout.split('\n')) {
      const [pid, ppid, pgid] = line.trim().split(/\s+/u).map(Number);
      if (
        Number.isInteger(pid) &&
        Number.isInteger(ppid) &&
        Number.isInteger(pgid)
      )
        entries.push({ pid, ppid, pgid });
    }
    return entries;
  } catch {
    return [];
  }
}

/** The processes below `root`, children before their own children; `root` itself is not included. */
export function descendantsOf(
  root: number,
  processes: readonly ProcessEntry[],
): ProcessEntry[] {
  const children = new Map<number, ProcessEntry[]>();
  for (const entry of processes) {
    const siblings = children.get(entry.ppid);
    if (siblings === undefined) children.set(entry.ppid, [entry]);
    else siblings.push(entry);
  }
  const found: ProcessEntry[] = [];
  const queue = [root];
  const seen = new Set<number>([root]);
  for (let parent = queue.shift(); parent !== undefined; parent = queue.shift())
    for (const child of children.get(parent) ?? []) {
      if (seen.has(child.pid)) continue;
      seen.add(child.pid);
      found.push(child);
      queue.push(child.pid);
    }
  return found;
}

/**
 * The process groups the processes below `root` run in, leaving out the groups of `root` and of the calling process,
 * and init's.
 */
export function groupsBelow(
  root: number,
  processes: readonly ProcessEntry[],
): number[] {
  const excluded = new Set<number>([0, 1]);
  for (const entry of processes)
    if (entry.pid === root || entry.pid === process.pid)
      excluded.add(entry.pgid);
  const groups = new Set<number>();
  for (const entry of descendantsOf(root, processes))
    if (!excluded.has(entry.pgid)) groups.add(entry.pgid);
  return [...groups];
}

function signal(target: number, name: NodeJS.Signals): void {
  try {
    process.kill(target, name);
  } catch {
    // Already gone, or not ours.
  }
}

function alive(target: number): boolean {
  try {
    process.kill(target, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export interface KillLeftoversOptions {
  /** Process groups to stop besides the ones found below `root` now, such as groups seen there earlier. */
  groups?: Iterable<number>;
  /** SIGTERM to SIGKILL; with none, SIGKILL only. */
  graceMs?: number;
  /**
   * Whether to look below `root` at all (the default); not for a `root` that has exited, whose pid another process may
   * have taken since.
   */
  below?: boolean;
}

/**
 * Stops everything below `root` and every process group they run in, plus `options.groups`: SIGTERM, then SIGKILL
 * after the grace period to whatever is left. `root` itself and the calling process's group are left alone. Returns how
 * many processes and groups it signalled.
 */
export async function killLeftovers(
  root: number,
  options: KillLeftoversOptions = {},
): Promise<{ processes: number; groups: number }> {
  const graceMs = options.graceMs ?? 3_000;
  const processes = await listProcesses();
  const own = processes.find((entry) => entry.pid === process.pid)?.pgid;
  const rootGroup = processes.find((entry) => entry.pid === root)?.pgid;
  const below = options.below ?? true;
  const pids = below
    ? descendantsOf(root, processes).map((entry) => entry.pid)
    : [];
  const groups = new Set(below ? groupsBelow(root, processes) : []);
  for (const group of options.groups ?? [])
    if (group > 1 && group !== own && group !== rootGroup) groups.add(group);
  const liveGroups = [...groups].filter((group) => alive(-group));
  if (pids.length === 0 && liveGroups.length === 0)
    return { processes: 0, groups: 0 };
  const stop = (name: NodeJS.Signals) => {
    for (const group of liveGroups) signal(-group, name);
    for (const pid of pids) signal(pid, name);
  };
  const left = () =>
    liveGroups.some((group) => alive(-group)) || pids.some((pid) => alive(pid));
  if (graceMs > 0) {
    stop('SIGTERM');
    const deadline = Date.now() + graceMs;
    while (left() && Date.now() < deadline) await delay(100);
  }
  if (left()) {
    stop('SIGKILL');
    const deadline = Date.now() + 2_000;
    while (left() && Date.now() < deadline) await delay(50);
  }
  return { processes: pids.length, groups: liveGroups.length };
}
