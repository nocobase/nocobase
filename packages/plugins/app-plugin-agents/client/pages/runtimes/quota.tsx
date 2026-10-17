import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import type { AgentTool } from '@nocobase/agent-protocol';
import type { RunnerSummary } from '../../../shared/runners.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { Button } from '../../components/ui/button.js';
import { AgTag } from '../../components/ag-tag.js';
import { quotaTargets } from './quota-targets.js';
import { useQuotaClock } from '../../hooks/use-quota-expiry.js';
import { useFormatters } from '../../lib/format.js';

export function QuotaCell({
  runner,
  tool,
  target = '',
}: {
  readonly runner: RunnerSummary;
  readonly tool: AgentTool;
  readonly target?: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const query = useQueryClient();
  const notify = useNotify();
  const format = useFormatters();
  const now = useQuotaClock([
    ...(runner.unavailableModels ?? []).map((mark) => mark.resetsAt),
    ...(runner.quotaUsage ?? []).map((usage) => usage.resetsAt),
  ]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const clear = useMutation({
    mutationFn: (key: string) =>
      api.clearQuota(runner.id, runner.quotaRevision ?? 0, key),
    onSuccess: () => {
      setConfirm(null);
      void query.invalidateQueries({ queryKey: agentsKeys.runners });
      void query.invalidateQueries({ queryKey: agentsKeys.agents });
    },
    onError: (error) => notify.error(error),
  });
  const marks = (runner.unavailableModels ?? []).filter(
    (m) =>
      m.reason === 'toolQuota' &&
      m.tool === tool &&
      m.model === target &&
      (!m.resetsAt || Date.parse(m.resetsAt) > now),
  );
  const usage = (runner.quotaUsage ?? []).filter(
    (u) =>
      u.tool === tool && u.target === target && u.usedPercent !== undefined,
  );
  const providerTool = tool === 'opencode' || tool === 'pi';
  const blockedProviders = new Set(
    (runner.unavailableModels ?? [])
      .filter(
        (mark) =>
          mark.reason === 'toolQuota' &&
          mark.scope === 'provider' &&
          mark.tool === tool &&
          (!mark.resetsAt || Date.parse(mark.resetsAt) > now),
      )
      .map((mark) => mark.model),
  ).size;
  const stale = usage.some(
    (u) =>
      Date.parse(u.observedAt) < now - 300000 ||
      (u.resetsAt !== null && Date.parse(u.resetsAt) <= now),
  );
  return (
    <div className='space-y-1 text-xs whitespace-normal'>
      {marks.map((mark) => {
        const key = JSON.stringify([
          mark.tool,
          mark.scope ?? 'model',
          mark.model,
          mark.window ?? 'account',
        ]);
        return (
          <div key={key} className='flex flex-wrap items-center gap-1.5'>
            {confirm === key ? (
              <>
                <span>
                  {t('runtimes.quota.confirm', { target: target || tool })}
                </span>
                <Button
                  type='button'
                  size='sm'
                  disabled={clear.isPending}
                  onClick={() => clear.mutate(key)}
                >
                  {t('runtimes.quota.clearMark')}
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => setConfirm(null)}
                >
                  {t('actions.cancel')}
                </Button>
              </>
            ) : (
              <>
                <AgTag tone='amber'>{t('runtimes.quota.reached')}</AgTag>
                <span>
                  {mark.resetsAt
                    ? t('runtimes.quota.resets', {
                        time: format.dateTime(mark.resetsAt),
                      })
                    : t('runtimes.quota.unknown')}
                </span>
                {runner.canClearQuota ? (
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => setConfirm(key)}
                  >
                    {t('runtimes.quota.clear')}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        );
      })}
      {usage.length ? (
        <div className='flex flex-wrap gap-2'>
          {usage.map((u) => (
            <span
              key={u.window}
              title={t('runtimes.quota.observed', {
                time: format.dateTime(u.observedAt),
              })}
              className='inline-flex items-center gap-1'
            >
              {u.window
                .replace('five_hour', '5h')
                .replace(/^seven_day.*$/u, '7d')
                .replace('300m', '5h')
                .replace('10080m', '7d')}
              {u.usedPercent === undefined ? (
                '—'
              ) : (
                <>
                  <span className='h-1 w-8 overflow-hidden rounded bg-muted'>
                    <span
                      className={
                        u.usedPercent >= 90
                          ? 'block h-full bg-amber-600'
                          : 'block h-full bg-primary'
                      }
                      style={{ width: `${u.usedPercent}%` }}
                    />
                  </span>
                  {Math.round(u.usedPercent)}%
                  {u.usedPercent >= 90 &&
                  !marks.length &&
                  (!u.resetsAt || Date.parse(u.resetsAt) > now) ? (
                    <AgTag tone='amber'>{t('runtimes.quota.near')}</AgTag>
                  ) : null}
                </>
              )}
            </span>
          ))}
        </div>
      ) : !marks.length ? (
        <span className='text-muted-foreground'>
          {target
            ? t('runtimes.quota.ok')
            : providerTool && blockedProviders > 0
              ? t('runtimes.quota.providers', {
                  blocked: blockedProviders,
                  total: quotaTargets(runner, tool).length,
                })
              : '—'}
        </span>
      ) : null}
      {usage.length && stale ? (
        <p className='text-muted-foreground'>
          {t('runtimes.quota.observed', {
            time: format.relative(
              usage
                .map((u) => u.observedAt)
                .sort()
                .at(-1),
            ),
          })}
        </p>
      ) : null}
    </div>
  );
}
