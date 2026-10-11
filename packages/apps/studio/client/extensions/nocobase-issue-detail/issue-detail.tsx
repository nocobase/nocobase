/**
 * An issue's page, presented: the two-column frame, the header (trail, parent, title edited in place, meta line), the
 * description edited in the rich text editor, the checklist of the current status, a status change waiting for
 * approval and the last decided ones, the sub-issues by stage, the dependencies with an issue search, the files, and
 * deleting the issue. Purely presentational: the consumer gives the data, decides who may do what, and performs every
 * change through the callbacks (a promise the block waits for). The properties column is in `issue-properties.tsx`.
 *
 * The page sits on the application's background as cards: the body (`IssueSurface`), the activity under it in a second
 * one, and the side column's cards. The title and the description open the body. Every secondary part below them is an
 * `IssueSection`: a heading row (icon, name, count, actions at the end) over its content, set off by a thin divider
 * inside the body's card. A part with nothing to show renders nothing; `IssueAddBar` under the description holds the
 * quiet buttons that add its first item, and `IssueFileDrop` lets files dropped or pasted anywhere on the body upload.
 */
import {
  CheckIcon,
  ChevronDownIcon,
  CornerLeftUpIcon,
  HistoryIcon,
  HourglassIcon,
  Link2Icon,
  ListChecksIcon,
  ListTreeIcon,
  Loader2Icon,
  PaperclipIcon,
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
  Undo2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentProps,
  type DragEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from 'cn';

import { IssueCard, type IssueCardLink } from '@/components/issue-card';
import {
  IssueStatusBadge,
  type IssueTableColor,
} from '@/components/issue-table';
import {
  AttachmentList,
  type AttachmentFile,
  type AttachmentLabels,
} from '../../components/attachment-list.js';
import {
  RichTextEditor,
  type RichTextLabels,
  type RichTextMention,
} from '../../components/rich-text-editor.js';
import { IssuePicker, type IssuePickerItem } from './issue-picker.js';
import {
  dateTime,
  defaultIssueDetailLabels,
  fill,
  relativeTime,
  type IssueDetailLabels,
} from './labels.js';

/** A status as the block shows it. */
export interface IssueDetailStatus {
  readonly name: string;
  readonly color: IssueTableColor;
}

/** Draws a link; a plain anchor by default, a router link in an application. */
export type IssueDetailLink = (props: {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
}) => ReactElement;

const PlainLink: IssueDetailLink = ({ href, className, children }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

/** The issue card's link, drawn with the block's link renderer. */
function useCardLink(Link: IssueDetailLink): IssueCardLink {
  return useMemo(() => {
    const CardLink: IssueCardLink = ({ href, className, children }) => (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
    return CardLink;
  }, [Link]);
}

const CARD = 'rounded-lg border bg-card p-4 text-card-foreground';

/** The rows of a list inside a section, such as sub-issues or pull requests. */
export const ISSUE_SECTION_LIST = 'divide-y overflow-hidden rounded-lg border';

/** One card of the main column: the body (title, description, sections) or the activity. */
export const ISSUE_SURFACE =
  'rounded-lg border bg-card p-4 text-card-foreground md:p-6';

/**
 * A card of the main column on the page's background, holding the body or the activity. It does not clip, so a pinned
 * child (the comment composer) can stick to the bottom of the scrolling page.
 */
export function IssueSurface({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      {...props}
      className={cn(ISSUE_SURFACE, className)}
      data-slot='issue-surface'
    />
  );
}

export interface IssueSectionProps extends Omit<
  ComponentProps<'section'>,
  'title'
> {
  /** A lucide icon, drawn muted at `size-4`. */
  readonly icon?: ReactNode;
  readonly title: ReactNode;
  /** Beside the title, such as `3` or `2/5`. */
  readonly count?: ReactNode;
  /** After the count, such as a status badge. */
  readonly meta?: ReactNode;
  /** At the end of the heading row, such as "New sub-issue". */
  readonly actions?: ReactNode;
}

/**
 * One secondary part of a record's page: a heading row (icon, name, count, actions at the end) over its content, set
 * off from what precedes it by a thin divider. Every part below the description uses it, so they read as one list.
 */
export function IssueSection({
  icon,
  title,
  count,
  meta,
  actions,
  className,
  children,
  ...props
}: IssueSectionProps): ReactElement {
  return (
    <section
      {...(typeof title === 'string' ? { 'aria-label': title } : {})}
      {...props}
      className={cn('flex flex-col gap-3 border-t pt-6', className)}
      data-slot='issue-section'
    >
      <div className='flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1'>
        <div className='flex min-w-0 items-center gap-2'>
          {icon ? (
            <span
              className='flex shrink-0 text-muted-foreground [&_svg]:size-4'
              aria-hidden='true'
            >
              {icon}
            </span>
          ) : null}
          <h2 className='font-heading text-sm font-semibold'>{title}</h2>
          {count !== undefined && count !== null ? (
            <span className='text-sm text-muted-foreground tabular-nums'>
              {count}
            </span>
          ) : null}
          {meta}
        </div>
        {actions ? (
          <div className='ml-auto flex items-center gap-1'>{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * The quiet buttons under the description that add the first item of a part not shown yet (a file, a sub-issue, a
 * dependency); once it has one, the part appears with its own actions. Nothing renders without buttons.
 */
export function IssueAddBar({
  label,
  children,
  className,
}: {
  /** The group's accessible name, such as "Add". */
  readonly label: string;
  readonly children?: ReactNode;
  readonly className?: string;
}): ReactElement | null {
  const nothing = (child: unknown): boolean =>
    child === null || child === undefined || child === false;
  if (nothing(children) || (Array.isArray(children) && children.every(nothing)))
    return null;
  return (
    <div
      role='group'
      aria-label={label}
      className={cn(
        '-ml-2.5 flex flex-wrap items-center gap-1 empty:hidden',
        className,
      )}
      data-slot='issue-add-bar'
    >
      {children}
    </div>
  );
}

/** A quiet button for `IssueAddBar`: muted until hovered. */
export function IssueAddButton({
  className,
  variant = 'ghost',
  size = 'sm',
  ...props
}: ComponentProps<typeof Button>): ReactElement {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  );
}

/** A button that picks files and hands them to `onFiles`. */
export function IssueFilesButton({
  onFiles,
  busy = false,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, 'onClick'> & {
  readonly onFiles: (files: readonly File[]) => void;
  /** Spins the icon and disables the button, such as while files upload. */
  readonly busy?: boolean;
}): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <IssueAddButton
        {...props}
        disabled={busy || props.disabled}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2Icon data-icon='inline-start' className='animate-spin' />
        ) : null}
        {children}
      </IssueAddButton>
      <input
        ref={inputRef}
        type='file'
        multiple
        hidden
        data-testid='attachment-file-input'
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          if (files.length > 0) onFiles(files);
        }}
      />
    </>
  );
}

/**
 * The page's body as a drop target: files dropped on it, or pasted while something in it has focus, go to `onFiles`,
 * unless what they landed on took them (an editor's own image upload). Without `onFiles` it is a plain container.
 */
export function IssueFileDrop({
  onFiles,
  children,
  className,
}: {
  readonly onFiles?: (files: readonly File[]) => void;
  readonly children: ReactNode;
  readonly className?: string;
}): ReactElement {
  const [dragging, setDragging] = useState(false);
  const handlers = onFiles
    ? {
        tabIndex: -1,
        onDragOver: (event: DragEvent) => {
          if (!event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          setDragging(true);
        },
        onDragLeave: (event: DragEvent) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          )
            setDragging(false);
        },
        onDrop: (event: DragEvent) => {
          setDragging(false);
          if (event.defaultPrevented || event.dataTransfer.files.length === 0)
            return;
          event.preventDefault();
          onFiles([...event.dataTransfer.files]);
        },
        onPaste: (event: ClipboardEvent) => {
          if (event.defaultPrevented) return;
          const pasted = [...event.clipboardData.files];
          if (pasted.length === 0) return;
          event.preventDefault();
          onFiles(pasted);
        },
      }
    : {};
  return (
    <div
      className={cn(
        'rounded-lg outline-none',
        className,
        dragging &&
          'bg-primary/5 ring-2 ring-primary/40 ring-offset-4 ring-offset-background',
      )}
      data-slot='issue-file-drop'
      data-dragging={dragging ? '' : undefined}
      {...handlers}
    >
      {children}
    </div>
  );
}

/**
 * The issue's own files as a section: "Upload" in its heading, what is uploading or the hint under it, and each file
 * with its preview and a removal that asks first. Nothing renders while there are no files and none is uploading.
 */
export function IssueAttachments({
  files,
  onUpload,
  uploading = [],
  hint,
  onRemove,
  onPreview,
  locale,
  labels,
}: {
  readonly files: readonly AttachmentFile[];
  /** Without it, the section only lists. */
  readonly onUpload?: (files: readonly File[]) => void;
  /** The names of the files uploading now. */
  readonly uploading?: readonly string[];
  /** Under the heading, such as the size limit. */
  readonly hint?: string;
  /** Removes a file after the section confirmed it. */
  readonly onRemove?: (file: AttachmentFile) => Promise<void>;
  readonly onPreview?: (
    files: readonly AttachmentFile[],
    index: number,
  ) => void;
  readonly locale?: string;
  readonly labels: AttachmentLabels;
}): ReactElement | null {
  const [removing, setRemoving] = useState<AttachmentFile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  if (files.length === 0 && uploading.length === 0) return null;
  const status =
    uploading.length > 0
      ? fill(labels.uploading, { name: uploading[0] ?? '' })
      : onUpload
        ? hint
        : undefined;
  return (
    <IssueSection
      icon={<PaperclipIcon />}
      title={labels.title}
      count={files.length > 0 ? files.length : undefined}
      actions={
        onUpload ? (
          <IssueFilesButton onFiles={onUpload} busy={uploading.length > 0}>
            {uploading.length > 0 ? null : (
              <UploadIcon data-icon='inline-start' />
            )}
            {labels.upload}
          </IssueFilesButton>
        ) : null
      }
      data-testid='issue-attachments'
    >
      {status ? (
        <p className='-mt-2 text-xs text-muted-foreground'>{status}</p>
      ) : null}
      <AttachmentList
        files={files}
        labels={labels}
        removingId={busyId}
        {...(onPreview ? { onPreview } : {})}
        {...(locale ? { locale } : {})}
        {...(onRemove ? { onRemove: setRemoving } : {})}
      />
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.removeTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {fill(labels.removeDescription, { name: removing?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>
              {labels.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={busyId !== null}
              onClick={() => {
                if (!removing || !onRemove) return;
                setBusyId(removing.id);
                void onRemove(removing)
                  .then(() => setRemoving(null))
                  .catch(() => undefined)
                  .finally(() => setBusyId(null));
              }}
            >
              {labels.removeConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </IssueSection>
  );
}

/** Whether the element, with `margin` above and below, fits the visible height of the nearest scrolling ancestor. */
function useFitsScrollViewport(
  ref: RefObject<HTMLElement | null>,
  margin: number,
): boolean {
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let viewport: HTMLElement | undefined;
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      const { overflowY } = getComputedStyle(parent);
      if (overflowY === 'auto' || overflowY === 'scroll') {
        viewport = parent;
        break;
      }
    }
    const measure = (): void => {
      const available = viewport
        ? viewport.clientHeight
        : document.documentElement.clientHeight;
      setFits(element.offsetHeight + 2 * margin <= available);
    };
    window.addEventListener('resize', measure);
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    if (viewport) observer?.observe(viewport);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [ref, margin]);
  return fits;
}

/** The page's padding, matching `md:p-6` and `lg:top-6` below, in pixels. */
const LAYOUT_INSET = 24;

/**
 * The frame of a record's page on the application's background: the main column (its cards, such as `IssueSurface`,
 * stacked with the frame's gap) beside a fixed 20rem side column of cards from `lg` up, folded into one column on narrow
 * screens. The side column follows the page while it fits the viewport.
 */
export function IssueDetailLayout({
  main,
  aside,
  asideLabel,
  className,
}: {
  readonly main: ReactNode;
  readonly aside: ReactNode;
  readonly asideLabel: string;
  readonly className?: string;
}): ReactElement {
  const contentRef = useRef<HTMLDivElement>(null);
  const fits = useFitsScrollViewport(contentRef, LAYOUT_INSET);
  return (
    <div
      className={cn(
        'flex min-h-full flex-col gap-4 p-4 md:gap-6 md:p-6 lg:flex-row',
        className,
      )}
      data-slot='issue-detail-layout'
    >
      <div className='flex min-w-0 flex-1 flex-col gap-4 md:gap-6'>{main}</div>
      <aside aria-label={asideLabel} className='lg:w-[20rem] lg:shrink-0'>
        <div className={cn(fits && 'lg:sticky lg:top-6')} ref={contentRef}>
          {aside}
        </div>
      </aside>
    </div>
  );
}

/**
 * The trail (when given), the parent link, the title (edited in place: Enter saves, Escape cancels) with the page's
 * `actions` beside it, and the meta line: identifier, status, project, then `meta`.
 */
export function IssueHeader({
  identifier,
  title,
  status,
  trail,
  parent,
  project,
  actions,
  meta,
  onRename,
  maxTitleLength,
  link: Link = PlainLink,
  labels = defaultIssueDetailLabels,
}: {
  readonly identifier: string;
  readonly title: string;
  readonly status: IssueDetailStatus;
  /** The way back, such as breadcrumbs. */
  readonly trail?: ReactNode;
  readonly parent?: {
    readonly identifier: string;
    readonly title: string;
    readonly href: string;
  } | null;
  readonly project?: { readonly name: string; readonly href: string } | null;
  readonly actions?: ReactNode;
  readonly meta?: ReactNode;
  /** Saves a new title; without it the title cannot be edited. */
  readonly onRename?: (title: string) => Promise<void>;
  readonly maxTitleLength?: number;
  readonly link?: IssueDetailLink;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Enter saves and then blurs the disabled input, which would save a second time without this guard.
  const savingRef = useRef(false);
  const save = (): void => {
    if (savingRef.current) return;
    const next = draft?.trim() ?? '';
    if (!next || next === title || !onRename) {
      setDraft(null);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    void onRename(next)
      .catch(() => undefined)
      .finally(() => {
        savingRef.current = false;
        setSaving(false);
        setDraft(null);
      });
  };
  return (
    <div className='space-y-2' data-slot='issue-header'>
      {trail ? <div className='min-w-0'>{trail}</div> : null}
      {parent ? (
        <Link
          href={parent.href}
          className='inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground'
        >
          <CornerLeftUpIcon className='size-3.5 shrink-0' aria-hidden='true' />
          <span className='shrink-0'>{labels.parent}</span>
          <span className='shrink-0 font-mono'>{parent.identifier}</span>
          <span className='truncate'>{parent.title}</span>
        </Link>
      ) : null}
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          {draft !== null ? (
            <div className='flex items-center gap-2'>
              <Input
                value={draft}
                autoFocus
                maxLength={maxTitleLength}
                aria-label={labels.titleLabel}
                className='h-10 text-xl font-semibold'
                disabled={saving}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={save}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    save();
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    setDraft(null);
                  }
                }}
              />
              {saving ? <Loader2Icon className='size-4 animate-spin' /> : null}
            </div>
          ) : (
            <div className='group flex items-start gap-2'>
              <h1 className='min-w-0 font-heading text-2xl font-semibold tracking-tight wrap-anywhere'>
                {title}
              </h1>
              {onRename ? (
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={labels.editTitle}
                  className='mt-0.5 shrink-0 opacity-60 group-hover:opacity-100 focus-visible:opacity-100'
                  onClick={() => setDraft(title)}
                >
                  <PencilIcon />
                </Button>
              ) : null}
            </div>
          )}
        </div>
        {actions ? (
          <div className='flex shrink-0 items-center gap-1'>{actions}</div>
        ) : null}
      </div>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground'>
        <span className='font-mono text-xs'>{identifier}</span>
        <IssueStatusBadge status={status} />
        {project ? (
          <Link
            href={project.href}
            className='truncate hover:text-foreground hover:underline'
          >
            {project.name}
          </Link>
        ) : null}
        {meta}
      </div>
    </div>
  );
}

/**
 * The description as Markdown, edited in the rich text editor with Save and Cancel (⌘Enter saves, Escape cancels).
 * The draft stays open when saving fails, so nothing typed is lost.
 */
export function IssueDescription({
  description,
  onSave,
  renderMarkdown,
  onMentionSearch,
  richTextLabels,
  labels = defaultIssueDetailLabels,
}: {
  readonly description: string;
  /** Without it the description cannot be edited. */
  readonly onSave?: (markdown: string) => Promise<void>;
  readonly renderMarkdown: (markdown: string) => ReactNode;
  readonly onMentionSearch?: (
    query: string,
  ) => Promise<readonly RichTextMention[]>;
  readonly richTextLabels?: RichTextLabels;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = (): void => {
    if (draft === null || draft === description || !onSave) return;
    setSaving(true);
    void onSave(draft)
      .then(() => setDraft(null))
      .catch(() => undefined)
      .finally(() => setSaving(false));
  };

  if (draft !== null)
    return (
      <div className='space-y-2'>
        <RichTextEditor
          value={draft}
          autoFocus
          aria-label={labels.description}
          placeholder={labels.descriptionPlaceholder}
          disabled={saving}
          {...(onMentionSearch ? { onMentionSearch } : {})}
          {...(richTextLabels ? { labels: richTextLabels } : {})}
          mentionPlacement='below'
          contentClassName='min-h-40'
          onChange={setDraft}
          onEscape={() => {
            if (!saving) setDraft(null);
          }}
          onSubmit={save}
        />
        <div className='flex justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={saving}
            onClick={() => setDraft(null)}
          >
            {labels.cancel}
          </Button>
          <Button
            size='sm'
            disabled={saving || draft === description}
            onClick={save}
          >
            {saving ? (
              <Loader2Icon data-icon='inline-start' className='animate-spin' />
            ) : null}
            {labels.save}
          </Button>
        </div>
      </div>
    );

  const edit = onSave ? (
    <Button
      variant='ghost'
      size='sm'
      className='text-muted-foreground'
      onClick={() => setDraft(description)}
    >
      <PencilIcon data-icon='inline-start' />
      {labels.editDescription}
    </Button>
  ) : null;
  if (!description.trim())
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <p>{labels.noDescription}</p>
        {edit}
      </div>
    );
  return (
    <div className='space-y-2'>
      <div className='max-w-3xl'>{renderMarkdown(description)}</div>
      {edit}
    </div>
  );
}

export interface ChecklistItem {
  readonly key: string;
  readonly label: string;
  readonly required: boolean;
  readonly checked: boolean;
  /** Who checked it, when it is checked. */
  readonly checkedBy?: string | null;
  readonly checkedAt?: string | null;
}

/** The checklist of the current status: every item with who checked it. */
export function IssueChecklist({
  status,
  items,
  complete,
  onToggle,
  locale,
  labels = defaultIssueDetailLabels,
}: {
  readonly status: IssueDetailStatus;
  readonly items: readonly ChecklistItem[];
  /** Every required item is checked. */
  readonly complete: boolean;
  /** Without it the items cannot be checked. */
  readonly onToggle?: (key: string, checked: boolean) => Promise<void>;
  readonly locale?: string;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  const [busy, setBusy] = useState(false);
  const done = items.filter((item) => item.checked).length;
  return (
    <IssueSection
      icon={<ListChecksIcon />}
      title={labels.checklist.title}
      count={fill(labels.checklist.progress, { done, total: items.length })}
      meta={<IssueStatusBadge status={status} />}
      aria-label={labels.checklist.label}
      data-testid='issue-checklist'
    >
      <ul className='space-y-1.5'>
        {items.map((item) => {
          const id = `issue-checklist-${item.key}`;
          return (
            <li key={item.key} className='flex items-start gap-2 text-sm'>
              <Checkbox
                id={id}
                className='mt-0.5'
                checked={item.checked}
                disabled={!onToggle || busy}
                onCheckedChange={(checked) => {
                  if (!onToggle) return;
                  setBusy(true);
                  void onToggle(item.key, checked === true)
                    .catch(() => undefined)
                    .finally(() => setBusy(false));
                }}
              />
              <label htmlFor={id} className='min-w-0 flex-1'>
                <span
                  className={cn(
                    item.checked && 'text-muted-foreground line-through',
                  )}
                >
                  {item.label}
                </span>
                {item.required ? (
                  <Badge
                    variant='secondary'
                    className='ml-2 bg-amber-500/10 font-normal text-amber-700 dark:text-amber-300'
                  >
                    {labels.checklist.required}
                  </Badge>
                ) : null}
                {item.checked && item.checkedAt ? (
                  <span className='block text-xs text-muted-foreground'>
                    {fill(labels.checklist.checkedBy, {
                      name: item.checkedBy ?? '—',
                      time: relativeTime(item.checkedAt, locale),
                    })}
                  </span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
      {complete ? null : (
        <p className='text-xs text-muted-foreground'>
          {labels.checklist.incomplete}
        </p>
      )}
    </IssueSection>
  );
}

export type ApprovalDecision = 'approve' | 'reject' | 'withdraw';

/**
 * A status change waiting for approval: the move, who asked and who may decide. An approver writes an optional comment
 * and approves or rejects; whoever asked may withdraw it; everyone else sees whom it waits for.
 */
export function IssueApprovalCard({
  from,
  to,
  requester,
  requestedAt,
  approvers,
  canDecide,
  canWithdraw,
  onDecide,
  locale,
  labels = defaultIssueDetailLabels,
}: {
  readonly from: IssueDetailStatus;
  readonly to: IssueDetailStatus;
  readonly requester: string;
  readonly requestedAt: string;
  readonly approvers: readonly string[];
  readonly canDecide: boolean;
  readonly canWithdraw: boolean;
  readonly onDecide: (
    decision: ApprovalDecision,
    comment: string | undefined,
  ) => Promise<void>;
  readonly locale?: string;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const decide = (decision: ApprovalDecision): void => {
    setBusy(true);
    void onDecide(
      decision,
      decision === 'withdraw' ? undefined : comment.trim() || undefined,
    )
      .catch(() => undefined)
      .finally(() => setBusy(false));
  };
  return (
    <article
      className={cn('space-y-3', CARD)}
      aria-label={labels.approvals.label}
      data-testid='issue-approval'
    >
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <ShieldCheckIcon
          className='size-4 text-muted-foreground'
          aria-hidden='true'
        />
        <span className='font-medium'>{labels.approvals.pending}</span>
        <IssueStatusBadge status={from} />
        <span aria-hidden='true'>→</span>
        <IssueStatusBadge status={to} />
      </div>
      <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs text-muted-foreground'>
        <dt>{labels.approvals.requester}</dt>
        <dd className='text-foreground'>
          {requester} ·{' '}
          <time dateTime={requestedAt}>
            {relativeTime(requestedAt, locale)}
          </time>
        </dd>
        <dt>{labels.approvals.approvers}</dt>
        <dd className='text-foreground'>{approvers.join(', ')}</dd>
      </dl>
      {canDecide ? (
        <div className='space-y-2'>
          <Textarea
            value={comment}
            rows={2}
            aria-label={labels.approvals.comment}
            placeholder={labels.approvals.commentPlaceholder}
            disabled={busy}
            onChange={(event) => setComment(event.target.value)}
          />
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={busy}
              onClick={() => decide('reject')}
            >
              <XIcon data-icon='inline-start' />
              {labels.approvals.reject}
            </Button>
            <Button size='sm' disabled={busy} onClick={() => decide('approve')}>
              {busy ? (
                <Loader2Icon
                  data-icon='inline-start'
                  className='animate-spin'
                />
              ) : (
                <CheckIcon data-icon='inline-start' />
              )}
              {labels.approvals.approve}
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <p className='text-xs text-muted-foreground'>
            {labels.approvals.waiting}
          </p>
          {canWithdraw ? (
            <Button
              variant='outline'
              size='sm'
              disabled={busy}
              onClick={() => decide('withdraw')}
            >
              <Undo2Icon data-icon='inline-start' />
              {labels.approvals.withdraw}
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}

export interface RecentApproval {
  readonly id: string;
  readonly from: IssueDetailStatus;
  readonly to: IssueDetailStatus;
  /** How it ended, in words, and its tone. */
  readonly outcome: string;
  readonly outcomeTone: 'green' | 'red' | 'grey' | 'amber';
  readonly decidedBy?: string | null;
  readonly at: string;
  readonly comment?: string | null;
}

const TONE: Readonly<Record<RecentApproval['outcomeTone'], string>> = {
  green: 'bg-green-500/10 text-green-700 dark:text-green-300',
  red: 'bg-red-500/10 text-red-700 dark:text-red-300',
  grey: 'bg-muted text-muted-foreground',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

/** The last decided approval requests, folded to one line with their count. Nothing before one was decided. */
export function IssueRecentApprovals({
  approvals,
  locale,
  labels = defaultIssueDetailLabels,
}: {
  readonly approvals: readonly RecentApproval[];
  readonly locale?: string;
  readonly labels?: IssueDetailLabels;
}): ReactElement | null {
  if (approvals.length === 0) return null;
  return (
    <Collapsible
      render={
        <IssueSection
          icon={<HistoryIcon />}
          title={labels.approvals.recent}
          count={approvals.length}
          actions={
            <CollapsibleTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  className='group/approvals text-muted-foreground'
                  aria-label={labels.approvals.recent}
                />
              }
            >
              <ChevronDownIcon
                className='transition-transform group-data-panel-open/approvals:rotate-180'
                aria-hidden='true'
              />
            </CollapsibleTrigger>
          }
        />
      }
      data-testid='issue-recent-approvals'
    >
      <CollapsibleContent>
        <ul className={ISSUE_SECTION_LIST}>
          {approvals.map((approval) => (
            <li key={approval.id} className='space-y-1 px-3 py-2 text-xs'>
              <div className='flex flex-wrap items-center gap-2'>
                <IssueStatusBadge status={approval.from} />
                <span aria-hidden='true'>→</span>
                <IssueStatusBadge status={approval.to} />
                <Badge
                  variant='secondary'
                  className={cn('font-normal', TONE[approval.outcomeTone])}
                >
                  {approval.outcome}
                </Badge>
                <span className='ml-auto text-muted-foreground'>
                  {approval.decidedBy ? `${approval.decidedBy} · ` : ''}
                  <time
                    dateTime={approval.at}
                    title={dateTime(approval.at, locale)}
                  >
                    {relativeTime(approval.at, locale)}
                  </time>
                </span>
              </div>
              {approval.comment ? (
                <p className='text-muted-foreground wrap-anywhere'>
                  {approval.comment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface SubIssue {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly href: string;
  readonly status: IssueDetailStatus;
  /** "waiting for 2", when other issues hold it. */
  readonly waiting?: string | null;
  readonly executor?: {
    readonly name: string;
    readonly kind?: string;
  } | null;
}

export interface SubIssueGroup {
  readonly key: string;
  /** The stage's name; no heading when every group has none. */
  readonly title: string | null;
  readonly done: number;
  readonly issues: readonly SubIssue[];
}

/**
 * Sub-issues grouped by stage, each with how many are done, and `actions` (such as "New sub-issue") in the heading.
 * Nothing renders without any: the page's `IssueAddBar` offers the first.
 */
export function IssueSubtasks({
  groups,
  actions,
  link: Link = PlainLink,
  labels = defaultIssueDetailLabels,
}: {
  readonly groups: readonly SubIssueGroup[];
  readonly actions?: ReactNode;
  readonly link?: IssueDetailLink;
  readonly labels?: IssueDetailLabels;
}): ReactElement | null {
  const cardLink = useCardLink(Link);
  const total = groups.reduce((sum, group) => sum + group.issues.length, 0);
  const done = groups.reduce((sum, group) => sum + group.done, 0);
  const staged = groups.some((group) => group.title !== null);
  if (total === 0) return null;
  return (
    <IssueSection
      icon={<ListTreeIcon />}
      title={labels.subtasks.title}
      count={`${done}/${total}`}
      actions={actions}
    >
      <div className='space-y-3'>
        {groups.map((group) => (
          <div key={group.key} className='overflow-hidden rounded-lg border'>
            {staged ? (
              <div className='flex items-center justify-between border-b bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground'>
                <span>{group.title ?? labels.subtasks.noStage}</span>
                <span className='tabular-nums'>
                  {group.done}/{group.issues.length}
                </span>
              </div>
            ) : null}
            <ul className='divide-y'>
              {group.issues.map((issue) => (
                <li key={issue.id}>
                  <IssueCard
                    issue={{
                      id: issue.id,
                      identifier: issue.identifier,
                      title: issue.title,
                      status: issue.status,
                      executor: issue.executor
                        ? {
                            name: issue.executor.name,
                            ...(issue.executor.kind
                              ? { kind: issue.executor.kind }
                              : {}),
                          }
                        : null,
                    }}
                    appearance='plain'
                    href={issue.href}
                    link={cardLink}
                    className='px-3 py-2'
                    marks={
                      issue.waiting ? (
                        <Badge
                          variant='secondary'
                          className='gap-1 bg-amber-500/10 font-normal text-amber-700 dark:text-amber-300'
                        >
                          <HourglassIcon aria-hidden='true' />
                          {issue.waiting}
                        </Badge>
                      ) : null
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </IssueSection>
  );
}

export interface DependencyItem {
  /** The link's id. */
  readonly id: string;
  /** The other issue's id. */
  readonly issueId: string;
  readonly identifier: string;
  readonly title: string;
  readonly href: string;
  readonly status: IssueDetailStatus;
}

/**
 * "Blocked by", "Blocks" and "Related". Blockers are added through an issue search and removed here; "Blocks" is
 * read-only; related links can be removed. Without any, nothing renders until `adding` (set by a "Dependency" button
 * in the page's `IssueAddBar`) opens the search, which Cancel or Escape in the empty search closes again through
 * `onAddingChange`.
 */
export function IssueDependencies({
  blockedBy,
  blocks,
  related,
  hidden,
  onAdd,
  onRemove,
  onSearch,
  adding = false,
  onAddingChange,
  excludeIds = [],
  link: Link = PlainLink,
  labels = defaultIssueDetailLabels,
}: {
  readonly blockedBy: readonly DependencyItem[];
  readonly blocks: readonly DependencyItem[];
  readonly related: readonly DependencyItem[];
  /** Under "Blocked by", such as how many blockers the reader cannot see. */
  readonly hidden?: string | null;
  /** Without it, nothing can be added or removed. */
  readonly onAdd?: (issue: IssuePickerItem) => Promise<void>;
  readonly onRemove?: (dependency: DependencyItem) => Promise<void>;
  readonly onSearch: (query: string) => Promise<readonly IssuePickerItem[]>;
  /** The search for the first dependency is open while there is none yet. */
  readonly adding?: boolean;
  readonly onAddingChange?: (adding: boolean) => void;
  /** Issues the search leaves out besides the blockers, such as the issue itself. */
  readonly excludeIds?: readonly string[];
  readonly link?: IssueDetailLink;
  readonly labels?: IssueDetailLabels;
}): ReactElement | null {
  const cardLink = useCardLink(Link);
  const [busy, setBusy] = useState(false);
  const any =
    blockedBy.length > 0 ||
    blocks.length > 0 ||
    related.length > 0 ||
    Boolean(hidden);
  // Once the first one is added the section stays for its own sake: the search for the first is done.
  useEffect(() => {
    if (any && adding) onAddingChange?.(false);
  }, [any, adding, onAddingChange]);
  if (!any && !(adding && onAdd)) return null;
  const run = (action: Promise<void>): void => {
    setBusy(true);
    void action.catch(() => undefined).finally(() => setBusy(false));
  };
  const list = (
    title: string,
    items: readonly DependencyItem[],
    removable: boolean,
  ): ReactNode =>
    items.length === 0 ? null : (
      <ul className={ISSUE_SECTION_LIST} aria-label={title}>
        {items.map((item) => (
          <li key={item.id}>
            <IssueCard
              issue={{
                id: item.issueId,
                identifier: item.identifier,
                title: item.title,
                status: item.status,
              }}
              appearance='plain'
              href={item.href}
              link={cardLink}
              className='px-3 py-2'
              trailing={
                removable && onRemove ? (
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    disabled={busy}
                    aria-label={fill(labels.dependencies.remove, {
                      identifier: item.identifier,
                    })}
                    onClick={() => run(onRemove(item))}
                  >
                    <XIcon />
                  </Button>
                ) : null
              }
            />
          </li>
        ))}
      </ul>
    );
  const exclude = new Set([
    ...excludeIds,
    ...blockedBy.map((item) => item.issueId),
  ]);
  const cancel = !any ? () => onAddingChange?.(false) : undefined;
  const count = blockedBy.length + blocks.length + related.length;
  return (
    <IssueSection
      icon={<Link2Icon />}
      title={labels.dependencies.title}
      count={count > 0 ? count : undefined}
    >
      <div className='space-y-2'>
        <h3 className='text-sm font-medium text-muted-foreground'>
          {labels.dependencies.blockedBy}
        </h3>
        {list(labels.dependencies.blockedBy, blockedBy, true)}
        {hidden ? (
          <p className='text-xs text-muted-foreground'>{hidden}</p>
        ) : null}
        {onAdd ? (
          <div
            className='flex items-center gap-2'
            onKeyDown={(event) => {
              if (
                cancel &&
                event.key === 'Escape' &&
                event.target instanceof HTMLInputElement &&
                event.target.value === ''
              )
                cancel();
            }}
          >
            <div className='min-w-0 flex-1'>
              <IssuePicker
                exclude={exclude}
                disabled={busy}
                autoFocus={cancel !== undefined}
                aria-label={labels.dependencies.add}
                placeholder={labels.dependencies.addPlaceholder}
                emptyText={labels.dependencies.searchEmpty}
                onSearch={onSearch}
                onPick={(issue) => run(onAdd(issue))}
              />
            </div>
            {cancel ? (
              <Button variant='ghost' size='sm' onClick={cancel}>
                {labels.cancel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {blocks.length > 0 ? (
        <div className='space-y-2'>
          <h3 className='text-sm font-medium text-muted-foreground'>
            {labels.dependencies.blocks}
          </h3>
          {list(labels.dependencies.blocks, blocks, false)}
        </div>
      ) : null}
      {related.length > 0 ? (
        <div className='space-y-2'>
          <h3 className='text-sm font-medium text-muted-foreground'>
            {labels.dependencies.related}
          </h3>
          {list(labels.dependencies.related, related, true)}
        </div>
      ) : null}
    </IssueSection>
  );
}

/** Deletes the issue after a confirmation. */
export function IssueDeleteButton({
  identifier,
  onDelete,
  labels = defaultIssueDetailLabels,
}: {
  readonly identifier: string;
  readonly onDelete: () => Promise<void>;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button
        variant='ghost'
        size='sm'
        className='text-muted-foreground'
        onClick={() => setOpen(true)}
      >
        <Trash2Icon data-icon='inline-start' />
        {labels.delete}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fill(labels.deleteTitle, { identifier })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {labels.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {labels.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void onDelete()
                  .then(() => setOpen(false))
                  .catch(() => undefined)
                  .finally(() => setBusy(false));
              }}
            >
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
