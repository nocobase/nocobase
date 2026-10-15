import {
  defineLifecycle,
  LifecycleError,
  type Lifecycle,
  type LifecycleRecord,
  type ReviewerSelection,
} from '@nocobase/lifecycle';
import {
  reviewerParameterGroup,
  defaultReviewerRule,
} from '../configuration/definitions.js';
import type { ReviewerServices } from '../configuration/reviewers.js';

export interface ReviewerDemoTypes {
  record: LifecycleRecord & {
    readonly applicantId: string;
    readonly candidates: readonly string[];
  };
  state: 'draft' | 'review' | 'approved' | 'rejected';
  parameters: { reviewerRule: readonly ReviewerSelection[] };
  services: ReviewerServices;
}
function demo(
  name: string,
  collection: string,
  readMode: 'snapshot' | 'live',
): Lifecycle<ReviewerDemoTypes> {
  return defineLifecycle<ReviewerDemoTypes>({
    name,
    collection,
    initial: 'draft',
    states: [
      'draft',
      'review',
      { name: 'approved', final: true },
      { name: 'rejected', final: true },
    ],
    parameters: { reviewerRule: defaultReviewerRule },
    parameterConfiguration: {
      readMode,
      ...(readMode === 'snapshot' ? { snapshotTransition: 'submit' } : {}),
      groups: [reviewerParameterGroup],
    },
    create: { guard: ({ actor, values }) => actor.id === values.applicantId },
    transitions: {
      submit: {
        from: 'draft',
        to: 'review',
        guard: ({ actor, record }) => actor.id === record.applicantId,
        set: async ({ record, parameters, services }) => {
          const candidates = await services.reviewers(
            parameters.reviewerRule,
            record.applicantId,
          );
          if (!candidates.length)
            throw new LifecycleError(
              'INVALID_STATE',
              'The reviewer rule has no eligible candidates.',
            );
          return { candidates: [...candidates], decidedBy: null };
        },
      },
      withdraw: {
        from: 'review',
        to: 'draft',
        guard: ({ actor, record }) => actor.id === record.applicantId,
        set: () => ({ candidates: [] }),
      },
      approve: {
        from: 'review',
        to: 'approved',
        guard: ({ actor, record }) => record.candidates.includes(actor.id),
        set: ({ actor }) => ({ decidedBy: actor.id }),
      },
      reject: {
        from: 'review',
        to: 'rejected',
        guard: ({ actor, record }) => record.candidates.includes(actor.id),
        set: ({ actor }) => ({ decidedBy: actor.id }),
      },
    },
  });
}
export const reviewerDemoLifecycle: Lifecycle<ReviewerDemoTypes> = demo(
  'reviewerDemo',
  'lifecycleExampleReviewerDemo',
  'snapshot',
);
export const reviewerLiveDemoLifecycle: Lifecycle<ReviewerDemoTypes> = demo(
  'reviewerLiveDemo',
  'lifecycleExampleReviewerLiveDemo',
  'live',
);
