import type { FoundationPart } from '../../shared/foundation.js';
import { total } from '../inventory.js';
import {
  fact,
  metric,
  NO_DATABASE,
  type CapabilityCollector,
} from './types.js';

export const aiAgents: CapabilityCollector = {
  key: 'aiAgents',
  packages: [
    '@nocobase/app-plugin-agents',
    '@nocobase/app-plugin-agent-sessions',
    '@nocobase/app-plugin-ai-employee',
  ],
  async collect({ probe }) {
    if (!probe) return NO_DATABASE;
    const hasModelServices = probe.has('agModelServices');
    if (!hasModelServices && !probe.has('agRunners'))
      return { status: 'unused', reason: 'notRegistered' };
    const [services, agents, runners, runs, modelCalls, input, output] =
      await Promise.all([
        hasModelServices
          ? probe.count('agModelServices', { enabled: true })
          : Promise.resolve(0),
        probe.has('agAgents') ? probe.count('agAgents') : Promise.resolve(0),
        probe.has('agRunners') ? probe.count('agRunners') : Promise.resolve(0),
        probe.has('agRuns') ? probe.count('agRuns') : Promise.resolve(0),
        probe.has('agModelUsage')
          ? probe.count('agModelUsage')
          : Promise.resolve(0),
        probe.has('agModelUsage')
          ? probe.sum('agModelUsage', 'inputTokens')
          : Promise.resolve(0),
        probe.has('agModelUsage')
          ? probe.sum('agModelUsage', 'outputTokens')
          : Promise.resolve(0),
      ]);
    const tokens = total([input, output]);
    // Native OnlineAgent and gateway calls use model services directly, without an agAgents record.
    const online = services !== null && services > 0;
    const runner = runners !== null && runners > 0;
    const parts: FoundationPart[] = [];
    if (hasModelServices && services !== null)
      parts.push(
        online
          ? { key: 'modelServices', status: 'active' }
          : {
              key: 'modelServices',
              status: 'needsSetup',
              reason: 'noModelService',
            },
      );
    if (agents !== null)
      parts.push({ key: 'agents', status: agents > 0 ? 'active' : 'unused' });
    if (runners !== null)
      parts.push({ key: 'runners', status: runner ? 'active' : 'unused' });
    const active = online || runner;
    const unknown = services === null || runners === null;
    return {
      status: active ? 'active' : unknown ? null : 'needsSetup',
      ...(active || unknown ? {} : { reason: 'noModelOrRunner' }),
      facts: active
        ? [
            ...(online ? [fact('modelServices', { count: services })] : []),
            ...(runner ? [fact('runners', { count: runners })] : []),
            ...(agents !== null && runs !== null && (agents > 0 || runs > 0)
              ? [fact('agents', { count: agents, runs })]
              : []),
          ]
        : [],
      metrics: [
        metric('agents', agents),
        metric('modelServices', services),
        metric('runners', runners),
        metric('runs', runs),
        metric('modelCalls', modelCalls),
        metric('tokens', tokens.value, {
          unit: 'tokens',
          complete: tokens.complete,
        }),
      ],
      parts,
    };
  },
};

export const knowledge: CapabilityCollector = {
  key: 'knowledge',
  packages: ['@nocobase/app-plugin-knowledge'],
  async collect({ probe }) {
    if (!probe) return NO_DATABASE;
    if (!probe.has('kbSpaces'))
      return { status: 'unused', reason: 'notRegistered' };
    const [spaces, docs, chunks] = await Promise.all([
      probe.count('kbSpaces'),
      probe.has('kbDocs') ? probe.count('kbDocs') : Promise.resolve(0),
      probe.has('kbChunks') ? probe.count('kbChunks') : Promise.resolve(0),
    ]);
    const active = (docs ?? 0) > 0;
    return {
      status: active ? 'active' : docs === null ? null : 'needsSetup',
      ...(active || docs === null ? {} : { reason: 'noDocuments' }),
      facts: active ? [fact('documents', { count: docs ?? 0 })] : [],
      metrics: [
        metric('documents', docs),
        metric('spaces', spaces),
        metric('chunks', chunks),
      ],
    };
  },
};
