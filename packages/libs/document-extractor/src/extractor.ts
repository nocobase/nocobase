import { Worker } from 'node:worker_threads';
import { isParsed } from './formats.js';
import type {
  ExtractOptions,
  ExtractRequest,
  ExtractResponse,
  TextExtractor,
  WorkerExtractorOptions,
} from './types.js';

interface Task {
  request: ExtractRequest;
  options: ExtractOptions;
  resolve(response: ExtractResponse): void;
  timer: ReturnType<typeof setTimeout>;
  abort: () => void;
  worker?: Worker;
  running: boolean;
  settled: boolean;
}
function positive(value: number, name: string, zero = false): number {
  if (!Number.isSafeInteger(value) || value < (zero ? 0 : 1))
    throw new RangeError(
      `${name} must be a ${zero ? 'non-negative' : 'positive'} safe integer.`,
    );
  return value;
}
const failure = (
  error: string,
  code?: 'aborted' | 'timeout' | 'too-large',
): ExtractResponse => ({ status: 'failed', error, ...(code ? { code } : {}) });

/** Owns only this factory's running Workers and waiting requests. */
class Extractor {
  private readonly queue: Task[] = [];
  private active = 0;
  private readonly timeoutMs: number;
  private readonly concurrency: number;
  private readonly maxQueue: number;
  private readonly maxInputBytes: number;
  constructor(options: WorkerExtractorOptions) {
    this.timeoutMs = positive(options.timeoutMs ?? 300_000, 'timeoutMs');
    this.concurrency = positive(options.concurrency ?? 2, 'concurrency');
    this.maxQueue = positive(options.maxQueue ?? 32, 'maxQueue', true);
    this.maxInputBytes = positive(
      options.maxInputBytes ?? 100 * 1024 * 1024,
      'maxInputBytes',
    );
  }
  extract(
    request: ExtractRequest,
    options: ExtractOptions = {},
  ): Promise<ExtractResponse> {
    if (options.signal?.aborted)
      return Promise.resolve(failure('Extraction was cancelled.', 'aborted'));
    if (request.bytes.byteLength > this.maxInputBytes)
      return Promise.resolve(
        failure('The document exceeds its byte budget.', 'too-large'),
      );
    if (!isParsed(request.ext))
      return Promise.resolve({ status: 'unsupported' });
    if (options.maxOutputChars !== undefined)
      positive(options.maxOutputChars, 'maxOutputChars', true);
    if (this.active >= this.concurrency && this.queue.length >= this.maxQueue)
      return Promise.resolve(failure('The document extraction queue is full.'));
    return new Promise((resolve) => {
      const task: Task = {
        request,
        options,
        resolve,
        running: false,
        settled: false,
        timer: setTimeout(() => {
          void this.finish(
            task,
            failure('Document extraction timed out.', 'timeout'),
          );
        }, this.timeoutMs),
        abort: () => {
          void this.finish(
            task,
            failure('Extraction was cancelled.', 'aborted'),
          );
        },
      };
      options.signal?.addEventListener('abort', task.abort, { once: true });
      this.queue.push(task);
      this.drain();
    });
  }
  private drain(): void {
    while (this.active < this.concurrency && this.queue.length) {
      const task = this.queue.shift()!;
      task.running = true;
      this.active += 1;
      try {
        const source = import.meta.url.endsWith('.ts')
          ? 'worker.ts'
          : 'worker.js';
        const worker = new Worker(new URL(`./${source}`, import.meta.url), {
          workerData: { mark: '@nocobase/document-extractor/parser' },
        });
        task.worker = worker;
        worker.once('message', (response: ExtractResponse) => {
          void this.finish(task, response);
        });
        worker.once('error', () => {
          void this.finish(task, failure('The document parser failed.'));
        });
        worker.once('exit', () => {
          void this.finish(
            task,
            failure('The document parser stopped before returning a result.'),
          );
        });
        const bytes = new Uint8Array(task.request.bytes);
        worker.postMessage(
          {
            ...task.request,
            bytes,
            maxOutputChars: task.options.maxOutputChars,
            omitEmbeddedImages: task.options.omitEmbeddedImages,
          },
          [bytes.buffer],
        );
      } catch {
        void this.finish(task, failure('The document parser could not start.'));
      }
    }
  }
  private async finish(task: Task, response: ExtractResponse): Promise<void> {
    if (task.settled) return;
    task.settled = true;
    clearTimeout(task.timer);
    task.options.signal?.removeEventListener('abort', task.abort);
    const index = this.queue.indexOf(task);
    if (index >= 0) this.queue.splice(index, 1);
    // Keep the slot occupied and the caller waiting until termination actually finishes.
    if (task.worker) await task.worker.terminate();
    if (task.running) this.active -= 1;
    task.resolve(response);
    this.drain();
  }
}

export function workerExtractor(
  options: WorkerExtractorOptions = {},
): TextExtractor {
  const extractor = new Extractor(options);
  return (request, extractOptions) =>
    extractor.extract(request, extractOptions);
}
