import { ArrowLeftIcon, ArrowUpRightIcon, InboxIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  INBOX_ACTION_ICON,
  inboxActionsFor,
  type InboxAction,
} from './inbox-actions.js';
import {
  actionLabel,
  useInboxFrameText,
  type InboxFrameText,
} from './frame.js';
import { InboxTypeIcon } from './inbox-item.js';
import { entryLink, isSettled, type InboxEntry } from './model.js';
import { ContributorScope } from './registry-scope.js';
import {
  rendererKey,
  useRendererOf,
  type InboxCanAct,
  type InboxEntryContext,
  type InboxEntryRenderer,
} from './registry.js';

/** What the detail pane's toolbar slot receives about the item shown. */
export interface InboxDetailToolbarInput {
  readonly entry: InboxEntry;
  /** The title shown, as its contributor words it. */
  readonly title: string;
  /** What its contributor says the item is about (`InboxEntryRenderer.context`). */
  readonly context: InboxEntryContext;
}

export interface InboxDetailProps {
  readonly entry: InboxEntry | null;
  readonly busy: boolean;
  readonly onBack: () => void;
  readonly onAction: (entry: InboxEntry, action: InboxAction) => void;
  readonly onOpen: (entry: InboxEntry) => void;
  /**
   * What the application places before the read and delete buttons, such as an "Ask agent" button; rendered inside the
   * item's contributor scope, so it may also register what the item is about with a page context.
   */
  readonly toolbar?: (input: InboxDetailToolbarInput) => ReactNode;
  /** The prefix of the element ids it renders. */
  readonly idPrefix?: string;
}

/**
 * The inbox's detail pane: everything needed to decide without leaving the inbox. Its header (`InboxDetailHeader`)
 * holds what kind of item it is, with read / delete icon buttons; the title, which opens what the item is about when it
 * has somewhere to go; and right under it the contributor's decision actions while the viewer may still act. Below
 * it, the contributor's body.
 *
 * What the item says and offers is its contributor's (`registry.ts`), rendered in the contributor's namespace; an item
 * nobody renders shows its title and body as sent, and nothing to act on.
 */
export function InboxDetail({
  entry,
  idPrefix = 'nocobase-inbox',
  ...props
}: InboxDetailProps): ReactElement {
  const frame = useInboxFrameText();
  const rendererOf = useRendererOf();
  if (!entry)
    return (
      <div className='flex h-full items-center justify-center p-6'>
        <Empty className='min-h-48'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>
              {frame.t('inbox.nothingSelected', {
                defaultValue: 'Select an item to view it',
              })}
            </EmptyTitle>
          </EmptyHeader>
        </Empty>
      </div>
    );
  const renderer = rendererOf(entry);
  return (
    <ContributorScope
      key={`${entry.item.id}:${rendererKey(renderer)}`}
      namespace={renderer.namespace}
      resources={renderer.resources}
    >
      <EntryDetail
        {...props}
        entry={entry}
        renderer={renderer}
        frame={frame}
        idPrefix={idPrefix}
      />
    </ContributorScope>
  );
}

const noModel = (): never => null as never;
const noAction = (): InboxCanAct => ({ state: 'none' });

function EntryDetail({
  entry,
  renderer,
  frame,
  busy,
  onBack,
  onAction,
  onOpen,
  toolbar,
  idPrefix,
}: Omit<InboxDetailProps, 'entry'> & {
  readonly entry: InboxEntry;
  readonly renderer: InboxEntryRenderer<never>;
  readonly frame: InboxFrameText;
  readonly idPrefix: string;
}): ReactElement {
  const { t } = frame;
  const { item, notice } = entry;
  // The renderer is fixed for this component (keyed by it), so its hooks always run in the same order.
  const wording = renderer.useWording();
  const useModel = renderer.useModel ?? noModel;
  const model = useModel(entry);
  const useCanAct = renderer.useCanAct ?? noAction;
  const canAct = useCanAct(entry, model);
  const settled = isSettled(entry);
  const { title, sentence } = wording.text(entry, model);
  const link = entryLink(entry);
  const context = renderer.context?.(entry, model) ?? {};
  const { Actions, Body } = renderer;
  const parts = {
    entry,
    model,
    title,
    onOpen: link ? () => onOpen(entry) : undefined,
    onDecided: () => {
      if (!item.readAt) onAction(entry, 'read');
    },
  };
  const titleId = `${idPrefix}-detail-title`;
  const outcome = notice?.outcome
    ? (wording.outcome?.(notice.outcome) ??
      t(`inbox.outcomes.${notice.outcome}`, { defaultValue: notice.outcome }))
    : null;

  return (
    <article
      className='flex min-h-full flex-col'
      aria-labelledby={titleId}
      data-testid={`${idPrefix}-detail`}
    >
      <InboxDetailHeader
        titleId={titleId}
        icon={<InboxTypeIcon entry={entry} renderer={renderer} />}
        kind={wording.label(entry, 'detail')}
        status={
          settled
            ? [t('inbox.resolved', { defaultValue: 'Handled' }), outcome]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        tools={
          <>
            {toolbar?.({ entry, title, context })}
            {inboxActionsFor(entry).map((action) => {
              const Icon = INBOX_ACTION_ICON[action];
              return (
                <IconAction
                  key={action}
                  label={actionLabel(t, action)}
                  disabled={busy}
                  onClick={() => onAction(entry, action)}
                >
                  <Icon />
                </IconAction>
              );
            })}
          </>
        }
        title={title}
        href={link}
        openLabel={wording.open ?? t('inbox.open', { defaultValue: 'Open' })}
        onOpen={() => onOpen(entry)}
        sentence={sentence}
        actions={
          canAct.state === 'loading' ? (
            <div
              role='status'
              aria-label={t('inbox.loading', { defaultValue: 'Loading' })}
              className='flex gap-2'
            >
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-8 w-20' />
            </div>
          ) : canAct.state === 'no' ? (
            <p className='text-sm text-muted-foreground'>{canAct.reason}</p>
          ) : canAct.state === 'yes' && Actions ? (
            <Actions {...parts} />
          ) : null
        }
        onBack={onBack}
        backLabel={t('inbox.back', { defaultValue: 'Back to the list' })}
      />
      <div className='flex flex-1 flex-col gap-6 p-5 md:px-6'>
        {Body ? <Body {...parts} /> : null}
      </div>
    </article>
  );
}

export interface InboxDetailHeaderProps {
  /** The id of the title, for the pane's `aria-labelledby`. */
  readonly titleId: string;
  /** The kind's icon. */
  readonly icon: ReactNode;
  /** What kind of item it is, in words. */
  readonly kind: string;
  /** How it ended, beside the kind, such as "Handled · Approved". */
  readonly status?: ReactNode;
  /** Compact icon buttons at the end of the kind line: read, delete, and what the application adds. */
  readonly tools?: ReactNode;
  /** The title, or a placeholder for it while the item loads. */
  readonly title: ReactNode;
  /** Where the title goes; a plain heading without it. */
  readonly href?: string | null;
  /** What following the title does, such as "Open issue", shown on hover. */
  readonly openLabel?: string;
  /** Called on a plain click of the title instead of following `href`; a click with a modifier key still follows it. */
  readonly onOpen?: () => void;
  /** The one sentence under the title. */
  readonly sentence?: ReactNode;
  /** A line of facts under the sentence, such as a status and who proposed it. */
  readonly meta?: ReactNode;
  /** The decision's buttons, or why there are none, right under the title. */
  readonly actions?: ReactNode;
  readonly onBack: () => void;
  readonly backLabel: string;
}

/**
 * The header every kind of item shares in the detail pane: a small kind line (icon, kind, how it ended, and compact
 * icon buttons at its end), then the title, which is itself the link to what the item is about (an arrow after it says
 * so), the sentence, and the decision's buttons right under them. A category with a detail of its own (a collection's
 * `Detail`) renders it too, so every kind reads the same.
 */
export function InboxDetailHeader({
  titleId,
  icon,
  kind,
  status,
  tools,
  title,
  href,
  openLabel,
  onOpen,
  sentence,
  meta,
  actions,
  onBack,
  backLabel,
}: InboxDetailHeaderProps): ReactElement {
  return (
    <header className='sticky top-0 z-10 flex flex-col gap-3 border-b bg-background/95 p-5 backdrop-blur-md md:px-6'>
      <div className='flex min-h-7 items-center gap-2'>
        <Button
          variant='ghost'
          size='icon-sm'
          className='-ml-1.5 lg:hidden'
          aria-label={backLabel}
          onClick={onBack}
        >
          <ArrowLeftIcon />
        </Button>
        {icon}
        <span className='min-w-0 truncate text-sm text-muted-foreground'>
          {kind}
        </span>
        {status ? (
          <span className='shrink-0 text-xs text-muted-foreground'>
            {status}
          </span>
        ) : null}
        {tools ? (
          <div className='ml-auto flex items-center gap-0.5'>{tools}</div>
        ) : null}
      </div>
      <div className='flex flex-col gap-1'>
        <h2
          id={titleId}
          className='font-heading text-lg font-semibold tracking-tight wrap-anywhere'
        >
          {href ? (
            <Link
              to={href}
              title={openLabel}
              data-slot='inbox-detail-link'
              className='rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'
              onClick={(event) => {
                if (
                  !onOpen ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                onOpen();
              }}
            >
              {title}
              <ArrowUpRightIcon
                aria-hidden='true'
                className='ml-1 inline size-4 align-baseline text-muted-foreground'
              />
            </Link>
          ) : (
            title
          )}
        </h2>
        {sentence ? (
          <p className='text-sm text-muted-foreground wrap-anywhere'>
            {sentence}
          </p>
        ) : null}
        {meta ? (
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
            {meta}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className='flex flex-wrap items-center gap-2'>{actions}</div>
      ) : null}
    </header>
  );
}

function IconAction({
  label,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  );
}
