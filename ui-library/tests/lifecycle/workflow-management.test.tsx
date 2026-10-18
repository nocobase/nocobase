import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  WorkflowDefinitionDetail,
  WorkflowManagementLayout,
} from '../../registry/lifecycle/workflow-management/layout.js';
import { WorkflowExecutionDetail } from '../../registry/lifecycle/workflow-management/execution-detail.js';
import { WorkflowDefinitionList } from '../../registry/lifecycle/workflow-management/definition-list.js';
import { WorkflowExecutionList } from '../../registry/lifecycle/workflow-management/execution-list.js';
import {
  executionLabels,
  transitions,
} from '../../website/demo/lifecycle/workflow-management/fixtures.js';

// Category integration exercises the real demo adapter; graph layout is covered in the browser.
vi.mock('#components/lifecycle-diagram', () => ({
  LifecycleDiagram: () => <div />,
}));

describe('workflow management', () => {
  it('delegates tab navigation and replaces list chrome in detail mode', () => {
    const onTabChange = vi.fn();
    const props = {
      title: 'Workflows',
      labels: { definitions: 'Definitions', executions: 'Executions' },
      tab: 'definitions' as const,
      onTabChange,
    };
    const view = render(
      <WorkflowManagementLayout {...props}>
        <p>List</p>
      </WorkflowManagementLayout>,
    );
    expect(screen.getByRole('tab', { name: 'Definitions' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Executions' }));
    expect(onTabChange).toHaveBeenCalledWith('executions');
    view.rerender(
      <WorkflowManagementLayout {...props} detail>
        <p>Detail</p>
      </WorkflowManagementLayout>,
    );
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Workflows' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });

  it('orders recorded history without mutation and selects only a display prefix', () => {
    const input = [transitions[1]!, transitions[0]!];
    const renderDiagram = vi.fn(({ current, history }) => (
      <output>
        {current}:{history.map((entry: { id: string }) => entry.id).join(',')}
      </output>
    ));
    render(
      <WorkflowExecutionDetail
        transitions={input}
        state='approved'
        effects={[]}
        labels={executionLabels}
        stateLabel={(name) => name}
        transitionLabel={(name) => name}
        dateLabel={(at) => at}
        effectStatusLabel={(status) => status}
        renderDiagram={renderDiagram}
      />,
    );
    expect(screen.getByText('approved:submit-1,approve-2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show step 1' }));
    expect(screen.getByText('review:submit-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show step 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(input.map((entry) => entry.id)).toEqual(['approve-2', 'submit-1']);
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('keeps search controls mounted during refresh and distinguishes pending from empty', () => {
    const onRefresh = vi.fn();
    const props = {
      rows: [],
      loaded: false,
      loading: true,
      search: <input aria-label='Search' defaultValue='draft' />,
      empty: 'No definitions',
      labels: {
        refresh: 'Refresh',
        workflow: 'Workflow',
        executionCount: 'Count',
        executionActivity: 'Activity',
      },
      onSort: vi.fn(),
      onRefresh,
    };
    const view = render(<WorkflowDefinitionList {...props} />);
    const input = screen.getByRole('textbox');
    expect(screen.queryByText('No definitions')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
    view.rerender(<WorkflowDefinitionList {...props} loaded loading={false} />);
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveValue('draft');
    expect(screen.getByText('No definitions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('delegates server ordering and pagination without changing rows locally', () => {
    const onSort = vi.fn();
    const onNext = vi.fn();
    render(
      <WorkflowExecutionList
        rows={[
          {
            id: '1',
            record: '#1',
            workflow: 'Orders',
            state: 'review',
            createdAt: 'Today',
          },
        ]}
        loaded
        loading={false}
        filters={<span>Orders filter</span>}
        empty='No executions'
        labels={{
          refresh: 'Refresh',
          record: 'Record',
          workflow: 'Workflow',
          state: 'State',
          createdAt: 'Created',
          previous: 'Previous',
          next: 'Next',
        }}
        order='newest'
        onSort={onSort}
        onRefresh={vi.fn()}
        pagination='Page 1'
        previousDisabled
        nextDisabled={false}
        onPrevious={vi.fn()}
        onNext={onNext}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Created' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onSort).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('cell', { name: '#1' })).toBeInTheDocument();
  });
});

it('demonstrates category filtering and add, edit, delete without removing workflows', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const { WorkflowManagementDemo } =
    await import('../../website/demo/lifecycle/workflow-management/index.js');
  const user = userEvent.setup();
  render(<WorkflowManagementDemo />);
  await user.click(
    screen.getByRole('button', { name: 'Operations', exact: true }),
  );
  expect(screen.getByText('No matching definitions')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Sales', exact: true }));
  expect(
    screen.getByRole('button', { name: 'Order approval', exact: true }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Add category', exact: true }),
  );
  await user.type(screen.getByLabelText('Category name'), 'Finance');
  await user.click(screen.getByRole('radio', { name: 'Blue', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Save category' }));
  expect(
    screen.getByRole('button', { name: 'Finance', exact: true }),
  ).toHaveAttribute('data-category-color', 'blue');
  await user.click(
    screen.getByRole('button', { name: 'Finance', exact: true }),
  );
  expect(screen.getByText('No matching definitions')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Actions for Finance' }));
  await user.click(
    await screen.findByRole('menuitem', { name: 'Edit', exact: true }),
  );
  expect(
    screen.getByRole('radio', { name: 'Blue', exact: true }),
  ).toBeChecked();
  await user.click(screen.getByRole('radio', { name: 'Purple', exact: true }));
  await user.clear(screen.getByLabelText('Category name'));
  await user.type(screen.getByLabelText('Category name'), 'Accounting');
  await user.click(screen.getByRole('button', { name: 'Save category' }));
  expect(
    screen.getByRole('button', { name: 'Accounting', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  expect(
    screen.getByRole('button', { name: 'Accounting', exact: true }),
  ).toHaveAttribute('data-category-color', 'purple');
  await user.click(
    screen.getByRole('button', { name: 'Actions for Accounting' }),
  );
  await user.click(
    await screen.findByRole('menuitem', { name: 'Delete', exact: true }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Delete category', exact: true }),
  );
  expect(
    screen.queryByRole('button', { name: 'Accounting', exact: true }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'All workflows' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await user.click(screen.getByRole('button', { name: 'Sales', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Actions for Sales' }));
  await user.click(
    await screen.findByRole('menuitem', { name: 'Delete', exact: true }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Delete category', exact: true }),
  );
  expect(
    screen.getByRole('button', { name: 'Order approval', exact: true }),
  ).toBeInTheDocument();
});

it('changes and clears a workflow category from its definition detail header', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const { WorkflowManagementDemo } =
    await import('../../website/demo/lifecycle/workflow-management/index.js');
  const user = userEvent.setup();
  render(<WorkflowManagementDemo />);
  await user.click(
    screen.getByRole('button', { name: 'Order approval', exact: true }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Change category: Sales' }),
  );
  await user.click(
    await screen.findByRole('menuitemradio', {
      name: 'Operations',
      exact: true,
    }),
  );
  expect(
    screen.getByRole('button', { name: 'Change category: Operations' }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Definitions', exact: true }),
  );
  await user.click(screen.getByRole('button', { name: 'Sales', exact: true }));
  expect(screen.getByText('No matching definitions')).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Operations', exact: true }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Order approval', exact: true }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Change category: Operations' }),
  );
  await user.click(
    await screen.findByRole('menuitemradio', { name: 'Uncategorized' }),
  );
  expect(
    screen.getByRole('button', { name: 'Change category: Uncategorized' }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Definitions', exact: true }),
  );
  expect(screen.getByText('No matching definitions')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'All workflows' }));
  expect(
    screen.getByRole('button', { name: 'Order approval', exact: true }),
  ).toBeInTheDocument();
});

it('renders a read-only category tag without an assignment control when updates are denied', async () => {
  const { DemoWorkflowCategory } =
    await import('../../website/demo/lifecycle/workflow-management/categories.js');
  const onChange = vi.fn();
  render(
    <DemoWorkflowCategory
      categories={[{ id: 'sales', title: 'Sales', color: 'blue' }]}
      value='sales'
      onChange={onChange}
      canEdit={false}
    />,
  );
  expect(screen.getByText('Sales')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

it('supports a full-width definition canvas with a contextual editor outside the permanent parameter slot', () => {
  const view = render(
    <WorkflowDefinitionDetail
      diagramTitle='Definition'
      parametersTitle='Parameters'
      diagram={<p>Standard graph</p>}
    />,
  );
  expect(
    screen.getByRole('region', { name: 'Definition' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: 'Parameters' }),
  ).not.toBeInTheDocument();
  view.rerender(
    <WorkflowDefinitionDetail
      diagramTitle='Definition'
      parametersTitle='Parameters'
      diagram={<p>Standard graph</p>}
      parameters={<p>Policy form</p>}
    />,
  );
  expect(screen.getByRole('region', { name: 'Parameters' })).toHaveTextContent(
    'Policy form',
  );
});

it('renders the whole supplied definition page without double pagination or local reordering', () => {
  const rows = Array.from({ length: 21 }, (_, index) => ({
    id: String(index),
    name: `key-${index}`,
    title: `Process ${index}`,
    activity: index,
  }));
  const sort = vi.fn();
  render(
    <WorkflowDefinitionList
      rows={rows}
      search={<input aria-label='Search' />}
      loaded
      loading={false}
      empty='Empty'
      labels={{
        refresh: 'Refresh',
        workflow: 'Workflow',
        executionCount: 'Count',
        executionActivity: 'Activity',
      }}
      sort={{ ascending: true }}
      onSort={sort}
      onRefresh={() => {}}
    />,
  );
  expect(screen.getAllByRole('row')).toHaveLength(22);
  expect(screen.getByText('Process 20')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Activity' }));
  expect(sort).toHaveBeenCalledOnce();
  expect(screen.getAllByRole('row')[1]).toHaveTextContent('Process 0');
});

it('does not show a no-results message while an execution page is loading', () => {
  const props = {
    rows: [],
    loaded: false,
    loading: true,
    filters: null,
    empty: 'No executions yet',
    labels: {
      refresh: 'Refresh',
      record: 'Record',
      workflow: 'Workflow',
      state: 'State',
      createdAt: 'Created',
      previous: 'Previous',
      next: 'Next',
    },
    order: 'newest' as const,
    onSort: () => {},
    onRefresh: () => {},
    pagination: null,
    previousDisabled: true,
    nextDisabled: true,
    onPrevious: () => {},
    onNext: () => {},
  };
  const view = render(<WorkflowExecutionList {...props} />);
  expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  expect(screen.queryByText('No results.')).not.toBeInTheDocument();
  expect(screen.queryByText('No executions yet')).not.toBeInTheDocument();
  view.rerender(<WorkflowExecutionList {...props} loaded loading={false} />);
  expect(screen.getByText('No executions yet')).toBeInTheDocument();
});
