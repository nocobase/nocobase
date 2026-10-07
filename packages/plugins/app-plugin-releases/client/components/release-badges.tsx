/** How an App, a deployment, a request or a key stands, as tags (`tag.tsx`) in the reader's language. */
import { useTranslation } from '@nocobase/i18n/client';
import { ShieldIcon } from 'lucide-react';
import { useContext, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { AppSummary, Labels } from '../../shared/releases.js';
import { ReleasesAppOriginContext } from '../lib/app-origin.js';
import { appStateOf } from '../lib/app-state.js';
import { messageText } from '../lib/errors.js';
import { ReleasesSystemLabelsContext } from '../lib/system-labels.js';
import { SystemLabelChip } from './labels-editor.js';
import { Tag, type Tone } from './tag.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

const APP_STATE_TONE: Readonly<Record<string, Tone>> = {
  running: 'green',
  pending: 'blue',
  starting: 'blue',
  deploying: 'blue',
  stopped: 'grey',
  stoppedOnDemand: 'grey',
  dormant: 'violet',
  failed: 'red',
  unknown: 'grey',
};

/** The App's runtime state; deploying while a deployment is pending. The runtime's error shows on hover. */
export function AppStateBadge({
  summary,
}: {
  readonly summary: AppSummary;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const state = appStateOf(summary);
  return (
    <Tag
      tone={APP_STATE_TONE[state] ?? 'grey'}
      dot
      title={
        summary.runtime.error
          ? messageText(t, summary.runtime.error)
          : undefined
      }
    >
      {t(`ui.state.${state}`)}
    </Tag>
  );
}

const STATUS_TONE: Readonly<Record<string, Tone>> = {
  queued: 'grey',
  deploying: 'blue',
  succeeded: 'green',
  failed: 'red',
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  cancelled: 'grey',
  deployed: 'green',
  active: 'green',
  disabled: 'grey',
  expired: 'amber',
};

/** A status worded by `key` (`ui.deployments.statuses.*`, `ui.requests.status.*`). */
export function StatusTag({
  status,
  wording,
}: {
  readonly status: string;
  readonly wording: string;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Tag tone={STATUS_TONE[status] ?? 'grey'} dot>
      {t(`${wording}.${status}`, { defaultValue: status })}
    </Tag>
  );
}

/** An environment's policy: protected, so every deployment waits for an approver. */
export function EnvironmentBadges({
  protected: isProtected = false,
}: {
  readonly protected?: boolean;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (!isProtected) return null;
  return <Tag tone='amber'>{t('ui.environments.protected')}</Tag>;
}

/** An environment's name on one line, followed by a shield that says "Protected" on hover or focus when it is. */
export function EnvironmentName({
  name,
  protected: isProtected = false,
}: {
  readonly name: string;
  readonly protected?: boolean;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const label = t('ui.environments.protected');
  return (
    <span className='inline-flex max-w-full min-w-0 items-center gap-1.5'>
      <span className='truncate' title={name}>
        {name}
      </span>
      {isProtected ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                tabIndex={0}
                className='inline-flex shrink-0 rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
              />
            }
          >
            <ShieldIcon className='size-4' aria-hidden='true' />
            <span className='sr-only'>{label}</span>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}

/**
 * Labels as `key=value` chips; a dash without any. A label the assembling application added shows a lock and why it is
 * there on hover.
 */
export function LabelChips({
  labels,
}: {
  readonly labels: Readonly<Record<string, string>>;
}): ReactElement {
  const system = useContext(ReleasesSystemLabelsContext);
  const entries = Object.entries(labels);
  if (entries.length === 0)
    return <span className='text-muted-foreground'>—</span>;
  return (
    <span className='flex flex-wrap gap-1'>
      {entries.map(([key, value]) => {
        const explanation = system?.explain(key, value) ?? null;
        return explanation ? (
          <SystemLabelChip
            key={key}
            text={`${key}=${value}`}
            explanation={explanation}
          />
        ) : (
          <span
            key={key}
            className='rounded-md border bg-muted/40 px-1.5 font-mono text-xs leading-5 text-muted-foreground'
          >
            {`${key}=${value}`}
          </span>
        );
      })}
    </span>
  );
}

/**
 * An App's labels where Apps are listed and on its page: the ones people set, as chips, and in place of the ones the
 * assembling application added, its one-line summary of the App (`ReleasesAppOriginContext`), such as "PR #18 ·
 * acme/crm". The added labels stay on the App, and its settings still show them.
 */
export function AppLabels({
  appId,
  labels,
}: {
  readonly appId: string;
  readonly labels: Labels;
}): ReactElement {
  const system = useContext(ReleasesSystemLabelsContext);
  const Summary = useContext(ReleasesAppOriginContext)?.Summary;
  const own = Object.fromEntries(
    Object.entries(labels).filter(
      ([key, value]) => system?.explain(key, value) == null,
    ),
  );
  const hasOwn = Object.keys(own).length > 0;
  return (
    <span className='flex flex-col gap-1'>
      {Summary ? (
        // A summary that renders nothing leaves the dash below.
        <span
          className='peer text-sm text-muted-foreground empty:hidden'
          data-slot='app-summary'
        >
          <Summary appId={appId} labels={labels} />
        </span>
      ) : null}
      {hasOwn ? (
        <LabelChips labels={own} />
      ) : (
        <span
          className={
            Summary
              ? 'hidden text-muted-foreground peer-empty:inline'
              : 'text-muted-foreground'
          }
        >
          —
        </span>
      )}
    </span>
  );
}

/** The App's one-line summary for its header, after a separator; nothing when the application has none for it. */
export function AppSummaryLine({
  appId,
  labels,
}: {
  readonly appId: string;
  readonly labels: Labels;
}): ReactElement | null {
  const Summary = useContext(ReleasesAppOriginContext)?.Summary;
  if (!Summary) return null;
  return (
    <span
      className="empty:hidden before:mr-2 before:content-['·']"
      data-slot='app-summary'
    >
      <Summary appId={appId} labels={labels} />
    </span>
  );
}
