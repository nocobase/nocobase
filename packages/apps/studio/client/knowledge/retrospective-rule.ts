/**
 * The `retrospective` status rule in the workflow editor (registered on the server in
 * `server/knowledge/retrospective.ts`): on a finished status, wake an agent to look back on the issue, the user manual
 * first, then what else is worth keeping.
 */
import type { StatusRuleTypeUI } from '@nocobase/app-plugin-projects/client/kit';
import { NotebookPenIcon } from 'lucide-react';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import {
  RetrospectiveEditor,
  RetrospectiveSummary,
} from './retrospective-rule-editors.js';

const text = (key: string) => ({ key, ns: STUDIO_NAMESPACE });

export const RETROSPECTIVE_RULE_TYPE: StatusRuleTypeUI = {
  type: 'retrospective',
  title: text('knowledgeRules.retrospective'),
  hint: text('knowledgeRules.retrospectiveHint'),
  categories: ['done'],
  group: 'action',
  Icon: NotebookPenIcon,
  initialConfig: {},
  Editor: RetrospectiveEditor,
  Summary: RetrospectiveSummary,
};
