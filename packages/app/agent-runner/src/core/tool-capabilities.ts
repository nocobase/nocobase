import {
  ToolInfoSchema,
  type AgentTool,
  type ToolInfo,
} from '../protocol/index.ts';
import type { AgentAdapter } from '../agent/adapters/types.ts';

export const MODEL_REFRESH_INTERVAL_MS: number = 5 * 60_000;
export const MODEL_DETECTION_TIMEOUT_MS = 30_000;

/** Refresh without making heartbeats or claims wait; every tool settles independently. */
export class ToolCapabilitiesCache {
  private pending?: Promise<void>;
  private lastRefresh = -Infinity;
  private readonly stopped = new AbortController();
  private readonly adapters: ReadonlyMap<AgentTool, AgentAdapter>;
  public tools: readonly ToolInfo[];
  private readonly now: () => number;
  private readonly timeoutMs: number;
  constructor(
    adapters: ReadonlyMap<AgentTool, AgentAdapter>,
    tools: readonly ToolInfo[],
    now: () => number = Date.now,
    timeoutMs: number = MODEL_DETECTION_TIMEOUT_MS,
  ) {
    this.adapters = adapters;
    this.tools = tools;
    this.now = now;
    this.timeoutMs = timeoutMs;
  }

  refresh(): void {
    if (
      this.stopped.signal.aborted ||
      this.pending ||
      this.now() - this.lastRefresh < MODEL_REFRESH_INTERVAL_MS
    )
      return;
    this.lastRefresh = this.now();
    this.pending = Promise.all(
      this.tools.map(async (tool) => {
        const adapter = this.adapters.get(tool.kind);
        const controller = new AbortController();
        const signal = AbortSignal.any([
          controller.signal,
          this.stopped.signal,
        ]);
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        let onAbort: () => void = () => {};
        try {
          const aborted = new Promise<never>((_resolve, reject) => {
            onAbort = () => reject(new Error('Model detection timed out'));
            signal.addEventListener('abort', onAbort, { once: true });
            if (signal.aborted) reject(new Error('Model detection timed out'));
          });
          const capability = await Promise.race([
            adapter?.detectModels?.(signal) ??
              Promise.resolve({
                modelsDetectionStatus: 'unsupported' as const,
              }),
            aborted,
          ]);
          const {
            models: _models,
            modelsDetectionStatus: _status,
            modelsDetectedAt: _at,
            modelsDetectionError: _error,
            ...base
          } = tool;
          const result = ToolInfoSchema.parse({
            ...base,
            // A failed detection clears old suggestions rather than advertising them as currently available.
            models:
              capability.modelsDetectionStatus === 'detected'
                ? capability.models
                : undefined,
            modelsDetectionStatus: capability.modelsDetectionStatus,
            modelsDetectionError:
              capability.modelsDetectionStatus === 'failed'
                ? capability.modelsDetectionError
                : undefined,
            modelsDetectedAt: new Date(this.now()).toISOString(),
          });
          this.replace(tool.kind, result);
        } catch {
          const { models: _models, ...base } = tool;
          this.replace(tool.kind, {
            ...base,
            modelsDetectionStatus: 'failed',
            modelsDetectionError: signal.aborted
              ? 'Model detection timed out'
              : 'Model detection failed',
            modelsDetectedAt: new Date(this.now()).toISOString(),
          });
        } finally {
          signal.removeEventListener('abort', onAbort);
          clearTimeout(timer);
        }
      }),
    ).then(() => {
      this.pending = undefined;
    });
  }

  private replace(kind: AgentTool, value: ToolInfo): void {
    if (!this.stopped.signal.aborted)
      this.tools = this.tools.map((tool) =>
        tool.kind === kind ? value : tool,
      );
  }
  stop(): void {
    this.stopped.abort();
  }
}
