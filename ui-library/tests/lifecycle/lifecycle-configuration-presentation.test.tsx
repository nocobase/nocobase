import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { LifecycleDiagram } from '../../registry/lifecycle/lifecycle-diagram.js';
import { description } from '../fixtures/lifecycle-configuration.js';
import type { FlowDiagramProps } from '../../registry/components/flow-diagram.js';

vi.mock('#components/flow-diagram', () => ({
  FlowDiagram: (props: FlowDiagramProps) => (
    <div data-testid='diagram' data-min-zoom={props.initialMinZoom}>
      {props.nodes.map((node) => (
        <section key={node.id} onClick={() => props.onNodeClick?.(node)}>
          {props.nodeActions?.(node)}
          <span data-testid={`config-${node.id}`}>
            {String(node.configurable)}
          </span>
        </section>
      ))}
      {props.edges.map((edge) => (
        <button key={edge.id} onClick={() => props.onEdgeClick?.(edge)}>
          {edge.label}
        </button>
      ))}
    </div>
  ),
}));
it('automatically renders a bound state control, preserves custom actions and does not also inspect/fire', () => {
  const configure = vi.fn();
  const inspect = vi.fn();
  render(
    <LifecycleDiagram
      description={description}
      ariaLabel='Approval'
      stateActions={() => <span>Existing action</span>}
      onStateClick={inspect}
      configuration={{
        label: () => '配置审批人',
        canConfigure: (_group, key) => key === 'reviewers',
        onConfigure: configure,
      }}
    />,
  );
  const control = screen.getByRole('button', { name: '配置审批人' });
  expect(control).toHaveAttribute('title', '配置审批人');
  expect(control).toHaveTextContent(/^$/);
  fireEvent.click(control);
  expect(configure).toHaveBeenCalledOnce();
  expect(configure.mock.calls[0]![0]).toMatchObject({
    target: { kind: 'state', name: 'review' },
  });
  expect(Object.keys(configure.mock.calls[0]![0].groups[0].fields)).toEqual([
    'reviewers',
  ]);
  expect(inspect).not.toHaveBeenCalled();
  expect(screen.getByText('Existing action')).toBeInTheDocument();
});
it('opens transition configuration from native bindings and retains ordinary inspection when denied', () => {
  const configure = vi.fn();
  const inspect = vi.fn();
  const view = render(
    <LifecycleDiagram
      description={description}
      ariaLabel='Approval'
      onTransitionClick={inspect}
      configuration={{
        label: () => 'Configure',
        canConfigure: () => true,
        onConfigure: configure,
      }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  expect(configure.mock.calls[0]![0]).toMatchObject({
    target: { kind: 'transition', name: 'approve' },
  });
  expect(inspect).not.toHaveBeenCalled();
  view.rerender(
    <LifecycleDiagram
      description={description}
      ariaLabel='Approval'
      onTransitionClick={inspect}
      configuration={{
        label: () => 'Configure',
        canConfigure: () => false,
        onConfigure: configure,
      }}
    />,
  );
  expect(
    screen.queryByRole('button', { name: 'Configure' }),
  ).not.toBeInTheDocument();
  expect(screen.getByTestId('config-review')).toHaveTextContent('false');
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  expect(inspect).toHaveBeenCalledWith(description.transitions[0]);
  expect(configure).toHaveBeenCalledOnce();
});
it('adds no editor without an explicit authorized adapter', () => {
  const inspect = vi.fn();
  render(
    <LifecycleDiagram
      description={description}
      ariaLabel='History'
      onTransitionClick={inspect}
    />,
  );
  expect(
    screen.queryByRole('button', { name: 'Configure' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  expect(inspect).toHaveBeenCalledOnce();
});

it('keeps the default graph readable while respecting an explicit viewport preference', () => {
  const view = render(
    <LifecycleDiagram description={description} ariaLabel='Approval' />,
  );
  expect(screen.getByTestId('diagram')).toHaveAttribute('data-min-zoom', '0.7');
  view.rerender(
    <LifecycleDiagram
      description={description}
      ariaLabel='Approval'
      initialMinZoom={0.4}
    />,
  );
  expect(screen.getByTestId('diagram')).toHaveAttribute('data-min-zoom', '0.4');
});

it('opens a transition-only policy from its owning node without inspecting or executing it', () => {
  const configure = vi.fn();
  const inspect = vi.fn();
  render(
    <LifecycleDiagram
      description={description}
      ariaLabel='Approval'
      onStateClick={inspect}
      configuration={{
        label: () => 'Configure threshold',
        canConfigure: (_group, key) => key === 'threshold',
        onConfigure: configure,
      }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Configure threshold' }));
  expect(configure).toHaveBeenCalledOnce();
  expect(configure.mock.calls[0]![0].target).toEqual({
    kind: 'transition',
    name: 'approve',
  });
  expect(screen.getByTestId('config-review')).toHaveTextContent('true');
  expect(inspect).not.toHaveBeenCalled();
});

it('lets the user choose multiple outgoing bindings and opens the editor after the chooser closes', async () => {
  const user = userEvent.setup();
  const configure = vi.fn(() =>
    screen.getByRole('textbox', { name: 'Policy value' }).focus(),
  );
  const inspect = vi.fn();
  const multiple = {
    ...description,
    transitions: [
      ...description.transitions,
      { ...description.transitions[0]!, name: 'escalate', title: 'Escalate' },
    ],
    parameterConfiguration: {
      ...description.parameterConfiguration!,
      groups: [
        {
          ...description.parameterConfiguration!.groups[0]!,
          fields: {
            threshold: {
              ...description.parameterConfiguration!.groups[0]!.fields
                .threshold!,
              bindings: [{ transition: 'approve' }, { transition: 'escalate' }],
            },
          },
        },
      ],
    },
  };
  render(
    <>
      <input aria-label='Policy value' />
      <LifecycleDiagram
        description={multiple}
        ariaLabel='Approval'
        onStateClick={inspect}
        configuration={{
          label: () => 'Configure',
          canConfigure: () => true,
          onConfigure: configure,
        }}
      />
    </>,
  );
  const chooser = screen.getByRole('button', { name: 'Configure: Review' });
  expect(chooser).toHaveTextContent(/^$/);
  expect(chooser).toHaveAttribute('title', 'Configure: Review');
  await user.click(chooser);
  expect(configure).not.toHaveBeenCalled();
  await user.keyboard('{Escape}');
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(configure).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Configure: Review' }),
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Configure: Review' }));
  await user.click(
    await screen.findByRole('button', { name: 'Configure · Escalate' }),
  );
  await waitFor(() => expect(configure).toHaveBeenCalledOnce());
  expect(configure.mock.calls[0]![0].target).toEqual({
    kind: 'transition',
    name: 'escalate',
  });
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Policy value' })).toHaveFocus(),
  );
  expect(inspect).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
