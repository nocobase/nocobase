import { useCan } from '@nocobase/app-plugin-authorization/client';
import {
  ConfirmDialog,
  PermissionsPage,
  titleText,
} from '@nocobase/app-plugin-authorization/client/management';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Info,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import { NavLink, Outlet, useParams } from 'react-router';

import { TitleDialog } from '../../../components/title-dialog.js';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../components/ui/alert.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Card } from '../../../components/ui/card.js';
import { Input } from '../../../components/ui/input.js';
import { DEPARTMENTS_SETTINGS, PACKAGE_NAME } from '../../../constants.js';
import { cn } from 'cn';
import {
  errorKey,
  useDepartmentsApi,
  type Department,
  type DepartmentsOutletContext,
} from './api.js';

interface TreeNode {
  readonly department: Department;
  readonly children: TreeNode[];
}

function buildTree(departments: readonly Department[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>(
    departments.map((department) => [
      department.id,
      { department, children: [] },
    ]),
  );
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parent =
      node.department.parentId === null
        ? undefined
        : nodes.get(node.department.parentId);
    // A parent that no longer resolves leaves the department at the top level rather than hiding it.
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** The nodes that match, with the ancestors that lead to them. */
function filterTree(
  nodes: readonly TreeNode[],
  matches: (department: Department) => boolean,
): TreeNode[] {
  return nodes.flatMap((node) => {
    const children = filterTree(node.children, matches);
    return matches(node.department) || children.length
      ? [{ department: node.department, children }]
      : [];
  });
}

/** The dialog the tree has open, if any. */
type Editing =
  | { readonly kind: 'create'; readonly parent?: Department }
  | { readonly kind: 'rename'; readonly department: Department }
  | { readonly kind: 'disable'; readonly department: Department };

export function ExampleNotice(): ReactElement {
  const { t } = useTranslation();
  return (
    <Alert className='border-primary/20 bg-primary/5'>
      <Info className='text-primary' />
      <AlertTitle>{t('notice.title')}</AlertTitle>
      <AlertDescription>
        <p>{t('notice.body', { packageName: PACKAGE_NAME })}</p>
        <p>{t('notice.skill')}</p>
      </AlertDescription>
    </Alert>
  );
}

function TreeRows({
  nodes,
  depth,
  selectedId,
  canUpdate,
  busy,
  onEdit,
  onEnable,
}: {
  nodes: readonly TreeNode[];
  depth: number;
  selectedId: string | undefined;
  canUpdate: boolean;
  busy: boolean;
  onEdit: (editing: Editing) => void;
  onEnable: (department: Department) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <ul className='space-y-0.5'>
      {nodes.map(({ department, children }) => {
        const title = titleText(department.title, t, department.id);
        return (
          <li key={department.id}>
            <div
              className={cn(
                'group flex items-center gap-1 rounded-md pr-1 hover:bg-muted',
                department.id === selectedId &&
                  'bg-primary/10 text-primary hover:bg-primary/10',
              )}
              style={{ paddingLeft: `${depth * 1}rem` }}
            >
              <NavLink
                to={encodeURIComponent(department.id)}
                className={cn(
                  'min-w-0 flex-1 truncate px-2 py-1.5 text-sm',
                  department.id === selectedId && 'font-medium',
                  !department.active && 'text-muted-foreground line-through',
                )}
              >
                {title}
              </NavLink>
              {!department.active ? (
                <Badge className='shrink-0 bg-muted text-muted-foreground'>
                  {t('tree.disabled')}
                </Badge>
              ) : null}
              {canUpdate ? (
                <div className='flex shrink-0 items-center opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    aria-label={t('tree.addChild', { title })}
                    title={t('tree.addChild', { title })}
                    disabled={busy}
                    onClick={() =>
                      onEdit({ kind: 'create', parent: department })
                    }
                  >
                    <Plus />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    aria-label={t('tree.rename', { title })}
                    title={t('tree.rename', { title })}
                    disabled={busy}
                    onClick={() => onEdit({ kind: 'rename', department })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    aria-label={t(
                      department.active ? 'tree.disable' : 'tree.enable',
                      { title },
                    )}
                    title={t(
                      department.active ? 'tree.disable' : 'tree.enable',
                      { title },
                    )}
                    disabled={busy}
                    onClick={() =>
                      department.active
                        ? onEdit({ kind: 'disable', department })
                        : onEnable(department)
                    }
                  >
                    {department.active ? <PowerOff /> : <Power />}
                  </Button>
                </div>
              ) : null}
            </div>
            {children.length ? (
              <TreeRows
                nodes={children}
                depth={depth + 1}
                selectedId={selectedId}
                canUpdate={canUpdate}
                busy={busy}
                onEdit={onEdit}
                onEnable={onEnable}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Settings → Departments: the searchable tree on the left, the selected department's details on the right. */
export default function DepartmentsPage(): ReactElement {
  const { t } = useTranslation();
  const api = useDepartmentsApi();
  const { departmentId } = useParams();
  const { can: canUpdate } = useCan({
    resource: { type: 'settings', id: DEPARTMENTS_SETTINGS },
    action: 'update',
  });
  const [reloadCount, setReloadCount] = useState(0);
  // Each result is stored with the request that produced it, so a stale response never replaces a newer one.
  const [result, setResult] = useState<{
    readonly key: number;
    readonly departments?: readonly Department[];
    readonly error?: unknown;
  }>();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Editing>();
  const [busy, setBusy] = useState(false);
  const [writeError, setWriteError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    const key = reloadCount;
    api.listDepartments(controller.signal).then(
      (departments) => {
        if (!controller.signal.aborted) setResult({ key, departments });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error });
      },
    );
    return () => controller.abort();
  }, [api, reloadCount]);

  const loading = result?.key !== reloadCount;
  const error = loading ? undefined : result?.error;
  // During a reload the last successful tree stays on screen.
  const departments = result?.departments;
  const reload = useCallback((): void => {
    setReloadCount((count) => count + 1);
  }, []);

  const query = search.trim().toLowerCase();
  const tree = useMemo(() => {
    const all = buildTree(departments ?? []);
    return query
      ? filterTree(all, (department) =>
          titleText(department.title, t, department.id)
            .toLowerCase()
            .includes(query),
        )
      : all;
  }, [departments, query, t]);

  async function write(action: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    setWriteError(undefined);
    try {
      await action();
      reload();
      return true;
    } catch (cause) {
      setWriteError(t(errorKey(cause)));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitTitle(value: string): Promise<void> {
    if (!editing || editing.kind === 'disable') return;
    const done = await write(() =>
      editing.kind === 'create'
        ? api.createDepartment({
            title: value,
            ...(editing.parent ? { parentId: editing.parent.id } : {}),
          })
        : api.updateDepartment(editing.department.id, { title: value }),
    );
    if (done) setEditing(undefined);
  }

  const context: DepartmentsOutletContext = {
    departments: departments ?? [],
    canUpdate,
    reload,
  };
  const forbidden = errorKey(error) === 'errors.FORBIDDEN';

  return (
    <PermissionsPage
      title={t('departments')}
      description={t('page.description')}
    >
      <ExampleNotice />
      {error && !departments ? (
        <Card className='grid min-h-64 place-items-center p-6 text-center'>
          <div role='alert' className='space-y-3'>
            <p className='text-sm text-muted-foreground'>
              {t(forbidden ? 'page.forbidden' : 'page.failed')}
            </p>
            {forbidden ? null : (
              <Button variant='outline' onClick={reload}>
                {t('page.retry')}
              </Button>
            )}
          </div>
        </Card>
      ) : !departments ? (
        <Card className='grid min-h-64 place-items-center'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <LoaderCircle className='size-4 animate-spin' />
            {t('page.loading')}
          </div>
        </Card>
      ) : (
        <div className='flex min-h-[32rem] flex-col gap-3 lg:flex-row'>
          <aside className='flex shrink-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground lg:w-72'>
            <div className='flex shrink-0 items-center gap-1 border-b p-2'>
              <div className='relative min-w-0 flex-1'>
                <Search className='pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground' />
                <Input
                  className='pl-8'
                  aria-label={t('tree.search')}
                  placeholder={t('tree.search')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              {canUpdate ? (
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={t('tree.addRoot')}
                  title={t('tree.addRoot')}
                  disabled={busy}
                  onClick={() => setEditing({ kind: 'create' })}
                >
                  <Plus />
                </Button>
              ) : null}
            </div>
            <nav
              aria-label={t('tree.label')}
              className='min-h-0 flex-1 overflow-y-auto p-2'
            >
              {tree.length ? (
                <TreeRows
                  nodes={tree}
                  depth={0}
                  selectedId={departmentId}
                  canUpdate={canUpdate}
                  busy={busy}
                  onEdit={(next) => {
                    setWriteError(undefined);
                    setEditing(next);
                  }}
                  onEnable={(department) =>
                    void write(() => api.setActive(department.id, true))
                  }
                />
              ) : (
                <p className='px-2 py-6 text-center text-sm text-muted-foreground'>
                  {t(query ? 'tree.noMatch' : 'tree.empty')}
                </p>
              )}
            </nav>
            {writeError && !editing ? (
              <p role='alert' className='border-t p-3 text-sm text-destructive'>
                {writeError}
              </p>
            ) : null}
          </aside>
          <section className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground'>
            {departmentId ? (
              <Outlet context={context} />
            ) : (
              <p className='p-6 text-sm text-muted-foreground'>
                {t('details.choose')}
              </p>
            )}
          </section>
        </div>
      )}
      {editing && editing.kind !== 'disable' ? (
        <TitleDialog
          title={
            editing.kind === 'rename'
              ? t('dialog.renameTitle')
              : editing.parent
                ? t('dialog.createChildTitle', {
                    title: titleText(editing.parent.title, t),
                  })
                : t('dialog.createTitle')
          }
          initialValue={
            editing.kind === 'rename'
              ? titleText(editing.department.title, t)
              : ''
          }
          submitLabel={t(
            editing.kind === 'rename' ? 'dialog.save' : 'dialog.create',
          )}
          busy={busy}
          {...(writeError ? { error: writeError } : {})}
          onSubmit={(value) => void submitTitle(value)}
          onCancel={() => setEditing(undefined)}
        />
      ) : null}
      <ConfirmDialog
        open={editing?.kind === 'disable'}
        busy={busy}
        title={t('dialog.disableTitle')}
        confirmLabel={t('dialog.disable')}
        cancelLabel={t('dialog.cancel')}
        onCancel={() => setEditing(undefined)}
        onConfirm={() => {
          if (editing?.kind !== 'disable') return;
          const { id } = editing.department;
          setEditing(undefined);
          void write(() => api.setActive(id, false));
        }}
      >
        {editing?.kind === 'disable'
          ? t('dialog.disableBody', {
              title: titleText(editing.department.title, t),
            })
          : null}
      </ConfirmDialog>
    </PermissionsPage>
  );
}
