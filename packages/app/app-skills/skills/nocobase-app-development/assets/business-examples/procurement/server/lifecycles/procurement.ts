import { defineLifecycle, type LifecycleRecord } from '@nocobase/lifecycle';

interface Request extends LifecycleRecord {
  applicantId: string;
  reviewerId: string | null;
  title: string;
  supplierId: string | null;
}
interface Types {
  record: Request;
  state: 'draft' | 'submitted' | 'rejected' | 'approved';
}
const owner = ({ record, actor }: { record: Request; actor: { id: string } }) =>
  actor.id === record.applicantId;
const reviewer = ({
  record,
  actor,
}: {
  record: Request;
  actor: { id: string };
}) => actor.id === record.reviewerId && actor.id !== record.applicantId;

// Capability checks and transaction-bound reference/amount checks belong to the service.
export const procurementLifecycle = defineLifecycle<Types>({
  name: 'procurement',
  collection: 'procurementRequests',
  initial: 'draft',
  states: ['draft', 'submitted', 'rejected', { name: 'approved', final: true }],
  create: { guard: ({ values, actor }) => values.applicantId === actor.id },
  transitions: {
    submit: {
      title: 'Submit',
      from: ['draft', 'rejected'],
      to: 'submitted',
      guard: owner,
    },
    approve: {
      title: 'Approve',
      from: 'submitted',
      to: 'approved',
      guard: reviewer,
    },
    reject: {
      title: 'Reject',
      from: 'submitted',
      to: 'rejected',
      guard: reviewer,
    },
  },
});
