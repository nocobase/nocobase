import {
  ToolInfoSchema,
  type AgentTool,
  type ToolInfo,
} from '../protocol/index.ts';
import type { AgentAdapter } from '../agent/adapters/types.ts';

export const MODEL_REFRESH_INTERVAL_MS: number = 5 * 60_000;
export const MODEL_DETECTION_TIMEOUT_MS = 30_000;
export const TOOL_DETECTION_TIMEOUT_MS = 30_000;
const CLEANUP_TIMEOUT_MS = 3_000;

/** A deadline also cancels the command; late results never reach the cache. */
async function bounded<T>(
  detect: (signal: AbortSignal) => Promise<T>,
  stop: AbortSignal,
  timeout: number,
): Promise<T> {
  const controller = new AbortController();
  const signal = AbortSignal.any([stop, controller.signal]);
  const timer = setTimeout(() => controller.abort(), timeout);
  let onAbort: () => void = () => {};
  try {
    signal.throwIfAborted();
    const aborted = new Promise<never>((_resolve, reject) => {
      onAbort = () => reject(new Error('Detection cancelled'));
      signal.addEventListener('abort', onAbort, { once: true });
    });
    return await Promise.race([detect(signal), aborted]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}

export async function detectTools(
  adapters: ReadonlyMap<AgentTool, AgentAdapter>,
  signal: AbortSignal = new AbortController().signal,
): Promise<ToolInfo[]> {
  const results = await Promise.all(
    [...adapters].map(
      async ([kind, adapter]): Promise<ToolInfo | undefined> => {
        try {
          const { installed, ...base } = await bounded(
            (input) => adapter.detect(input),
            signal,
            TOOL_DETECTION_TIMEOUT_MS,
          );
          if (!signal.aborted)
            return ToolInfoSchema.parse({
              kind,
              ...base,
              status:
                base.status ??
                (installed
                  ? base.authenticated
                    ? 'ready'
                    : 'needsLogin'
                  : 'notInstalled'),
            });
        } catch {
          // A failed inspection must not advertise the previous installation.
        }
        return signal.aborted
          ? undefined
          : { kind, authenticated: false, status: 'failed' };
      },
    ),
  );
  return results.filter((tool): tool is ToolInfo => tool !== undefined);
}

/** Fresh inspection instances never replace the adapters driving active runs. */
export class ToolCapabilitiesCache {
  private pending?: Promise<void>;
  private readonly detecting = new Set<Promise<unknown>>();
  private lastRefresh = -Infinity;
  private readonly fingerprints = new Map<AgentTool, string>();
  private force = new Set<AgentTool>();
  private readonly stopped = new AbortController();
  private readonly adaptersFor: () => ReadonlyMap<AgentTool, AgentAdapter>;
  public tools: readonly ToolInfo[];
  private readonly now: () => number;
  private readonly timeoutMs: number;
  constructor(
    adaptersFor: () => ReadonlyMap<AgentTool, AgentAdapter>,
    tools: readonly ToolInfo[],
    now: () => number = Date.now,
    timeoutMs: number = MODEL_DETECTION_TIMEOUT_MS,
  ) {
    this.adaptersFor = adaptersFor;
    this.tools = tools;
    this.now = now;
    this.timeoutMs = timeoutMs;
  }

  invalidate(): void {
    this.force = new Set(this.adaptersFor().keys());
    this.lastRefresh = -Infinity;
    this.refresh();
  }

  refresh(): void {
    if (
      this.stopped.signal.aborted ||
      this.pending ||
      this.now() - this.lastRefresh < MODEL_REFRESH_INTERVAL_MS
    )
      return;
    this.lastRefresh = this.now();
    const adapters = [...this.adaptersFor()];
    const forced = this.force;
    this.force = new Set();
    let cursor = 0;
    const inspectNext = async (): Promise<void> => {
      while (cursor < adapters.length && !this.stopped.signal.aborted) {
        const [kind, adapter] = adapters[cursor++];
        try {
          const fingerprint = adapter.fingerprint
            ? await adapter.fingerprint()
            : undefined;
          if (
            fingerprint !== undefined &&
            this.fingerprints.get(kind) === fingerprint &&
            !forced.has(kind)
          )
            continue;
          if (fingerprint !== undefined)
            this.fingerprints.set(kind, fingerprint);
          const detected = await this.inspect((signal) =>
            adapter.detect(signal),
          );
          const { installed, ...fields } = detected;
          const base = ToolInfoSchema.parse({
            kind,
            ...fields,
            status:
              fields.status ??
              (installed
                ? fields.authenticated
                  ? 'ready'
                  : 'needsLogin'
                : 'notInstalled'),
          });
          if (!installed || !base.authenticated) {
            this.replace(kind, base);
            continue;
          }
          if (!adapter.detectModels) {
            this.replace(kind, {
              ...base,
              modelsDetectionStatus:
                base.modelsDetectionStatus ?? 'unsupported',
            });
            continue;
          }
          try {
            const capability = await this.inspect((signal) =>
              adapter.detectModels!(signal),
            );
            this.replace(
              kind,
              ToolInfoSchema.parse({
                ...base,
                ...capability,
                modelsDetectedAt: new Date(this.now()).toISOString(),
              }),
            );
          } catch (error) {
            this.replace(kind, {
              ...base,
              modelsDetectionStatus: 'failed',
              modelsDetectionError:
                error instanceof Error &&
                error.message === 'Detection cancelled'
                  ? 'Model detection timed out'
                  : 'Model detection failed',
              modelsDetectedAt: new Date(this.now()).toISOString(),
            });
          }
        } catch {
          this.replace(kind, { kind, authenticated: false, status: 'failed' });
        }
      }
    };
    this.pending = Promise.all([inspectNext(), inspectNext()])
      .then(() => undefined)
      .finally(async () => {
        await this.cleanup();
        this.pending = undefined;
        if (this.force.size) this.refresh();
      });
  }

  private inspect<T>(detect: (signal: AbortSignal) => Promise<T>): Promise<T> {
    return bounded(
      (signal) => {
        const work = detect(signal);
        this.detecting.add(work);
        void work.then(
          () => this.detecting.delete(work),
          () => this.detecting.delete(work),
        );
        return work;
      },
      this.stopped.signal,
      this.timeoutMs,
    );
  }

  private replace(kind: AgentTool, value?: ToolInfo): void {
    if (this.stopped.signal.aborted) return;
    const index = this.tools.findIndex((tool) => tool.kind === kind);
    this.tools =
      index < 0
        ? [...this.tools, ...(value ? [value] : [])]
        : this.tools.flatMap((tool) =>
            tool.kind === kind ? (value ? [value] : []) : [tool],
          );
  }

  private async cleanup(): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([
      Promise.allSettled([...this.detecting]),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, CLEANUP_TIMEOUT_MS);
      }),
    ]);
    clearTimeout(timer);
    this.detecting.clear();
  }

  async stop(): Promise<void> {
    this.stopped.abort();
    await this.cleanup();
  }
}
