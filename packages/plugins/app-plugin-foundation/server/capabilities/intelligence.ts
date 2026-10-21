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
    if (!probe.has('agModelServices'))
      return { status: 'unused', reason: 'notRegistered' };
    const [services, agents, runners, runs, modelCalls, input, output] =
      await Promise.all([
        probe.count('agModelServices', { enabled: true }),
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
    // Two paths run an agent: an online one calls a model service, a runner one runs a coding tool on a runner.
    const online = (services ?? 0) > 0 && (agents ?? 0) > 0;
    const runner = (runners ?? 0) > 0;
    const parts: FoundationPart[] = [
      (services ?? 0) > 0
        ? { key: 'modelServices', status: 'active' }
        : {
            key: 'modelServices',
            status: 'needsSetup',
            reason: 'noModelService',
          },
      (agents ?? 0) > 0
        ? { key: 'agents', status: 'active' }
        : { key: 'agents', status: 'needsSetup', reason: 'noAgent' },
      runner
        ? { key: 'runners', status: 'active' }
        : { key: 'runners', status: 'unused' },
    ];
    const active = online || runner;
    return {
      status: active ? 'active' : 'needsSetup',
      ...(active ? {} : { reason: 'noModelOrRunner' }),
      facts: active
        ? [fact('agents', { count: agents ?? 0, runs: runs ?? 0 })]
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
      status: active ? 'active' : 'needsSetup',
      ...(active ? {} : { reason: 'noDocuments' }),
      facts: active ? [fact('documents', { count: docs ?? 0 })] : [],
      metrics: [
        metric('documents', docs),
        metric('spaces', spaces),
        metric('chunks', chunks),
      ],
    };
  },
};
