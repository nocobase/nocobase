import { useState, type ReactElement } from 'react';
import { PageHeader } from '#components/page-header';
import { Input } from '#components/ui/input';
import { LifecycleDiagram } from '#components/lifecycle-diagram';
import {
  WorkflowManagementLayout,
  WorkflowDefinitionDetail,
  type WorkflowTab,
} from '#extensions/nocobase-workflow-management/layout';
import { WorkflowDefinitionList } from '#extensions/nocobase-workflow-management/definition-list';
import { WorkflowExecutionList } from '#extensions/nocobase-workflow-management/execution-list';
import { WorkflowExecutionDetail } from '#extensions/nocobase-workflow-management/execution-detail';
import { description, transitions, executionLabels } from './fixtures.js';
import {
  DemoCategories,
  DemoWorkflowCategory,
  type DemoCategory,
} from './categories.js';

/** A static adapter. Real applications derive tabs, filters and detail selection from their routes. */
export function WorkflowManagementDemo(): ReactElement {
  const [tab, setTab] = useState<WorkflowTab>('definitions');
  const [detail, setDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [ascending, setAscending] = useState(false);
  const [revision, setRevision] = useState(0);
  const [categories, setCategories] = useState<DemoCategory[]>([
    { id: 'sales', title: 'Sales', color: 'blue' },
    { id: 'operations', title: 'Operations', color: 'teal' },
  ]);
  const [category, setCategory] = useState('all');
  const [workflowCategory, setWorkflowCategory] = useState<string | undefined>(
    'sales',
  );
  const matches = 'Order approval'.toLowerCase().includes(search.toLowerCase());
  const open = (
    <button
      className='font-medium underline-offset-4 hover:underline'
      onClick={() => {
        setTab('definitions');
        setDetail(true);
      }}
    >
      Order approval
    </button>
  );
  return (
    <WorkflowManagementLayout
      title='Workflow management'
      description='Definitions, parameters and recorded executions.'
      labels={{ definitions: 'Definitions', executions: 'Executions' }}
      tab={tab}
      onTabChange={setTab}
      detail={detail}
    >
      {detail ? (
        <>
          {/* An application declares this trail with usePageBreadcrumb in its shell. */}
          <nav
            aria-label='Breadcrumb'
            className='flex flex-wrap gap-2 text-sm text-muted-foreground'
          >
            <button
              className='hover:underline'
              onClick={() => setDetail(false)}
            >
              Workflow management
            </button>
            <span aria-hidden='true'>/</span>
            <button
              className='hover:underline'
              onClick={() => setDetail(false)}
            >
              {tab === 'definitions' ? 'Definitions' : 'Executions'}
            </button>
            <span aria-hidden='true'>/</span>
            <span aria-current='page'>
              Order approval{tab === 'executions' ? ' · #1' : ''}
            </span>
          </nav>
          <PageHeader
            title={
              <span className='flex flex-wrap items-baseline gap-x-4 gap-y-2'>
                <span>
                  {tab === 'definitions'
                    ? 'Order approval'
                    : 'Order approval · #1'}
                </span>
                {tab === 'definitions' && (
                  <DemoWorkflowCategory
                    categories={categories}
                    value={workflowCategory}
                    onChange={setWorkflowCategory}
                  />
                )}
              </span>
            }
          />
          {tab === 'definitions' ? (
            <WorkflowDefinitionDetail
              diagramTitle='Process diagram'
              parametersTitle='Parameter settings'
              diagram={
                <LifecycleDiagram
                  presentation='process'
                  stateKind={(state) =>
                    state.name === 'review'
                      ? 'approval'
                      : state.name === 'rejected'
                        ? 'negative'
                        : state.final
                          ? 'success'
                          : description.initialStates.includes(state.name)
                            ? 'start'
                            : 'work'
                  }
                  description={description}
                  ariaLabel='Order approval definition'
                  direction='DOWN'
                  autoHeight
                  className='min-h-96'
                />
              }
              parameters={
                <p className='text-sm text-muted-foreground'>
                  This definition has no adjustable parameters.
                </p>
              }
            />
          ) : (
            <WorkflowExecutionDetail
              key={revision}
              transitions={transitions}
              state='approved'
              effects={[
                {
                  id: 'notify-1',
                  effect: 'notify',
                  status: 'failed',
                  attempts: 1,
                  maxAttempts: 3,
                  error: 'Delivery unavailable',
                },
              ]}
              labels={executionLabels}
              stateLabel={(name) => name}
              transitionLabel={(name) => name}
              dateLabel={(at) => at}
              effectStatusLabel={(status) => status}
              renderDiagram={({ current, history }) => (
                <LifecycleDiagram
                  presentation='process'
                  stateKind={(state) =>
                    state.name === 'review'
                      ? 'approval'
                      : state.name === 'rejected'
                        ? 'negative'
                        : state.final
                          ? 'success'
                          : description.initialStates.includes(state.name)
                            ? 'start'
                            : 'work'
                  }
                  description={description}
                  ariaLabel='Order approval execution'
                  direction='DOWN'
                  autoHeight
                  currentState={current}
                  history={history}
                  className='min-h-96'
                />
              )}
            />
          )}
        </>
      ) : tab === 'definitions' ? (
        <WorkflowDefinitionList
          rows={
            matches && (category === 'all' || category === workflowCategory)
              ? [
                  {
                    id: 'orders',
                    name: 'orders',
                    title: open,
                    activity: (
                      <button
                        className='hover:underline'
                        onClick={() => {
                          setTab('executions');
                          setSearch('');
                        }}
                      >
                        1 execution
                      </button>
                    ),
                  },
                ]
              : []
          }
          categories={
            <DemoCategories
              categories={categories}
              value={category}
              onChange={setCategory}
              onSave={(id, title, color) =>
                setCategories((current) =>
                  id
                    ? current.map((item) =>
                        item.id === id ? { ...item, title, color } : item,
                      )
                    : [
                        ...current,
                        {
                          id: `category-${Date.now()}-${current.length}`,
                          title,
                          color,
                        },
                      ],
                )
              }
              onDelete={(id) => {
                setCategories((current) =>
                  current.filter((item) => item.id !== id),
                );
                if (category === id) setCategory('all');
                if (workflowCategory === id) setWorkflowCategory(undefined);
              }}
            />
          }
          search={
            <Input
              aria-label='Search definitions'
              placeholder='Search definitions'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          }
          loaded
          loading={false}
          empty='No matching definitions'
          labels={{
            refresh: 'Refresh',
            workflow: 'Workflow',
            executionCount: 'Execution count',
            executionActivity: 'Execution activity',
          }}
          sort={{ ascending }}
          onSort={() => setAscending(!ascending)}
          onRefresh={() => setRevision(revision + 1)}
        />
      ) : (
        <WorkflowExecutionList
          rows={
            matches
              ? [
                  {
                    id: 'order-1',
                    record: (
                      <button
                        className='hover:underline'
                        onClick={() => setDetail(true)}
                      >
                        #1
                      </button>
                    ),
                    workflow: open,
                    state: 'approved',
                    createdAt: '2026-01-01 11:00',
                  },
                ]
              : []
          }
          filters={
            <Input
              className='w-full sm:w-72'
              aria-label='Search executions'
              placeholder='Search executions'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          }
          loaded
          loading={false}
          empty='No matching executions'
          labels={{
            refresh: 'Refresh',
            record: 'Record',
            workflow: 'Workflow',
            state: 'State',
            createdAt: 'Created at',
            previous: 'Previous',
            next: 'Next',
          }}
          order={ascending ? 'oldest' : 'newest'}
          onSort={() => setAscending(!ascending)}
          onRefresh={() => setRevision(revision + 1)}
          pagination='Page 1 · 1 record'
          previousDisabled
          nextDisabled
          onPrevious={() => undefined}
          onNext={() => undefined}
        />
      )}
    </WorkflowManagementLayout>
  );
}
