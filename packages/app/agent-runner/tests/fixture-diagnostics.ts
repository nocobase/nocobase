// Temporary CI observations: output only explicit fields from synthetic fixtures, never logs, credentials or history.
import { existsSync, readFileSync, writeSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inject } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import type { FakeRun, FakeServer } from './fake-server.ts';

export function fixtureDiagnostics(
  home: string,
  servers: FakeServer[],
  label: string,
  daemonOutput?: () => string,
) {
  for (const server of servers) server.diagnosticEnabled = true;
  const phases: unknown[] = [];
  const marks: { name: string; at: string }[] = [];
  const previous = new Map<string, string>();
  const observe = () => {
    for (const server of servers)
      for (const run of server.runs.values()) {
        let record: { phase?: string; pid?: number; startedAt?: string } = {};
        try {
          if (run.status !== 'queued')
            record = JSON.parse(
              readFileSync(
                path.join(home, 'runs', `${run.payload.run.id}.json`),
                'utf8',
              ),
            );
        } catch {
          /* Record not created or removed. */
        }
        const phase = [
          'spawned',
          'variables',
          'workspace',
          'cli',
          'dirs',
          'skills',
          'mounts',
          'running',
          'reporting',
        ].includes(record.phase ?? '')
          ? record.phase
          : undefined;
        const value = {
          status: run.status,
          phase,
          pid: record.pid,
          startedAt: record.startedAt,
          directoryExists: run.start?.workDir
            ? existsSync(run.start.workDir)
            : undefined,
        };
        const key = `${server.url}:${run.payload.run.id}`;
        if (previous.get(key) !== JSON.stringify(value)) {
          previous.set(key, JSON.stringify(value));
          phases.push({
            at: new Date().toISOString(),
            server: servers.indexOf(server),
            run: run.payload.run.id,
            ...value,
          });
        }
      }
  };
  const timer = setInterval(observe, 100);
  timer.unref();
  const events = (run: FakeRun) =>
    [...run.events.values()].map((event) => ({
      seq: event.seq,
      at: event.at,
      type: event.type,
      phase: event.meta?.phase,
      reason: event.meta?.reason,
      localSave: Array.isArray(event.meta?.localSave)
        ? event.meta.localSave.map((result) => ({
            saved: result.saved,
            reason:
              typeof result.reason === 'string' &&
              result.reason.includes('Writers remain')
                ? 'writers-remain'
                : undefined,
          }))
        : undefined,
    }));
  return {
    mark(name: string) {
      marks.push({ name, at: new Date().toISOString() });
    },
    finish() {
      clearInterval(timer);
      observe();
      const preserved = servers.flatMap((server) =>
        [...server.runs.values()].map((run) => {
          let meta: { recoveryRequired?: boolean; recoveryReason?: string } =
            {};
          try {
            const file = createHash('sha256')
              .update(path.resolve(run.start?.workDir ?? ''))
              .digest('hex');
            meta = JSON.parse(
              readFileSync(
                path.join(home, 'workspaces', `${file}.json`),
                'utf8',
              ),
            );
          } catch {
            /* No workspace metadata. */
          }
          return {
            run: run.payload.run.id,
            recoveryRequired: meta.recoveryRequired,
            recoveryReason: meta.recoveryReason?.includes('Writers remain')
              ? 'writers-remain'
              : meta.recoveryReason?.includes('orphan writer quiescence')
                ? 'orphan-quiescence-unknown'
                : meta.recoveryRequired
                  ? 'other-preservation'
                  : undefined,
          };
        }),
      );
      writeSync(
        1,
        'FIXTURE_DIAGNOSTICS ' +
          JSON.stringify({
            label,
            environment: {
              node: process.version,
              platform: process.platform,
              arch: process.arch,
              cpus: os.availableParallelism(),
              memory: os.totalmem(),
              vitestWorker: process.env.VITEST_WORKER_ID,
              concurrency: inject('fixtureConcurrency'),
            },
            marks,
            supervision: (daemonOutput?.() ?? '')
              .split('\n')
              .flatMap((line) => {
                const run = line.match(/run (run-\d+):/u)?.[1];
                if (!run) return [];
                const action = line.includes('released by the server')
                  ? 'server-release'
                  : line.includes('worker did not stop within')
                    ? 'cancel-grace-expired'
                    : line.includes('exited (')
                      ? 'worker-exit'
                      : undefined;
                if (!action) return [];
                return [
                  {
                    at: line.match(/\d{4}-\d{2}-\d{2}T\S+/u)?.[0],
                    run,
                    action,
                    signal: line.match(/exited \((SIG\w+|\d+)\)/u)?.[1],
                  },
                ];
              }),
            phases,
            preserved,
            servers: servers.map((server) => ({
              requests: server.diagnosticRequests,
              runs: [...server.runs.values()].map((run) => ({
                id: run.payload.run.id,
                status: run.status,
                events: events(run),
                reports: run.reports.map((report) => ({
                  kind: report.kind,
                  status: report.status,
                  reason: (report.body as { reason?: string }).reason,
                })),
              })),
            })),
          }) +
          '\n',
      );
    },
  };
}

declare module 'vitest' {
  export interface ProvidedContext {
    fixtureConcurrency: {
      maxWorkers: number;
      pool: string;
      fileParallelism: boolean | 'default';
    };
  }
}
