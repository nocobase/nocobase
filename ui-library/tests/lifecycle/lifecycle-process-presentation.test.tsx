import { act, render, screen, fireEvent } from '@testing-library/react';
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
  const capsule = await screen.findByRole('note', {
    name: 'Approved · Return → Draft',
  });
  expect(capsule).toHaveTextContent('Return');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Tab' });
  act(() => capsule.focus());

  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    'Approved · Return → Draft',
  );
  act(() => capsule.blur());
  expect(
    screen.queryByRole('note', { name: 'Approved · Return → Draft' }),
  ).not.toBeInTheDocument();
});
