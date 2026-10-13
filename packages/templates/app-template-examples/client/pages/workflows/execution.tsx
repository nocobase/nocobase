import { useState, type ReactElement } from 'react';
import { useLocation, useParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ProcessDiagram } from '@nocobase/app-plugin-lifecycle-example/client';
import { RouteDrawer } from '#components/route-drawer';
import { Button } from '#components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
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
  const [selected, setSelected] = useState<string>();
  const transitions = [...detail.view.history.transitions].sort(
    (a, b) =>
      a.version - b.version ||
      a.at.localeCompare(b.at) ||
      a.id.localeCompare(b.id),
  );
  const index = selected
    ? transitions.findIndex((entry) => entry.id === selected)
    : -1;
  const history = index < 0 ? transitions : transitions.slice(0, index + 1);
  const current = index < 0 ? detail.view.state : transitions[index].to;
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm'>
          {t('workflows.currentState')}:{' '}
          <strong>{labels.state(detail.workflow.source, current)}</strong>
        </p>
      </div>
      <p className='text-sm text-muted-foreground'>
        {t('workflows.historyHint')}
      </p>
      <ProcessDiagram
        description={detail.description}
        labelNamespace={
          detail.workflow.source === 'office'
            ? '@nocobase/app-plugin-office-flows-example'
            : undefined
        }
        current={current}
        history={history}
      />
      <h3 className='font-semibold'>{t('workflows.history')}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('workflows.step')}</TableHead>
            <TableHead>{t('workflows.transition')}</TableHead>
            <TableHead>{t('workflows.from')}</TableHead>
            <TableHead>{t('workflows.to')}</TableHead>
            <TableHead>{t('workflows.actor')}</TableHead>
            <TableHead>{t('workflows.time')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transitions.map((entry, step) => (
            <TableRow
              key={entry.id}
              data-selected={entry.id === selected ? 'true' : undefined}
            >
              <TableCell>
                <Button
                  size='sm'
                  variant={entry.id === selected ? 'secondary' : 'ghost'}
                  aria-label={t('workflows.showStep', { step: step + 1 })}
                  aria-pressed={entry.id === selected}
                  onClick={() => setSelected(entry.id)}
                >
                  {step + 1}
                </Button>
              </TableCell>
              <TableCell>
                {labels.transition(detail.workflow.source, entry.transition)}
              </TableCell>
              <TableCell>
                {entry.from
                  ? labels.state(detail.workflow.source, entry.from)
                  : '—'}
              </TableCell>
              <TableCell>
                {labels.state(detail.workflow.source, entry.to)}
              </TableCell>
              <TableCell>{entry.actorId}</TableCell>
              <TableCell>{workflowDate(entry.at, i18n.language)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!transitions.length && (
        <p className='text-sm text-muted-foreground'>
          {t('workflows.noHistory')}
        </p>
      )}
      <h3 className='font-semibold'>{t('workflows.effects')}</h3>
      {detail.view.history.effectRuns.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('workflows.effect')}</TableHead>
              <TableHead>{t('workflows.state')}</TableHead>
              <TableHead>{t('workflows.attempts')}</TableHead>
              <TableHead>{t('workflows.error')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.view.history.effectRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell>{run.effect}</TableCell>
                <TableCell>
                  {t(`workflows.runStates.${run.status}`, {
                    defaultValue: run.status,
                  })}
                </TableCell>
                <TableCell>
                  {run.attempts} / {run.maxAttempts}
                </TableCell>
                <TableCell className='max-w-80 whitespace-normal break-words text-destructive'>
                  {run.error || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('workflows.noEffects')}
        </p>
      )}
      {detail.view.parameterValues && (
        <details className='rounded-lg border p-3 text-sm'>
          <summary className='cursor-pointer font-medium'>
            {t('workflows.executionParameters')}
          </summary>
          <p className='py-2 text-muted-foreground'>
            {t('workflows.snapshotHint')}
          </p>
          <pre className='overflow-x-auto'>
            {JSON.stringify(detail.view.parameterValues, null, 2)}
          </pre>
        </details>
      )}
    </div>
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
    <RouteDrawer
      title={
        request.data
          ? `${labels.title(request.data.data.workflow)} · #${recordId}`
          : t('workflows.execution')
      }
      description={t('workflows.executionDescription')}
      closeTo={{ pathname: '/workflows/executions', search: location.search }}
      // Wide drawers keep branching diagrams readable while retaining the list context.
      className='w-full sm:max-w-5xl'
    >
      <div className='mb-4 flex justify-end'>
        <Button
          variant='outline'
          disabled={request.loading}
          onClick={() => {
            setRefreshVersion((version) => version + 1);
            request.reload();
          }}
        >
          {t('workflows.refresh')}
        </Button>
      </div>
      <DataState {...request} retry={request.reload} />
      {request.data && (
        <ExecutionDiagram
          key={`${workflowId}:${recordId}:${refreshVersion}`}
          detail={request.data.data}
        />
      )}
    </RouteDrawer>
  );
}
