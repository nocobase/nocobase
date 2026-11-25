import type { LifecycleDescription } from '@nocobase/lifecycle';

export const description: LifecycleDescription = {
  name: 'expenses',
  initial: 'review',
  initialStates: ['review'],
  states: ['review', 'approved'],
  stateInfo: [
    { name: 'review', title: 'Review', final: false, meta: {} },
    { name: 'approved', title: 'Approved', final: true, meta: {} },
  ],
  transitions: [
    {
      name: 'approve',
      title: 'Approve',
      from: ['review'],
      to: ['approved'],
      effects: [],
      accept: [],
      manual: true,
      meta: {},
    },
  ],
  continuations: [],
  onEnter: {},
  triggers: [],
  parameterConfiguration: {
    groups: [
      {
        key: 'approval',
        title: 'Approval policy',
        schemaVersion: 1,
        fields: {
          threshold: {
            type: 'number',
            title: 'Finance threshold',
            minimum: 0,
            bindings: [{ transition: 'approve' }],
          },
          reviewers: {
            type: 'reviewers',
            title: 'Reviewers',
            bindings: [{ state: 'review' }, { transition: 'approve' }],
          },
          unrelated: { type: 'string', title: 'Unbound policy' },
          denied: {
            type: 'boolean',
            title: 'Restricted policy',
            bindings: [{ state: 'review' }],
          },
        },
      },
    ],
  },
};
