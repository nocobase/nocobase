/**
 * What Studio's pull requests add to the projects plugin's workflow editor: the event `studio.merged` (where the system
 * moves an issue once its pull requests are merged) and the entry condition `prMerged`. The server registers the same
 * keys with the same placement (`server/git/workflow.ts`).
 */
import type {
  StatusRuleTypeUI,
  WorkflowEventUI,
} from '@nocobase/app-plugin-projects/client/kit';
import { GitMergeIcon } from 'lucide-react';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import { MERGED_EVENT, PR_MERGED_RULE } from '../../shared/git.js';
import { PrMergedEditor, PrMergedSummary } from './workflow-editors.js';

const text = (key: string) => ({ key, ns: STUDIO_NAMESPACE });

export const GIT_RULE_TYPES: readonly StatusRuleTypeUI[] = [
  {
    type: PR_MERGED_RULE,
    title: text('studioGit.rule.title'),
    hint: text('studioGit.rule.hint'),
    categories: ['started', 'done'],
    // Only an entry condition: listed under "Entry conditions".
    group: 'condition',
    Icon: GitMergeIcon,
    initialConfig: {},
    Editor: PrMergedEditor,
    Summary: PrMergedSummary,
  },
];

export const GIT_WORKFLOW_EVENTS: readonly WorkflowEventUI[] = [
  {
    key: MERGED_EVENT,
    from: ['started'],
    to: ['done'],
    title: text('studioGit.event.title'),
    hint: text('studioGit.event.hint'),
  },
];
