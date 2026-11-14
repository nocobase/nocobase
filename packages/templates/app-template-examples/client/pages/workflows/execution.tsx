import type { ReactElement } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ProcessDiagram } from '@nocobase/app-plugin-lifecycle-example/client';
import { WorkflowDetailPage } from './detail-page.js';
import { WorkflowExecutionDetail as WorkflowExecutionView } from '#extensions/nocobase-workflow-management/execution-detail';
import type { WorkflowExecutionDetail } from '../../../shared/workflows.js';
import { DataState } from './shared.js';
import { useWorkflowData, useWorkflowLabels, workflowDate } from './hooks.js';

export function ExecutionDiagram({
  detail,
}: {
  readonly detail: WorkflowExecutionDetail;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const labels = useWorkflowLabels();
  return (
    <WorkflowExecutionView
      transitions={detail.view.history.transitions}
      state={detail.view.state}
      effects={detail.view.history.effectRuns}
      labels={{
        processDiagram: t('workflows.processDiagram'),
        history: t('workflows.history'),
        historyHint: t('workflows.historyHint'),
        step: t('workflows.step'),
        transition: t('workflows.transition'),
        from: t('workflows.from'),
        to: t('workflows.to'),
        actor: t('workflows.actor'),
        time: t('workflows.time'),
        noHistory: t('workflows.noHistory'),
        effects: t('workflows.effects'),
        effect: t('workflows.effect'),
        state: t('workflows.state'),
        attempts: t('workflows.attempts'),
        error: t('workflows.error'),
        noEffects: t('workflows.noEffects'),
        executionParameters: t('workflows.executionParameters'),
        snapshotHint: t('workflows.snapshotHint'),
        showStep: (step) => t('workflows.showStep', { step }),
      }}
      stateLabel={(name) => labels.state(detail.workflow.source, name)}
      transitionLabel={(name) =>
        labels.transition(detail.workflow.source, name)
      }
      dateLabel={(at) => workflowDate(at, i18n.language)}
      effectStatusLabel={(status) =>
        t(`workflows.runStates.${status}`, { defaultValue: status })
      }
      parameters={
        detail.view.parameterValues ? (
          <pre className='overflow-x-auto text-sm'>
            {JSON.stringify(
              detail.view.parameterSnapshot ?? detail.view.parameterValues,
              null,
              2,
            )}
          </pre>
        ) : undefined
      }
      renderDiagram={({ current, history }) => (
        <ProcessDiagram
          autoHeight={false}
          showDetails={false}
          containerClassName='flex flex-1 flex-col'
          className='h-auto min-h-[720px] flex-1'
          description={detail.description}
          labelNamespace={
            detail.workflow.source === 'office'
              ? '@nocobase/app-plugin-office-flows-example'
              : undefined
          }
          current={current}
          history={history}
        />
      )}
    />
  );
}
export default function ExecutionPage(): ReactElement {
  const { workflowId = '', recordId = '' } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const labels = useWorkflowLabels();
  const request = useWorkflowData<{ data: WorkflowExecutionDetail }>(
    `workflows/executions/${encodeURIComponent(workflowId)}/${encodeURIComponent(recordId)}`,
  );
  return (
    <WorkflowDetailPage
      title={
        request.data
          ? `${labels.title(request.data.data.workflow)} · #${recordId}`
          : t('workflows.execution')
      }
      titleSuffix={
        request.data && request.data.data.workflow.versions.length > 1 ? (
          // The record runs the version it is bound to, whichever is latest.
          <Link
            to={{
              pathname: `/workflows/definitions/${request.data.data.workflow.id}`,
              search: new URLSearchParams({
                version: String(request.data.data.definition.version),
              }).toString(),
            }}
            className='text-sm font-normal tracking-normal text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring'
          >
            {t('workflows.versionLabel', {
              version: request.data.data.definition.version,
            })}
          </Link>
        ) : undefined
      }
      description={t('workflows.executionDescription')}
      listTitle={t('workflows.executions')}
      closeTo={{ pathname: '/workflows/executions', search: location.search }}
    >
      <DataState {...request} retry={request.reload} />
      {request.data && (
        <ExecutionDiagram
          key={`${workflowId}:${recordId}`}
          detail={request.data.data}
        />
      )}
    </WorkflowDetailPage>
  );
}
