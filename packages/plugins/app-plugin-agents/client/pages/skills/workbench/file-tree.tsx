/**
 * The skill's files as a tree, `SKILL.md` first. Selecting an entry opens it in the pane beside. While editing, a folder
 * row and the root take new files and folders and uploads (by its menu, or by dropping files onto it), and every entry
 * but `SKILL.md` can be renamed and deleted. A script carries a badge.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertCircleIcon,
  ChevronRightIcon,
  FileIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  MoreHorizontalIcon,
  UploadIcon,
} from 'lucide-react';
import { useState, type DragEvent, type ReactElement } from 'react';

import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip.js';
import { cn } from 'cn';
import {
  isScript,
  SKILL_MD,
  treeOf,
  type FileDraft,
  type SkillDraft,
  type TreeNode,
} from './model.js';

export interface FileTreeActions {
  readonly newFile: (folder: string) => void;
  readonly newFolder: (folder: string) => void;
  /** Uploads `files` into `folder`; without them, asks for them. */
  readonly upload: (folder: string, files?: readonly File[]) => void;
  readonly rename: (node: TreeNode) => void;
  readonly remove: (node: TreeNode) => void;
  readonly toggleExecutable: (file: FileDraft) => void;
  readonly download: (file: FileDraft) => void;
  readonly replace: (file: FileDraft) => void;
}

const hasFiles = (event: DragEvent): boolean =>
  [...event.dataTransfer.types].includes('Files');

/** Where dropped files go: highlighted while files are dragged over it. */
function useDropTarget(
  folder: string,
  actions: FileTreeActions | null,
): {
  readonly over: boolean;
  readonly props: {
    onDragOver?: (event: DragEvent) => void;
    onDragLeave?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent) => void;
  };
} {
  const [over, setOver] = useState(false);
  if (!actions) return { over: false, props: {} };
  return {
    over,
    props: {
      onDragOver: (event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      },
      onDragLeave: (event) => {
        event.stopPropagation();
        setOver(false);
      },
      onDrop: (event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        const files = [...event.dataTransfer.files];
        if (files.length > 0) actions.upload(folder, files);
      },
    },
  };
}

export function FileTree({
  draft,
  selected,
  onSelect,
  actions,
  skillProblems,
}: {
  readonly draft: SkillDraft;
  readonly selected: string;
  readonly onSelect: (path: string) => void;
  /** While editing. */
  readonly actions: FileTreeActions | null;
  /** SKILL.md has front matter problems. */
  readonly skillProblems: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const root = useDropTarget('', actions);
  const toggle = (path: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  return (
    <TooltipProvider>
      <nav
        aria-label={t('skills.tree.label')}
        className={cn(
          'flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-2',
          root.over && 'bg-accent',
        )}
        data-testid='skill-tree'
        {...root.props}
      >
        <div className='flex items-center justify-between gap-2 pl-2'>
          <span className='text-sm font-medium'>{t('skills.files')}</span>
          {actions ? (
            <div className='flex gap-1'>
              <ToolbarButton
                label={t('skills.tree.newFile')}
                onClick={() => actions.newFile('')}
              >
                <FilePlusIcon />
              </ToolbarButton>
              <ToolbarButton
                label={t('skills.tree.newFolder')}
                onClick={() => actions.newFolder('')}
              >
                <FolderPlusIcon />
              </ToolbarButton>
              <ToolbarButton
                label={t('skills.tree.upload')}
                onClick={() => actions.upload('')}
              >
                <UploadIcon />
              </ToolbarButton>
            </div>
          ) : null}
        </div>
        <ul className='flex flex-col'>
          <li>
            <Row
              selected={selected === SKILL_MD}
              onClick={() => onSelect(SKILL_MD)}
              icon={<FileTextIcon />}
              label={SKILL_MD}
              trailing={
                skillProblems ? (
                  <AlertCircleIcon
                    className='size-4 text-destructive'
                    aria-label={t('skills.frontMatter.title')}
                  />
                ) : null
              }
            />
          </li>
          {treeOf(draft).map((node) => (
            <Node
              key={node.path}
              node={node}
              selected={selected}
              collapsed={collapsed}
              onToggle={toggle}
              onSelect={onSelect}
              actions={actions}
            />
          ))}
        </ul>
        {actions ? (
          <p className='px-2 text-xs text-muted-foreground'>
            {t('skills.tree.dropHint')}
          </p>
        ) : null}
      </nav>
    </TooltipProvider>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactElement;
}): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Row({
  selected,
  onClick,
  icon,
  label,
  trailing,
  menu,
  over = false,
  expanded,
  dropProps,
}: {
  readonly selected: boolean;
  readonly onClick: () => void;
  readonly icon: ReactElement;
  readonly label: string;
  readonly trailing?: ReactElement | null;
  readonly menu?: ReactElement | null;
  readonly over?: boolean;
  /** A folder's state. */
  readonly expanded?: boolean;
  readonly dropProps?: ReturnType<typeof useDropTarget>['props'];
}): ReactElement {
  return (
    <div
      className={cn(
        'group/row flex items-center gap-1 rounded-md pr-1 text-sm hover:bg-accent',
        selected && 'bg-accent font-medium',
        over && 'bg-accent ring-1 ring-ring',
      )}
      {...dropProps}
    >
      <button
        type='button'
        className='flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground'
        aria-current={selected ? 'true' : undefined}
        aria-expanded={expanded}
        onClick={onClick}
      >
        {expanded === undefined ? null : (
          <ChevronRightIcon
            className={cn('transition-transform', expanded && 'rotate-90')}
          />
        )}
        {icon}
        <span className='truncate font-mono text-xs' title={label}>
          {label}
        </span>
      </button>
      {trailing}
      {menu ? (
        <span className='opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 pointer-coarse:opacity-100'>
          {menu}
        </span>
      ) : null}
    </div>
  );
}

function Node({
  node,
  selected,
  collapsed,
  onToggle,
  onSelect,
  actions,
}: {
  readonly node: TreeNode;
  readonly selected: string;
  readonly collapsed: ReadonlySet<string>;
  readonly onToggle: (path: string) => void;
  readonly onSelect: (path: string) => void;
  readonly actions: FileTreeActions | null;
}): ReactElement {
  const { t } = useTranslation();
  const drop = useDropTarget(
    node.path,
    node.kind === 'folder' ? actions : null,
  );
  if (node.kind === 'folder') {
    const open = !collapsed.has(node.path);
    return (
      <li>
        <Row
          selected={false}
          expanded={open}
          over={drop.over}
          dropProps={drop.props}
          onClick={() => onToggle(node.path)}
          icon={open ? <FolderOpenIcon /> : <FolderIcon />}
          label={node.name}
          menu={
            actions ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      aria-label={t('skills.tree.actionsFor', {
                        name: node.path,
                      })}
                    />
                  }
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-auto min-w-40'>
                  <DropdownMenuItem onClick={() => actions.newFile(node.path)}>
                    <FilePlusIcon />
                    {t('skills.tree.newFile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => actions.newFolder(node.path)}
                  >
                    <FolderPlusIcon />
                    {t('skills.tree.newFolder')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.upload(node.path)}>
                    <UploadIcon />
                    {t('skills.tree.upload')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.rename(node)}>
                    {t('skills.tree.rename')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() => actions.remove(node)}
                  >
                    {t('skills.tree.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null
          }
        />
        {open && node.children.length > 0 ? (
          <ul className='ml-4 flex flex-col border-l pl-1'>
            {node.children.map((child) => (
              <Node
                key={child.path}
                node={child}
                selected={selected}
                collapsed={collapsed}
                onToggle={onToggle}
                onSelect={onSelect}
                actions={actions}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }
  const file = node.file!;
  return (
    <li>
      <Row
        selected={selected === node.path}
        onClick={() => onSelect(node.path)}
        icon={file.kind === 'text' ? <FileTextIcon /> : <FileIcon />}
        label={node.name}
        trailing={
          isScript(file) ? (
            <Badge variant='secondary' data-testid='skill-script-badge'>
              {t('skills.scriptBadge')}
            </Badge>
          ) : null
        }
        menu={
          actions ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('skills.tree.actionsFor', {
                      name: node.path,
                    })}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-auto min-w-40'>
                <DropdownMenuItem onClick={() => actions.rename(node)}>
                  {t('skills.tree.rename')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.toggleExecutable(file)}
                >
                  {file.executable
                    ? t('skills.tree.unmarkExecutable')
                    : t('skills.tree.markExecutable')}
                </DropdownMenuItem>
                {file.kind === 'binary' ? (
                  <DropdownMenuItem onClick={() => actions.replace(file)}>
                    {t('skills.tree.replace')}
                  </DropdownMenuItem>
                ) : null}
                {file.kind === 'binary' && file.savedPath ? (
                  <DropdownMenuItem onClick={() => actions.download(file)}>
                    {t('skills.tree.download')}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => actions.remove(node)}
                >
                  {t('skills.tree.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      />
    </li>
  );
}
