/**
 * A project's page, presented: the header (progress ring, name, status, lead, dates, workflow and progress, with the
 * page's actions), deleting the project from its "more" menu, and the Overview tab's parts — the key numbers, the
 * status distribution, the description edited in the rich text editor, the two-column frame, titled sections and the
 * members as a row of avatars. Purely presentational: the consumer gives the data, decides who may do what, and
 * performs every change through the callbacks (a promise the block waits for). The Settings and Releases tabs' parts
 * are in `project-settings.tsx` and `project-releases.tsx`.
 */
import {
  CalendarIcon,
  Loader2Icon,
  LockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  WorkflowIcon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from 'cn';

import {
  IssueStatusBadge,
  type IssueTableColor,
} from '@/components/issue-table';
import {
  PeopleAvatars,
  PersonValue,
  type AvatarPerson,
} from '../../components/property-fields.js';
import {
  RichTextEditor,
  type RichTextLabels,
} from '../../components/rich-text-editor.js';
import {
  defaultProjectDetailLabels,
  fill,
  type ProjectDetailLabels,
} from './labels.js';

/** A status as the block shows it, a project's or an issue's. */
export interface ProjectDetailStatus {
  readonly name: string;
  readonly color: IssueTableColor;
}

/** Draws a link; a plain anchor by default, a router link in an application. */
export type ProjectDetailLink = (props: {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
}) => ReactElement;

const PlainLink: ProjectDetailLink = ({ href, className, children }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

const CARD = 'rounded-lg border bg-card p-4 text-card-foreground';

/** The dot of each colour, for the status distribution. */
const DOT: Readonly<Record<IssueTableColor, string>> = {
  gray: 'bg-muted-foreground/50',
  blue: 'bg-blue-500 dark:bg-blue-400',
  purple: 'bg-violet-500 dark:bg-violet-400',
  yellow: 'bg-amber-500 dark:bg-amber-400',
  green: 'bg-emerald-500 dark:bg-emerald-400',
  red: 'bg-red-500 dark:bg-red-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
};

/** Progress as a ring, the percentage inside from 32px up; named by `label` for screen readers. */
export function ProgressRing({
  percent,
  size = 40,
  label,
  className,
}: {
  readonly percent: number;
  /** Pixel size; fixed on purpose, like an icon. */
  readonly size?: number;
  readonly label?: string;
  readonly className?: string;
}): ReactElement {
  const value = Math.min(100, Math.max(0, Math.round(percent)));
  const stroke = size >= 32 ? 3.5 : 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          strokeWidth={stroke}
          className='stroke-muted'
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn(
            'transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none',
            value >= 100 ? 'stroke-emerald-500' : 'stroke-primary',
          )}
        />
      </svg>
      {size >= 32 ? (
        <span
          aria-hidden='true'
          className='absolute text-xs font-medium tracking-tight tabular-nums'
        >
          {value}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The trail with the page's `actions`, then the progress ring, the name with a lock for a members-only project and
 * the status, and the meta line: lead, dates, workflow and progress.
 */
export function ProjectHeader({
  name,
  status,
  membersOnly = false,
  progress,
  lead,
  dates,
  workflow,
  trail,
  actions,
  labels = defaultProjectDetailLabels,
}: {
  readonly name: string;
  readonly status: ProjectDetailStatus;
  readonly membersOnly?: boolean;
  /** 0–100, and its words, such as "3 of 8 issues done". */
  readonly progress: { readonly percent: number; readonly label: string };
  readonly lead: {
    readonly name: string;
    readonly avatar?: string | null;
  } | null;
  /** The start and due dates, already formatted; nothing when neither is set. */
  readonly dates?: string | null;
  readonly workflow?: string | null;
  /** The way back, such as breadcrumbs. */
  readonly trail?: ReactNode;
  readonly actions?: ReactNode;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.header;
  return (
    <header className='space-y-4' data-slot='project-header'>
      {trail ? <div className='min-w-0'>{trail}</div> : null}
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex min-w-0 items-start gap-4'>
          <ProgressRing
            percent={progress.percent}
            size={48}
            label={progress.label}
          />
          <div className='min-w-0 space-y-1.5'>
            <h1 className='flex min-w-0 items-center gap-2 font-heading text-2xl font-semibold tracking-tight'>
              <span className='truncate'>{name}</span>
              {membersOnly ? (
                <LockIcon
                  className='size-4 shrink-0 text-muted-foreground'
                  aria-label={words.private}
                />
              ) : null}
              <IssueStatusBadge status={status} />
            </h1>
            <p className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
              <span className='inline-flex items-center gap-1.5'>
                {words.lead}
                {lead ? (
                  <span className='text-foreground'>
                    <PersonValue name={lead.name} avatar={lead.avatar} />
                  </span>
                ) : (
                  <span>
                    —<span className='sr-only'>{words.noLead}</span>
                  </span>
                )}
              </span>
              {dates ? (
                <span className='inline-flex items-center gap-1.5'>
                  <CalendarIcon className='size-3.5' aria-hidden='true' />
                  {dates}
                </span>
              ) : null}
              {workflow ? (
                <span className='inline-flex items-center gap-1.5'>
                  <WorkflowIcon className='size-3.5' aria-hidden='true' />
                  <span className='sr-only'>{words.workflow}</span>
                  {workflow}
                </span>
              ) : null}
              <span className='tabular-nums'>{progress.label}</span>
            </p>
          </div>
        </div>
        {actions ? (
          <div className='flex shrink-0 flex-wrap items-center gap-2'>
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

/**
 * The project's "more" menu with deleting it after a confirmation. While `onDelete` runs the confirmation's button
 * stays busy; a failure leaves the menu as it was, for the consumer to report.
 */
export function ProjectDeleteMenu({
  name,
  onDelete,
  labels = defaultProjectDetailLabels,
}: {
  readonly name: string;
  readonly onDelete: () => Promise<void>;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.deletion;
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant='outline' size='icon-sm' aria-label={words.more} />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-auto min-w-40'>
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant='destructive'
              onClick={() => setConfirming(true)}
            >
              <Trash2Icon />
              {words.delete}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fill(words.title, { name })}</AlertDialogTitle>
            <AlertDialogDescription>{words.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{words.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={deleting}
              onClick={() => {
                setDeleting(true);
                void onDelete()
                  .then(() => setConfirming(false))
                  .catch(() => undefined)
                  .finally(() => setDeleting(false));
              }}
            >
              {deleting ? (
                <Loader2Icon
                  data-icon='inline-start'
                  className='animate-spin'
                />
              ) : null}
              {words.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** The Overview tab's frame: the main column beside a 20rem side column from `xl` up, one column below. */
export function ProjectOverviewLayout({
  main,
  aside,
  asideLabel,
}: {
  readonly main: ReactNode;
  readonly aside: ReactNode;
  readonly asideLabel: string;
}): ReactElement {
  return (
    <div className='flex flex-col gap-6 xl:flex-row xl:items-start'>
      <div className='min-w-0 flex-1 space-y-6'>{main}</div>
      <aside
        aria-label={asideLabel}
        className='space-y-3 xl:w-[20rem] xl:shrink-0'
      >
        {aside}
      </aside>
    </div>
  );
}

/** A titled card, with an optional line under the title and actions beside it. */
export function ProjectSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  readonly title: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <section className={cn(CARD, 'space-y-3', className)} aria-label={title}>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 space-y-1'>
          <h2 className='text-sm font-semibold'>{title}</h2>
          {description ? (
            <p className='text-sm text-muted-foreground'>{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className='flex shrink-0 items-center gap-1'>{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export interface ProjectMetric {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}

/** The key numbers as a row of tiles. */
export function ProjectMetrics({
  metrics,
  labels = defaultProjectDetailLabels,
}: {
  readonly metrics: readonly ProjectMetric[];
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  return (
    <section
      aria-label={labels.overview.numbers}
      className='grid grid-cols-2 gap-3 md:grid-cols-4'
    >
      {metrics.map((metric) => (
        <div key={metric.key} className={cn(CARD, 'px-4 py-3')}>
          <p className='text-xs text-muted-foreground'>{metric.label}</p>
          <p className='mt-1 font-heading text-2xl font-semibold tabular-nums'>
            {metric.value}
          </p>
        </div>
      ))}
    </section>
  );
}

export interface StatusCount {
  readonly key: string;
  readonly name: string;
  readonly color: IssueTableColor;
  readonly count: number;
}

/** One stacked bar in the order given, each status in its colour, with a legend of name and count. */
export function ProjectStatusDistribution({
  rows,
  labels = defaultProjectDetailLabels,
}: {
  readonly rows: readonly StatusCount[];
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const shown = rows.filter((row) => row.count > 0);
  const total = shown.reduce((sum, row) => sum + row.count, 0);
  return (
    <ProjectSection title={labels.overview.distribution}>
      {total === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {labels.overview.noIssues}
        </p>
      ) : (
        <div className='space-y-3'>
          <div
            className='flex h-2 w-full overflow-hidden rounded-full bg-muted'
            aria-hidden='true'
          >
            {shown.map((row) => (
              <span
                key={row.key}
                className={cn(
                  'h-full first:rounded-l-full last:rounded-r-full',
                  DOT[row.color],
                )}
                style={{ width: `${(row.count / total) * 100}%` }}
              />
            ))}
          </div>
          <ul className='flex flex-wrap gap-x-5 gap-y-2 text-sm'>
            {shown.map((row) => (
              <li key={row.key} className='inline-flex items-center gap-1.5'>
                <span
                  aria-hidden='true'
                  className={cn('size-2 rounded-full', DOT[row.color])}
                />
                <span>{row.name}</span>
                <span className='text-muted-foreground tabular-nums'>
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ProjectSection>
  );
}

/**
 * The description as Markdown in its card, edited in the rich text editor with Save and Cancel (⌘Enter saves, Escape
 * cancels). The draft stays open when saving fails, so nothing typed is lost.
 */
export function ProjectDescription({
  description,
  onSave,
  renderMarkdown,
  richTextLabels,
  labels = defaultProjectDetailLabels,
}: {
  readonly description: string;
  /** Saves the Markdown, empty for none; without it the description cannot be edited. */
  readonly onSave?: (markdown: string) => Promise<void>;
  readonly renderMarkdown: (markdown: string) => ReactNode;
  readonly richTextLabels?: RichTextLabels;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.overview;
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = (): void => {
    if (draft === null || draft === description || !onSave) return;
    setSaving(true);
    void onSave(draft.trim())
      .then(() => setDraft(null))
      .catch(() => undefined)
      .finally(() => setSaving(false));
  };
  const edit =
    onSave && draft === null ? (
      <Button
        variant='ghost'
        size='xs'
        className='text-muted-foreground'
        onClick={() => setDraft(description)}
      >
        <PencilIcon data-icon='inline-start' />
        {words.editDescription}
      </Button>
    ) : null;
  return (
    <ProjectSection title={words.description} actions={edit}>
      {draft !== null ? (
        <div className='space-y-2'>
          <RichTextEditor
            value={draft}
            autoFocus
            aria-label={words.description}
            placeholder={words.descriptionPlaceholder}
            disabled={saving}
            {...(richTextLabels ? { labels: richTextLabels } : {})}
            mentionPlacement='below'
            contentClassName='min-h-32'
            onChange={setDraft}
            onEscape={() => {
              if (!saving) setDraft(null);
            }}
            onSubmit={save}
          />
          <p className='text-xs text-muted-foreground'>
            {words.descriptionHint}
          </p>
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={saving}
              onClick={() => setDraft(null)}
            >
              {words.cancel}
            </Button>
            <Button
              size='sm'
              disabled={saving || draft === description}
              onClick={save}
            >
              {saving ? (
                <Loader2Icon
                  data-icon='inline-start'
                  className='animate-spin'
                />
              ) : null}
              {words.save}
            </Button>
          </div>
        </div>
      ) : description.trim() ? (
        <div className='max-w-3xl'>{renderMarkdown(description)}</div>
      ) : (
        <p className='text-sm text-muted-foreground'>{words.noDescription}</p>
      )}
    </ProjectSection>
  );
}

/** The members as a compact row of avatars, with an optional way to manage them (such as a link to settings). */
export function ProjectMembersRow({
  members,
  manageHref,
  link: Link = PlainLink,
  labels = defaultProjectDetailLabels,
}: {
  readonly members: readonly AvatarPerson[];
  readonly manageHref?: string;
  readonly link?: ProjectDetailLink;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.overview;
  return (
    <ProjectSection
      title={words.members}
      actions={
        manageHref ? (
          <Link
            href={manageHref}
            className='text-xs text-muted-foreground hover:text-foreground hover:underline'
          >
            {words.manageMembers}
          </Link>
        ) : null
      }
    >
      {members.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{words.noMembers}</p>
      ) : (
        <PeopleAvatars
          people={members}
          max={8}
          label={fill(words.memberCount, { count: members.length })}
        />
      )}
    </ProjectSection>
  );
}
