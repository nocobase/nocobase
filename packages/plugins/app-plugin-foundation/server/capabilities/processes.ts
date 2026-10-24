import type { FoundationPart } from '../../shared/foundation.js';
import {
  countOf,
  fact,
  metric,
  NO_DATABASE,
  type CapabilityCollector,
  type CapabilityFindings,
} from './types.js';

export const workflows: CapabilityCollector = {
  key: 'workflows',
  packages: ['@nocobase/lifecycle', '@nocobase/app-plugin-scheduler'],
  async collect({ probe }) {
    if (!probe) return NO_DATABASE;
    const findings: CapabilityFindings[] = [];
    const parts: FoundationPart[] = [];

    // The lifecycle store's two Collections exist once the application persists its lifecycles, which is the
    // integration itself: a lifecycle nobody has moved yet is still in use.
    if (probe.has('lifecycleTransitions')) {
      const byLifecycle = await probe.groupCount(
        'lifecycleTransitions',
        'lifecycle',
      );
      const effects = probe.has('lifecycleEffectRuns')
        ? await probe.groupCount('lifecycleEffectRuns', 'status')
        : new Map<string, number>();
      const transitions =
        byLifecycle === null
          ? null
          : [...byLifecycle.values()].reduce((sum, count) => sum + count, 0);
      parts.push({ key: 'lifecycles', status: 'active' });
      findings.push({
        status: 'active',
        facts:
          byLifecycle === null
            ? []
            : [
                byLifecycle.size === 0
                  ? fact('lifecyclesWithoutTransitions')
                  : fact('lifecycles', {
                      count: byLifecycle.size,
                      names: [...byLifecycle.keys()],
                      transitions: transitions ?? 0,
                    }),
              ],
        metrics: [
          metric('transitions', transitions),
          metric('lifecycles', byLifecycle?.size ?? null),
          metric('effectsSucceeded', countOf(effects, ['succeeded'])),
          metric('effectsFailed', countOf(effects, ['failed', 'dead'])),
          metric('effectsPending', countOf(effects, ['queued', 'running'])),
        ],
      });
    } else {
      parts.push({
        key: 'lifecycles',
        status: 'unused',
        reason: 'notRegistered',
      });
    }

    if (probe.has('scheduleDefinitions')) {
      const enabled = await probe.count('scheduleDefinitions', {
        enabled: true,
      });
      const occurrences = probe.has('scheduleOccurrences')
        ? await probe.count('scheduleOccurrences')
        : null;
      const active = (enabled ?? 0) > 0;
      parts.push(
        enabled === null
          ? { key: 'schedules', status: null }
          : active
            ? { key: 'schedules', status: 'active' }
            : { key: 'schedules', status: 'unused', reason: 'noSchedules' },
      );
      findings.push({
        status: active ? 'active' : enabled === null ? null : 'unused',
        facts: active ? [fact('schedules', { count: enabled ?? 0 })] : [],
        metrics: [
          metric('schedules', enabled),
          metric('scheduleOccurrences', occurrences),
        ],
      });
    } else {
      parts.push({
        key: 'schedules',
        status: 'unused',
        reason: 'notRegistered',
      });
    }

    const active = findings.some((finding) => finding.status === 'active');
    const unknown = parts.some((part) => part.status === null);
    return {
      status: active ? 'active' : unknown ? null : 'unused',
      ...(active || unknown ? {} : { reason: 'noWorkflows' }),
      facts: findings.flatMap((finding) => finding.facts ?? []),
      metrics: findings.flatMap((finding) => finding.metrics ?? []),
      parts,
    };
  },
};
