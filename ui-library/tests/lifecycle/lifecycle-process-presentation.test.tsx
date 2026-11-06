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

it('keeps node actions and recorded progress in the optional process presentation', async () => {
  const configure = vi.fn();
  render(
    <TestI18nProvider runtime={runtime}>
      <LifecycleDiagram
        description={description}
        presentation='process'
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
        presentation='process'
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
