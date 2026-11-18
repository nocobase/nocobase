/**
 * One entry in a space's view. A header carries the path to it (each step opens that entry, the first the space's
 * home), when it was last updated (who and which version on hover), the proposals waiting on it, and its actions: Edit
 * (Propose changes for someone who may only propose), History, and a menu to move, verify, add under, upload under,
 * open its permissions (the viewer's own access, and its entries for someone who manages it) and, last, archive it.
 * A file has no Edit: its header offers Replace (Propose a replacement), Download and History, and its menu renames it
 * and edits its properties and summary; on a phone only Download and the menu stay, which opens from the bottom with
 * Replace and History at its top. Below, the title, a line of who changed it
 * and its standing (version, inherited or read-only, restricted to the people listed, archived, verified by whom and
 * when), and its summary; then an article's Markdown in a reading column with a table of
 * contents beside it on a wide pane, a file with its preview and extracted text, or a folder's entries. A leading
 * `# Title` repeating the title is not shown twice. Editing takes the document's place (`doc-editor.tsx`).
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BadgeCheckIcon,
  DownloadIcon,
  FilePlusIcon,
  FolderInputIcon,
  FolderPlusIcon,
  HistoryIcon,
  InboxIcon,
  ListTreeIcon,
  LockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ReplaceIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  UploadIcon,
} from 'lucide-react';
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Alert, AlertDescription } from './ui/alert.js';
import { Badge } from './ui/badge.js';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb.js';
import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { Separator } from './ui/separator.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet.js';
import { Skeleton } from './ui/skeleton.js';
import { Spinner } from './ui/spinner.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';
import { cn } from 'cn';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  KnowledgeDoc,
  KnowledgeDocSummary,
  KnowledgeVersion,
} from '../../shared/knowledge.js';
import type { DocMode } from '../hooks/use-view-state.js';
import { useMediaQuery } from '../hooks/use-media.js';
import { useNotify } from '../hooks/use-notify.js';
import { relativeTime } from '../lib/format.js';
import { leadingTitleLine, tocOf } from '../lib/toc.js';
import { childrenOf } from '../lib/tree.js';
import {
  knowledgeKeys,
  useKnowledgeApi,
  useKnowledgeDoc,
  useKnowledgeVersion,
  useKnowledgeVersions,
} from '../api.js';
import { DiffView } from './diff-view.js';
import { ChunksSheet, DocIndexBadge } from './doc-index.js';
import { DocEditor, DocPropertiesDialog } from './doc-editor.js';
import { useEntryActions } from '../lib/entry-actions.js';
import { useReplaceFile } from '../hooks/use-replace-file.js';
import { citedKey, downloadFile } from '../lib/files.js';
import { EntryIcon, FileBody } from './file-pane.js';
import { KnowledgeMarkdown, TableOfContents } from './markdown.js';
import { ProposeFileDialog } from './propose-file.js';

export type { DocMode } from '../hooks/use-view-state.js';

export interface DocPaneProps {
  /** Availability already read by the containing knowledge view. */
  readonly proposalsEnabled?: boolean;
  readonly docId: string;
  /** Shown in another space's view, which inherits it: read-only here. */
  readonly inherited: boolean;
  /** What an inherited document is, as the application words it. */
  readonly inheritedHint?: string | undefined;
  /** The name of the space it is in, the first step of its path. */
  readonly spaceLabel: string;
  readonly mode: DocMode;
  /** An older version to read, or null for the current one. */
  readonly version: number | null;
  /** The documents of the view, to move this one among its space's and list a folder's. */
  readonly docs: readonly KnowledgeDocSummary[];
  readonly onMode: (mode: DocMode) => void;
  /** Reads the chosen version (or the current one), leaving history mode. */
  readonly onVersion: (version: number | null) => void;
  /** Opens another entry (a folder's, a step of the path). */
  readonly onOpen: (docId: string) => void;
  /** The space's home, from the first step of the path. */
  readonly onHome: () => void;
  /** The proposals waiting on this entry. */
  readonly onProposals: (docId: string) => void;
  /** Lines to highlight and scroll to (a section's), or null. */
  readonly lines?: readonly [number, number] | null;
  /** Shows lines of the current version highlighted (reading it), or none. */
  readonly onLines?: (lines: readonly [number, number] | null) => void;
}

function Verified({ doc }: { readonly doc: KnowledgeDoc }): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (!doc.verifiedAt)
    return (
      <span className='inline-flex items-center gap-1 text-muted-foreground'>
        <BadgeCheckIcon className='size-3.5' aria-hidden='true' />
        {t('knowledge.doc.notVerified')}
      </span>
    );
  return (
    <span
      className='inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400'
      data-testid='knowledge-verified'
    >
      <BadgeCheckIcon className='size-3.5' aria-hidden='true' />
      {[
        t('knowledge.doc.verifiedLabel'),
        doc.verifiedBy?.name ?? null,
        doc.verifiedAt.slice(0, 10),
      ]
        .filter(Boolean)
        .join(' · ')}
    </span>
  );
}

function DocMeta({
  doc,
  inherited,
  inheritedHint,
  onPermissions,
  index,
}: {
  readonly doc: KnowledgeDoc;
  readonly inherited: boolean;
  readonly inheritedHint: string | undefined;
  /** Opens its permissions, for someone who manages it. */
  readonly onPermissions: (() => void) | null;
  /** Where its sections stand in the semantic index, when that is on. */
  readonly index: ReactNode;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const restricted = t('knowledge.doc.restricted', {
    count: doc.accessEntries,
  });
  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground'>
      <span className='inline-flex items-center gap-1.5'>
        <EntryIcon entry={doc} />
        {t(`knowledge.kinds.${doc.kind}`)}
      </span>
      {doc.kind === 'folder' ? null : (
        <span className='tabular-nums'>
          {t('knowledge.doc.versionBy', {
            version: doc.version,
            name: doc.updatedBy.name ?? t('knowledge.someone'),
          })}
        </span>
      )}
      {inherited ? (
        <Tooltip>
          <TooltipTrigger render={<Badge variant='secondary' />}>
            <LockIcon data-icon='inline-start' />
            {t('knowledge.spaces.inherited')}
          </TooltipTrigger>
          <TooltipContent>
            {inheritedHint ?? t('knowledge.spaces.inheritedHint')}
          </TooltipContent>
        </Tooltip>
      ) : !doc.access.edit ? (
        <Badge variant='secondary'>
          <LockIcon data-icon='inline-start' />
          {doc.access.propose
            ? t('knowledge.spaces.proposeOnly')
            : t('knowledge.spaces.readOnly')}
        </Badge>
      ) : null}
      {doc.accessMode === 'custom' ? (
        <Tooltip>
          <TooltipTrigger
            render={
              onPermissions ? (
                <button
                  type='button'
                  className='inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
                />
              ) : (
                <span className='inline-flex' tabIndex={0} />
              )
            }
            data-testid='knowledge-restricted'
            {...(onPermissions ? { onClick: onPermissions } : {})}
          >
            <Badge variant='outline'>
              <LockIcon data-icon='inline-start' />
              {restricted}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{t('knowledge.doc.restrictedHint')}</TooltipContent>
        </Tooltip>
      ) : null}
      {doc.archivedAt ? (
        <Badge variant='destructive'>{t('knowledge.tree.archivedBadge')}</Badge>
      ) : null}
      {doc.kind === 'folder' ? null : <Verified doc={doc} />}
      {index}
    </div>
  );
}

function History({
  doc,
  onView,
}: {
  readonly doc: KnowledgeDoc;
  readonly onView: (version: number) => void;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const versions = useKnowledgeVersions(doc.id);
  const [from, setFrom] = useState(Math.max(1, doc.version - 1));
  const [to, setTo] = useState(doc.version);
  const before = useKnowledgeVersion(doc.id, from);
  const after = useKnowledgeVersion(doc.id, to);
  const items = (versions.data ?? []).map((version) => ({
    value: String(version.version),
    label: `v${version.version}`,
  }));
  const picker = (
    value: number,
    onChange: (value: number) => void,
    label: string,
  ) => (
    <Select
      items={items}
      value={String(value)}
      onValueChange={(next: string | null) => next && onChange(Number(next))}
    >
      <SelectTrigger aria-label={label} className='w-24'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <div className='space-y-4' data-testid='knowledge-history'>
      <h2 className='font-heading text-lg font-semibold'>
        {t('knowledge.history.title')}
      </h2>
      <ol className='divide-y rounded-lg border'>
        {(versions.data ?? []).map((version: KnowledgeVersion) => (
          <li
            key={version.version}
            className='flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm'
          >
            <span className='font-medium tabular-nums'>v{version.version}</span>
            {version.file ? (
              <span className='truncate text-muted-foreground'>
                {version.file.filename}
              </span>
            ) : null}
            {version.version === doc.version ? (
              <Badge variant='outline'>{t('knowledge.history.current')}</Badge>
            ) : null}
            {version.proposalId ? (
              <Badge variant='secondary'>
                {t('knowledge.history.fromProposal')}
              </Badge>
            ) : null}
            <span className='text-muted-foreground'>
              {t('knowledge.history.by', {
                name: version.author.name ?? t('knowledge.someone'),
              })}
              {version.approvedBy
                ? ` · ${t('knowledge.history.approvedBy', { name: version.approvedBy.name ?? '' })}`
                : ''}
              {' · '}
              {relativeTime(version.createdAt, i18n.language)}
            </span>
            {version.note ? (
              <span className='w-full text-muted-foreground'>
                {version.note}
              </span>
            ) : null}
            <div className='ml-auto flex gap-1'>
              {version.version > 1 ? (
                <Button
                  variant='ghost'
                  onClick={() => {
                    setFrom(version.version - 1);
                    setTo(version.version);
                  }}
                >
                  {t('knowledge.history.compare')}
                </Button>
              ) : null}
              <Button variant='ghost' onClick={() => onView(version.version)}>
                {t('knowledge.history.view')}
              </Button>
            </div>
          </li>
        ))}
        {versions.isPending ? (
          <li className='p-3'>
            <Skeleton className='h-5 w-1/2' />
          </li>
        ) : null}
      </ol>
      {doc.version > 1 ? (
        <section className='space-y-3'>
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <span className='font-medium'>
              {t('knowledge.history.compare')}
            </span>
            {picker(from, setFrom, t('knowledge.history.compare'))}
            <span>{t('knowledge.history.with')}</span>
            {picker(to, setTo, t('knowledge.history.with'))}
          </div>
          {before.data && after.data ? (
            <DiffView
              before={before.data.content ?? ''}
              after={after.data.content ?? ''}
            />
          ) : (
            <Skeleton className='h-24 w-full' />
          )}
        </section>
      ) : null}
    </div>
  );
}

/** A folder's entries, to open. */
function FolderBody({
  doc,
  docs,
  onOpen,
}: {
  readonly doc: KnowledgeDoc;
  readonly docs: readonly KnowledgeDocSummary[];
  readonly onOpen: (docId: string) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const children = childrenOf(docs, doc.id);
  if (children.length === 0)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('knowledge.folder.empty')}
      </p>
    );
  return (
    <ul className='divide-y rounded-lg border' data-testid='knowledge-folder'>
      {children.map((child) => (
        <li key={child.id}>
          <button
            type='button'
            className='flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted'
            onClick={() => onOpen(child.id)}
          >
            <EntryIcon entry={child} />
            <span className='truncate'>{child.title}</span>
            {child.summary ? (
              <span className='ml-auto truncate text-muted-foreground'>
                {child.summary}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function DocPath({
  doc,
  spaceLabel,
  onOpen,
  onHome,
}: {
  readonly doc: KnowledgeDoc;
  readonly spaceLabel: string;
  readonly onOpen: (docId: string) => void;
  readonly onHome: () => void;
}): ReactElement {
  return (
    <Breadcrumb className='min-w-0'>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<button type='button' onClick={onHome} />}>
            {spaceLabel}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {doc.breadcrumbs.map((crumb) => (
          <Fragment key={crumb.id}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                render={
                  <button type='button' onClick={() => onOpen(crumb.id)} />
                }
                className='max-w-48 truncate'
              >
                {crumb.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className='max-w-48 truncate'>
            {doc.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** One action of an entry's menu, or a line between groups of them. */
type MenuEntry =
  | {
      readonly key: string;
      readonly icon: ReactNode;
      readonly label: string;
      readonly onClick: () => void;
      readonly disabled?: boolean;
      readonly destructive?: boolean;
    }
  | 'separator';

/** A line between groups, named after the action before it. */
interface MenuSeparator {
  readonly key: string;
  readonly separator: true;
}

/** The entries without a line at either end or two in a row. */
function tidy(
  entries: readonly (MenuEntry | null)[],
): (Exclude<MenuEntry, 'separator'> | MenuSeparator)[] {
  const out: (Exclude<MenuEntry, 'separator'> | MenuSeparator)[] = [];
  for (const entry of entries) {
    if (entry === null) continue;
    const last = out.at(-1);
    if (entry === 'separator') {
      if (last && !('separator' in last))
        out.push({ key: `after-${last.key}`, separator: true });
      continue;
    }
    out.push(entry);
  }
  const last = out.at(-1);
  if (last && 'separator' in last) out.pop();
  return out;
}

/** An entry's "…" menu: a dropdown, or on a phone a sheet from the bottom. */
function EntryMenu({
  entries,
  sheet,
  title,
}: {
  readonly entries: readonly ReturnType<typeof tidy>[number][];
  readonly sheet: boolean;
  readonly title: string;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [open, setOpen] = useState(false);
  if (entries.length === 0) return null;
  const trigger = (
    <Button
      variant='outline'
      size='icon'
      aria-label={t('knowledge.doc.more')}
      title={t('knowledge.doc.more')}
    />
  );
  if (sheet)
    return (
      <>
        <Button
          variant='outline'
          size='icon'
          aria-label={t('knowledge.doc.more')}
          title={t('knowledge.doc.more')}
          onClick={() => setOpen(true)}
        >
          <MoreHorizontalIcon />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side='bottom'
            className='max-h-[85dvh] gap-0 rounded-t-xl pb-[env(safe-area-inset-bottom)]'
            data-testid='knowledge-doc-actions'
          >
            <SheetHeader className='pr-12'>
              <SheetTitle className='truncate'>{title}</SheetTitle>
              <SheetDescription className='sr-only'>
                {t('knowledge.doc.more')}
              </SheetDescription>
            </SheetHeader>
            <div className='flex flex-col overflow-y-auto px-2 pb-3'>
              {entries.map((entry) =>
                'separator' in entry ? (
                  <Separator key={entry.key} className='my-1' />
                ) : (
                  <Button
                    key={entry.key}
                    variant='ghost'
                    size='lg'
                    disabled={entry.disabled}
                    className={cn(
                      'h-11 justify-start',
                      entry.destructive && 'text-destructive',
                    )}
                    onClick={() => {
                      setOpen(false);
                      entry.onClick();
                    }}
                  >
                    {entry.icon}
                    {entry.label}
                  </Button>
                ),
              )}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        {entries.map((entry) =>
          'separator' in entry ? (
            <DropdownMenuSeparator key={entry.key} />
          ) : (
            <DropdownMenuItem
              key={entry.key}
              disabled={entry.disabled}
              {...(entry.destructive
                ? { variant: 'destructive' as const }
                : {})}
              onClick={entry.onClick}
            >
              {entry.icon}
              {entry.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DocPane(props: DocPaneProps): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const { docId, inherited, mode, version } = props;
  const doc = useKnowledgeDoc(docId);
  const proposalsEnabled = props.proposalsEnabled !== false;
  const old = useKnowledgeVersion(docId, version);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const actions = useEntryActions();
  const [proposingFile, setProposingFile] = useState(false);
  const [chunksOpen, setChunksOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const phone = !useMediaQuery('(min-width: 768px)');
  const replace = useReplaceFile(doc.data);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lines = props.lines ?? null;
  const loaded = Boolean(doc.data);
  // The lines are parsed again on every render: compare them by value, as the file's tabs do.
  const cited = citedKey(docId, lines);
  // The highlighted lines come into view once the document is shown.
  useEffect(() => {
    if (!cited || !loaded) return;
    const first = bodyRef.current?.querySelector('[data-highlighted]');
    if (first && 'scrollIntoView' in first)
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [cited, loaded]);
  const verify = useMutation({
    mutationFn: () => api.act(docId, 'verify'),
    onSuccess: () => {
      notify.success(t('knowledge.doc.verifiedToast'));
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
    onError: (error) => notify.error(error),
  });

  if (doc.isError) {
    const missing =
      doc.error instanceof ApiClientError &&
      [403, 404].includes(doc.error.status);
    return (
      <p className='text-sm text-muted-foreground'>
        {missing ? t('knowledge.doc.notFound') : t('knowledge.loadFailed')}
      </p>
    );
  }
  if (!doc.data)
    return (
      <div className='space-y-3'>
        <Skeleton className='h-5 w-1/3' />
        <Skeleton className='h-9 w-2/3' />
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-40 w-full' />
      </div>
    );
  const current = proposalsEnabled
    ? doc.data
    : {
        ...doc.data,
        pendingProposals: 0,
        access: { ...doc.data.access, propose: false },
      };
  const live = !current.archivedAt;
  const editable = current.access.edit && !inherited;
  // Someone who may propose but not edit proposes changes instead.
  const proposes = !inherited && !current.access.edit && current.access.propose;
  const older = version !== null && version !== current.version;
  const content = older ? (old.data?.content ?? '') : current.content;
  const file = older ? (old.data?.file ?? null) : current.file;
  const folder = current.kind === 'folder';
  const article = current.kind === 'article';
  const hidden = article ? leadingTitleLine(content, current.title) : null;
  const toc = article ? tocOf(content, hidden) : [];
  const summary: KnowledgeDocSummary = current;

  const isFile = current.kind === 'file';

  if (mode === 'edit' && live && !isFile && (editable || (proposes && article)))
    return (
      <article className='min-w-0' data-testid='knowledge-doc'>
        <DocEditor
          key={current.version}
          doc={current}
          propose={!editable}
          onDone={() => props.onMode('read')}
        />
      </article>
    );

  const edit = isFile ? null : editable && live ? (
    <Button onClick={() => props.onMode('edit')}>
      <PencilIcon data-icon='inline-start' />
      {folder ? t('knowledge.doc.rename') : t('knowledge.doc.edit')}
    </Button>
  ) : proposes && live && !folder ? (
    <Button onClick={() => props.onMode('edit')}>
      <PencilIcon data-icon='inline-start' />
      {t('knowledge.doc.proposeChanges')}
    </Button>
  ) : null;
  // A file is replaced where an article is edited, without the primary emphasis.
  const replacing =
    isFile && live && !older && editable
      ? {
          label: t('knowledge.files.replace'),
          pending: replace.pending,
          onClick: replace.pick,
        }
      : isFile && live && !older && proposes
        ? {
            label: t('knowledge.files.proposeReplace'),
            pending: false,
            onClick: () => setProposingFile(true),
          }
        : null;
  const toggleHistory = () =>
    props.onMode(mode === 'history' ? 'read' : 'history');
  const holds = current.kind !== 'file';
  // Whoever manages it changes its permissions; not from a space it is inherited into. Anyone sees their own access.
  const manager = current.access.manage && !inherited ? actions : null;
  const permissionsItem: MenuEntry | null = actions
    ? {
        key: 'permissions',
        icon: <ShieldIcon />,
        label: t('knowledge.doc.permissions'),
        onClick: () => actions.permissions(summary),
      }
    : null;
  const chunksItem: MenuEntry | null = folder
    ? null
    : {
        key: 'chunks',
        icon: <ListTreeIcon />,
        label: t('knowledge.chunks.open'),
        onClick: () => setChunksOpen(true),
      };
  const menuEntries: (MenuEntry | null)[] = !actions
    ? []
    : !editable
      ? [chunksItem, permissionsItem]
      : live
        ? [
            ...(isFile
              ? [
                  {
                    key: 'rename',
                    icon: <PencilIcon />,
                    label: t('knowledge.doc.rename'),
                    onClick: () => actions.rename(summary),
                  },
                  {
                    key: 'properties',
                    icon: <SlidersHorizontalIcon />,
                    label: t('knowledge.doc.properties'),
                    onClick: () => setPropertiesOpen(true),
                  },
                ]
              : []),
            {
              key: 'move',
              icon: <FolderInputIcon />,
              label: t('knowledge.doc.move'),
              onClick: () => actions.move(summary),
            },
            folder
              ? null
              : {
                  key: 'verify',
                  icon: <BadgeCheckIcon />,
                  label: t('knowledge.doc.verify'),
                  disabled: verify.isPending,
                  onClick: () => verify.mutate(),
                },
            ...(holds
              ? [
                  'separator' as const,
                  {
                    key: 'childArticle',
                    icon: <FilePlusIcon />,
                    label: t('knowledge.new.childArticle'),
                    onClick: () => actions.newEntry('article', current.id),
                  },
                  {
                    key: 'childFolder',
                    icon: <FolderPlusIcon />,
                    label: t('knowledge.new.childFolder'),
                    onClick: () => actions.newEntry('folder', current.id),
                  },
                  {
                    key: 'upload',
                    icon: <UploadIcon />,
                    label: t('knowledge.files.uploadHere'),
                    onClick: () => actions.upload(current.id),
                  },
                ]
              : []),
            'separator',
            chunksItem,
            permissionsItem,
            'separator',
            {
              key: 'archive',
              icon: <ArchiveIcon />,
              label: t('knowledge.doc.archive'),
              destructive: true,
              onClick: () => actions.archive(summary),
            },
          ]
        : [
            {
              key: 'restore',
              icon: <ArchiveRestoreIcon />,
              label: t('knowledge.doc.restore'),
              onClick: () => actions.restore(summary),
            },
            'separator',
            chunksItem,
            permissionsItem,
          ];
  // On a phone a file's header keeps Download and the menu; Replace and History open from the menu's top.
  const fileSheet = isFile && phone;
  // Someone who only reads a file sees Download and History on a desktop; a phone keeps History in the menu.
  const desktopReader = isFile && !fileSheet && !editable && !proposes;
  const menu = desktopReader ? null : (
    <EntryMenu
      sheet={fileSheet}
      title={current.title}
      entries={tidy([
        ...(fileSheet
          ? [
              current.pendingProposals > 0
                ? {
                    key: 'proposals',
                    icon: <InboxIcon />,
                    label: t('knowledge.doc.pending', {
                      count: current.pendingProposals,
                    }),
                    onClick: () => props.onProposals(current.id),
                  }
                : null,
              replacing
                ? {
                    key: 'replace',
                    icon: <ReplaceIcon />,
                    label: replacing.label,
                    disabled: replacing.pending,
                    onClick: replacing.onClick,
                  }
                : null,
              {
                key: 'history',
                icon: <HistoryIcon />,
                label: t('knowledge.doc.history'),
                onClick: toggleHistory,
              },
              'separator' as const,
            ]
          : []),
        ...menuEntries,
      ])}
    />
  );
  const download = file ? (
    <Button
      variant='outline'
      size={phone ? 'icon' : 'default'}
      aria-label={t('knowledge.files.download')}
      title={t('knowledge.files.download')}
      onClick={() => downloadFile(file)}
    >
      <DownloadIcon data-icon={phone ? undefined : 'inline-start'} />
      {phone ? null : t('knowledge.files.download')}
    </Button>
  ) : null;

  return (
    <article className='min-w-0 space-y-6' data-testid='knowledge-doc'>
      <header className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
          <DocPath
            doc={current}
            spaceLabel={props.spaceLabel}
            onOpen={props.onOpen}
            onHome={props.onHome}
          />
          <div
            className='flex flex-wrap items-center gap-2'
            data-testid='knowledge-doc-toolbar'
          >
            {current.pendingProposals > 0 && !fileSheet && !desktopReader ? (
              <Button
                variant='link'
                className='px-1'
                onClick={() => props.onProposals(current.id)}
              >
                {t('knowledge.doc.pending', {
                  count: current.pendingProposals,
                })}
              </Button>
            ) : null}
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className='text-sm text-muted-foreground'
                    tabIndex={0}
                  />
                }
              >
                {t('knowledge.doc.updatedAgo', {
                  time: relativeTime(current.updatedAt, i18n.language),
                })}
              </TooltipTrigger>
              <TooltipContent>
                {folder
                  ? (current.updatedBy.name ?? t('knowledge.someone'))
                  : t('knowledge.doc.updatedDetail', {
                      name: current.updatedBy.name ?? t('knowledge.someone'),
                      version: current.version,
                    })}
              </TooltipContent>
            </Tooltip>
            {edit}
            {replacing && !fileSheet ? (
              <Button
                variant='outline'
                disabled={replacing.pending}
                onClick={replacing.onClick}
              >
                {replacing.pending ? (
                  <Spinner data-icon='inline-start' />
                ) : (
                  <ReplaceIcon data-icon='inline-start' />
                )}
                {replacing.label}
              </Button>
            ) : null}
            {download}
            {folder || fileSheet ? null : (
              <Button
                variant={mode === 'history' ? 'secondary' : 'outline'}
                aria-pressed={mode === 'history'}
                onClick={toggleHistory}
              >
                <HistoryIcon data-icon='inline-start' />
                {t('knowledge.doc.history')}
              </Button>
            )}
            {menu}
            {isFile ? replace.input : null}
          </div>
        </div>
        <div className='space-y-2'>
          <h1 className='font-heading text-3xl font-semibold tracking-tight wrap-anywhere'>
            {current.title}
          </h1>
          <DocMeta
            doc={current}
            inherited={inherited}
            inheritedHint={props.inheritedHint}
            onPermissions={manager ? () => manager.permissions(summary) : null}
            index={
              folder ? null : (
                <DocIndexBadge docId={current.id} editable={editable && live} />
              )
            }
          />
          {current.summary ? (
            <p className='max-w-[720px] text-muted-foreground'>
              {current.summary}
            </p>
          ) : null}
        </div>
      </header>
      {current.archivedAt ? (
        <Alert>
          <AlertDescription>
            {t('knowledge.doc.archivedNotice')}
          </AlertDescription>
        </Alert>
      ) : null}
      {mode === 'history' && !folder ? (
        <History
          doc={current}
          onView={(number) => {
            props.onVersion(number === current.version ? null : number);
          }}
        />
      ) : folder ? (
        <FolderBody doc={current} docs={props.docs} onOpen={props.onOpen} />
      ) : (
        <div
          className={cn(
            'grid gap-8',
            toc.length > 0 && '@5xl:grid-cols-[minmax(0,720px)_220px]',
          )}
        >
          <div ref={bodyRef} className='min-w-0 max-w-[720px] space-y-3'>
            {older ? (
              <Alert>
                <AlertDescription className='flex flex-wrap items-center gap-2'>
                  {t('knowledge.doc.oldVersion', { version })}
                  <Button
                    variant='outline'
                    onClick={() => props.onVersion(null)}
                  >
                    {t('knowledge.doc.backToCurrent')}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {lines && !older ? (
              <Alert data-testid='knowledge-lines'>
                <AlertDescription className='flex flex-wrap items-center gap-2'>
                  {t('knowledge.chunks.showing', {
                    start: lines[0],
                    end: lines[1],
                  })}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => props.onLines?.(null)}
                  >
                    {t('knowledge.chunks.clear')}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {file ? (
              <FileBody
                doc={current}
                file={file}
                content={content}
                version={older && version !== null ? version : current.version}
                older={older}
                editable={editable && !older && live}
                highlight={older ? null : lines}
              />
            ) : content.trim() ? (
              <KnowledgeMarkdown
                content={content}
                hiddenHeadingLine={hidden}
                highlight={older ? null : lines}
                className='text-base'
              />
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t('knowledge.doc.empty')}
              </p>
            )}
          </div>
          {toc.length > 0 ? (
            <aside className='hidden @5xl:block'>
              <div className='sticky top-4'>
                <TableOfContents headings={toc} />
              </div>
            </aside>
          ) : null}
        </div>
      )}
      {folder ? null : (
        <ChunksSheet
          open={chunksOpen}
          onOpenChange={setChunksOpen}
          docId={current.id}
          title={current.title}
          onShow={(shown) => props.onLines?.(shown)}
        />
      )}
      {propertiesOpen ? (
        <DocPropertiesDialog
          open
          onOpenChange={setPropertiesOpen}
          doc={current}
        />
      ) : null}
      {proposingFile ? (
        <ProposeFileDialog
          open
          onOpenChange={setProposingFile}
          target={{ kind: 'update', doc: current }}
        />
      ) : null}
    </article>
  );
}
