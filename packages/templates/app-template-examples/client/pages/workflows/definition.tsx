import { Empty, EmptyDescription } from '#components/ui/empty';
import { officeParameterFields } from '@nocobase/app-plugin-office-flows-example/client';
import type { ReactElement } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ProcessDiagram } from '@nocobase/app-plugin-lifecycle-example/client';
import { WorkflowParametersForm } from './parameters.js';
import { WorkflowCategoryEditor, type Category } from './categories.js';
import { WorkflowDetailPage } from './detail-page.js';
import { WorkflowDefinitionDetail } from '#extensions/nocobase-workflow-management/layout';
import type { WorkflowDefinition } from '../../../shared/workflows.js';
import { DataState } from './shared.js';
import { useWorkflowData, useWorkflowLabels } from './hooks.js';

function DefinitionDescription({
  definition,
}: {
  readonly definition: WorkflowDefinition;
}): ReactElement {
  const { t } = useTranslation();
  const labels = useWorkflowLabels();
  const { description, workflow } = definition;
  const { t: describe } = useTranslation(
    workflow.source === 'office'
      ? '@nocobase/app-plugin-office-flows-example'
      : '@nocobase/app-plugin-lifecycle-example',
  );
  const descriptionKeys: Record<string, string> = {
    tickets: 'tickets.agentDescription',
    orders: 'orders.shows',
    invoices: 'invoices.shows',
    exports: 'exports.shows',
    purchases: 'purchases.description',
    fulfilments: 'fulfilments.description',
    subscriptions: 'subscriptions.shows',
    dataRequests: 'dataRequests.description',
    incoming: 'incoming.description',
  };
  const descriptionKey = descriptionKeys[workflow.name];
  return (
    <>
      {descriptionKey
        ? describe(descriptionKey)
        : t('workflows.processSummary', {
            title: labels.title(workflow),
            states: description.states.length,
            transitions: description.transitions.length,
          })}
    </>
  );
}

function DefinitionDiagram({
  definition,
}: {
  readonly definition: WorkflowDefinition;
}): ReactElement {
  return (
    <div className='flex flex-1 flex-col gap-4'>
      <ProcessDiagram
        autoHeight={false}
        showDetails={false}
        // React Flow needs a definite height when the cards size independently.
        containerClassName='flex flex-1 flex-col'
        className='h-[720px] min-h-[720px] shrink-0'
        description={definition.description}
        labelNamespace={
          definition.workflow.source === 'office'
            ? '@nocobase/app-plugin-office-flows-example'
            : undefined
        }
      />
    </div>
  );
}
export default function DefinitionPage(): ReactElement {
  const { workflowId = '' } = useParams();
  const { t } = useTranslation();
  const labels = useWorkflowLabels();
  const location = useLocation();
  const request = useWorkflowData<{ data: WorkflowDefinition }>(
    `workflows/definitions/${encodeURIComponent(workflowId)}`,
  );
  const categories = useWorkflowData<{ data: Category[] }>(
    'workflows/categories',
  );
  return (
    <WorkflowDetailPage
      title={
        request.data
          ? labels.title(request.data.data.workflow)
          : t('workflows.definition')
      }
      titleSuffix={
        request.data ? (
          <>
            {categories.data && (
              <WorkflowCategoryEditor
                key={workflowId}
                workflowId={workflowId}
                value={request.data.data.workflow.categoryId}
                categories={categories.data.data}
                onSaved={request.reload}
              />
            )}
            <Link
              to={`/workflows/executions?workflowId=${encodeURIComponent(workflowId)}`}
              className='text-sm font-normal tracking-normal text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring'
            >
              {t('workflows.executionCountLink', {
                count: request.data.data.workflow.executionCount,
              })}
            </Link>
          </>
        ) : undefined
      }
      description={
        request.data ? (
          <DefinitionDescription definition={request.data.data} />
        ) : undefined
      }
      listTitle={t('workflows.definitions')}
      closeTo={{ pathname: '/workflows/definitions', search: location.search }}
    >
      {request.data && <DataState {...categories} retry={categories.reload} />}
      <DataState {...request} retry={request.reload} />
      {request.data && (
        <WorkflowDefinitionDetail
          diagramTitle={t('workflows.processDiagram')}
          parametersTitle={t('workflows.parameterSettings')}
          diagram={
            <DefinitionDiagram
              key={workflowId}
              definition={request.data.data}
            />
          }
          parameters={
            location.pathname.endsWith('/parameters') ? null : (
                request.data.data.workflow.source === 'office'
                  ? Boolean(
                      officeParameterFields[request.data.data.workflow.name],
                    )
                  : Boolean(
                      request.data.data.description.parameterConfiguration
                        ?.groups.length,
                    )
              ) ? (
              <WorkflowParametersForm key={workflowId} inline />
            ) : (
              <Empty>
                <EmptyDescription>
                  {t('workflows.noParameters')}
                </EmptyDescription>
              </Empty>
            )
          }
        />
      )}
      <Outlet />
    </WorkflowDetailPage>
  );
}
