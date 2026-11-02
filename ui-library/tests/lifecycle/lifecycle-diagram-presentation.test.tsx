import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import type { FlowDiagramProps } from '../../registry/components/flow-diagram.js';
import { LifecycleDiagram } from '../../registry/lifecycle/lifecycle-diagram.js';

vi.mock('#components/flow-diagram', () => ({
  FlowDiagram: (props: FlowDiagramProps) => (
    <div
      data-testid='diagram'
      data-direction={props.direction}
      data-auto-height={props.autoHeight}
      className={props.className}
    >
      {props.nodes.map((node) => (
        <section key={node.id}>
          {node.label}
          {props.nodeActions?.(node)}
        </section>
      ))}
    </div>
  ),
}));
const description: LifecycleDescription = {
  name: 'approval',
  initial: 'draft',
  initialStates: ['draft'],
  states: ['draft'],
  stateInfo: [{ name: 'draft', title: 'Draft', final: false, meta: {} }],
  transitions: [],
  continuations: [],
  onEnter: {},
  triggers: [],
};
it('defaults process definitions to vertical auto-height and preserves node configuration controls', () => {
  const configure = vi.fn();
  render(
    <LifecycleDiagram
      description={description}
      ariaLabel='Definition'
      stateActions={(state) => (
        <button onClick={() => configure(state.name)}>Configure</button>
      )}
    />,
  );
  expect(screen.getByTestId('diagram')).toHaveAttribute(
    'data-direction',
    'DOWN',
  );
  expect(screen.getByTestId('diagram')).toHaveAttribute(
    'data-auto-height',
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
  expect(configure).toHaveBeenCalledWith('draft');
});
it('preserves explicit compact orientation and height overrides', () => {
  render(
    <LifecycleDiagram
      description={description}
      ariaLabel='Compact progress'
      direction='RIGHT'
      autoHeight={false}
      className='h-80'
    />,
  );
  expect(screen.getByTestId('diagram')).toHaveAttribute(
    'data-direction',
    'RIGHT',
  );
  expect(screen.getByTestId('diagram')).toHaveAttribute(
    'data-auto-height',
    'false',
  );
  expect(screen.getByTestId('diagram')).toHaveClass('h-80');
});
