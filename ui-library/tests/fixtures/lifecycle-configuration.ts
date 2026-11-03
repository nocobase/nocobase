import type { LifecycleDescription } from '@nocobase/lifecycle';

export const description: LifecycleDescription = {
  name: 'expenses',
  initial: 'review',
  initialStates: ['review'],
  states: ['review'],
  stateInfo: [{ name: 'review', title: 'Review', final: false, meta: {} }],
  transitions: [
    {
      name: 'approve',
      title: 'Approve',
      from: ['review'],
      to: ['review'],
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
    readMode: 'snapshot',
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
