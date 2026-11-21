import { useState, type ReactElement } from 'react';
import { createUuid, useApiClient } from '@nocobase/app-client';
import type { ManagementCommand, ManagementDetails } from '@nocobase/lifecycle';
import { useTranslation } from '@nocobase/i18n/client';

import { LIFECYCLE_ROUTES } from '../../shared/routes.js';
import { errorMessage } from '../lib/api.js';
import { dateTime, NAMESPACE } from '../lib/format.js';
import { useTranslate } from '../lib/use-example-record.js';
import { Choice } from './choice.js';
import { Field, StateBadge } from './record-ui.js';
import { Textarea } from './textarea.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog.js';

export type TicketManagementView = Pick<
  ManagementDetails,
  'actions' | 'targets' | 'initial' | 'work' | 'history' | 'version'
>;

interface ManagementSubmission {
  readonly command: ManagementCommand;
  readonly target?: string;
  readonly reason: string;
  readonly requestId: string;
  readonly expectedVersion: string;
}

export function TicketManagementDialog({
  id,
  subject,
  state,
  management,
  refresh,
}: {
  readonly id: string;
  readonly subject: string;
  readonly state: string;
  readonly management: TicketManagementView;
  readonly refresh: () => Promise<void>;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const api = useApiClient();
  const [snapshot, setSnapshot] = useState<{
    management: TicketManagementView;
    state: string;
  }>();
  const [command, setCommand] = useState<ManagementCommand>('suspend');
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [submission, setSubmission] = useState<ManagementSubmission>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const detail = snapshot?.management ?? management;
  const reenter = command === 'reset' || command === 'restartAt';
  const destination =
    command === 'reset'
      ? detail.initial
      : command === 'restartAt'
        ? target
        : (snapshot?.state ?? state);

  async function submit(): Promise<void> {
    if (
      !snapshot ||
      busy ||
      conflict ||
      !reason.trim() ||
      !detail.actions.includes(command) ||
      !destination
    )
      return;
    const request = submission ?? {
      command,
      ...(command === 'restartAt' ? { target } : {}),
      reason: reason.trim(),
      requestId: createUuid(),
      expectedVersion: detail.version,
    };
    setSubmission(request);
    setBusy(true);
    setError('');
    try {
      await api.request({
        path: `${LIFECYCLE_ROUTES}/tickets/${encodeURIComponent(id)}/management`,
        method: 'POST',
        json: request,
      });
      setSnapshot(undefined);
      await refresh();
    } catch (cause) {
      const stale =
        typeof cause === 'object' &&
        cause !== null &&
        'status' in cause &&
        cause.status === 409;
      setConflict(stale);
      setError(
        stale ? t('ticketManagement.conflict') : errorMessage(cause, translate),
      );
      if (stale) await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={snapshot !== undefined}
      onOpenChange={(open) => {
        if (busy) return;
        if (!open) {
          setSnapshot(undefined);
          return;
        }
        const first = management.actions[0];
        if (!first) return;
        setSnapshot({ management, state });
        setCommand(first);
        setTarget(management.targets[0] ?? '');
        setReason('');
        setConflict(false);
        setSubmission(undefined);
        setError('');
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant='outline'
            size='sm'
            disabled={!management.actions.length}
          />
        }
      >
        {t('ticketManagement.title')}
      </DialogTrigger>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>{t('ticketManagement.title')}</DialogTitle>
          <DialogDescription>
            #{id} · {subject}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <Choice
            label={t('ticketManagement.action')}
            value={command}
            disabled={busy || conflict}
            options={detail.actions.map((action) => ({
              value: action,
              label: t(`ticketManagement.commands.${action}`),
            }))}
            onChange={(value) => {
              setCommand(value as ManagementCommand);
              setSubmission(undefined);
            }}
          />
          {command === 'restartAt' && (
            <Choice
              label={t('ticketManagement.target')}
              value={target}
              disabled={busy || conflict}
              options={detail.targets.map((value) => ({
                value,
                label: t(`states.${value}`),
              }))}
              onChange={(value) => {
                setTarget(value);
                setSubmission(undefined);
              }}
            />
          )}
          <div className='grid grid-cols-2 gap-2'>
            <Field label={t('ticketManagement.current')}>
              <StateBadge state={snapshot?.state ?? state} />
            </Field>
            {destination && (
              <Field label={t('ticketManagement.target')}>
                <StateBadge state={destination} />
              </Field>
            )}
          </div>
          {reenter && (
            <div className='space-y-2 text-muted-foreground'>
              <p>{t('ticketManagement.restartNotice')}</p>
              {detail.work.length > 0 && (
                <ul className='list-disc space-y-1 pl-5'>
                  {detail.work.map((run) => (
                    <li key={run.id}>
                      {run.effect} · {t(`ticketManagement.work.${run.status}`)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <label className='block space-y-1.5'>
            <span>{t('ticketManagement.reason')}</span>
            <Textarea
              required
              maxLength={1000}
              value={reason}
              disabled={busy || conflict}
              onChange={(event) => {
                setReason(event.target.value);
                setSubmission(undefined);
              }}
            />
          </label>
          {error && (
            <p role='alert' className='text-destructive'>
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => setSnapshot(undefined)}
          >
            {t('common.close')}
          </Button>
          <Button
            disabled={busy || conflict || !reason.trim()}
            onClick={() => void submit()}
          >
            {t('ticketManagement.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TicketManagementHistory({
  history,
}: {
  readonly history: TicketManagementView['history'];
}): ReactElement | null {
  const { t, i18n } = useTranslation(NAMESPACE);
  if (!history.length) return null;
  return (
    <section className='space-y-2 rounded-lg border p-3'>
      <h3 className='text-sm font-medium'>{t('ticketManagement.history')}</h3>
      <ol className='space-y-3 text-sm'>
        {history.map(({ id, actorId, at, from, event }) => (
          <li key={id} className='space-y-1'>
            <p className='flex flex-wrap items-center gap-2'>
              <strong>{t(`ticketManagement.commands.${event.command}`)}</strong>
              <StateBadge state={from} /> →{' '}
              <StateBadge state={event.result.state} />
            </p>
            <p className='text-xs text-muted-foreground'>
              {t('ticketManagement.audit', {
                actor: actorId,
                time: dateTime(at, i18n.language),
                from: event.previousRound,
                to: event.result.round,
              })}
            </p>
            <p className='wrap-anywhere whitespace-pre-wrap'>{event.reason}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
