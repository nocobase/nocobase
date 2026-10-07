import { useEffect, useState, type ReactElement } from 'react';
import type { Translator } from '@nocobase/i18n';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { WORKFLOW_NS } from '../namespace.js';
import { workflowApi } from './data.js';
import type { WorkflowNodeRunPayload, WorkflowNodeRunRecord } from './types.js';
import { Badge } from './ui/badge.js';

export interface WorkflowInspectorProps {
  nodeKey: string | null;
  attempts: readonly WorkflowNodeRunRecord[];
  selectedAttempt?: string | null;
  onSelectAttempt?: (id: string) => void;
}
export function WorkflowInspector({
  nodeKey,
  attempts,
  selectedAttempt,
  onSelectAttempt,
}: WorkflowInspectorProps): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  if (!nodeKey)
    return (
      <aside aria-label={t('inspector.label')}>
        <h2>{t('inspector.overview')}</h2>
        <p>{t('inspector.selectNode')}</p>
      </aside>
    );
  return (
    <aside aria-label={t('inspector.label')}>
      <h2>{nodeKey}</h2>
      <label>
        {t('inspector.attempt')}{' '}
        <select
          value={selectedAttempt ?? attempts.at(-1)?.id ?? ''}
          onChange={(event) => onSelectAttempt?.(event.target.value)}
        >
          {attempts.map((attempt, index) => (
            <option key={attempt.id} value={attempt.id}>
              {index + 1} · {runStatusLabel(attempt.status, t)}
            </option>
          ))}
        </select>
      </label>
      <ol>
        {attempts.map((attempt) => (
          <li key={attempt.id}>
            #{attempt.id} · {formatClientTime(attempt.startedAt, t)} →{' '}
            {formatClientTime(attempt.finishedAt, t)}
          </li>
        ))}
      </ol>
    </aside>
  );
}

function displayValue(value: unknown, t: Translator): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  )
    return String(value);
  if (typeof value === 'symbol') return value.toString();
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return t('inspector.unserializable');
  }
}
function formatClientTime(value: string | null, t: Translator): string {
  if (!value) return t('inspector.stillRunning');
  const date = new Date(value);
  const part = (next: number, width: number = 2): string =>
    String(next).padStart(width, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}.${part(date.getMilliseconds(), 3)}`;
}
function runStatusLabel(status: number, t: Translator): string {
  return status === 1
    ? t('status.succeeded')
    : status === 0
      ? t('status.running')
      : status === -1
        ? t('status.failed')
        : status === -2
          ? t('status.error')
          : t('status.aborted');
}
function runStatusTone(status: number): string {
  return status === 1
    ? 'resolved'
    : status === 0
      ? 'running'
      : status === -1
        ? 'failed'
        : status === -2
          ? 'error'
          : 'aborted';
}
function formatRunDuration(run: WorkflowNodeRunRecord): string {
  const start = new Date(run.startedAt).getTime();
  const end = run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now();
  const elapsed = Math.max(0, end - start);
  return elapsed < 1000 ? `${elapsed} ms` : `${(elapsed / 1000).toFixed(1)} s`;
}
export interface WorkflowRunResultDialogProps {
  runId: string;
  nodeRun: WorkflowNodeRunRecord | null;
  nodeTitle?: string;
  nodeDescription?: string | null;
  onClose: () => void;
}
export function WorkflowRunResultDialog({
  runId,
  nodeRun,
  nodeTitle,
  nodeDescription,
  onClose,
}: WorkflowRunResultDialogProps): ReactElement {
  return (
    <WorkflowRunResultDialogContent
      key={`${runId}:${nodeRun?.id ?? nodeTitle}`}
      runId={runId}
      nodeRun={nodeRun}
      nodeTitle={nodeTitle}
      nodeDescription={nodeDescription}
      onClose={onClose}
    />
  );
}
function WorkflowRunResultDialogContent({
  runId,
  nodeRun,
  nodeTitle,
  nodeDescription,
  onClose,
}: WorkflowRunResultDialogProps): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const [attemptId, setAttemptId] = useState(nodeRun?.id ?? '');
  const attemptsKey = `${runId}:${nodeRun?.nodeKey}`;
  const [attemptsResult, setAttemptsResult] = useState<{
    key: string;
    value: WorkflowNodeRunRecord[];
  }>(() => ({ key: attemptsKey, value: nodeRun ? [nodeRun] : [] }));
  const payloadKey = `${runId}:${attemptId}`;
  const [payloadResult, setPayloadResult] = useState<{
    key: string;
    value: WorkflowNodeRunPayload | null;
    error: string | null;
  }>(() => ({ key: payloadKey, value: null, error: null }));
  useEffect(() => {
    if (!nodeRun) return;
    let active = true;
    void workflowApi.nodeRuns(runId, nodeRun.nodeKey).then(
      (next) => {
        if (active) setAttemptsResult({ key: attemptsKey, value: next });
      },
      () => {
        /* The latest summary remains enough to display the selected run. */
      },
    );
    return () => {
      active = false;
    };
  }, [attemptsKey, nodeRun, runId]);
  useEffect(() => {
    if (!attemptId) return;
    let active = true;
    void workflowApi.payload(runId, attemptId).then(
      (next) => {
        if (active)
          setPayloadResult({ key: payloadKey, value: next, error: null });
      },
      (cause: unknown) => {
        if (active)
          setPayloadResult({
            key: payloadKey,
            value: null,
            error: cause instanceof Error ? cause.message : String(cause),
          });
      },
    );
    return () => {
      active = false;
    };
  }, [attemptId, payloadKey, runId]);
  const attempts =
    attemptsResult.key === attemptsKey
      ? attemptsResult.value
      : nodeRun
        ? [nodeRun]
        : [];
  const payload = payloadResult.key === payloadKey ? payloadResult.value : null;
  const error = payloadResult.key === payloadKey ? payloadResult.error : null;
  const current =
    attempts.find((attempt) => attempt.id === attemptId) ?? nodeRun;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size='lg' className='workflow-node-result-dialog'>
        <DialogHeader>
          <DialogTitle>{nodeTitle ?? current?.nodeKey}</DialogTitle>
          <div className='workflow-node-result-meta'>
            <Badge
              className={`workflow-run-status-tag ${current ? runStatusTone(current.status) : 'not-executed'}`}
            >
              {current
                ? runStatusLabel(current.status, t)
                : t('status.notExecuted')}
            </Badge>
            {current ? (
              <span>
                {t('common.duration', { duration: formatRunDuration(current) })}
              </span>
            ) : null}
          </div>
        </DialogHeader>
        {attempts.length > 1 ? (
          <label>
            {t('inspector.attempt')}{' '}
            <select
              value={attemptId}
              onChange={(event) => setAttemptId(event.target.value)}
            >
              {attempts.map((attempt, index) => (
                <option key={attempt.id} value={attempt.id}>
                  {index + 1} · {runStatusLabel(attempt.status, t)} ·{' '}
                  {formatClientTime(attempt.startedAt, t)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <details className='workflow-node-description-disclosure'>
          <summary>{t('common.description')}</summary>
          <p>{nodeDescription?.trim() || t('workflows.noNodeDescription')}</p>
        </details>
        {!current ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('inspector.notExecuted')}
          </p>
        ) : error ? (
          <p role='alert'>{error}</p>
        ) : payload ? (
          <div className='workflow-result-content'>
            {payload.truncated ? (
              <p role='status'>{t('inspector.payloadTruncated')}</p>
            ) : null}
            {payload.error ? (
              <>
                <h3>{t('status.error')}</h3>
                <pre>{payload.error}</pre>
              </>
            ) : (
              <>
                <h3>{t('inspector.result')}</h3>
                <pre>{displayValue(payload.result, t)}</pre>
              </>
            )}
            {payload.log?.trim() ? (
              <>
                <h3>{t('inspector.log')}</h3>
                <pre>{payload.log}</pre>
              </>
            ) : null}
          </div>
        ) : (
          <p>{t('inspector.loadingResult')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface WorkflowInputDialogProps {
  input: unknown;
  onClose: () => void;
}
export function WorkflowInputDialog({
  input,
  onClose,
}: WorkflowInputDialogProps): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size='lg' className='workflow-node-result-dialog'>
        <DialogHeader>
          <DialogTitle>{t('inspector.inputTitle')}</DialogTitle>
          <DialogDescription>
            {t('inspector.inputDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className='workflow-result-content'>
          <h3>{t('inspector.input')}</h3>
          <pre>{displayValue(input, t)}</pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
