/**
 * This plugin's own status rule types in the workflow editor, described like the ones other plugins contribute
 * (`status-rule-types.ts`), so the editor treats every type the same way. The server's are in
 * `server/domains/workflows/built-in-rule-types.ts`; their stored form is unchanged (`subtasksDone` and `blockersDone`
 * keep no settings, so they have no `initialConfig`).
 */
import {
  BellIcon,
  HourglassIcon,
  ListChecksIcon,
  ListTreeIcon,
  SquarePlusIcon,
} from 'lucide-react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  BlockersDoneSummary,
  ChecklistEditor,
  ChecklistSummary,
  NotifyOwnerEditor,
  NotifyOwnerSummary,
  StartOptionEditor,
  StartOptionSummary,
  SubtasksDoneSummary,
} from './built-in-rule-editors.js';
import type { StatusRuleTypeUI } from './status-rule-types.js';

const text = (key: string) => ({ key, ns: ACCESS_NAMESPACE });

export const BUILT_IN_STATUS_RULE_TYPES: readonly StatusRuleTypeUI[] = [
  {
    type: 'checklist',
    title: text('workflows.rules.checklist'),
    hint: text('workflows.rules.checklistHint'),
    group: 'action',
    Icon: ListChecksIcon,
    initialConfig: { items: [{ key: 'item_1', label: '', required: true }] },
    Editor: ChecklistEditor,
    Summary: ChecklistSummary,
  },
  {
    type: 'notifyOwner',
    title: text('workflows.rules.notifyOwner'),
    hint: text('workflows.rules.notifyOwnerHint'),
    group: 'action',
    Icon: BellIcon,
    initialConfig: {},
    Editor: NotifyOwnerEditor,
    Summary: NotifyOwnerSummary,
  },
  {
    type: 'subtasksDone',
    title: text('workflows.rules.subtasksDone'),
    hint: text('workflows.rules.subtasksDoneHint'),
    // A closed status never waits, so the rule is not offered there.
    categories: ['unstarted', 'started', 'done'],
    group: 'condition',
    Icon: ListTreeIcon,
    Summary: SubtasksDoneSummary,
  },
  {
    type: 'blockersDone',
    title: text('workflows.rules.blockersDone'),
    hint: text('workflows.rules.blockersDoneHint'),
    group: 'condition',
    Icon: HourglassIcon,
    Summary: BlockersDoneSummary,
  },
  {
    type: 'startOption',
    title: text('workflows.rules.startOption'),
    hint: text('workflows.rules.startOptionHint'),
    // A new issue cannot be created finished.
    categories: ['unstarted', 'started'],
    group: 'condition',
    Icon: SquarePlusIcon,
    initialConfig: {},
    Editor: StartOptionEditor,
    Summary: StartOptionSummary,
  },
];
