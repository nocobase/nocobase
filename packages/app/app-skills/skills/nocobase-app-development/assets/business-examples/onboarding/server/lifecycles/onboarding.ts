import { defineLifecycle, type LifecycleRecord } from '@nocobase/lifecycle';
interface Case extends LifecycleRecord {
  coordinatorId: string;
}
export const onboardingLifecycle = defineLifecycle<{
  record: Case;
  state: 'draft' | 'submitted';
}>({
  name: 'onboarding',
  collection: 'onboardingCases',
  initial: 'draft',
  states: ['draft', { name: 'submitted', final: true }],
  create: { guard: ({ values, actor }) => values.coordinatorId === actor.id },
  transitions: {
    submit: {
      title: 'Submit',
      from: 'draft',
      to: 'submitted',
      guard: ({ record, actor }) => record.coordinatorId === actor.id,
    },
  },
});
