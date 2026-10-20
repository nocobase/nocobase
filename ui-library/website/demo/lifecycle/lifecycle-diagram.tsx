import { useState, type ReactElement } from 'react';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import { LifecycleDiagram } from '#components/lifecycle-diagram';

const description: LifecycleDescription = {
  parameterConfiguration: {
    readMode: 'snapshot',
    groups: [
      {
        key: 'approval',
        title: 'Approval policy',
        schemaVersion: 1,
        fields: {
          reviewers: {
            type: 'reviewers',
            title: 'Reviewers',
            bindings: [{ state: 'review' }],
          },
          threshold: {
            type: 'number',
            title: 'Finance threshold',
            minimum: 0,
            bindings: [{ transition: 'decide' }],
          },
        },
      },
    ],
  },
  name: 'expenses',
  initial: 'draft',
  initialStates: ['draft'],
  states: ['draft', 'review', 'approved', 'rejected'],
  stateInfo: [
    { name: 'draft', title: 'Draft', final: false, meta: {} },
    { name: 'review', title: 'In review', final: false, meta: {} },
    { name: 'approved', title: 'Approved', final: true, meta: {} },
    { name: 'rejected', title: 'Rejected', final: true, meta: {} },
  ],
  transitions: [
    {
      name: 'submit',
      title: 'Submit',
      from: ['draft'],
      to: ['review'],
      manual: true,
      effects: ['notify'],
      accept: [],
      meta: {},
    },
    {
      name: 'withdraw',
      title: 'Withdraw',
      from: ['review'],
      to: ['draft'],
      manual: true,
      effects: [],
      accept: [],
      meta: {},
    },
    {
      name: 'reassign',
      title: 'Reassign',
      from: ['review'],
      to: ['review'],
      manual: true,
      effects: [],
      accept: ['approverId'],
      meta: {},
    },
    {
      name: 'decide',
      title: 'Decide',
      from: ['review'],
      to: ['approved', 'rejected'],
      manual: true,
      effects: [],
      accept: [],
      meta: {},
    },
    {
      name: 'expire',
      title: 'Expire',
      from: ['review'],
      to: ['rejected'],
      manual: false,
      effects: [],
      accept: [],
      meta: {},
    },
  ],
  triggers: [{ name: 'expireStale', transition: 'expire', when: ['review'] }],
  continuations: [],
  onEnter: { review: ['notify'] },
};

export function LifecycleDiagramDemo(): ReactElement {
  const [detail, setDetail] = useState(
    'Record is in review. Select a state or transition.',
  );
  return (
    <div className='flex min-h-svh flex-col gap-3 bg-background p-6 text-foreground'>
      <p className='text-sm' aria-live='polite'>
        {detail}
      </p>
      <LifecycleDiagram
        description={description}
        currentState='review'
        history={[{ transition: 'submit', from: 'draft', to: 'review' }]}
        endLabel='End'
        transitionLabel={(transition) =>
          `${transition.title}${transition.manual ? '' : ' · ⚙'}`
        }
        availableTransitions={['withdraw', 'reassign', 'decide']}
        ariaLabel='Expense lifecycle'
        configuration={{
          label: () => 'Configure',
          // This isolated demo previews selection; a real application checks API permissions.
          canConfigure: () => true,
          onConfigure: ({ target, groups }) =>
            setDetail(
              `Configuration for ${target.name}: ${groups.flatMap((group) => Object.values(group.fields).map((field) => field.title)).join(', ')}. Connect the application parameter editor and authenticated API here.`,
            ),
        }}
        onStateClick={(state) =>
          setDetail(
            `${state.title}: ${description.onEnter[state.name]?.join(', ') ?? '—'}`,
          )
        }
        onTransitionClick={(transition) =>
          setDetail(
            `${transition.title}: ${transition.from.join(', ')} → ${transition.to.join(', ')}; ${
              description.triggers
                .filter((trigger) => trigger.transition === transition.name)
                .map((trigger) => trigger.name)
                .join(', ') || '—'
            }`,
          )
        }
      />
    </div>
  );
}
