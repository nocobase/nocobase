import type { AgentTool, ToolInfo } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';

import {
  TOOL_UPDATE_COMMANDS,
  type ToolState,
} from '../../../shared/runners.js';

/**
 * What a tool's state means for someone who has to act on it: the versions and the update command for a tool too old
 * to run; undefined for a state its label already says.
 */
export function useToolStateHint(): (
  state: ToolState,
  tool: AgentTool,
  info: ToolInfo | undefined,
) => string | undefined {
  const { t } = useTranslation();
  return (state, tool, info) => {
    if (state === 'off') return t('runtimes.tool.offHint');
    if (state !== 'versionTooOld') return undefined;
    const command = TOOL_UPDATE_COMMANDS[tool];
    const values = {
      tool: t(`tools.${tool}`),
      version: info?.version ?? '',
      minVersion: info?.minVersion ?? '—',
    };
    return command
      ? t('runtimes.tool.versionTooOldHint', { ...values, command })
      : t('runtimes.tool.versionTooOldUpgrade', values);
  };
}
