import { Empty, EmptyDescription } from '#components/ui/empty';
import { officeParameterFields } from '@nocobase/app-plugin-office-flows-example/client';
import { useEffect, type ReactElement } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ProcessDiagram } from '@nocobase/app-plugin-lifecycle-example/client';
import { WorkflowParametersForm } from './parameters.js';
import { WorkflowCategoryEditor, type Category } from './categories.js';
import { WorkflowDetailPage } from './detail-page.js';
import { WorkflowDefinitionDetail } from '#extensions/nocobase-workflow-management/layout';
import type { WorkflowDefinition } from '../../../shared/workflows.js';
import { DataState, VersionSelect } from './shared.js';
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
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const rawVersion = Number(search.get('version'));
  const version =
    Number.isSafeInteger(rawVersion) && rawVersion > 0 ? rawVersion : undefined;
  const request = useWorkflowData<{ data: WorkflowDefinition }>(
    `workflows/definitions/${encodeURIComponent(workflowId)}`,
    version === undefined
      ? ''
      : new URLSearchParams({ version: String(version) }).toString(),
  );
  const categories = useWorkflowData<{ data: Category[] }>(
    'workflows/categories',
  );
  const loaded = request.data?.data;
  const canonicalId = loaded?.workflow.id;
  useEffect(() => {
    // A link from before the process had versions names one version by its
    // own name: open the process at that version instead.
    if (!loaded || canonicalId === workflowId) return;
    const params = new URLSearchParams(location.search);
    params.set('version', String(loaded.definition.version));
    void navigate(
      {
        pathname: location.pathname.replace(
          `/workflows/definitions/${workflowId}`,
          `/workflows/definitions/${canonicalId}`,
        ),
        search: params.toString(),
      },
      { replace: true },
    );
  }, [canonicalId, workflowId, loaded, location, navigate]);
  const versioned = (loaded?.workflow.versions.length ?? 0) > 1;
  const executionsSearch = new URLSearchParams({
    workflowId: canonicalId ?? workflowId,
    ...(versioned && loaded
      ? { version: String(loaded.definition.version) }
      : {}),
  }).toString();
  return (
    <WorkflowDetailPage
      title={loaded ? labels.title(loaded.workflow) : t('workflows.definition')}
      titleSuffix={
        loaded ? (
          <>
            {versioned && (
              <VersionSelect
                versions={loaded.workflow.versions}
                value={loaded.definition.version}
                onChange={(next) => {
                  const params = new URLSearchParams(search);
                  if (next === undefined) params.delete('version');
                  else params.set('version', String(next));
                  setSearch(params);
                }}
              />
            )}
            {categories.data && (
              <WorkflowCategoryEditor
                key={canonicalId}
                workflowId={canonicalId ?? workflowId}
                value={loaded.workflow.categoryId}
                categories={categories.data.data}
                onSaved={request.reload}
              />
            )}
            <Link
              to={`/workflows/executions?${executionsSearch}`}
              className='text-sm font-normal tracking-normal text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring'
            >
              {versioned
                ? t('workflows.versionExecutionCountLink', {
                    version: loaded.definition.version,
                    count: loaded.definition.executionCount,
                  })
                : t('workflows.executionCountLink', {
                    count: loaded.workflow.executionCount,
                  })}
            </Link>
          </>
        ) : undefined
      }
      description={
        loaded ? (
          <>
            <DefinitionDescription definition={loaded} />
            {versioned && (
              <span className='mt-1 block text-xs'>
                {t('workflows.latestHint')}
              </span>
            )}
          </>
        ) : undefined
      }
      listTitle={t('workflows.definitions')}
      closeTo={{ pathname: '/workflows/definitions', search: location.search }}
    >
      {loaded && <DataState {...categories} retry={categories.reload} />}
      <DataState {...request} retry={request.reload} />
      {loaded && (
        <WorkflowDefinitionDetail
          diagramTitle={t('workflows.processDiagram')}
          parametersTitle={t('workflows.parameterSettings')}
          diagram={
            <DefinitionDiagram
              key={`${loaded.workflow.id}@${loaded.definition.version}`}
              definition={loaded}
            />
          }
          parameters={
            location.pathname.endsWith('/parameters') ? null : (
                loaded.workflow.source === 'office'
                  ? Boolean(officeParameterFields[loaded.workflow.name])
                  : Boolean(
                      loaded.description.parameterConfiguration?.groups.length,
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
