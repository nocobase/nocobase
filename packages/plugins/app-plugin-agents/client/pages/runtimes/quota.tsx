import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { isNativeTool, type AgentTool } from '@nocobase/agent-protocol';
import type {
  RunnerSummary,
  UnavailableModel,
} from '../../../shared/runners.js';
import { compactDateTime, quotaWindowLabel } from '../../lib/format.js';
import { QuotaLabel } from '../../components/quota-status.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog.js';
import { Button } from '../../components/ui/button.js';

export function QuotaCell({
  runner,
  tool,
  target = '',
  now,
  onClear,
}: {
  readonly runner: RunnerSummary;
  readonly tool: AgentTool;
  readonly target?: string;
  readonly now: number;
  readonly onClear: (mark: UnavailableModel) => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const marks = (runner.unavailableModels ?? []).filter(
    (m) =>
      m.reason === 'toolQuota' &&
      m.tool === tool &&
      m.model === target &&
      (!m.resetsAt || Date.parse(m.resetsAt) > now),
  );
  const usage = (runner.quotaUsage ?? []).filter(
    (u) =>
      u.tool === tool &&
      u.target === target &&
      u.usedPercent !== undefined &&
      (!u.resetsAt || Date.parse(u.resetsAt) > now) &&
      !(u.window === 'account' && marks.length) &&
      !(u.exhausted && !marks.length),
  );
  const providerTool = tool === 'opencode' || tool === 'pi';
  const blocked = new Set(
    (runner.unavailableModels ?? [])
      .filter(
        (m) =>
          m.reason === 'toolQuota' &&
          m.tool === tool &&
          m.scope === 'provider' &&
          (!m.resetsAt || Date.parse(m.resetsAt) > now),
      )
      .map((m) => m.model),
  ).size;
  const near =
    !marks.length &&
    usage.some(
      (u) =>
        (u.usedPercent ?? 0) >= 90 &&
        (!u.resetsAt || Date.parse(u.resetsAt) > now),
    );
  return (
    <div className='min-w-0 space-y-1 text-xs whitespace-normal'>
      {marks.map((mark) => (
        <div
          key={`${mark.scope}:${mark.window}`}
          className='flex flex-wrap items-center gap-x-1.5 gap-y-1'
        >
          <QuotaLabel />
          <span>
            {mark.resetsAt
              ? t('runtimes.quota.resets', {
                  time: compactDateTime(mark.resetsAt, i18n.language, now),
                })
              : t('runtimes.quota.unknown')}
          </span>
          {!mark.resetsAt ? (
            <span className='text-muted-foreground'>
              {t('runtimes.quota.since', {
                time: compactDateTime(mark.at, i18n.language, now),
              })}
            </span>
          ) : null}
          {runner.canClearQuota ? (
            <Button
              type='button'
              size='xs'
              variant='outline'
              className='ml-auto'
              onClick={() => onClear(mark)}
            >
              {t('runtimes.quota.clear')}
            </Button>
          ) : null}
        </div>
      ))}
      {usage.length ? (
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
          {usage.map((u) => (
            <span
              key={u.window}
              className='inline-flex items-center gap-1 whitespace-nowrap'
              title={t('runtimes.quota.observed', {
                time: compactDateTime(u.observedAt, i18n.language, now),
              })}
            >
              {quotaWindowLabel(u.window)}{' '}
              <span className='h-1 w-8 overflow-hidden rounded bg-muted'>
                <span
                  className={
                    (u.usedPercent ?? 0) >= 100
                      ? 'block h-full bg-destructive'
                      : (u.usedPercent ?? 0) >= 90
                        ? 'block h-full bg-amber-600'
                        : 'block h-full bg-primary'
                  }
                  style={{ width: `${u.usedPercent}%` }}
                />
              </span>
              {t('runtimes.quota.usedPercent', {
                percent: Math.round(u.usedPercent ?? 0),
              })}
            </span>
          ))}
          {near ? <QuotaLabel near /> : null}
        </div>
      ) : null}
      {marks.some((m) => m.resetsAt) ? (
        <p className='text-muted-foreground'>{t('runtimes.quota.automatic')}</p>
      ) : null}
      {!usage.length && !marks.length ? (
        providerTool && !target && blocked > 0 ? (
          <span className='text-muted-foreground'>
            {t('runtimes.quota.providers', {
              count: blocked,
            })}
          </span>
        ) : (
          <span className='text-muted-foreground'>
            {t(
              !isNativeTool(tool)
                ? 'runtimes.tool.notProvided'
                : 'runtimes.quota.ok',
            )}
          </span>
        )
      ) : null}
    </div>
  );
}

/** Asks before a quota mark is cleared; `name` is the tool or model the mark holds back, null while closed. */
export function QuotaClearDialog({
  name,
  pending,
  onClear,
  onCancel,
}: {
  readonly name: string | null;
  readonly pending: boolean;
  readonly onClear: () => void;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={name !== null}
      onOpenChange={(open) => {
        if (!open && !pending) onCancel();
      }}
    >
      {/* Opened from the runtime sheet, so its backdrop must be forced to cover the sheet. */}
      <AlertDialogContent nested>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('runtimes.quota.confirmTitle', { target: name ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('runtimes.quota.confirm', { target: name ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={pending}
            onClick={onClear}
          >
            {t('runtimes.quota.clearMark')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
