import type { LifecycleDescription } from '@nocobase/lifecycle';
import type {
  WorkflowExecutionLabels,
  WorkflowHistoryEntry,
} from '#extensions/nocobase-workflow-management/execution-detail';

export const description: LifecycleDescription = {
  name: 'orders',
  initial: 'draft',
  initialStates: ['draft'],
  states: ['draft', 'review', 'approved'],
  stateInfo: [
    { name: 'draft', title: 'Draft', final: false, meta: {} },
    { name: 'review', title: 'Review', final: false, meta: {} },
    { name: 'approved', title: 'Approved', final: true, meta: {} },
  ],
  transitions: [
    {
      name: 'submit',
      title: 'Submit',
      from: ['draft'],
      to: ['review'],
      manual: true,
      effects: [],
      accept: [],
      meta: {},
    },
    {
      name: 'approve',
      title: 'Approve',
      from: ['review'],
      to: ['approved'],
      manual: true,
      effects: ['notify'],
      accept: [],
      meta: {},
    },
  ],
  triggers: [],
  continuations: [],
  onEnter: {},
};
export const transitions: readonly WorkflowHistoryEntry[] = [
  {
    id: 'submit-1',
    version: 1,
    at: '2026-01-01T10:00:00Z',
    transition: 'submit',
    from: 'draft',
    to: 'review',
    actorId: 'Alice',
  },
  {
    id: 'approve-2',
    version: 2,
    at: '2026-01-01T11:00:00Z',
    transition: 'approve',
    from: 'review',
    to: 'approved',
    actorId: 'Bob',
  },
];
export const executionLabels: WorkflowExecutionLabels = {
  processDiagram: 'Process diagram',
  history: 'History',
  historyHint: 'Select a step to inspect its recorded path.',
  step: 'Step',
  transition: 'Transition',
  from: 'From',
  to: 'To',
  actor: 'Actor',
  time: 'Time',
  noHistory: 'No history',
  effects: 'Effects',
  effect: 'Effect',
  state: 'State',
  attempts: 'Attempts',
  error: 'Error',
  noEffects: 'No effects',
  executionParameters: 'Recorded parameters',
  snapshotHint: 'Values recorded for this execution.',
  showStep: (step) => `Show step ${step}`,
};
