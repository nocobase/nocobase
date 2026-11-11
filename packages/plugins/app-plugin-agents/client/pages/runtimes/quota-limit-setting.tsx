import { AgTag } from '../../components/ag-tag.js';
import { useState, type ReactElement } from 'react';
import type { AgentTool } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RunnerSummary } from '../../../shared/runners.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { Input } from '../../components/ui/input.js';
import { Button } from '../../components/ui/button.js';

/** A ceiling changes admission only; it never changes reported usage or ends a running lease. */
interface QuotaLimitProps {
  readonly runner: RunnerSummary;
  readonly tool: AgentTool;
  readonly now: number;
}
export function QuotaLimitSetting(props: QuotaLimitProps): ReactElement {
  return (
    <QuotaLimitForm
      key={`${props.runner.id}:${props.tool}:${props.runner.quotaLimits?.[props.tool] ?? ''}`}
      {...props}
    />
  );
}
function QuotaLimitForm({ runner, tool, now }: QuotaLimitProps) {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const cache = useQueryClient();
  const notify = useNotify();
  const current = runner.quotaLimits?.[tool];
  const [draft, setDraft] = useState(
    current === undefined ? '' : String(current),
  );
  const empty = !draft.trim();
  const value = Number(draft);
  const valid =
    empty || (Number.isInteger(value) && value >= 1 && value <= 100);
  const changed = empty ? current !== undefined : value !== current;
  const editable = runner.canManage && runner.status !== 'revoked';
  const save = useMutation({
    mutationFn: () => {
      const limits = { ...runner.quotaLimits };
      if (empty) delete limits[tool];
      else limits[tool] = value;
      return api.updateRunner(runner.id, {
        quotaLimits: Object.keys(limits).length ? limits : null,
      });
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: agentsKeys.runner(runner.id) });
      void cache.invalidateQueries({ queryKey: agentsKeys.runners });
      void cache.invalidateQueries({ queryKey: agentsKeys.agents });
      void cache.invalidateQueries({ queryKey: agentsKeys.available });
      void cache.invalidateQueries({ queryKey: agentsKeys.chatAgents });
    },
    onError: (error) => notify.error(error),
  });
  const paused =
    current !== undefined &&
    (runner.quotaUsage ?? []).some(
      (sample) =>
        sample.tool === tool &&
        sample.usedPercent !== undefined &&
        sample.usedPercent >= current &&
        (!sample.resetsAt || Date.parse(sample.resetsAt) > now),
    );
  if (!editable && current === undefined) return null;
  return (
    <div className='space-y-1'>
      <div className='flex flex-wrap items-center gap-1.5'>
        <label htmlFor={`quota-limit-${tool}`}>
          {t('runtimes.quota.ceilingLabel')}
        </label>
        <Input
          id={`quota-limit-${tool}`}
          type='number'
          min={1}
          max={100}
          step={1}
          className='h-7 w-20'
          value={draft}
          disabled={!editable || save.isPending}
          placeholder={t('runtimes.quota.ceilingOff')}
          aria-label={t('runtimes.quota.ceilingInput', {
            tool: t(`tools.${tool}`),
          })}
          aria-invalid={!valid || undefined}
          onChange={(event) => setDraft(event.target.value)}
        />
        <span>%</span>
        {paused ? (
          <AgTag
            tone='amber'
            dot
            role='status'
            title={t('runtimes.quota.ceilingPaused')}
          >
            {t('runtimes.quota.ceilingReached')}
          </AgTag>
        ) : null}
        {editable && changed ? (
          <Button
            type='button'
            size='xs'
            variant='outline'
            disabled={!valid || save.isPending}
            onClick={() => save.mutate()}
          >
            {t('runtimes.quota.ceilingSave')}
          </Button>
        ) : null}
      </div>
      {!valid ? <p role='alert'>{t('runtimes.quota.ceilingInvalid')}</p> : null}
      <p className='text-muted-foreground'>{t('runtimes.quota.ceilingHint')}</p>
    </div>
  );
}
