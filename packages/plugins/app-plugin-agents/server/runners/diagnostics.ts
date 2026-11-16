import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, open, rm, type FileHandle } from 'node:fs/promises';
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
  files?: DiagnosticsFile[];
  truncated?: boolean;
}
export interface RunnerDiagnosticsCollection {
  runners: RunnerDiagnosticsResult[];
}
export interface RunnerDiagnosticsProgress {
  runnerId: string;
  status: 'waiting' | 'uploading' | 'collected' | DiagnosticsSkip;
  /** Sanitized output bytes received, including environment.json. */
  bytes: number;
  truncated?: boolean;
}
export interface RunnerDiagnosticsFile {
  runnerId: string;
  /** Safe archive-relative name, including environment.json. */
  file: string;
  path: string;
  signal: AbortSignal;
  bytes: number;
}
export interface RunnerDiagnostics {
  /** Caller authorizes the scope and consumes each file before the callback resolves. No files survive collect(). */
  collect(options: {
    runnerIds: readonly string[];
    window: DiagnosticsWindow;
    directory: string;
    timeoutMs?: number;
    maxTotalBytes?: number;
    signal?: AbortSignal;
    onFile(file: RunnerDiagnosticsFile): Promise<void>;
    /** Callback failures abort this collection. Handle asynchronous publish failures in the caller. */
    onProgress?(progress: RunnerDiagnosticsProgress): void;
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
  sent: boolean;
  uploading: boolean;
  controller: AbortController;
  consume(this: void, body: AsyncIterable<Uint8Array>): Promise<void>;
  progress(
    status: RunnerDiagnosticsProgress['status'],
    bytes: number,
    truncated?: boolean,
  ): void;
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
  const pending = new Map<string, Pending[]>();
  const uploadingRunners = new Set<string>();
  return {
    async collect(options) {
      const window = DiagnosticsWindowSchema.parse(options.window);
      if (
        !Array.isArray(options.runnerIds) ||
        options.runnerIds.some((id) => typeof id !== 'string' || !id.trim())
      )
        throw fail('INVALID_ARGUMENT', 'Invalid diagnostics runner scope');
      const budget = options.maxTotalBytes ?? 200 * 1024 * 1024;
      if (
        !Number.isSafeInteger(budget) ||
        budget < 128 * 1024 ||
        budget > 300 * 1024 * 1024
      )
        throw fail('INVALID_ARGUMENT', 'Invalid diagnostics total budget');
      options.signal?.throwIfAborted();
      await mkdir(options.directory, { recursive: true, mode: 0o700 });
      const directory = await mkdtemp(
        path.join(options.directory, 'runner-diagnostics-'),
      );
      const controller = new AbortController();
      const items: Pending[] = [];
      const uploads = new Set<Promise<void>>();
      // Serialize upload consumption within this export. Other exports have independent sinks.
      let tail: Promise<void> = Promise.resolve();
      let timer: NodeJS.Timeout | undefined;
      let progressError: Error | undefined;
      const report = (event: RunnerDiagnosticsProgress) => {
        if (progressError) return;
        try {
          options.onProgress?.(event);
        } catch (error) {
          progressError =
            error instanceof Error ? error : new Error(String(error));
          controller.abort(progressError);
          for (const item of items)
            item.finish({ runnerId: item.runnerId, status: 'failed' });
        }
      };
      const abort = () => {
        controller.abort(options.signal?.reason);
        for (const item of items)
          item.finish({ runnerId: item.runnerId, status: 'failed' });
      };
      options.signal?.addEventListener('abort', abort, { once: true });
      try {
        const scope = new Set(options.runnerIds);
        const runners = (await list()).filter((runner) => scope.has(runner.id));
        options.signal?.throwIfAborted();
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
            Math.min(120_000, Math.max(1, options.timeoutMs ?? 120_000)),
        ).toISOString();
        let assigned = 0;
        const jobs = runners.map((runner): Promise<RunnerDiagnosticsResult> => {
          const skip = (status: DiagnosticsSkip) => {
            report({ runnerId: runner.id, status, bytes: 0 });
            return Promise.resolve({ runnerId: runner.id, status });
          };
          if (runner.status !== 'online') return skip('offline');
          if (!runner.features.includes(DIAGNOSTICS_FEATURE))
            return skip('unsupported');
          if (assigned++ >= count) return skip('capacity');
          return new Promise((resolve) => {
            let finished = false;
            let bytes = 0;
            const item: Pending = {
              runnerId: runner.id,
              request: {
                requestId: randomUUID(),
                window,
                maxBytes: allowance,
                expiresAt,
              },
              sent: false,
              uploading: false,
              controller: new AbortController(),
              progress(status, received, truncated) {
                bytes = received;
                report({
                  runnerId: runner.id,
                  status,
                  bytes,
                  ...(truncated === undefined ? {} : { truncated }),
                });
              },
              finish(result) {
                if (finished) return;
                finished = true;
                const queue = pending.get(runner.id)!;
                queue.splice(queue.indexOf(item), 1);
                if (!queue.length) pending.delete(runner.id);
                resolve(result);
                item.progress(result.status, bytes, result.truncated);
              },
              async consume(body) {
                const previous = tail;
                let release!: () => void;
                tail = new Promise<void>((resolve) => {
                  release = resolve;
                });
                const signal = AbortSignal.any([
                  controller.signal,
                  item.controller.signal,
                ]);
                const source =
                  body instanceof Readable ? body : Readable.from(body);
                const stop = () => {
                  source.destroy();
                };
                source.on('error', () => item.controller.abort());
                signal.addEventListener('abort', stop, { once: true });
                let handle: FileHandle | undefined;
                const currentPath = path.join(directory, 'current');
                let current: string | undefined;
                let fileBytes = 0;
                let buffered = '';
                let lastProgress = 0;
                const seen = new Map<string, number>();
                let environment = false;
                let manifest:
                  { files: DiagnosticsFile[]; truncated: boolean } | undefined;
                let redact = createLogLineSanitizer();
                const dates = new Set(diagnosticsDates(window));
                const selected = new Set(window.runIds);
                const allowed = (file: string) => {
                  const date = /\d{4}-\d{2}-\d{2}/.exec(file)?.[0];
                  return (
                    date &&
                    dates.has(date) &&
                    (!file.startsWith('runs/') ||
                      window.runIds === undefined ||
                      selected.has(
                        path.basename(file).replace(/\.(?:log|stderr)$/, ''),
                      ))
                  );
                };
                const flush = async () => {
                  if (buffered) {
                    await handle!.writeFile(buffered);
                    buffered = '';
                  }
                };
                const consumeFile = async () => {
                  if (!handle) return;
                  await flush();
                  await handle.close();
                  handle = undefined;
                  signal.throwIfAborted();
                  try {
                    await options.onFile({
                      runnerId: runner.id,
                      file: current!,
                      path: currentPath,
                      signal,
                      bytes: fileBytes,
                    });
                    signal.throwIfAborted();
                  } finally {
                    await rm(currentPath, { force: true });
                  }
                };
                const write = async (file: string, text: string) => {
                  if (file !== current) {
                    await consumeFile();
                    if (seen.has(file))
                      throw fail(
                        'INVALID_ARGUMENT',
                        'Diagnostics files must not be interleaved',
                      );
                    handle = await open(currentPath, 'wx', 0o600);
                    current = file;
                    fileBytes = 0;
                  }
                  const size = Buffer.byteLength(text);
                  bytes += size;
                  fileBytes += size;
                  if (bytes > allowance)
                    throw fail(
                      'RESOURCE_EXHAUSTED',
                      'Diagnostics output exceeds its byte budget',
                    );
                  buffered += text;
                  if (Buffer.byteLength(buffered) >= 64 * 1024) await flush();
                  seen.set(file, fileBytes);
                  if (Date.now() - lastProgress >= 500) {
                    item.progress('uploading', bytes);
                    lastProgress = Date.now();
                  }
                };
                let result: RunnerDiagnosticsResult;
                let failure: Error | undefined;
                try {
                  await previous;
                  signal.throwIfAborted();
                  item.progress('uploading', 0);
                  lastProgress = Date.now();
                  await pipeline(
                    source,
                    limit(allowance),
                    createGunzip(),
                    limit(allowance),
                    async (input) => {
                      for await (const line of boundedLogLines(
                        input as AsyncIterable<Uint8Array>,
                        DIAGNOSTICS_MAX_RECORD,
                      )) {
                        signal.throwIfAborted();
                        if (line === null)
                          throw fail(
                            'RESOURCE_EXHAUSTED',
                            'Diagnostics record is too large',
                          );
                        let raw: unknown;
                        try {
                          raw = JSON.parse(line);
                        } catch {
                          throw fail(
                            'INVALID_ARGUMENT',
                            'Invalid diagnostics JSON',
                          );
                        }
                        const parsed = DiagnosticsRecordSchema.safeParse(raw);
                        if (!parsed.success)
                          throw fail(
                            'INVALID_ARGUMENT',
                            'Invalid diagnostics record',
                          );
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
                          await write(
                            'environment.json',
                            JSON.stringify(sanitizeLog(record)) + '\n',
                          );
                        } else if (record.type === 'log') {
                          if (!environment || !allowed(record.file))
                            throw fail(
                              'INVALID_ARGUMENT',
                              'Unexpected diagnostics log source',
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
                          // Switching sources also resets multiline secret state before sanitizing the first entry.
                          if (current !== record.file)
                            redact = createLogLineSanitizer();
                          const text =
                            JSON.stringify(
                              sanitizeLog({
                                ...record.entry,
                                msg: redact(record.entry.msg),
                              }),
                            ) + '\n';
                          await write(record.file, text);
                        } else {
                          if (
                            !environment ||
                            new Set(record.files.map((file) => file.file))
                              .size !== record.files.length ||
                            record.files.some((file) => !allowed(file.file)) ||
                            [...seen.keys()].some(
                              (name) =>
                                name !== 'environment.json' &&
                                !record.files.some(
                                  (file) => file.file === name,
                                ),
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
                    { signal },
                  );
                  if (!manifest || !environment)
                    throw fail(
                      'INVALID_ARGUMENT',
                      'Diagnostics upload is incomplete',
                    );
                  await consumeFile();
                  result = {
                    runnerId: runner.id,
                    status: 'collected',
                    files: manifest.files,
                    truncated: manifest.truncated,
                  };
                } catch (error) {
                  failure =
                    error instanceof Error ? error : new Error(String(error));
                  result = {
                    runnerId: runner.id,
                    status:
                      error instanceof ApiError &&
                      error.status === 'RESOURCE_EXHAUSTED'
                        ? 'too_large'
                        : 'failed',
                  };
                } finally {
                  signal.removeEventListener('abort', stop);
                  source.destroy();
                  try {
                    try {
                      await handle?.close();
                    } finally {
                      await rm(currentPath, { force: true });
                    }
                  } catch (error) {
                    failure =
                      error instanceof Error ? error : new Error(String(error));
                    result = { runnerId: runner.id, status: 'failed' };
                  } finally {
                    release();
                  }
                }
                item.finish(result);
                if (failure) throw failure;
              },
            };
            items.push(item);
            pending.set(runner.id, [...(pending.get(runner.id) ?? []), item]);
          });
        });
        if (progressError) throw progressError;
        timer = setTimeout(
          () => {
            for (const item of items) {
              item.controller.abort();
              item.finish({ runnerId: item.runnerId, status: 'timeout' });
            }
          },
          Math.max(1, Date.parse(expiresAt) - Date.now()),
        );
        // Keep only this collection's active uploads so an unrelated export cannot delay cleanup.
        for (const item of items) {
          const consume = item.consume;
          item.consume = async (body) => {
            const upload = consume(body);
            uploads.add(upload);
            try {
              await upload;
            } finally {
              uploads.delete(upload);
            }
          };
        }
        const results = await Promise.all(jobs);
        await Promise.allSettled([...uploads]);
        options.signal?.throwIfAborted();
        if (progressError)
          throw new Error('Diagnostics progress callback failed', {
            cause: progressError,
          });
        return { runners: results };
      } finally {
        if (timer) clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
        controller.abort();
        for (const item of items)
          item.finish({ runnerId: item.runnerId, status: 'failed' });
        await Promise.allSettled([...uploads]);
        await rm(directory, { recursive: true, force: true });
      }
    },
    take(runnerId) {
      const item = pending.get(runnerId)?.[0];
      if (
        !item ||
        item.sent ||
        uploadingRunners.has(runnerId) ||
        Date.now() >= Date.parse(item.request.expiresAt)
      )
        return;
      item.sent = true;
      item.progress('waiting', 0);
      return item.request;
    },
    async accept(runnerId, requestId, body) {
      const item = pending.get(runnerId)?.[0];
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
      uploadingRunners.add(runnerId);
      try {
        await item.consume(body);
      } finally {
        uploadingRunners.delete(runnerId);
      }
    },
  };
}
