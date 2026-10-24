/**
 * A session's transcript, item by item (`transcript.ts`): the person's messages, the agent's answers in Markdown, its
 * thinking and tool calls folded away, its plan, the permission requests waiting for an answer, and at the end of a
 * turn the work it created with the choice to start it.
 */
import { copyText, resolveAppUrl, useToaster } from '@nocobase/app-client';

import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import {
  AlertTriangleIcon,
  BrainIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  ListChecksIcon,
  LoaderIcon,
  PencilIcon,
  PlayIcon,
  SearchIcon,
  ShieldQuestionIcon,
  TerminalIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react';
import { Fragment, useRef, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import { MarkdownView } from './markdown-view.js';
import { ConversationImage } from './conversation-image.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';

import { imagePath, type Session, type SessionLink } from '../../shared/api.js';
import { awaitsStart } from '../lib/facts.js';
import { lineDiff } from '../lib/diff.js';
import { clockTime, dateTime, tokens } from '../lib/format.js';
import {
  toolSummary,
  type ToolCall,
  type ToolKind,
  type TranscriptItem,
} from '../transcript.js';
import { useMarkSeen } from '../api.js';
import { useLinkOpen } from '../config.js';
import { plainClick } from '../lib/clicks.js';
import { LinkName } from './link-name.js';
import { StatusPill } from './status-pill.js';

export interface TranscriptActions {
  readonly withdraw?: (seq: number) => Promise<void>;
  readonly edit?: (item: Extract<TranscriptItem, { type: 'prompt' }>) => void;
  readonly answer: (requestId: string, optionId: string | null) => void;
  readonly decide: (kind: string, start: string[], skip: string[]) => void;
}

const KIND_ICON: Readonly<Record<ToolKind, typeof FileTextIcon>> = {
  read: FileTextIcon,
  edit: PencilIcon,
  delete: XIcon,
  move: PencilIcon,
  search: SearchIcon,
  execute: TerminalIcon,
  think: BrainIcon,
  fetch: GlobeIcon,
  other: WrenchIcon,
};

/** A terminal's colors, as tool output shows in the prototype's dark panels. */
const TERMINAL =
  'bg-[oklch(0.23_0.02_264)] text-[oklch(0.9_0.01_264)] dark:bg-[oklch(0.2_0.02_264)]';

export function TranscriptView({
  items,
  readSeq,
  session,
  agentName,
  writable,
  actions,
}: {
  readonly items: readonly TranscriptItem[];
  readonly readSeq?: number | undefined;
  readonly session: Session;
  readonly agentName: string;
  readonly writable: boolean;
  readonly actions: TranscriptActions;
}): ReactElement {
  const endRef = useRef<HTMLLIElement>(null);
  useMarkSeen(session.id, readSeq, endRef);
  return (
    <ol className='flex flex-col gap-4'>
      {items.map((item) => (
        <li key={item.key}>
          <Item
            item={item}
            session={session}
            agentName={agentName}
            writable={writable}
            actions={actions}
          />
        </li>
      ))}
      <li ref={endRef} aria-hidden className='h-px' />
    </ol>
  );
}

function Item({
  item,
  session,
  agentName,
  writable,
  actions,
}: {
  readonly item: TranscriptItem;
  readonly session: Session;
  readonly agentName: string;
  readonly writable: boolean;
  readonly actions: TranscriptActions;
}): ReactElement | null {
  const { t, i18n } = useTranslation();
  const toaster = useToaster();
  switch (item.type) {
    case 'prompt':
      return (
        <div className='ml-auto flex max-w-[82%] flex-col items-end gap-1'>
          {item.images.length > 0 && (
            <div className='flex flex-wrap justify-end gap-2'>
              {item.images.map((image) => (
                <ConversationImage
                  key={image.id}
                  src={
                    image.file
                      ? resolveAppUrl(imagePath(session.id, image.file))
                      : `data:${image.mimeType};base64,${image.data}`
                  }
                />
              ))}
            </div>
          )}
          {item.text && (
            <div className='bg-accent rounded-[12px_12px_4px_12px] px-3.5 py-2 text-sm whitespace-pre-wrap'>
              <MentionedText text={item.text} links={session.links} />
            </div>
          )}
          <span className='text-muted-foreground text-[11px] tabular-nums'>
            {clockTime(item.at, i18n.language)}
            {item.state !== 'running' && item.state !== 'done' && (
              <span
                className={cn(
                  item.state === 'queued' &&
                    'text-amber-700 dark:text-amber-400',
                )}
              >
                {' · '}
                {t(`transcript.prompt.${item.state}`)}
              </span>
            )}
          </span>
          {session.archivedAt === null &&
            item.state === 'queued' &&
            actions.withdraw &&
            (item.withdrawable ? (
              <WithdrawButton
                seq={Number(item.key)}
                withdraw={actions.withdraw}
              />
            ) : (
              <span className='text-muted-foreground max-w-80 text-right text-xs'>
                {t('transcript.prompt.unsupported')}
              </span>
            ))}
          {item.state === 'withdrawn' && (
            <div className='flex gap-2'>
              {item.text && (
                <Button
                  size='xs'
                  variant='ghost'
                  onClick={() =>
                    void copyText(item.text).then((copied) => {
                      if (!copied)
                        toaster.show({
                          type: 'error',
                          title: t('errors.copy'),
                        });
                    })
                  }
                >
                  {t('transcript.prompt.copy')}
                </Button>
              )}
              {actions.edit && session.archivedAt === null && (
                <Button
                  size='xs'
                  variant='ghost'
                  onClick={() => actions.edit?.(item)}
                >
                  {t('transcript.prompt.edit')}
                </Button>
              )}
            </div>
          )}
        </div>
      );
    case 'message':
      return <MarkdownView content={item.text} className='text-sm' />;
    case 'thought':
      return (
        <Folded
          icons={[<BrainIcon key='thought' className='size-4' />]}
          label={t('transcript.thought')}
        >
          <p className='text-muted-foreground border-l-2 pl-3 text-xs whitespace-pre-wrap'>
            {item.text}
          </p>
        </Folded>
      );
    case 'tools':
      return <ToolGroup calls={item.calls} />;
    case 'plan': {
      const done = item.entries.filter(
        (entry) => entry.status === 'completed',
      ).length;
      return (
        <div className='bg-card rounded-lg border px-3.5 py-2.5'>
          <div className='mb-2 flex items-center gap-2.5 text-[13px] font-medium'>
            <ListChecksIcon className='size-4' />
            {t('transcript.plan', { done, total: item.entries.length })}
            <span className='bg-muted h-1.5 w-20 overflow-hidden rounded-full'>
              <span
                className='bg-primary block h-full'
                style={{
                  width: `${(done / Math.max(1, item.entries.length)) * 100}%`,
                }}
              />
            </span>
          </div>
          <ul className='flex flex-col gap-1 text-[13px]'>
            {item.entries.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  'flex items-start gap-2',
                  entry.status === 'completed' &&
                    'text-muted-foreground line-through decoration-border',
                )}
              >
                <StatusIcon
                  status={
                    entry.status === 'completed'
                      ? 'completed'
                      : entry.status === 'in_progress'
                        ? 'in_progress'
                        : 'pending'
                  }
                />
                <span>{entry.content}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case 'permission':
      return item.outcome === null ? (
        <div className='flex flex-col gap-2.5 rounded-[10px] border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800 dark:bg-amber-950/50'>
          <div className='flex items-center gap-2 text-[13px] font-semibold text-amber-800 dark:text-amber-300'>
            <ShieldQuestionIcon className='size-4' />
            {t('transcript.permission.title', { agent: agentName })}
          </div>
          <p className='text-[13px] font-medium'>{item.title}</p>
          {item.detail && <CommandBlock text={item.detail} />}
          {writable && (
            <div className='flex flex-wrap gap-2'>
              {item.options.map((option, index) => (
                <Button
                  key={option.optionId}
                  size='sm'
                  className='h-9 text-xs font-normal'
                  variant={index === 0 ? 'default' : 'outline'}
                  onClick={() =>
                    actions.answer(item.requestId, option.optionId)
                  }
                >
                  {option.name}
                </Button>
              ))}
            </div>
          )}
          <p className='text-[11px] text-amber-800/90 dark:text-amber-300/90'>
            {t('transcript.permission.timeout')}
          </p>
        </div>
      ) : (
        <div className='bg-card flex flex-col gap-2 rounded-[10px] border p-3.5'>
          <div className='flex items-center gap-2 text-[13px] font-medium'>
            {item.options.some((option) => option.optionId === item.outcome) ? (
              <CheckIcon className='size-4' />
            ) : (
              <XIcon className='size-4' />
            )}
            {item.options.find((option) => option.optionId === item.outcome)
              ?.name ??
              t(
                `transcript.permission.${item.outcome === 'timedOut' || item.outcome === 'cancelled' ? item.outcome : 'declined'}`,
              )}
            <span className='text-muted-foreground font-normal'>
              · {item.title}
            </span>
          </div>
          {item.detail && <CommandBlock text={item.detail} />}
        </div>
      );
    case 'turn':
      return (
        <div className='flex flex-col gap-2'>
          {item.error && (
            <div className='text-destructive flex items-start gap-2 rounded-lg border border-current/30 px-3.5 py-2.5 text-[13px]'>
              <AlertTriangleIcon className='mt-0.5 size-4 shrink-0' />
              <span className='whitespace-pre-wrap'>{item.error}</span>
            </div>
          )}
          <div className='text-muted-foreground before:bg-border after:bg-border flex items-center gap-3 text-[11px] tabular-nums before:h-px before:flex-1 after:h-px after:flex-1'>
            {[
              item.stopReason === 'cancelled'
                ? t('transcript.turn.cancelled')
                : null,
              item.seconds === null
                ? null
                : item.seconds < 60
                  ? t('transcript.turn.seconds', { count: item.seconds })
                  : t('transcript.turn.minutes', {
                      minutes: Math.floor(item.seconds / 60),
                      seconds: item.seconds % 60,
                    }),
              item.usage &&
                t('transcript.turn.input', {
                  count: tokens(item.usage.inputTokens, i18n.language),
                }),
              item.usage?.cachedReadTokens &&
                t('transcript.turn.cached', {
                  count: tokens(item.usage.cachedReadTokens, i18n.language),
                }),
              item.usage &&
                t('transcript.turn.output', {
                  count: tokens(item.usage.outputTokens, i18n.language),
                }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      );
    case 'notice':
      return (
        <div
          className={cn(
            'flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-[13px]',
            item.level === 'error'
              ? 'text-destructive border-current/30'
              : 'text-muted-foreground bg-card',
          )}
        >
          <AlertTriangleIcon className='mt-0.5 size-4 shrink-0' />
          <span className='whitespace-pre-wrap'>{item.message}</span>
        </div>
      );
    case 'links':
      return (
        <LinksCard
          links={item.refIds.flatMap((refId) => {
            const link = session.links.find(
              (candidate) =>
                candidate.kind === item.linkKind && candidate.refId === refId,
            );
            return link ? [link] : [];
          })}
          writable={writable}
          onDecide={(start, skip) => actions.decide(item.linkKind, start, skip)}
        />
      );
  }
}

function WithdrawButton({
  seq,
  withdraw,
}: {
  readonly seq: number;
  readonly withdraw: (seq: number) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <Button
      size='xs'
      variant='ghost'
      disabled={pending}
      onClick={() => {
        setPending(true);
        void withdraw(seq)
          .then(
            () => setFailed(false),
            () => setFailed(true),
          )
          .finally(() => setPending(false));
      }}
    >
      {t(failed ? 'transcript.prompt.retry' : 'transcript.prompt.withdraw')}
    </Button>
  );
}

/** A person's message, with what it mentions with `#` opening where its application shows it. */
function MentionedText({
  text,
  links,
}: {
  readonly text: string;
  readonly links: readonly SessionLink[];
}): ReactElement {
  const open = useLinkOpen();
  const byKey = new Map(
    links.flatMap((link) => (link.key && link.href ? [[link.key, link]] : [])),
  );
  // Each part keyed by where it starts in the message.
  const parts = text
    .split(/(#[^\s#]+)/u)
    .filter(Boolean)
    .reduce<{ start: number; part: string }[]>((list, part) => {
      const last = list.at(-1);
      return [
        ...list,
        { start: last ? last.start + last.part.length : 0, part },
      ];
    }, []);
  return (
    <>
      {parts.map(({ start, part }) => {
        const link = part.startsWith('#')
          ? byKey.get(part.slice(1))
          : undefined;
        return link?.href ? (
          <Link
            key={start}
            to={link.href}
            title={link.title}
            className='text-primary font-medium hover:underline'
            onClick={(event) => {
              if (plainClick(event) && open?.(link)) event.preventDefault();
            }}
          >
            {part}
          </Link>
        ) : (
          <Fragment key={start}>{part}</Fragment>
        );
      })}
    </>
  );
}

/** The work a turn created: what waits to start is ticked, and one click starts it or leaves it. */
function LinksCard({
  links,
  writable,
  onDecide,
}: {
  readonly links: readonly SessionLink[];
  readonly writable: boolean;
  readonly onDecide: (start: string[], skip: string[]) => void;
}): ReactElement | null {
  const { t, i18n } = useTranslation();
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(() => new Set());
  if (links.length === 0) return null;
  const waiting = links.filter(awaitsStart);
  const deciding = waiting.length > 0 && writable;
  const chosen = waiting
    .filter((link) => !skipped.has(link.refId))
    .map((link) => link.refId);
  const group = links.find((link) => link.group)?.group;
  return (
    <div className='bg-card overflow-hidden rounded-[10px] border'>
      <div className='flex items-center gap-2 border-b px-3.5 py-2.5 text-[13px]'>
        <ListChecksIcon className='size-4' />
        <span className='font-semibold'>
          {deciding
            ? t('links.created', { count: links.length })
            : t('links.count', { count: links.length })}
        </span>
        {group && (
          <span className='ml-auto inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs'>
            <FolderIcon className='size-3.5' />
            {group}
          </span>
        )}
      </div>
      <ul>
        {links.map((link) => {
          const pending = deciding && awaitsStart(link);
          return (
            <li
              key={link.refId}
              className='flex min-w-0 items-center gap-3 border-b px-3.5 py-2.5'
            >
              {pending && (
                <Checkbox
                  checked={!skipped.has(link.refId)}
                  onCheckedChange={(checked) =>
                    setSkipped((current) => {
                      const next = new Set(current);
                      if (checked) next.delete(link.refId);
                      else next.add(link.refId);
                      return next;
                    })
                  }
                  aria-label={link.title}
                />
              )}
              <LinkName link={link} />
              {link.status && <StatusPill status={link.status} />}
            </li>
          );
        })}
      </ul>
      {deciding ? (
        <div className='bg-muted flex flex-wrap items-center gap-2 px-3.5 py-2.5'>
          <Button
            size='sm'
            className='h-9 text-xs font-normal'
            disabled={chosen.length === 0}
            onClick={() =>
              onDecide(
                chosen,
                waiting
                  .filter((link) => skipped.has(link.refId))
                  .map((link) => link.refId),
              )
            }
          >
            <PlayIcon />
            {t('links.start', { count: chosen.length })}
          </Button>
          <Button
            size='sm'
            variant='outline'
            className='h-9 text-xs font-normal'
            onClick={() =>
              onDecide(
                [],
                waiting.map((link) => link.refId),
              )
            }
          >
            {t('links.skip')}
          </Button>
          <span className='text-muted-foreground text-xs'>
            {t('links.startHint')}
          </span>
        </div>
      ) : (
        <Decided links={links} locale={i18n.language} />
      )}
    </div>
  );
}

/** What the owner decided about the work: when, what started and what was left as it was. */
function Decided({
  links,
  locale,
}: {
  readonly links: readonly SessionLink[];
  readonly locale: string;
}): ReactElement | null {
  const { t } = useTranslation();
  const decided = links.filter((link) => link.decidedAt !== null);
  if (decided.length === 0) return null;
  const at = decided
    .map((link) => link.decidedAt!)
    .sort()
    .at(-1)!;
  const left = decided.filter((link) => link.startable);
  const started = decided.length - left.length;
  const parts = [
    started > 0 ? t('links.started', { count: started }) : null,
    left.length > 0
      ? t('links.left', {
          keys: left
            .map((link) => link.key ?? link.title)
            .join(t('links.separator')),
          status: left[0].status?.label ?? t('links.unknown'),
        })
      : null,
  ].filter(Boolean);
  return (
    <div className='bg-muted text-muted-foreground flex items-center gap-2 px-3.5 py-2.5 text-xs'>
      <CheckIcon className='size-4' />
      {dateTime(at, locale)} · {parts.join(t('links.comma'))}
    </div>
  );
}

function CommandBlock({ text }: { readonly text: string }): ReactElement {
  return (
    <pre className='bg-card overflow-x-auto rounded-md border px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap'>
      {text}
    </pre>
  );
}

function ToolGroup({
  calls,
}: {
  readonly calls: readonly ToolCall[];
}): ReactElement {
  const { t } = useTranslation();
  const running = calls.some(
    (call) => call.status === 'in_progress' || call.status === 'pending',
  );
  const kinds = toolSummary(calls);
  const label = kinds
    .map(({ kind, count }) => t(`transcript.tools.${kind}`, { count }))
    .join(t('transcript.tools.separator'));
  return (
    <Folded
      icons={
        running
          ? [<LoaderIcon key='running' className='size-4 animate-spin' />]
          : kinds.map(({ kind }) => {
              const Icon = KIND_ICON[kind];
              return <Icon key={kind} className='size-4' />;
            })
      }
      label={label}
    >
      <ul className='ml-1.5 flex flex-col gap-0.5 border-l-2 pl-3'>
        {calls.map((call) => (
          <li key={call.id}>
            <ToolCallRow call={call} />
          </li>
        ))}
      </ul>
    </Folded>
  );
}

function ToolCallRow({ call }: { readonly call: ToolCall }): ReactElement {
  const { t } = useTranslation();
  const detail = call.output.trim() || call.diffs.length > 0;
  // An MCP tool's call, titled `mcp.<server>.<tool>` by Codex, reads as the server and the tool.
  const mcp = /^mcp\.([^.]+)\.(.+)$/u.exec(call.title);
  const row = (
    <span className='flex min-w-0 items-center gap-2 py-0.5 text-xs'>
      <span className='text-muted-foreground w-12 shrink-0 truncate capitalize'>
        {mcp ? mcp[1] : t(`transcript.kinds.${call.kind}`)}
      </span>
      <code className='min-w-0 flex-1 truncate'>
        {mcp ? mcp[2] : call.title}
      </code>
      {call.status !== 'completed' && <StatusIcon status={call.status} />}
    </span>
  );
  if (!detail) return row;
  return (
    <Collapsible>
      <CollapsibleTrigger className='hover:bg-muted w-full rounded px-1 text-left'>
        {row}
      </CollapsibleTrigger>
      <CollapsibleContent className='mt-1 mb-2 flex flex-col gap-2'>
        {call.diffs.map((diff) => (
          <div
            key={diff.path}
            className='bg-card overflow-hidden rounded-lg border'
          >
            <div className='bg-muted text-muted-foreground px-3 py-1 font-mono text-[11px]'>
              {diff.path}
            </div>
            <pre className='overflow-x-auto py-1.5 font-mono text-[11px] leading-relaxed'>
              {lineDiff(diff.oldText, diff.newText).map((line) => (
                <span
                  key={line.key}
                  className={cn(
                    'block px-3 whitespace-pre',
                    line.type === 'added' &&
                      'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
                    line.type === 'removed' &&
                      'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300',
                  )}
                >
                  {line.type === 'added'
                    ? '+ '
                    : line.type === 'removed'
                      ? '- '
                      : '  '}
                  {line.text}
                </span>
              ))}
            </pre>
          </div>
        ))}
        {call.output.trim() && (
          <pre
            className={cn(
              'max-h-80 overflow-auto rounded-lg px-3 py-2.5 font-mono text-[11px] leading-relaxed',
              TERMINAL,
            )}
          >
            {call.output.trimEnd()}
          </pre>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function StatusIcon({
  status,
}: {
  readonly status: ToolCall['status'];
}): ReactElement {
  if (status === 'completed')
    return (
      <CheckIcon className='mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
    );
  if (status === 'failed')
    return <XIcon className='text-destructive mt-0.5 size-4 shrink-0' />;
  if (status === 'in_progress')
    return (
      <LoaderIcon className='text-primary mt-0.5 size-4 shrink-0 animate-spin' />
    );
  return (
    <CircleIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
  );
}

function Folded({
  icons,
  label,
  children,
}: {
  readonly icons: readonly ReactElement[];
  readonly label: string;
  readonly children: ReactElement;
}): ReactElement {
  return (
    <Collapsible>
      <CollapsibleTrigger className='text-muted-foreground hover:text-foreground group flex items-center gap-2 text-xs'>
        <ChevronRightIcon className='size-3.5 transition-transform group-data-[panel-open]:rotate-90' />
        <span className='inline-flex gap-0.5'>{icons}</span>
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className='mt-2'>{children}</CollapsibleContent>
    </Collapsible>
  );
}
