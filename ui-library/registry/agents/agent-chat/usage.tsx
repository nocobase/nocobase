/**
 * What a conversation used, as far as the coding tools of its runs report it (`GET conversations/{id}/usage`): a
 * small ring by the composer for how full the context window is, and the details' "Usage" section with the window
 * and the tokens and cost over every run. A tool that does not report a piece leaves it out (OpenCode and Pi report
 * no context window, Codex and the ACP agents no cost) rather than showing a made-up number.
 */
import type { ConversationUsage } from '@nocobase/app-plugin-agents/shared/conversations';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { useChatTranslation } from './chat-i18n.js';
const tokens = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

function percent(context: NonNullable<ConversationUsage['context']>): number {
  return Math.min(100, Math.round((context.used / context.size) * 100));
}

/** A small ring for how full the context window is; nothing when the tool does not say. */
export function ContextRing({
  usage,
}: {
  readonly usage: ConversationUsage | undefined;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const { i18n } = useTranslation();
  const context = usage?.context;
  if (!context) return null;
  const share = percent(context);
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius;
  const label = t('chat.usage.context', {
    used: tokens(context.used, i18n.language),
    size: tokens(context.size, i18n.language),
    percent: share,
  });
  return (
    <span
      className='inline-flex size-7 shrink-0 items-center justify-center text-muted-foreground'
      role='img'
      aria-label={label}
      title={label}
      data-testid='chat-context-ring'
    >
      <svg viewBox='0 0 16 16' className='size-4 -rotate-90' aria-hidden='true'>
        <circle
          cx='8'
          cy='8'
          r={radius}
          fill='none'
          stroke='currentColor'
          strokeOpacity='0.2'
          strokeWidth='2'
        />
        <circle
          cx='8'
          cy='8'
          r={radius}
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          className={share >= 80 ? 'text-amber-600 dark:text-amber-400' : ''}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - share / 100)}
        />
      </svg>
    </span>
  );
}

/** The details' usage: the context window with a bar, then input, cached and output tokens and the cost. */
export function UsageSection({
  usage,
}: {
  readonly usage: ConversationUsage | undefined;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const { i18n } = useTranslation();
  if (!usage || (usage.runs === 0 && !usage.context)) return null;
  const number = (count: number): string =>
    new Intl.NumberFormat(i18n.language).format(count);
  return (
    <div className='flex flex-col gap-2' data-testid='session-usage'>
      {usage.context ? (
        <div className='flex flex-col gap-1'>
          <div className='flex items-baseline justify-between gap-2 text-xs'>
            <span className='text-muted-foreground'>
              {t('chat.usage.window')}
            </span>
            <span className='tabular-nums'>
              {tokens(usage.context.used, i18n.language)} /{' '}
              {tokens(usage.context.size, i18n.language)} ·{' '}
              {percent(usage.context)}%
            </span>
          </div>
          <span
            className='h-1.5 overflow-hidden rounded-full bg-muted'
            role='progressbar'
            aria-label={t('chat.usage.window')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent(usage.context)}
          >
            <span
              className='block h-full bg-primary'
              style={{ width: `${percent(usage.context)}%` }}
            />
          </span>
        </div>
      ) : null}
      {usage.runs > 0 ? (
        <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs'>
          {(
            [
              ['input', usage.inputTokens],
              ['cached', usage.cacheReadTokens],
              ['output', usage.outputTokens],
            ] as const
          ).map(([key, count]) => (
            <div key={key} className='contents'>
              <dt className='text-muted-foreground'>
                {t(`chat.usage.${key}`)}
              </dt>
              <dd className='text-right tabular-nums'>{number(count)}</dd>
            </div>
          ))}
          {usage.costUsd !== null ? (
            <div className='contents'>
              <dt className='text-muted-foreground'>{t('chat.usage.cost')}</dt>
              <dd className='text-right tabular-nums'>
                {new Intl.NumberFormat(i18n.language, {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: usage.costUsd < 1 ? 4 : 2,
                }).format(usage.costUsd)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}
