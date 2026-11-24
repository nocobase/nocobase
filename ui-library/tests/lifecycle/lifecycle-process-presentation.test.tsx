import { render, screen, fireEvent } from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { beforeAll, expect, it, vi } from 'vitest';
import { readmeTranslations } from '../readme-translations.js';
import { LifecycleDiagram } from '../../registry/lifecycle/lifecycle-diagram.js';
import { WorkflowManagementDemo } from '../../website/demo/lifecycle/workflow-management/index.js';
import { description } from '../../website/demo/lifecycle/workflow-management/fixtures.js';

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 80, height: 20 }),
  });
});

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/test-process-presentation',
    resources: readmeTranslations('components')['en-US'],
  },
});

it('defaults to process presentation, keeping node actions and recorded progress', async () => {
  const configure = vi.fn();
  render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={description}
        stateKind={(state) =>
          state.name === 'review'
            ? 'approval'
            : state.final
              ? 'success'
              : 'start'
        }
        ariaLabel='Process'
        currentState='review'
        history={[{ transition: 'submit', from: 'draft', to: 'review' }]}
        stateActions={(state) =>
          state.name === 'review' ? (
            <button onClick={configure}>Configure reviewer</button>
          ) : null
        }
      />
    </TestI18nProvider>,
  );
  const review = await screen.findByTestId('rf__node-review');
  expect(review.querySelector('[data-execution-state]')).toHaveAttribute(
    'data-execution-state',
    'current',
  );
  expect(
    screen
      .getByTestId('rf__node-draft')
      .querySelector('[data-execution-state]'),
  ).toHaveAttribute('data-execution-state', 'visited');
  expect(
    screen
      .getByTestId('rf__node-approved')
      .querySelector('[data-execution-state]'),
  ).toHaveAttribute('data-execution-state', 'unreached');
  expect(
    screen.getByTestId('rf__edge-["submit","draft","review"]'),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Configure reviewer' }));
  expect(configure).toHaveBeenCalledOnce();
  expect(
    screen.getByRole('button', { name: 'Fullscreen' }),
  ).toBeInTheDocument();
});

it('uses process nodes in workflow definition and execution details and updates history selection', async () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <WorkflowManagementDemo />
    </TestI18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Order approval' }));
  expect(
    (await screen.findByTestId('rf__node-review')).querySelector(
      '[data-execution-state]',
    ),
  ).toHaveAttribute('data-execution-state', 'plan');
  fireEvent.click(screen.getByRole('button', { name: 'Workflow management' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Executions' }));
  fireEvent.click(screen.getByRole('button', { name: '#1' }));
  expect(
    (await screen.findByTestId('rf__node-approved')).querySelector(
      '[data-execution-state]',
    ),
  ).toHaveAttribute('data-execution-state', 'current');
  fireEvent.click(screen.getByRole('button', { name: 'Show step 1' }));
  expect(
    screen
      .getByTestId('rf__node-review')
      .querySelector('[data-execution-state]'),
  ).toHaveAttribute('data-execution-state', 'current');
});

it('omits long return lines in process mode and shows their explanation on node focus', async () => {
  const process = {
    ...description,
    transitions: [
      ...description.transitions,
      {
        ...description.transitions[0]!,
        name: 'return',
        title: 'Return',
        from: ['approved'],
        to: ['draft'],
      },
    ],
  };
  render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={process}
        ariaLabel='Return paths'
        revealEdges={[
          {
            id: 'legacy-return',
            source: 'approved',
            target: 'draft',
            label: 'Return',
          },
        ]}
      />
    </TestI18nProvider>,
  );
  const node = await screen.findByTestId('rf__node-approved');
  expect(
    screen.queryByTestId('rf__edge-["return","approved","draft"]'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('note', { name: 'Approved · Return → Draft' }),
  ).not.toBeInTheDocument();
  fireEvent.focus(node);
  expect(
    screen.queryByTestId('rf__edge-reveal:legacy-return'),
  ).not.toBeInTheDocument();
  const route = await screen.findByRole('note', {
    name: 'Approved · Return → Draft',
  });
  expect(route).toHaveTextContent('ReturnDraft');
  expect(screen.getByRole('group', { name: 'Other routes' })).toHaveTextContent(
    'Leaves to',
  );
  expect(
    screen
      .getByTestId('rf__node-draft')
      .querySelector('[data-execution-state]'),
  ).toHaveClass('outline-dashed');
  fireEvent.blur(node);
  expect(
    screen.queryByRole('note', { name: 'Approved · Return → Draft' }),
  ).not.toBeInTheDocument();
});

it('lists a return transition declared from several states once', async () => {
  const process = {
    ...description,
    transitions: [
      ...description.transitions,
      {
        ...description.transitions[0]!,
        name: 'return',
        title: 'Return',
        from: ['review', 'approved'],
        to: ['draft'],
      },
    ],
  };
  render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={process}
        presentation='process'
        ariaLabel='Return paths'
      />
    </TestI18nProvider>,
  );
  fireEvent.focus(await screen.findByTestId('rf__node-draft'));
  const routes = await screen.findAllByRole('note');
  expect(routes).toHaveLength(1);
  expect(routes[0]).toHaveAccessibleName('Review, Approved · Return → Draft');
  expect(routes[0]).toHaveTextContent('ReturnReview, Approved');
  expect(screen.getByRole('group', { name: 'Other routes' })).toHaveTextContent(
    'Arrives from',
  );
});

it('labels a transition declared from several forward states once', async () => {
  const process = {
    ...description,
    transitions: [
      ...description.transitions,
      {
        ...description.transitions[0]!,
        name: 'fastTrack',
        title: 'Fast track',
        from: ['draft', 'review'],
        to: ['approved'],
      },
    ],
  };
  render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={process}
        presentation='process'
        ariaLabel='Fast track paths'
      />
    </TestI18nProvider>,
  );
  const labelled = await screen.findByTestId(
    'rf__edge-["fastTrack","review","approved"]',
  );
  const unlabelled = screen.getByTestId(
    'rf__edge-["fastTrack","draft","approved"]',
  );
  expect(labelled.querySelector('text')).toHaveTextContent('Fast track');
  expect(unlabelled.querySelector('text')).toBeNull();
  expect(unlabelled.querySelector('title')).toHaveTextContent('Fast track');
});

it('lists a transition once per direction when it leaves, loops and arrives', async () => {
  const process = {
    ...description,
    transitions: [
      ...description.transitions,
      {
        ...description.transitions[0]!,
        name: 'customerReply',
        title: 'Customer reply',
        from: ['review', 'approved'],
        to: ['draft', 'review'],
      },
    ],
  };
  render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={process}
        presentation='process'
        ariaLabel='Customer reply paths'
      />
    </TestI18nProvider>,
  );
  fireEvent.focus(await screen.findByTestId('rf__node-review'));
  const routes = await screen.findAllByRole('note');
  expect(routes.map((route) => route.getAttribute('aria-label'))).toEqual([
    'Review · Customer reply → Draft, Review',
    'Approved · Customer reply → Review',
  ]);
});

it('retains return edges on the canvas when classic presentation is explicitly selected', async () => {
  const process = {
    ...description,
    transitions: [
      ...description.transitions,
      {
        ...description.transitions[0]!,
        name: 'return',
        title: 'Return',
        from: ['approved'],
        to: ['draft'],
      },
    ],
  };
  render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={process}
        presentation='classic'
        ariaLabel='Classic return paths'
      />
    </TestI18nProvider>,
  );
  expect(
    await screen.findByTestId('rf__edge-["return","approved","draft"]'),
  ).toBeInTheDocument();
});

const multiStageApproval = {
  ...description,
  states: [
    'draft',
    'dept',
    'legal',
    'finance',
    'approved',
    'rejected',
    'voided',
  ],
  stateInfo: [
    { name: 'draft', title: 'Draft', final: false, meta: {} },
    { name: 'dept', title: 'Dept', final: false, meta: {} },
    { name: 'legal', title: 'Legal', final: false, meta: {} },
    { name: 'finance', title: 'Finance', final: false, meta: {} },
    { name: 'approved', title: 'Approved', final: true, meta: {} },
    { name: 'rejected', title: 'Rejected', final: true, meta: {} },
    { name: 'voided', title: 'Voided', final: true, meta: {} },
  ],
  transitions: [
    {
      ...description.transitions[0]!,
      name: 'submit',
      title: 'Submit',
      from: ['draft'],
      to: ['dept'],
    },
    {
      ...description.transitions[0]!,
      name: 'deptApprove',
      title: 'Dept approve',
      from: ['dept'],
      to: ['legal'],
    },
    {
      ...description.transitions[0]!,
      name: 'legalApprove',
      title: 'Legal approve',
      from: ['legal'],
      to: ['finance'],
    },
    {
      ...description.transitions[0]!,
      name: 'approve',
      title: 'Approve',
      from: ['dept', 'legal', 'finance'],
      to: ['approved'],
    },
    {
      ...description.transitions[0]!,
      name: 'reject',
      title: 'Reject',
      from: ['dept', 'legal', 'finance'],
      to: ['rejected'],
    },
    {
      ...description.transitions[0]!,
      name: 'voidRequest',
      title: 'Void',
      from: ['draft', 'dept'],
      to: ['voided'],
    },
  ],
};

it('keeps all final states on the canvas when exitStates is omitted, including multi-source success and negative outcomes', async () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={multiStageApproval}
        stateKind={(state) =>
          state.name === 'rejected' || state.name === 'voided'
            ? 'negative'
            : state.final
              ? 'success'
              : state.name === 'draft'
                ? 'start'
                : 'approval'
        }
        ariaLabel='Default no exitStates'
      />
    </TestI18nProvider>,
  );

  expect(await screen.findByTestId('rf__node-rejected')).toBeInTheDocument();
  expect(screen.getByTestId('rf__node-voided')).toBeInTheDocument();
  expect(screen.getByTestId('rf__node-approved')).toBeInTheDocument();
  expect(
    screen.getByTestId('rf__edge-["reject","dept","rejected"]'),
  ).toBeInTheDocument();
  expect(
    screen.getByTestId('rf__edge-["reject","legal","rejected"]'),
  ).toBeInTheDocument();
  expect(
    screen.getByTestId('rf__edge-["reject","finance","rejected"]'),
  ).toBeInTheDocument();
  expect(
    screen.getByTestId('rf__edge-["approve","dept","approved"]'),
  ).toBeInTheDocument();
});

it('omits explicit final exitStates without a bottom bar, ignores non-final names, and exposes folded exits in node hover/focus notes', async () => {
  const onStateClick = vi.fn();
  const configureExit = vi.fn();
  const view = render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={multiStageApproval}
        stateKind={(state) =>
          state.name === 'rejected' || state.name === 'voided'
            ? 'negative'
            : state.final
              ? 'success'
              : state.name === 'draft'
                ? 'start'
                : 'approval'
        }
        exitStates={['rejected', 'voided', 'legal']}
        endLabel='End'
        stateActions={(state) =>
          state.name === 'rejected' ? (
            <button type='button' onClick={configureExit}>
              Configure rejection
            </button>
          ) : null
        }
        onStateClick={onStateClick}
        ariaLabel='Explicit exit states'
      />
    </TestI18nProvider>,
  );

  // Final exit states leave the canvas (along with their decorative $end markers);
  // non-final 'legal' and non-listed final 'approved' remain on the canvas, and no bottom exit strip renders.
  expect(await screen.findByTestId('rf__node-legal')).toBeInTheDocument();
  expect(screen.getByTestId('rf__node-approved')).toBeInTheDocument();
  expect(
    screen.getByTestId('rf__node-["$end","approved"]'),
  ).toBeInTheDocument();
  expect(screen.queryByTestId('rf__node-rejected')).not.toBeInTheDocument();
  expect(screen.queryByTestId('rf__node-voided')).not.toBeInTheDocument();
  expect(
    screen.queryByTestId('rf__node-["$end","rejected"]'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByTestId('rf__edge-["reject","dept","rejected"]'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByTestId('rf__edge-["reject","finance","rejected"]'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('group', { name: 'Exit outcomes' }),
  ).not.toBeInTheDocument();

  // Focusing any approval stage lists its folded exit routes in the floating note card;
  // clicking the folded exit entry calls onStateClick for that exit state without clicking the stage,
  // and keeps stateActions accessible on the note entry.
  fireEvent.focus(screen.getByTestId('rf__node-dept'));
  const rejectNote = await screen.findByRole('note', {
    name: 'Dept · Reject → Rejected',
  });
  expect(rejectNote).toBeInTheDocument();
  expect(
    screen.getByRole('note', { name: 'Dept · Void → Voided' }),
  ).toBeInTheDocument();
  const rejectButton = rejectNote.querySelector('button');
  expect(rejectButton).not.toBeNull();
  fireEvent.click(rejectButton!);
  expect(onStateClick).toHaveBeenCalledTimes(1);
  expect(onStateClick).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'rejected' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Configure rejection' }));
  expect(configureExit).toHaveBeenCalledOnce();

  // Predicate form works identically and still protects non-final states.
  view.rerender(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={multiStageApproval}
        stateKind={(state) =>
          state.name === 'rejected' || state.name === 'voided'
            ? 'negative'
            : state.final
              ? 'success'
              : state.name === 'draft'
                ? 'start'
                : 'approval'
        }
        exitStates={(state) =>
          state.name === 'rejected' || state.name === 'dept'
        }
        ariaLabel='Predicate exit states'
      />
    </TestI18nProvider>,
  );
  expect(await screen.findByTestId('rf__node-dept')).toBeInTheDocument();
  expect(screen.queryByTestId('rf__node-rejected')).not.toBeInTheDocument();
  expect(screen.getByTestId('rf__node-voided')).toBeInTheDocument();
});

it('marks execution termination on the stopping canvas node from history and keeps only the active exit on canvas when history is absent', async () => {
  const view = render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={multiStageApproval}
        stateKind={(state) =>
          state.name === 'rejected' || state.name === 'voided'
            ? 'negative'
            : state.final
              ? 'success'
              : state.name === 'draft'
                ? 'start'
                : 'approval'
        }
        exitStates={['rejected', 'voided']}
        currentState='rejected'
        history={[
          { transition: 'submit', from: 'draft', to: 'dept' },
          { transition: 'reject', from: 'dept', to: 'rejected' },
        ]}
        ariaLabel='Rejected execution with history'
      />
    </TestI18nProvider>,
  );

  // Termination renders directly on the stopping source node (Dept) with a negative outcome badge,
  // while folded exit states stay off the canvas.
  const deptStep = (await screen.findByTestId('rf__node-dept')).querySelector(
    '[data-execution-state]',
  );
  expect(deptStep).toHaveAttribute('data-execution-state', 'current');
  expect(deptStep).toHaveAttribute('data-exit-outcome', 'negative');
  expect(deptStep).toHaveTextContent('Rejected');
  expect(deptStep).not.toHaveTextContent('Current');
  expect(screen.queryByTestId('rf__node-rejected')).not.toBeInTheDocument();
  expect(screen.queryByTestId('rf__node-voided')).not.toBeInTheDocument();
  expect(
    screen
      .getByTestId('rf__node-draft')
      .querySelector('[data-execution-state]'),
  ).toHaveAttribute('data-execution-state', 'visited');
  expect(
    screen
      .getByTestId('rf__node-legal')
      .querySelector('[data-execution-state]'),
  ).toHaveAttribute('data-execution-state', 'unreached');

  // Without history identifying a canvas source, only the active exit state stays on the canvas as current,
  // while other folded exits (Voided) remain omitted.
  view.rerender(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={multiStageApproval}
        stateKind={(state) =>
          state.name === 'rejected' || state.name === 'voided'
            ? 'negative'
            : state.final
              ? 'success'
              : state.name === 'draft'
                ? 'start'
                : 'approval'
        }
        exitStates={['rejected', 'voided']}
        currentState='rejected'
        ariaLabel='Rejected execution without history'
      />
    </TestI18nProvider>,
  );
  const rejectedNode = await screen.findByTestId('rf__node-rejected');
  expect(rejectedNode.querySelector('[data-execution-state]')).toHaveAttribute(
    'data-execution-state',
    'current',
  );
  expect(screen.queryByTestId('rf__node-voided')).not.toBeInTheDocument();
  expect(
    screen.getByTestId('rf__node-dept').querySelector('[data-execution-state]'),
  ).not.toHaveAttribute('data-exit-outcome');
});
