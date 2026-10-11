/**
 * The workflow status rules Studio contributes (`runAgent`, `suggestExecutor`, registered on the server in
 * `server/agents/stage-rules.ts`), as the projects plugin's workflow editor shows them: a title and hint, the "When
 * entering" group of its "Add rule" menu, an icon, the settings editor, and the one-line summary
 * (`stage-rule-editors.tsx`).
 */
import type { StatusRuleTypeUI } from '@nocobase/app-plugin-projects/client/kit';
import { BotIcon, UserPlusIcon } from 'lucide-react';
import type { useTranslation } from '@nocobase/i18n/client';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import {
  STAGE_RUN_LIMIT,
  STAGE_RUN_WINDOW_HOURS,
} from '../../shared/stage-run-limit.js';
import {
  RunAgentEditor,
  RunAgentSummary,
  SuggestExecutorEditor,
  SuggestExecutorSummary,
} from './stage-rule-editors.js';

const text = (key: string) => ({ key, ns: STUDIO_NAMESPACE });

/** `runAgent` and `suggestExecutor`, never on a finished or closed status (the server refuses those). */
export function stageRuleTypes(
  t: ReturnType<typeof useTranslation>['t'],
): readonly StatusRuleTypeUI[] {
  return [
    {
      type: 'runAgent',
      title: text('studioAgents.stageRules.runAgent'),
      hint: t('studioAgents.stageRules.runAgentHint', {
        maxRuns: STAGE_RUN_LIMIT,
        windowHours: STAGE_RUN_WINDOW_HOURS,
      }),
      categories: ['unstarted', 'started'],
      group: 'action',
      Icon: BotIcon,
      initialConfig: {},
      Editor: RunAgentEditor,
      Summary: RunAgentSummary,
    },
    {
      type: 'suggestExecutor',
      title: text('studioAgents.stageRules.suggestExecutorTitle'),
      hint: text('studioAgents.stageRules.suggestExecutorHint'),
      categories: ['unstarted', 'started'],
      group: 'action',
      Icon: UserPlusIcon,
      initialConfig: {},
      Editor: SuggestExecutorEditor,
      Summary: SuggestExecutorSummary,
    },
  ];
}
