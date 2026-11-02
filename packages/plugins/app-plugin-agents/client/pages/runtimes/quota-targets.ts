import type { AgentTool } from '@nocobase/agent-protocol';
import type { RunnerSummary } from '../../../shared/runners.js';
export function quotaTargets(runner: RunnerSummary, tool: AgentTool): string[] {
  return [
    ...new Set([
      ...(tool === 'opencode' || tool === 'pi'
        ? (runner.tools
            .find((item) => item.kind === tool)
            ?.models?.map((model) => model.id.split('/')[0]) ?? [])
        : []),
      ...(runner.quotaUsage ?? [])
        .filter((u) => u.tool === tool && u.scope !== 'tool')
        .map((u) => u.target),
      ...(runner.unavailableModels ?? [])
        .filter(
          (m) =>
            m.tool === tool && m.reason === 'toolQuota' && m.scope !== 'tool',
        )
        .map((m) => m.model),
    ]),
  ];
}
