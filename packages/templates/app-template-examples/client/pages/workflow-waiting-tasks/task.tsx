import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#components/ui/empty';
import { Label } from '#components/ui/label';
import { Skeleton } from '#components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Textarea } from '#components/ui/textarea';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';
import { Link, useParams } from 'react-router';
import type { ReviewTask } from './types.js';

interface TaskDetail {
  data: ReviewTask;
  meta: { currentReviewer: { id: string; name: string } };
}

export default function WorkflowWaitingTaskPage(): ReactElement {
  const { id = '' } = useParams();
  const api = useApiClient();
  const toaster = useToaster();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [decision, setDecision] = useState('');
  const [decisionTouched, setDecisionTouched] = useState(false);
  const focusDecisionAfterSaveRef = useRef(false);
  const decisionRef = useRef<HTMLButtonElement>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const query = useQuery({
    queryKey: ['quotation-review-task', id],
    queryFn: ({ signal }) =>
      api.request<TaskDetail>({ path: `quotationReviewTasks/${id}`, signal }),
    retry: false,
    refetchInterval: (query) => {
      const current = query.state.data?.data;
      return current?.resumeRequest?.status === 'queued' ||
        current?.resumeRequest?.status === 'processing' ||
        (current?.status === 'pending' && current.waitStatus === 'not-ready')
        ? 2000
        : false;
    },
  });
  const task = query.data?.data;
  const selectedDecision =
    task?.status === 'submitting' ? (task.decision ?? '') : decision;
  const enteredComment =
    task?.status === 'submitting' ? (task.comment ?? '') : comment;
  const ready = task?.status === 'pending' && task.waitStatus === 'pending';
  const retryable = task?.status === 'submitting';
  const canSubmit = ready || retryable;
  const decisionError = decisionTouched && !selectedDecision;
  const missing =
    query.isError &&
    typeof query.error === 'object' &&
    query.error !== null &&
    'status' in query.error &&
    query.error.status === 404;
  useEffect(() => {
    if (!saving && focusDecisionAfterSaveRef.current) {
      focusDecisionAfterSaveRef.current = false;
      decisionRef.current?.focus();
    }
  }, [saving]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!task || !canSubmit) return;
    if (!['approved', 'rejected'].includes(selectedDecision)) {
      setDecisionTouched(true);
      decisionRef.current?.focus();
      return;
    }
    setSaving(true);
    setError(false);
    try {
      const response = await api.request<{ data: ReviewTask }>({
        path: `quotationReviewTasks/${task.id}/submit`,
        method: 'POST',
        json: { decision: selectedDecision, comment: enteredComment },
      });
      queryClient.setQueryData(['quotation-review-task', id], {
        data: response.data,
        meta: query.data?.meta,
      });
      setSuccess(true);
      toaster.show({
        type: 'success',
        title: t('workflowTasks.submitSuccess'),
      });
      void query.refetch();
      void queryClient.invalidateQueries({
        queryKey: ['quotation-review-tasks'],
      });
    } catch (submissionError) {
      if (
        submissionError instanceof ApiClientError &&
        submissionError.reason === 'INVALID_INPUT'
      ) {
        setDecisionTouched(true);
        focusDecisionAfterSaveRef.current = true;
      } else {
        setError(true);
      }
      await query.refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('workflowTasks.detailTitle')}
        description={t('workflowTasks.detailDescription')}
        actions={
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              {t('workflowTasks.refresh')}
            </Button>
            <Button
              variant='outline'
              render={<Link to='/workflow/waiting-tasks' />}
              nativeButton={false}
            >
              {t('workflowTasks.back')}
            </Button>
          </div>
        }
      />
      {query.isPending ? (
        <div
          role='status'
          aria-label={t('workflowTasks.loading')}
          className='max-w-2xl space-y-4 rounded-lg border bg-card p-5'
        >
          <span className='sr-only'>{t('workflowTasks.loading')}</span>
          <Skeleton className='h-7 w-1/2' />
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-32 w-full' />
        </div>
      ) : missing ? (
        <Empty className='max-w-2xl border bg-card'>
          <EmptyHeader>
            <EmptyTitle>{t('workflowTasks.notFound')}</EmptyTitle>
            <EmptyDescription>
              {t('workflowTasks.notFoundHint')}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            variant='outline'
            render={<Link to='/workflow/waiting-tasks' />}
            nativeButton={false}
          >
            {t('workflowTasks.back')}
          </Button>
        </Empty>
      ) : query.isError ? (
        <div
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive'
        >
          {t('workflowTasks.detailError')}{' '}
          <Button variant='outline' onClick={() => void query.refetch()}>
            {t('workflowTasks.retry')}
          </Button>
        </div>
      ) : task ? (
        <div className='max-w-2xl space-y-6'>
          <div className='space-y-3 rounded-lg border bg-card p-5'>
            <div className='flex items-center justify-between gap-3'>
              <strong className='text-lg'>{task.quotationId}</strong>
              <Badge variant='outline'>
                {t(`workflowTasks.status.${task.status}`)}
              </Badge>
            </div>
            <dl className='grid gap-3 text-sm sm:grid-cols-2'>
              <div>
                <dt className='text-muted-foreground'>
                  {t('workflowTasks.route')}
                </dt>
                <dd>{t(`workflowTasks.routeValue.${task.route}`)}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>
                  {t('workflowTasks.amount')}
                </dt>
                <dd>
                  {new Intl.NumberFormat(i18n.language, {
                    style: 'currency',
                    currency: 'USD',
                  }).format(task.totalCents / 100)}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>
                  {t('workflowTasks.runId')}
                </dt>
                <dd className='font-mono'>
                  <Link
                    className='text-primary underline-offset-2 hover:underline'
                    to={`/settings/workflow/runs/${encodeURIComponent(task.runId)}`}
                  >
                    #{task.runId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>
                  {t('workflowTasks.waitStatus')}
                </dt>
                <dd>
                  {t(`workflowTasks.wait.${task.waitStatus}`, {
                    defaultValue: task.waitStatus,
                  })}
                </dd>
              </div>
            </dl>
          </div>
          {task.status === 'submitted' ? (
            <div
              role='status'
              className='space-y-2 rounded-lg border bg-card p-5'
            >
              <h2 className='font-semibold'>{t('workflowTasks.submitted')}</h2>
              <p>
                {t('workflowTasks.resumeStatus')}:{' '}
                {t(
                  `workflowTasks.resume.${task.resumeRequest?.status ?? 'unknown'}`,
                )}
              </p>
              {task.resumeRequest?.status === 'rejected' ? (
                <p className='text-destructive'>
                  {t(`workflowTasks.resumeReason.${task.resumeRequest.reason}`)}
                </p>
              ) : null}
              {task.resumeRequest?.status === 'consumed' ? (
                <p>{t('workflowTasks.appliedHint')}</p>
              ) : null}
              <p>
                {t('workflowTasks.reviewer')}: {task.confirmedBy}
              </p>
              <p>
                {t('workflowTasks.decision')}:{' '}
                {t(`workflowTasks.decisionValue.${task.decision}`)}
              </p>
              {task.comment ? (
                <p>
                  {t('workflowTasks.comment')}: {task.comment}
                </p>
              ) : null}
            </div>
          ) : canSubmit ? (
            <form
              className='space-y-5 rounded-lg border bg-card p-5'
              onSubmit={(event) => void submit(event)}
            >
              <h2 className='font-semibold'>{t('workflowTasks.process')}</h2>
              <div className='space-y-2'>
                <Label>{t('workflowTasks.reviewer')}</Label>
                <p className='rounded-md border bg-muted px-3 py-2 text-sm'>
                  {retryable
                    ? task.confirmedBy
                    : query.data?.meta.currentReviewer.name}
                </p>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='review-decision'>
                  {t('workflowTasks.decision')}{' '}
                  <span aria-hidden='true'>*</span>
                </Label>
                <Select
                  value={selectedDecision}
                  onValueChange={(value) => setDecision(value ?? '')}
                  disabled={saving || retryable}
                >
                  <SelectTrigger
                    id='review-decision'
                    ref={decisionRef}
                    aria-required='true'
                    aria-invalid={decisionError}
                    aria-describedby={
                      decisionError ? 'review-decision-error' : undefined
                    }
                    onBlur={() => setDecisionTouched(true)}
                    className='w-full'
                  >
                    <SelectValue
                      placeholder={t('workflowTasks.chooseDecision')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='approved'>
                      {t('workflowTasks.decisionValue.approved')}
                    </SelectItem>
                    <SelectItem value='rejected'>
                      {t('workflowTasks.decisionValue.rejected')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {decisionError ? (
                  <p
                    id='review-decision-error'
                    role='alert'
                    className='text-sm text-destructive'
                  >
                    {t('workflowTasks.decisionRequired')}
                  </p>
                ) : null}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='review-comment'>
                  {t('workflowTasks.comment')}
                </Label>
                <Textarea
                  id='review-comment'
                  maxLength={2000}
                  value={enteredComment}
                  onChange={(event) => setComment(event.target.value)}
                  disabled={saving || retryable}
                />
              </div>
              {error ? (
                <p role='alert' className='text-sm text-destructive'>
                  {t('workflowTasks.submitError')}
                </p>
              ) : null}
              <Button type='submit' disabled={saving}>
                {saving
                  ? t('workflowTasks.submitting')
                  : t('workflowTasks.submit')}
              </Button>
            </form>
          ) : (
            <p
              role='status'
              className='rounded-lg border bg-muted p-5 text-muted-foreground'
            >
              {t('workflowTasks.unavailable')}
            </p>
          )}
          {success ? (
            <p role='status' className='text-sm text-primary'>
              {t('workflowTasks.submitSuccess')}
            </p>
          ) : null}
        </div>
      ) : null}
    </PageContainer>
  );
}
