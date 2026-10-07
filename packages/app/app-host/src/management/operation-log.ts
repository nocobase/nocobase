/**
 * Operation logs: `operationId → outcome` of the deployments a managed Host ran for a scope, kept where the Host runs
 * so a control plane that restarted in the middle of a deployment (or replaced itself) can ask how it ended
 * (`HostManagementService.getOperation`). It is a recoverable cache, not authoritative state: the control plane's own
 * records stay the truth, and losing the log only turns unknown outcomes into "interrupted".
 *
 * `FileOperationLog` writes one JSON file per operation under `<dir>/operations/<scopeId>/`, and an owner lease in
 * `<dir>/owner.json`. A new Host process waits for the previous owner to exit (bounded), so it never restores Apps
 * while an older Host is still finishing a deployment of the same Apps, and then records every operation the previous
 * owner left running as interrupted.
 */
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import type { HostOperation } from './types.ts';

/** Where a Host keeps deployment outcomes so they outlive the processes that ran them. */
export interface OperationLog {
  get(scopeId: string, operationId: string): Promise<HostOperation | null>;
  put(operation: HostOperation): Promise<void>;
}

const SCOPE_ID = /^[a-zA-Z0-9_.-]{1,64}$/;
const OPERATION_ID = /^[a-zA-Z0-9_.:-]{1,128}$/;

export function assertScopeId(scopeId: string): void {
  if (
    typeof scopeId !== 'string' ||
    !SCOPE_ID.test(scopeId) ||
    /^\.+$/.test(scopeId)
  )
    throw new Error(`Invalid scope ID "${String(scopeId)}"`);
}

export function assertOperationId(operationId: string): void {
  if (
    typeof operationId !== 'string' ||
    !OPERATION_ID.test(operationId) ||
    /^\.+$/.test(operationId)
  )
    throw new Error(`Invalid operation ID "${String(operationId)}"`);
}

/** Keeps results in memory: for an embedded Host Control whose control plane keeps its own records. */
export class MemoryOperationLog implements OperationLog {
  private readonly results = new Map<string, HostOperation>();

  get(scopeId: string, operationId: string): Promise<HostOperation | null> {
    return Promise.resolve(
      this.results.get(`${scopeId}\u0000${operationId}`) ?? null,
    );
  }

  put(result: HostOperation): Promise<void> {
    this.results.set(`${result.scopeId}\u0000${result.operationId}`, result);
    return Promise.resolve();
  }
}

interface OwnerLease {
  readonly pid: number;
  readonly bootId: string;
  readonly startedAt: string;
  /** The machine (or container) the owner ran on; a process ID means nothing on another. */
  readonly hostname?: string;
}

interface StoredOperation extends HostOperation {
  readonly owner: OwnerLease;
}

export interface FileOperationLogOptions {
  /** How long a new owner waits for the previous one to exit (45 s by default). */
  readonly previousOwnerWaitMs?: number;
  /** Finished operations older than this are removed when the log opens (30 days by default). */
  readonly retentionDays?: number;
  /** At most this many finished operations are kept per scope (500 by default). */
  readonly maxPerScope?: number;
  /** How often the previous owner is checked while waiting (250 ms by default). */
  readonly pollMs?: number;
}

export class FileOperationLog implements OperationLog {
  private readonly owner: OwnerLease = {
    pid: process.pid,
    bootId: randomUUID(),
    startedAt: new Date().toISOString(),
    hostname: os.hostname(),
  };
  private opened: Promise<void> | null = null;

  constructor(
    private readonly dir: string,
    private readonly options: FileOperationLogOptions = {},
  ) {}

  /**
   * Takes the log over: waits for a previous owner that is still alive, marks what it left running as interrupted,
   * and prunes old results. Every other method waits for it.
   */
  open(): Promise<void> {
    this.opened ??= this.takeOver();
    return this.opened;
  }

  async get(
    scopeId: string,
    operationId: string,
  ): Promise<HostOperation | null> {
    await this.open();
    const stored = await this.read(this.file(scopeId, operationId));
    return stored ? withoutOwner(stored) : null;
  }

  async put(result: HostOperation): Promise<void> {
    await this.open();
    await this.write({ ...result, owner: this.owner });
  }

  private file(scopeId: string, operationId: string): string {
    assertScopeId(scopeId);
    assertOperationId(operationId);
    return path.join(this.dir, 'operations', scopeId, `${operationId}.json`);
  }

  private async read(file: string): Promise<StoredOperation | null> {
    try {
      const value = JSON.parse(await readFile(file, 'utf8')) as StoredOperation;
      return value && typeof value.operationId === 'string' ? value : null;
    } catch {
      return null;
    }
  }

  private async write(stored: StoredOperation): Promise<void> {
    const target = this.file(stored.scopeId, stored.operationId);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(stored)}\n`, {
        mode: 0o600,
      });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  private async takeOver(): Promise<void> {
    await mkdir(this.dir, { recursive: true, mode: 0o700 });
    const leasePath = path.join(this.dir, 'owner.json');
    const previous = await readFile(leasePath, 'utf8')
      .then((text) => JSON.parse(text) as OwnerLease)
      .catch(() => null);
    if (previous && previous.bootId !== this.owner.bootId) {
      const deadline =
        Date.now() + (this.options.previousOwnerWaitMs ?? 45_000);
      while (isAlive(previous) && Date.now() < deadline)
        await sleep(this.options.pollMs ?? 250);
    }
    const temporary = `${leasePath}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(this.owner)}\n`, {
      mode: 0o600,
    });
    await rename(temporary, leasePath);

    const root = path.join(this.dir, 'operations');
    const scopes = await readdir(root).catch(() => [] as string[]);
    const retentionMs = (this.options.retentionDays ?? 30) * 86_400_000;
    const maxPerScope = this.options.maxPerScope ?? 500;
    for (const scopeId of scopes) {
      if (!SCOPE_ID.test(scopeId)) continue;
      const directory = path.join(root, scopeId);
      const finished: { file: string; at: number }[] = [];
      for (const name of await readdir(directory).catch(() => [] as string[])) {
        if (!name.endsWith('.json')) continue;
        const file = path.join(directory, name);
        const stored = await this.read(file);
        if (!stored) continue;
        if (
          stored.state === 'running' &&
          stored.owner?.bootId !== this.owner.bootId
        ) {
          await this.write({
            ...stored,
            state: 'interrupted',
            error:
              stored.error ??
              'The App Host stopped before the operation finished.',
            finishedAt: new Date().toISOString(),
          });
          continue;
        }
        if (stored.state !== 'running') {
          const at = Date.parse(stored.finishedAt ?? stored.startedAt);
          finished.push({
            file,
            at: Number.isFinite(at) ? at : (await stat(file)).mtimeMs,
          });
        }
      }
      finished.sort((a, b) => b.at - a.at);
      const now = Date.now();
      for (const [index, entry] of finished.entries())
        if (index >= maxPerScope || now - entry.at > retentionMs)
          await rm(entry.file, { force: true });
    }
  }
}

function withoutOwner(stored: StoredOperation): HostOperation {
  const { owner: _owner, ...result } = stored;
  return result;
}

/** Whether the process that held the lease is still running. Another instance in this process counts as gone. */
function isAlive(lease: OwnerLease): boolean {
  if (!Number.isSafeInteger(lease.pid) || lease.pid <= 0) return false;
  // A lease from another machine or container (a replaced container of this application) cannot be checked here.
  if (lease.hostname && lease.hostname !== os.hostname()) return false;
  if (lease.pid === process.pid) return false;
  try {
    process.kill(lease.pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
