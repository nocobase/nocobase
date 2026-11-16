import { DiagnosticsWriter } from './diagnostics-writer.js';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, open, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import {
  boundedLogLines,
  sanitizeLog,
  createLogLineSanitizer,
} from '@nocobase/logging';
import {
  DIAGNOSTICS_FEATURE,
  DIAGNOSTICS_MAX_BYTES,
  DIAGNOSTICS_MAX_RECORD,
  DiagnosticsRecordSchema,
  DiagnosticsWindowSchema,
  diagnosticsDates,
  type DiagnosticsRequest,
  type DiagnosticsWindow,
  type DiagnosticsFile,
} from '@nocobase/agent-protocol';
import { ApiError } from '@nocobase/app-server/router';
import type { Runner } from '../../shared/runners.js';

export type DiagnosticsSkip =
  'offline' | 'unsupported' | 'timeout' | 'too_large' | 'failed' | 'capacity';
export interface RunnerDiagnosticsResult {
  runnerId: string;
  status: 'collected' | DiagnosticsSkip;
  directory?: string;
  files?: DiagnosticsFile[];
  truncated?: boolean;
}
export interface RunnerDiagnosticsCollection {
  directory: string;
  runners: RunnerDiagnosticsResult[];
  dispose(): Promise<void>;
}
export interface RunnerDiagnostics {
  /** Caller owns authorization. Retain until the preview bundle expires, then dispose. Single instance only. */
  collect(options: {
    runnerIds: readonly string[];
    window: DiagnosticsWindow;
    directory: string;
    timeoutMs?: number;
    maxTotalBytes?: number;
  }): Promise<RunnerDiagnosticsCollection>;
  take(runnerId: string): DiagnosticsRequest | undefined;
  accept(
    runnerId: string,
    requestId: string,
    body: AsyncIterable<Uint8Array>,
  ): Promise<void>;
}
interface Pending {
  runnerId: string;
  request: DiagnosticsRequest;
  directory: string;
  sent: boolean;
  uploading: boolean;
  controller: AbortController;
  finish(result: RunnerDiagnosticsResult): void;
}
const fail = (
  status: 'PERMISSION_DENIED' | 'INVALID_ARGUMENT' | 'RESOURCE_EXHAUSTED',
  message: string,
) => new ApiError({ domain: 'agents', status, reason: status, message });
function limit(max: number): Transform {
  let bytes = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, done) {
      bytes += chunk.length;
      done(
        bytes > max
          ? fail(
              'RESOURCE_EXHAUSTED',
              'Diagnostics upload exceeds its byte budget',
            )
          : null,
        chunk,
      );
    },
  });
}

export function createRunnerDiagnostics(
  list: () => Promise<readonly Pick<Runner, 'id' | 'status' | 'features'>[]>,
): RunnerDiagnostics {
  const pending = new Map<string, Pending>();
  const uploads = new Set<Promise<void>>();
  let active = false;
  let dispatched = 0;
  const service: RunnerDiagnostics = {
    async collect(options) {
      if (active)
        throw new ApiError({
          domain: 'agents',
          status: 'ABORTED',
          httpStatus: 409,
          reason: 'CONFLICT',
          message: 'A diagnostics collection is already active',
        });
      const window = DiagnosticsWindowSchema.parse(options.window);
      if (
        !Array.isArray(options.runnerIds) ||
        options.runnerIds.some((id) => typeof id !== 'string' || !id.trim())
      )
        throw fail('INVALID_ARGUMENT', 'Invalid diagnostics runner scope');
      const runnerIds = new Set(options.runnerIds);
      const budget = options.maxTotalBytes ?? 200 * 1024 * 1024;
      if (
        !Number.isSafeInteger(budget) ||
        budget < 128 * 1024 ||
        budget > 300 * 1024 * 1024
      )
        throw fail('INVALID_ARGUMENT', 'Invalid diagnostics total budget');
      active = true;
      let directory: string | undefined;
      let timer: NodeJS.Timeout | undefined;
      const controllers: AbortController[] = [];

      try {
        await mkdir(options.directory, { recursive: true, mode: 0o700 });
        directory = await mkdtemp(
          path.join(options.directory, 'runner-diagnostics-'),
        );
        const runners = (await list()).filter((runner) =>
          runnerIds.has(runner.id),
        );
        const eligible = runners.filter(
          (runner) =>
            runner.status === 'online' &&
            runner.features.includes(DIAGNOSTICS_FEATURE),
        );
        const count = Math.min(
          128,
          eligible.length,
          Math.floor(budget / (128 * 1024)),
        );
        const allowance = Math.min(
          DIAGNOSTICS_MAX_BYTES,
          Math.floor(budget / Math.max(count, 1)),
        );
        const expiresAt = new Date(
          Date.now() +
            Math.min(45_000, Math.max(1, options.timeoutMs ?? 45_000)),
        ).toISOString();
        let assigned = 0;
        const jobs = runners.map((runner): Promise<RunnerDiagnosticsResult> => {
          if (runner.status !== 'online')
            return Promise.resolve({ runnerId: runner.id, status: 'offline' });
          if (!runner.features.includes(DIAGNOSTICS_FEATURE))
            return Promise.resolve({
              runnerId: runner.id,
              status: 'unsupported',
            });
          if (assigned++ >= count)
            return Promise.resolve({ runnerId: runner.id, status: 'capacity' });
          return new Promise((resolve) => {
            const request: DiagnosticsRequest = {
              requestId: randomUUID(),
              window,
              maxBytes: allowance,
              expiresAt,
            };
            const controller = new AbortController();
            controllers.push(controller);
            const item: Pending = {
              runnerId: runner.id,
              request,
              directory: path.join(directory!, String(assigned)),
              sent: false,
              uploading: false,
              controller,
              finish(result) {
                if (!pending.delete(runner.id)) return;
                if (item.sent) dispatched--;
                resolve(result);
              },
            };
            pending.set(runner.id, item);
          });
        });
        timer = setTimeout(
          () => {
            for (const item of [...pending.values()]) {
              item.controller.abort();
              item.finish({ runnerId: item.runnerId, status: 'timeout' });
            }
          },
          Math.max(1, Date.parse(expiresAt) - Date.now()),
        );
        const results = await Promise.all(jobs);
        clearTimeout(timer);
        // A timed-out upload may still be removing its partial directory. Never hand it to the packager.
        await Promise.allSettled([...uploads]);
        let disposed = false;
        return {
          directory,
          runners: results,
          async dispose() {
            if (disposed) return;
            disposed = true;
            for (const controller of controllers) controller.abort();
            await Promise.allSettled([...uploads]);
            await rm(directory!, { recursive: true, force: true });
            active = false;
          },
        };
      } catch (error) {
        if (timer) clearTimeout(timer);
        for (const item of [...pending.values()]) {
          item.controller.abort();
          item.finish({ runnerId: item.runnerId, status: 'failed' });
        }
        if (directory) await rm(directory, { recursive: true, force: true });
        active = false;
        throw error;
      }
    },
    take(runnerId) {
      const item = pending.get(runnerId);
      if (
        !item ||
        item.sent ||
        dispatched >= 2 ||
        Date.now() >= Date.parse(item.request.expiresAt)
      )
        return;
      item.sent = true;
      dispatched++;
      return item.request;
    },
    async accept(runnerId, requestId, body) {
      const item = pending.get(runnerId);
      if (
        !item ||
        !item.sent ||
        item.uploading ||
        item.request.requestId !== requestId ||
        Date.now() >= Date.parse(item.request.expiresAt)
      )
        throw fail(
          'PERMISSION_DENIED',
          'No unconsumed diagnostics request belongs to this runner',
        );
      item.uploading = true;
      const request = item.request;
      const seen = new Map<string, number>();
      const redactLines = new Map<
        string,
        ReturnType<typeof createLogLineSanitizer>
      >();
      let environment = false;
      let manifest:
        { files: DiagnosticsFile[]; truncated: boolean } | undefined;
      const dates = new Set(diagnosticsDates(request.window));
      const selected = new Set(request.window.runIds);
      const allowedFile = (file: string) => {
        const date = /\d{4}-\d{2}-\d{2}/.exec(file)?.[0];
        return (
          date &&
          (dates.has(date) ||
            (file.startsWith('runs/') &&
              selected.has(
                path.basename(file).replace(/\.(?:log|stderr)$/, ''),
              )))
        );
      };
      const upload = (async () => {
        const writer = new DiagnosticsWriter(item.directory);
        let written = 0;
        try {
          await mkdir(item.directory, { recursive: true, mode: 0o700 });
          await pipeline(
            Readable.from(body),
            limit(request.maxBytes),
            createGunzip(),
            limit(request.maxBytes),
            async (input) => {
              for await (const line of boundedLogLines(
                input as AsyncIterable<Uint8Array>,
                DIAGNOSTICS_MAX_RECORD,
              )) {
                if (line === null)
                  throw fail(
                    'RESOURCE_EXHAUSTED',
                    'Diagnostics record is too large',
                  );
                let raw: unknown;
                try {
                  raw = JSON.parse(line);
                } catch {
                  throw fail('INVALID_ARGUMENT', 'Invalid diagnostics JSON');
                }
                const parsed = DiagnosticsRecordSchema.safeParse(raw);
                if (!parsed.success)
                  throw fail('INVALID_ARGUMENT', 'Invalid diagnostics record');
                const record = parsed.data;
                if (manifest)
                  throw fail(
                    'INVALID_ARGUMENT',
                    'Diagnostics manifest must be the final record',
                  );
                if (record.type === 'environment') {
                  if (environment || seen.size)
                    throw fail(
                      'INVALID_ARGUMENT',
                      'Duplicate or misplaced diagnostics environment',
                    );
                  environment = true;
                  const file = await open(
                    path.join(item.directory, 'environment.json'),
                    'wx',
                    0o600,
                  );
                  const text = JSON.stringify(sanitizeLog(record)) + '\n';
                  written += Buffer.byteLength(text);
                  if (written > request.maxBytes) {
                    await file.close();
                    throw fail(
                      'RESOURCE_EXHAUSTED',
                      'Diagnostics output exceeds its byte budget',
                    );
                  }
                  try {
                    await file.writeFile(text);
                  } finally {
                    await file.close();
                  }
                } else if (record.type === 'log') {
                  if (!environment || !allowedFile(record.file))
                    throw fail(
                      'INVALID_ARGUMENT',
                      'Unexpected diagnostics log source',
                    );
                  if (
                    !seen.has(record.file) &&
                    (record.file.startsWith('runs/') &&
                    selected.has(
                      path
                        .basename(record.file)
                        .replace(/\.(?:log|stderr)$/, ''),
                    )
                      ? seen.size >= 512
                      : [...seen.keys()].filter(
                          (file) =>
                            !(
                              file.startsWith('runs/') &&
                              selected.has(
                                path
                                  .basename(file)
                                  .replace(/\.(?:log|stderr)$/, ''),
                              )
                            ),
                        ).length >= 64)
                  )
                    throw fail(
                      'RESOURCE_EXHAUSTED',
                      'Too many diagnostics log sources',
                    );
                  const time =
                    typeof record.entry.time === 'number'
                      ? record.entry.time
                      : Date.parse(record.entry.time);
                  if (!Number.isFinite(time))
                    throw fail(
                      'INVALID_ARGUMENT',
                      'Invalid diagnostics log time',
                    );
                  let redact = redactLines.get(record.file);
                  if (!redact) {
                    redact = createLogLineSanitizer();
                    redactLines.set(record.file, redact);
                  }
                  const text =
                    JSON.stringify(
                      sanitizeLog({
                        ...record.entry,
                        msg: redact(record.entry.msg),
                      }),
                    ) + '\n';
                  written += Buffer.byteLength(text);
                  if (written > request.maxBytes)
                    throw fail(
                      'RESOURCE_EXHAUSTED',
                      'Diagnostics output exceeds its byte budget',
                    );
                  await writer.write(record.file, text);
                  seen.set(
                    record.file,
                    (seen.get(record.file) ?? 0) + Buffer.byteLength(text),
                  );
                } else {
                  if (
                    !environment ||
                    record.files.length > 512 ||
                    record.files.filter(
                      (file) =>
                        !(
                          file.file.startsWith('runs/') &&
                          selected.has(
                            path
                              .basename(file.file)
                              .replace(/\.(?:log|stderr)$/, ''),
                          )
                        ),
                    ).length > 64 ||
                    new Set(record.files.map((file) => file.file)).size !==
                      record.files.length ||
                    record.files.some((file) => !allowedFile(file.file)) ||
                    [...seen.keys()].some(
                      (name) =>
                        !record.files.some((file) => file.file === name),
                    )
                  )
                    throw fail(
                      'INVALID_ARGUMENT',
                      'Invalid diagnostics manifest',
                    );
                  manifest = {
                    files: record.files.map((file) => ({
                      ...file,
                      dates: [/\d{4}-\d{2}-\d{2}/.exec(file.file)![0]],
                      bytes: seen.get(file.file) ?? 0,
                    })),
                    truncated: record.truncated,
                  };
                }
              }
            },
            { signal: item.controller.signal },
          );
          await writer.close();
          if (!manifest || !environment)
            throw fail('INVALID_ARGUMENT', 'Diagnostics upload is incomplete');
          item.finish({
            runnerId,
            status: 'collected',
            directory: item.directory,
            files: manifest.files,
            truncated: manifest.truncated,
          });
        } catch (error) {
          await writer.close().catch(() => undefined);
          await rm(item.directory, { recursive: true, force: true });
          item.finish({
            runnerId,
            status:
              error instanceof ApiError && error.status === 'RESOURCE_EXHAUSTED'
                ? 'too_large'
                : 'failed',
          });
          throw error;
        }
      })();
      uploads.add(upload);
      try {
        await upload;
      } finally {
        uploads.delete(upload);
      }
    },
  };
  return service;
}
