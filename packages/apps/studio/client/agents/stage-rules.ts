/**
 * The workflow status rules Studio contributes (`runAgent`, `suggestExecutor`, registered on the server in
 * `server/agents/stage-rules.ts`), as the projects plugin's workflow editor shows them: a title and hint, the "When
 * entering" group of its "Add rule" menu, an icon, the settings editor, and the one-line summary
 * (`stage-rule-editors.tsx`).
 */
import type { StatusRuleTypeUI } from '@nocobase/app-plugin-projects/client/kit';
import { BotIcon, UserPlusIcon } from 'lucide-react';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import {
  RunAgentEditor,
  RunAgentSummary,
  SuggestExecutorEditor,
  SuggestExecutorSummary,
} from './stage-rule-editors.js';

const text = (key: string) => ({ key, ns: STUDIO_NAMESPACE });

/** `runAgent` and `suggestExecutor`, never on a finished or closed status (the server refuses those). */
export const STAGE_RULE_TYPES: readonly StatusRuleTypeUI[] = [
  {
    type: 'runAgent',
    title: text('studioAgents.stageRules.runAgent'),
    hint: text('studioAgents.stageRules.runAgentHint'),
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
