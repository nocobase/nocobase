import {
  Link,
  Outlet,
  Navigate,
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import {
  WorkflowManagementLayout,
  WorkflowDefinitionDetail,
} from '#extensions/nocobase-workflow-management/layout';
import { WorkflowDefinitionList } from '#extensions/nocobase-workflow-management/definition-list';
import { WorkflowExecutionList } from '#extensions/nocobase-workflow-management/execution-list';
import {
  WorkflowExecutionDetail,
  type WorkflowHistoryEntry,
} from '#extensions/nocobase-workflow-management/execution-detail';
import { LifecycleDiagram } from '#components/lifecycle-diagram';
import { RouteChildPage } from '#components/route-child-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { useEquipment, type Row, type AssetView } from './api.js';
import { LoadState, Display } from './shared.js';
interface Definition {
  id: string;
  description: LifecycleDescription;
  parameters: object;
}
function useLabels() {
  const { t } = useTranslation();
  return {
    t,
    definition: (id: string) =>
      t(
        'equipment.' +
          ({
            equipmentAssets: 'equipment',
            equipmentRequests: 'requests',
            equipmentMaintenance: 'maintenance',
            equipmentStocktakes: 'stocktakes',
          }[id] || 'workflows'),
      ),
    description: (d: LifecycleDescription) => ({
      ...d,
      stateInfo: d.stateInfo.map((s) => ({
        ...s,
        title: t('equipment.states.' + s.name),
      })),
      transitions: d.transitions.map((s) => ({
        ...s,
        title: t('equipment.transitions.' + s.name),
      })),
    }),
  };
}
export default function Workflows() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const allPieces = location.pathname.split('/').filter(Boolean);
  const start = allPieces.indexOf('workflows');
  const root = '/' + allPieces.slice(0, start + 1).join('/');
  const pieces = allPieces.slice(start);
  const tab = pieces.includes('executions') ? 'executions' : 'definitions';
  const detail = pieces.length > 2;
  return (
    <WorkflowManagementLayout
      title={t('equipment.workflows')}
      description={t('equipment.definitionHint')}
      labels={{
        definitions: t('equipment.definitions'),
        executions: t('equipment.executions'),
      }}
      tab={tab}
      detail={detail}
      onTabChange={(next) => void navigate(root + '/' + next)}
    >
      {pieces.length === 1 ? <Navigate to='definitions' replace /> : <Outlet />}
    </WorkflowManagementLayout>
  );
}
export function Definitions() {
  const result = useEquipment<Definition[]>('workflows');
  const { t, definition } = useLabels();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const q = params.get('q') || '';
  return (
    <>
      <WorkflowDefinitionList
        rows={(result.data?.data || [])
          .filter((r) =>
            definition(r.id).toLowerCase().includes(q.toLowerCase()),
          )
          .map((row) => ({
            id: row.id,
            title: (
              <Link
                className='text-primary hover:underline'
                to={{ pathname: row.id, search: location.search }}
              >
                {definition(row.id)}
              </Link>
            ),
            activity: '—',
          }))}
        search={
          <Input
            aria-label={t('equipment.search')}
            value={q}
            onChange={(e) =>
              setParams(e.target.value ? { q: e.target.value } : {}, {
                replace: true,
              })
            }
          />
        }
        loaded={!!result.data}
        loading={result.isFetching}
        empty={t('equipment.noResults')}
        status={
          <LoadState
            loading={result.isPending}
            error={result.error}
            retry={() => void result.refetch()}
          />
        }
        labels={{
          refresh: t('equipment.refresh'),
          workflow: t('equipment.workflow'),
          executionCount: t('equipment.executionCount'),
          executionActivity: t('equipment.activity'),
        }}
        onRefresh={() => void result.refetch()}
      />
      <Outlet />
    </>
  );
}
export function DefinitionDetail() {
  const { workflowId = '' } = useParams();
  const result = useEquipment<Definition>('workflows/' + workflowId);
  const { t, definition, description } = useLabels();
  const location = useLocation();
  return (
    <RouteChildPage>
      <PageContainer>
        <PageHeader
          title={definition(workflowId)}
          actions={
            <Button
              variant='outline'
              render={
                <Link
                  to={{ pathname: '..', search: location.search }}
                  relative='route'
                />
              }
            >
              {t('equipment.back')}
            </Button>
          }
        />
        <LoadState
          loading={result.isPending}
          error={result.error}
          retry={() => void result.refetch()}
        />
        {result.data && (
          <div className='mt-6'>
            <WorkflowDefinitionDetail
              diagramTitle={t('equipment.diagram')}
              parametersTitle={t('equipment.parameters')}
              diagram={
                <div className='h-[36rem] min-w-0'>
                  <LifecycleDiagram
                    ariaLabel={t('equipment.diagram')}
                    description={description(result.data.data.description)}
                    presentation='process'
                  />
                </div>
              }
              parameters={
                <p className='text-sm text-muted-foreground'>
                  {t('equipment.noParameters')}
                </p>
              }
            />
          </div>
        )}
      </PageContainer>
    </RouteChildPage>
  );
}
export function Executions() {
  const { t, definition } = useLabels();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const result = useEquipment<Row[]>(
    'executions?page=' +
      page +
      '&pageSize=20&order=' +
      (params.get('order') || 'desc'),
  );
  const location = useLocation();
  return (
    <>
      <WorkflowExecutionList
        rows={(result.data?.data || []).map((row) => ({
          id: row.id,
          record: (
            <Link
              className='text-primary hover:underline'
              to={{
                pathname: String(row.lifecycle) + '/' + row.recordId,
                search: location.search,
              }}
            >
              {String(row.recordId).slice(0, 8)}
            </Link>
          ),
          workflow: definition(String(row.lifecycle)),
          state: t('equipment.states.' + row.to),
          createdAt: <Display value={row.at} />,
        }))}
        loaded={!!result.data}
        loading={result.isFetching}
        filters={null}
        status={
          <LoadState
            loading={result.isPending}
            error={result.error}
            retry={() => void result.refetch()}
          />
        }
        empty={t('equipment.empty')}
        labels={{
          refresh: t('equipment.refresh'),
          record: t('equipment.record'),
          workflow: t('equipment.workflow'),
          state: t('equipment.fields.status'),
          createdAt: t('equipment.time'),
          previous: t('equipment.previous'),
          next: t('equipment.next'),
        }}
        order={params.get('order') === 'asc' ? 'oldest' : 'newest'}
        onSort={() =>
          setParams({ order: params.get('order') === 'asc' ? 'desc' : 'asc' })
        }
        onRefresh={() => void result.refetch()}
        pagination={
          <span>
            {page} /{' '}
            {Math.max(1, Math.ceil((result.data?.meta?.total || 0) / 20))}
          </span>
        }
        previousDisabled={page === 1 || result.isFetching}
        nextDisabled={
          page * 20 >= (result.data?.meta?.total || 0) || result.isFetching
        }
        onPrevious={() =>
          setParams({
            page: String(page - 1),
            order: params.get('order') || 'desc',
          })
        }
        onNext={() =>
          setParams({
            page: String(page + 1),
            order: params.get('order') || 'desc',
          })
        }
      />
      <Outlet />
    </>
  );
}
export function ExecutionDetail() {
  const { lifecycle = '', recordId = '' } = useParams();
  const result = useEquipment<
    AssetView & {
      state: string;
      definition: Definition;
      history: { transitions: WorkflowHistoryEntry[]; effectRuns: [] };
    }
  >('executions/' + lifecycle + '/' + recordId);
  const { t, definition, description } = useLabels();
  const location = useLocation();
  const labels = {
    processDiagram: t('equipment.diagram'),
    history: t('equipment.history'),
    historyHint: t('equipment.historyHint'),
    step: t('equipment.step'),
    transition: t('equipment.action'),
    from: t('equipment.from'),
    to: t('equipment.to'),
    actor: t('equipment.actor'),
    time: t('equipment.time'),
    noHistory: t('equipment.noHistory'),
    effects: t('equipment.effects'),
    effect: t('equipment.effect'),
    state: t('equipment.fields.status'),
    attempts: t('equipment.attempts'),
    error: t('equipment.error'),
    noEffects: t('equipment.noEffects'),
    executionParameters: t('equipment.parameters'),
    snapshotHint: t('equipment.snapshotHint'),
    showStep: (step: number) => t('equipment.showStep', { step }),
  };
  return (
    <RouteChildPage>
      <PageContainer>
        <PageHeader
          title={definition(lifecycle)}
          actions={
            <Button
              variant='outline'
              render={
                <Link
                  to={{ pathname: '../..', search: location.search }}
                  relative='route'
                />
              }
            >
              {t('equipment.back')}
            </Button>
          }
        />
        <LoadState
          loading={result.isPending}
          error={result.error}
          retry={() => void result.refetch()}
        />
        {result.data && (
          <div className='mt-6'>
            <WorkflowExecutionDetail
              transitions={result.data.data.history.transitions}
              effects={[]}
              state={result.data.data.state}
              labels={labels}
              stateLabel={(s) => t('equipment.states.' + s)}
              transitionLabel={(s) => t('equipment.transitions.' + s)}
              effectStatusLabel={(s) => s}
              dateLabel={(s) => <Display value={s} />}
              renderDiagram={(selection) => (
                <div className='h-[32rem]'>
                  <LifecycleDiagram
                    ariaLabel={t('equipment.diagram')}
                    description={description(
                      result.data.data.definition.description,
                    )}
                    history={selection.history}
                    currentState={selection.current}
                    presentation='process'
                  />
                </div>
              )}
            />
          </div>
        )}
      </PageContainer>
    </RouteChildPage>
  );
}
