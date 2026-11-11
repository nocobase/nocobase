/**
 * Which quota marks and usage samples a runtime shows for a tool or one of its providers or models. The runtime sheet's
 * quota cell (`quota.tsx`) and the list's quota summary (`tool-quota.tsx`) both read quota through it, so they agree.
 */
import type { AgentTool } from '@nocobase/agent-protocol';
import {
  quotaCurrent,
  type Runner,
  type RunnerQuotaUsage,
  type UnavailableModel,
} from '../../../shared/runners.js';

export type QuotaSource = Pick<
  Runner,
  'unavailableModels' | 'quotaUsage' | 'quotaLimits'
>;

export interface QuotaView {
  /** Current quota marks: the tool, provider or model takes no work until they reset or are cleared. */
  readonly marks: readonly UnavailableModel[];
  /** Usage samples with a percentage worth showing. */
  readonly usage: readonly RunnerQuotaUsage[];
  /** Not marked, but a window is at 90% or more. */
  readonly near: boolean;
}

/** Providers of opencode and pi report their own quota; the list sums them up instead of naming each. */
export function providerTool(tool: AgentTool): boolean {
  return tool === 'opencode' || tool === 'pi';
}

/** `target` is a provider or model, or empty for the whole tool. */
export function quotaView(
  runner: QuotaSource,
  tool: AgentTool,
  target: string,
  now: number,
): QuotaView {
  const marks = (runner.unavailableModels ?? []).filter(
    (m) =>
      m.reason === 'toolQuota' &&
      m.tool === tool &&
      m.model === target &&
      quotaCurrent(m, now),
  );
  const usage = (runner.quotaUsage ?? []).filter(
    (u) =>
      u.tool === tool &&
      u.target === target &&
      u.usedPercent !== undefined &&
      quotaCurrent(u, now) &&
      // A marked account says nothing more by a percentage; an exhausted window whose mark was cleared is stale.
      !(u.window === 'account' && marks.length) &&
      !(u.exhausted && !marks.length),
  );
  const near = !marks.length && usage.some((u) => (u.usedPercent ?? 0) >= 90);
  return { marks, usage, near };
}

/** The providers of `tool` currently marked at quota. */
export function blockedProviders(
  runner: QuotaSource,
  tool: AgentTool,
  now: number,
): string[] {
  return [
    ...new Set(
      (runner.unavailableModels ?? [])
        .filter(
          (m) =>
            m.reason === 'toolQuota' &&
            m.tool === tool &&
            m.scope === 'provider' &&
            quotaCurrent(m, now),
        )
        .map((m) => m.model),
    ),
  ];
}
