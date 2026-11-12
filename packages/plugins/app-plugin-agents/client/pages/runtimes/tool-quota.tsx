/**
 * A tool's quota at a glance, beside its tag in the runtime list: when it is used up and when it resets, how many
 * providers (opencode and pi) or models are used up, or else the highest percentage used. Hovering shows each window. It reads
 * quota exactly as the runtime sheet does (`quota-view.ts`); clearing a mark stays in the sheet.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { AgentTool } from '@nocobase/agent-protocol';
import type { ReactElement } from 'react';

import { quotaTargetLabel } from '../../../shared/model-catalog.js';
import { QuotaLabel } from '../../components/quota-status.js';
import { Badge } from '../../components/ui/badge.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip.js';
import { compactDateTime, quotaWindowLabel } from '../../lib/format.js';
import { providerTool, quotaView, type QuotaSource } from './quota-view.js';

/** The latest reset of `marks`, which all have to pass before work resumes; null when one is unknown. */
function lastReset(
  marks: readonly { readonly resetsAt?: string | null }[],
): string | null {
  if (marks.some((mark) => !mark.resetsAt)) return null;
  return (
    marks
      .map((mark) => mark.resetsAt!)
      .sort()
      .at(-1) ?? null
  );
}

export function ToolQuota({
  runner,
  tool,
  now,
}: {
  readonly runner: QuotaSource;
  readonly tool: AgentTool;
  readonly now: number;
}): ReactElement | null {
  const { t, i18n } = useTranslation();
  const time = (iso: string) => compactDateTime(iso, i18n.language, now);
  const own = quotaView(runner, tool, '', now);
  const targets = [
    ...new Set([
      ...(runner.quotaUsage ?? [])
        .filter((u) => u.tool === tool && u.target !== '')
        .map((u) => u.target),
      ...(runner.unavailableModels ?? [])
        .filter(
          (m) => m.tool === tool && m.reason === 'toolQuota' && m.model !== '',
        )
        .map((m) => m.model),
    ]),
  ].sort();
  const parts = [
    { label: '', view: own },
    ...targets.map((target) => ({
      label: quotaTargetLabel(
        tool,
        providerTool(tool) ? 'provider' : 'model',
        target,
      ),
      view: quotaView(runner, tool, target, now),
    })),
  ].filter(({ view }) => view.marks.length || view.usage.length);
  if (!parts.length) return null;

  const details = parts.flatMap(({ label, view }) => {
    const prefix = label ? `${label} · ` : '';
    return [
      ...view.marks.map(
        (mark) =>
          `${prefix}${quotaWindowLabel(mark.window ?? 'account')} · ${t('runtimes.quota.reached')} · ${
            mark.resetsAt
              ? t('runtimes.quota.resets', { time: time(mark.resetsAt) })
              : t('runtimes.quota.unknown')
          }`,
      ),
      ...view.usage.map(
        (u) =>
          `${prefix}${quotaWindowLabel(u.window)} · ${t(
            'runtimes.quota.usedPercent',
            {
              percent: Math.round(u.usedPercent ?? 0),
            },
          )}${u.resetsAt ? ` · ${t('runtimes.quota.resets', { time: time(u.resetsAt) })}` : ''}`,
      ),
    ];
  });

  // Providers (opencode, pi) or models used up while the tool itself still has quota.
  const blocked = parts.filter(
    ({ label, view }) => label && view.marks.length,
  ).length;
  const highest = Math.max(
    0,
    ...parts.flatMap(({ view }) => view.usage.map((u) => u.usedPercent ?? 0)),
  );
  const limit = runner.quotaLimits?.[tool];
  let summary: ReactElement;
  if (own.marks.length)
    summary = <QuotaLabel resetsAt={lastReset(own.marks)} reset />;
  else if (blocked > 0)
    summary = (
      <Badge variant='secondary' className='bg-destructive/10 text-destructive'>
        {t(
          providerTool(tool)
            ? 'runtimes.quota.providers'
            : 'runtimes.quota.models',
          { count: blocked },
        )}
      </Badge>
    );
  else {
    const level =
      highest >= 100
        ? 'full'
        : highest >= 90 || (limit !== undefined && highest >= limit)
          ? 'warn'
          : undefined;
    summary = (
      <span
        data-level={level}
        className='text-xs text-muted-foreground tabular-nums data-[level=full]:font-medium data-[level=full]:text-destructive data-[level=warn]:font-medium data-[level=warn]:text-amber-700 dark:data-[level=warn]:text-amber-300'
      >
        {t('runtimes.quota.percent', { percent: Math.round(highest) })}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            data-testid={`tool-quota-${tool}`}
            className='inline-flex cursor-default rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
          />
        }
        aria-label={`${t(`tools.${tool}`)} · ${t('runtimes.quota.title')}: ${details.join('; ')}`}
      >
        {summary}
      </TooltipTrigger>
      <TooltipContent className='flex-col items-start gap-0.5'>
        <span className='font-medium'>
          {t(`tools.${tool}`)} · {t('runtimes.quota.title')}
        </span>
        {details.map((line) => (
          <span key={line}>{line}</span>
        ))}
        {limit !== undefined ? (
          <span>
            {t('runtimes.quota.ceilingLabel')} {limit}%
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
