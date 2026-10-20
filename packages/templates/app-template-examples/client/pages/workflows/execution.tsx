import { useState, type ReactElement } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { useLocation, useParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ProcessDiagram } from '@nocobase/app-plugin-lifecycle-example/client';
import { WorkflowDetailPage } from './detail-page.js';
import { Button } from '#components/ui/button';
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
            {JSON.stringify(detail.view.parameterValues, null, 2)}
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
  const [refreshVersion, setRefreshVersion] = useState(0);
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
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('workflows.refresh')}
                disabled={request.loading}
                onClick={() => {
                  setRefreshVersion((version) => version + 1);
                  request.reload();
                }}
              />
            }
          >
            <RefreshCw
              className={request.loading ? 'animate-spin' : undefined}
            />
          </TooltipTrigger>
          <TooltipContent>{t('workflows.refresh')}</TooltipContent>
        </Tooltip>
      }
      description={t('workflows.executionDescription')}
      listTitle={t('workflows.executions')}
      closeTo={{ pathname: '/workflows/executions', search: location.search }}
    >
      <DataState {...request} retry={request.reload} />
      {request.data && (
        <ExecutionDiagram
          key={`${workflowId}:${recordId}:${refreshVersion}`}
          detail={request.data.data}
        />
      )}
    </WorkflowDetailPage>
  );
}
