/**
 * The left pane of the knowledge view: the view's heading where it has one (the application's space switcher), the
 * search that opens the ⌘K dialog with the New menu beside it, the proposals waiting for review, and each space as a
 * group with its tree — the space shown first and open, its "…" menu opening the space's access and the search test,
 * the spaces it inherits collapsed at the bottom, locked. A tree row opens its entry, with a lock when only the people listed may access it; its chevron folds what is
 * under it, and its "…" menu renames, moves, adds under it or archives it for someone who may edit it, and opens its
 * permissions for someone who manages it. Files dropped on a space or on an entry are uploaded there; the hint says
 * so only while files are dragged. Archived entries are shown on request, at the bottom.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronRightIcon,
  FilePlusIcon,
  FlaskConicalIcon,
  FolderInputIcon,
  FolderPlusIcon,
  InboxIcon,
  LockIcon,
  MoreHorizontalIcon,
  ScissorsIcon,
  PencilIcon,
  ShieldIcon,
  SearchIcon,
  UploadIcon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { Kbd } from './ui/kbd.js';
import { Skeleton } from './ui/skeleton.js';
import { Switch } from './ui/switch.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';
import { cn } from 'cn';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  KnowledgeDocSummary,
  KnowledgeSpace,
} from '../../shared/knowledge.js';
import { useDraggingFiles } from '../hooks/use-media.js';
import { useFileDrop } from '../hooks/use-upload.js';
import { ancestorsOf, forest, type TreeNode } from '../lib/tree.js';
import { useEntryActions, type EntryActions } from '../lib/entry-actions.js';
import { EntryIcon } from './file-pane.js';

export interface SidebarSpace {
  readonly space: KnowledgeSpace;
  readonly docs: readonly KnowledgeDocSummary[];
}

export interface KnowledgeSidebarProps {
  readonly spaces: readonly SidebarSpace[];
  readonly loading: boolean;
  readonly spaceLabel: (space: KnowledgeSpace) => string;
  readonly inheritedHint: string;
  readonly selected: string | null;
  readonly onSelect: (id: string) => void;
  /** Proposals waiting in the view's spaces, and whether their list is shown. */
  readonly pending: number;
  readonly reviewing: boolean;
  readonly onReview: () => void;
  readonly onSearch: () => void;
  /** Files dropped go into the space shown, under the entry dropped on. */
  readonly onDropFiles:
    ((files: File[], parentId: string | null) => void) | null;
  readonly archived: boolean;
  readonly onArchived: ((show: boolean) => void) | null;
  readonly searchShortcut: string;
  /** The view's heading, the full width of the pane above the search. */
  readonly heading?: ReactNode;
  /** Buttons beside the search: the New menu. */
  readonly toolbar?: ReactNode;
}

interface RowProps {
  readonly selected: string | null;
  readonly onSelect: (id: string) => void;
  readonly collapsed: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  /** The menu's actions, only in the space shown for someone who may edit it. */
  readonly actions: EntryActions | null;
  readonly onDropFiles: ((files: File[], parentId: string) => void) | null;
}

function RowMenu({
  doc,
  actions,
}: {
  readonly doc: KnowledgeDocSummary;
  readonly actions: EntryActions;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const holds = doc.kind !== 'file';
  const editable = doc.access.edit;
  const permissions = doc.access.manage ? (
    <DropdownMenuItem onClick={() => actions.permissions(doc)}>
      <ShieldIcon />
      {t('knowledge.doc.permissions')}
    </DropdownMenuItem>
  ) : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size='icon-sm'
            variant='ghost'
            aria-label={t('knowledge.tree.actions')}
            className='shrink-0 opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100'
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        {!editable ? (
          permissions
        ) : doc.archivedAt ? (
          <DropdownMenuItem onClick={() => actions.restore(doc)}>
            <ArchiveRestoreIcon />
            {t('knowledge.doc.restore')}
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={() => actions.rename(doc)}>
              <PencilIcon />
              {t('knowledge.doc.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.move(doc)}>
              <FolderInputIcon />
              {t('knowledge.doc.move')}
            </DropdownMenuItem>
            {holds ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.newEntry('article', doc.id)}
                >
                  <FilePlusIcon />
                  {t('knowledge.new.childArticle')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.newEntry('folder', doc.id)}
                >
                  <FolderPlusIcon />
                  {t('knowledge.new.childFolder')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.upload(doc.id)}>
                  <UploadIcon />
                  {t('knowledge.files.uploadHere')}
                </DropdownMenuItem>
              </>
            ) : null}
            {permissions ? (
              <>
                <DropdownMenuSeparator />
                {permissions}
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              onClick={() => actions.archive(doc)}
            >
              <ArchiveIcon />
              {t('knowledge.doc.archive')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TreeRow({
  node,
  depth,
  ...props
}: RowProps & {
  readonly node: TreeNode;
  readonly depth: number;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const { selected, onSelect, collapsed, onToggle, actions, onDropFiles } =
    props;
  const { doc } = node;
  const drop = useFileDrop(
    onDropFiles && doc.kind !== 'file' && !doc.archivedAt && doc.access.edit
      ? (files) => onDropFiles(files, doc.id)
      : null,
  );
  const parent = node.children.length > 0;
  const open = parent && !collapsed.has(doc.id);
  const current = doc.id === selected;
  return (
    <li
      role='treeitem'
      aria-selected={current}
      {...(parent ? { 'aria-expanded': open } : {})}
    >
      <div
        className={cn(
          'group/row flex min-w-0 items-center gap-0.5 rounded-md pr-0.5 hover:bg-muted',
          current && 'bg-muted',
          drop.over && 'ring-2 ring-primary',
        )}
        style={{ paddingLeft: `${depth * 12}px` }}
        {...drop.handlers}
      >
        {parent ? (
          <Button
            size='icon-sm'
            variant='ghost'
            aria-label={
              open ? t('knowledge.tree.collapse') : t('knowledge.tree.expand')
            }
            className='shrink-0 text-muted-foreground hover:bg-transparent'
            onClick={() => onToggle(doc.id)}
          >
            <ChevronRightIcon
              className={cn('transition-transform', open && 'rotate-90')}
            />
          </Button>
        ) : (
          <span aria-hidden='true' className='size-7 shrink-0' />
        )}
        <button
          type='button'
          onClick={() => onSelect(doc.id)}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm outline-none focus-visible:underline',
            current && 'font-medium',
            doc.archivedAt && 'text-muted-foreground line-through',
          )}
          data-kind={doc.kind}
        >
          <EntryIcon entry={doc} open={open} />
          <span className='truncate'>{doc.title}</span>
          {doc.accessMode === 'custom' ? (
            <LockIcon
              className='size-3.5 shrink-0 text-muted-foreground'
              aria-label={t('knowledge.tree.restricted')}
              role='img'
            />
          ) : null}
          {doc.file?.parseStatus === 'failed' ? (
            <Badge variant='destructive' className='ml-auto shrink-0'>
              {t('knowledge.files.status.failed')}
            </Badge>
          ) : null}
          {doc.pendingProposals > 0 ? (
            <Badge variant='secondary' className='ml-auto shrink-0'>
              {t('knowledge.tree.pending', { count: doc.pendingProposals })}
            </Badge>
          ) : null}
        </button>
        {actions && (doc.access.edit || doc.access.manage) ? (
          <RowMenu doc={doc} actions={actions} />
        ) : null}
      </div>
      {open ? (
        <TreeRows nodes={node.children} depth={depth + 1} {...props} />
      ) : null}
    </li>
  );
}

function TreeRows({
  nodes,
  depth,
  label,
  ...props
}: RowProps & {
  readonly nodes: readonly TreeNode[];
  readonly depth: number;
  readonly label?: string;
}): ReactElement {
  return (
    <ul
      role={depth === 0 ? 'tree' : 'group'}
      aria-label={depth === 0 ? label : undefined}
      className='space-y-px'
    >
      {nodes.map((node) => (
        <TreeRow key={node.doc.id} node={node} depth={depth} {...props} />
      ))}
    </ul>
  );
}

function SpaceGroup({
  entry,
  label,
  inheritedHint,
  selected,
  onSelect,
  onDropFiles,
}: {
  readonly entry: SidebarSpace;
  readonly label: string;
  readonly inheritedHint: string;
  readonly selected: string | null;
  readonly onSelect: (id: string) => void;
  readonly onDropFiles:
    ((files: File[], parentId: string | null) => void) | null;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const { space, docs } = entry;
  const inherited = space.inherited;
  const shared = useEntryActions();
  // The space shown is the one the view acts on; one it inherits is read-only here.
  const actions = inherited ? null : shared;
  const [open, setOpen] = useState(!inherited);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // Opening an entry (from search, a link) unfolds its space and what is above it.
  const [seen, setSeen] = useState(selected);
  if (seen !== selected) {
    setSeen(selected);
    if (selected && docs.some((doc) => doc.id === selected)) {
      const above = ancestorsOf(docs, selected);
      if (above.some((id) => collapsed.has(id)))
        setCollapsed(
          new Set([...collapsed].filter((id) => !above.includes(id))),
        );
      if (!open) setOpen(true);
    }
  }
  const drops = inherited ? null : onDropFiles;
  // At the top only for someone who may edit the space; under an entry, for someone who may edit that entry.
  const drop = useFileDrop(
    drops && actions?.access.edit ? (files) => drops(files, null) : null,
  );
  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn('rounded-md', drop.over && 'ring-2 ring-primary/50')}
      aria-label={label}
      data-testid={`knowledge-space-${space.scope}`}
      render={<section />}
      {...drop.handlers}
    >
      <div className='flex items-center gap-1'>
        <CollapsibleTrigger
          render={
            <button
              type='button'
              className='flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-sm font-medium hover:bg-muted'
            />
          }
        >
          <ChevronRightIcon
            aria-hidden='true'
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-90',
            )}
          />
          <span className='truncate'>{label}</span>
        </CollapsibleTrigger>
        {inherited ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span
                  className='inline-flex size-9 shrink-0 items-center justify-center text-muted-foreground'
                  aria-label={t('knowledge.spaces.inherited')}
                />
              }
            >
              <LockIcon className='size-4' />
            </TooltipTrigger>
            <TooltipContent>{inheritedHint}</TooltipContent>
          </Tooltip>
        ) : null}
        {actions ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={t('knowledge.spaces.actions')}
                  title={t('knowledge.spaces.actions')}
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={() => actions.spaceAccess()}>
                <ShieldIcon />
                {t('knowledge.spaces.access')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.searchTest()}>
                <FlaskConicalIcon />
                {t('knowledge.searchTest.title')}
              </DropdownMenuItem>
              {actions.access.manage ? (
                <DropdownMenuItem onClick={() => actions.chunking()}>
                  <ScissorsIcon />
                  {t('knowledge.chunking.title')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <CollapsibleContent className='pt-0.5'>
        {docs.length > 0 ? (
          <TreeRows
            nodes={forest(docs)}
            depth={0}
            label={label}
            selected={selected}
            onSelect={onSelect}
            collapsed={collapsed}
            onToggle={toggle}
            actions={actions}
            onDropFiles={drops}
          />
        ) : (
          <p className='px-2 py-1.5 text-sm text-muted-foreground'>
            {t('knowledge.spaces.empty')}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function KnowledgeSidebar(props: KnowledgeSidebarProps): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const dragging = useDraggingFiles();
  const own = props.spaces.filter((entry) => !entry.space.inherited);
  const inherited = props.spaces.filter((entry) => entry.space.inherited);
  const group = (entry: SidebarSpace) => (
    <SpaceGroup
      key={`${entry.space.scope}:${entry.space.scopeId}`}
      entry={entry}
      label={props.spaceLabel(entry.space)}
      inheritedHint={props.inheritedHint}
      selected={props.selected}
      onSelect={props.onSelect}
      onDropFiles={props.onDropFiles}
    />
  );
  return (
    <nav
      aria-label={t('knowledge.tree.label')}
      className='flex h-full min-h-0 flex-col'
    >
      {props.heading ? (
        <div className='min-w-0 shrink-0 px-2 pt-2'>{props.heading}</div>
      ) : null}
      <div className='flex shrink-0 items-center gap-2 p-2'>
        <Button
          variant='outline'
          className='min-w-0 flex-1 justify-start text-muted-foreground'
          onClick={props.onSearch}
        >
          <SearchIcon data-icon='inline-start' />
          <span className='flex-1 truncate text-left'>
            {t('knowledge.search.placeholder')}
          </span>
          <Kbd>{props.searchShortcut}</Kbd>
        </Button>
        {props.toolbar}
      </div>
      <div className='min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2'>
        {props.pending > 0 ? (
          <button
            type='button'
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
              props.reviewing && 'bg-muted font-medium',
            )}
            data-testid='knowledge-waiting'
            onClick={props.onReview}
          >
            <InboxIcon
              className='size-4 text-muted-foreground'
              aria-hidden='true'
            />
            <span className='truncate'>
              {t('knowledge.proposals.pendingEntry', { count: props.pending })}
            </span>
          </button>
        ) : null}
        {props.loading ? (
          <div className='space-y-2 px-2 py-1'>
            <Skeleton className='h-5 w-3/4' />
            <Skeleton className='h-5 w-2/3' />
            <Skeleton className='h-5 w-1/2' />
          </div>
        ) : (
          <>
            {own.map(group)}
            {inherited.length > 0 ? (
              <div className='space-y-2 border-t pt-2'>
                {inherited.map(group)}
              </div>
            ) : null}
          </>
        )}
      </div>
      {props.onArchived || (dragging && props.onDropFiles) ? (
        <div className='shrink-0 space-y-2 border-t p-2'>
          {dragging && props.onDropFiles ? (
            <p className='px-1 text-xs text-muted-foreground'>
              {t('knowledge.files.dropHint')}
            </p>
          ) : null}
          {props.onArchived ? (
            <label className='flex items-center gap-2 px-1 text-sm text-muted-foreground'>
              <Switch
                checked={props.archived}
                onCheckedChange={props.onArchived}
              />
              {t('knowledge.tree.archived')}
            </label>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
