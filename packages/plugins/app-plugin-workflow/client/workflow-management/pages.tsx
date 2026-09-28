import { ChevronDownIcon } from 'lucide-react';
import { Button as BaseButton } from '@base-ui/react/button';
import { Input } from './ui/input.js';
import { definition } from './record-definition.js';
import { WorkflowComparisonDialog } from './version-comparison.js';
import { Button } from './ui/button.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToaster } from '@nocobase/app-client';
import type { Translator } from '@nocobase/i18n';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useResolvedPath,
  matchPath,
  useNavigate,
  useParams,
  useOutlet,
} from 'react-router';
import { Switch } from './ui/switch.js';
import { Badge } from './ui/badge.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import {
  buildExecutionOverlay,
  projectWorkflowGraph,
} from '@nocobase/app-plugin-workflow/client';
import { createWorkflowEventKey, workflowApi } from './data.js';
import { WorkflowInputDialog, WorkflowRunResultDialog } from './inspector.js';
import type {
  WorkflowDetailRecord,
  WorkflowListRecord,
  WorkflowNodeRunRecord,
  WorkflowRunRecord,
} from './types.js';
import { WorkflowCanvas } from './workflow-canvas.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.js';
import { WORKFLOW_SETTING_PATHS } from '../route-contracts.js';
import { WORKFLOW_NS } from '../namespace.js';
import './workflow-canvas.css';
import { ArrowLeft, Maximize2, Minimize2, Search } from 'lucide-react';

function workflowPath(workflowId: string): string {
  return `${WORKFLOW_SETTING_PATHS.workflows}/${encodeURIComponent(workflowId)}`;
}

function workflowRunPath(runId: string): string {
  return `${WORKFLOW_SETTING_PATHS.workflowRuns}/${encodeURIComponent(runId)}`;
}

function WorkflowBackButton(): React.ReactElement {
  const navigate = useNavigate();
  const { t } = useTranslation(WORKFLOW_NS);
  return (
    <BaseButton
      className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
      onClick={() => void navigate(-1)}
    >
      <ArrowLeft aria-hidden='true' className='size-4' />
      {t('common.back')}
    </BaseButton>
  );
}

function WorkflowTabs(): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  return (
    <nav
      aria-label={t('nav.workflows')}
      className='flex gap-1 overflow-x-auto border-b border-border'
    >
      {(['workflows', 'runs'] as const).map((module) => (
        <NavLink
          key={module}
          end
          to={`${WORKFLOW_SETTING_PATHS.root}/${module}`}
          className={({ isActive }) =>
            `shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`
          }
        >
          {t(module === 'workflows' ? 'nav.flow' : 'nav.runs')}
        </NavLink>
      ))}
    </nav>
  );
}

export function WorkflowManagementPage(): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const location = useLocation();
  const parent = useResolvedPath('.');
  const isParent = matchPath(
    { path: parent.pathname, end: true },
    location.pathname,
  );
  // Existing detail URLs are covering child pages, not tab panels.
  const isDetail =
    !isParent &&
    !['workflows', 'runs'].some((module) =>
      matchPath(
        { path: `${parent.pathname}/${module}`, end: true },
        location.pathname,
      ),
    );
  if (isDetail) return <Outlet />;
  return (
    <PageContainer className='workflow-page'>
      <PageHeader title={t('workflows.title')} />
      <WorkflowTabs />
      {isParent ? (
        <Navigate replace to={`workflows${location.search}`} />
      ) : (
        <Outlet />
      )}
    </PageContainer>
  );
}

function statusLabel(status: number | null, t: Translator): string {
  return status == null
    ? t('status.queued')
    : status === 0
      ? t('status.running')
      : status === 1
        ? t('status.resolved')
        : status === -1
          ? t('status.failed')
          : status === -2
            ? t('status.error')
            : status === -3
              ? t('status.aborted')
              : t('status.unknown');
}

function statusTone(status: number | null): string {
  return status == null
    ? 'queued'
    : status === 0
      ? 'running'
      : status === 1
        ? 'resolved'
        : status === -1
          ? 'failed'
          : status === -2
            ? 'error'
            : status === -3
              ? 'aborted'
              : 'unknown';
}

function WorkflowRunStatusTag({
  status,
}: {
  status: number | null;
}): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  return (
    <Badge className={`workflow-run-status-tag ${statusTone(status)}`}>
      {statusLabel(status, t)}
    </Badge>
  );
}
function WorkflowStatusSwitch({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}): React.ReactElement {
  return (
    <Switch
      aria-label={label}
      checked={checked}
      onCheckedChange={onCheckedChange}
      size='default'
    />
  );
}

function CanvasFullscreenButton({
  cardRef,
}: {
  cardRef: React.RefObject<HTMLElement | null>;
}): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    if (!fullscreen) return;
    const card = cardRef.current;
    const previousOverflow = document.body.style.overflow;
    card?.classList.add('workflow-canvas-fullscreen');
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        setFullscreen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      card?.classList.remove('workflow-canvas-fullscreen');
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [cardRef, fullscreen]);
  return (
    <button
      className='canvas-header-action-button'
      type='button'
      aria-label={t(fullscreen ? 'canvas.exitFullscreen' : 'canvas.fullscreen')}
      title={t(fullscreen ? 'canvas.exitFullscreen' : 'canvas.fullscreen')}
      aria-pressed={fullscreen}
      onClick={() => setFullscreen((value) => !value)}
    >
      {fullscreen ? (
        <Minimize2 aria-hidden='true' />
      ) : (
        <Maximize2 aria-hidden='true' />
      )}
    </button>
  );
}

function WorkflowPagination({
  pagination,
  onPageChange,
}: {
  pagination: { page: number; pageSize: number; total: number };
  onPageChange: (page: number) => void;
}): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const pageCount = Math.ceil(pagination.total / pagination.pageSize);
  return (
    <nav className='workflow-pagination' aria-label={t('pagination.label')}>
      <span>
        {t('pagination.page', { page: pagination.page, total: pageCount })}
      </span>
      <div>
        <button
          type='button'
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          {t('pagination.previous')}
        </button>
        <button
          type='button'
          disabled={pagination.page >= pageCount}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          {t('pagination.next')}
        </button>
      </div>
    </nav>
  );
}

function formatTime(value?: string | null, locale?: string): string {
  return value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';
}
function formatTriggeredTime(value?: string | null, locale?: string): string {
  return value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(new Date(value))
    : '—';
}
function duration(run: WorkflowRunRecord): string {
  const start = run.startedAt ?? run.createdAt;
  if (!start) return '—';
  const elapsed = Math.max(
    0,
    (run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now()) -
      new Date(start).getTime(),
  );
  return elapsed < 1000 ? `${elapsed} ms` : `${(elapsed / 1000).toFixed(1)} s`;
}
function contextProperties(
  schema: object,
): Record<
  string,
  { type?: string; title?: string; description?: string; default?: unknown }
> {
  const candidate = schema as {
    properties?: Record<
      string,
      { type?: string; title?: string; description?: string; default?: unknown }
    >;
  };
  return candidate.properties ?? {};
}
function displayInputValue(value: unknown, fallback: string): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  )
    return String(value);
  if (typeof value === 'symbol') return value.toString();
  if (value === undefined) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}
function useAsync<T>(load: () => Promise<T>): {
  value: T | null;
  error: string | null;
  reload: () => void;
} {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    load: () => Promise<T>;
    value: T | null;
    error: string | null;
  }>(() => ({ load, value: null, error: null }));
  useEffect(() => {
    let active = true;
    const requestedRevision = revision;
    void load().then(
      (next) =>
        active &&
        requestedRevision === revision &&
        setResult({ load, value: next, error: null }),
      (cause: unknown) =>
        active &&
        setResult({
          load,
          value: null,
          error: cause instanceof Error ? cause.message : String(cause),
        }),
    );
    return () => {
      active = false;
    };
  }, [load, revision]);
  return {
    ...(result.load === load ? result : { value: null, error: null }),
    reload: () => setRevision((current) => current + 1),
  };
}

export function InputDialog({
  workflow,
  onClose,
}: {
  workflow: WorkflowDetailRecord;
  onClose: () => void;
}): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const workflowId = workflow.id ?? workflow.hash;
  if (!workflowId) throw new Error(t('workflows.parametersMissingIdentifier'));
  const [values, setValues] = useState(workflow.parameterValues);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size='md'>
        <DialogHeader>
          <DialogTitle>{t('actions.parameterSettings')}</DialogTitle>
        </DialogHeader>
        <form
          className='workflow-parameter-form'
          onSubmit={(event) => {
            event.preventDefault();
            void workflowApi.parameters(workflowId, values).then(onClose);
          }}
        >
          {Object.entries(workflow.parametersSchema).map(([key, item]) => (
            <label className='workflow-parameter-field' key={key}>
              <span>{item.title ?? key}</span>
              {item.type === 'boolean' ? (
                <Switch
                  checked={
                    Object.hasOwn(values, key)
                      ? values[key] === true
                      : item.default === true
                  }
                  onCheckedChange={(checked) =>
                    setValues((current) => ({ ...current, [key]: checked }))
                  }
                />
              ) : (
                <input
                  placeholder={
                    item.default === undefined
                      ? t('common.notSet')
                      : displayInputValue(
                          item.default,
                          t('inspector.unserializable'),
                        )
                  }
                  value={
                    Object.hasOwn(values, key)
                      ? displayInputValue(
                          values[key],
                          t('inspector.unserializable'),
                        )
                      : ''
                  }
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [key]:
                        item.type === 'number'
                          ? Number(event.target.value)
                          : event.target.value,
                    }))
                  }
                />
              )}
              {item.description ? <small>{item.description}</small> : null}
            </label>
          ))}
          <DialogFooter>
            <button
              className='workflow-button workflow-button-outline'
              type='button'
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
            <button className='workflow-button' type='submit'>
              {t('common.save')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function ManualRunDialog({
  workflow,
  onClose,
  onExecuted,
}: {
  workflow: WorkflowDetailRecord;
  onClose: () => void;
  onExecuted: (run: WorkflowRunRecord) => void;
}): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const toaster = useToaster();
  const [running, setRunning] = useState(false);
  const workflowId = workflow.id ?? workflow.hash;
  if (!workflowId) throw new Error(t('workflows.runMissingIdentifier'));
  const properties = contextProperties(workflow.inputSchema);
  const [values, setValues] = useState<
    Record<string, string | number | boolean | undefined>
  >(() =>
    Object.fromEntries(
      Object.entries(properties)
        .filter(([, item]) => item.default !== undefined)
        .map(([key, item]) => [key, item.default as string | number | boolean]),
    ),
  );
  const run = (): void => {
    if (running) return;
    setRunning(true);
    const input = Object.fromEntries(
      Object.entries(values).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    ) as Record<string, string | number | boolean>;
    void workflowApi
      .execute(workflowId, input, createWorkflowEventKey())
      .then((execution) => {
        onClose();
        onExecuted(execution);
      })
      .catch((cause: unknown) =>
        toaster.show({
          type: 'error',
          title: t('workflows.runFailed'),
          description: cause instanceof Error ? cause.message : String(cause),
        }),
      )
      .finally(() => setRunning(false));
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !running && onClose()}>
      <DialogContent size='md'>
        <DialogHeader>
          <DialogTitle>{t('manualRun.title')}</DialogTitle>
          <DialogDescription>{t('manualRun.description')}</DialogDescription>
        </DialogHeader>
        <form
          className='workflow-parameter-form'
          onSubmit={(event) => {
            event.preventDefault();
            run();
          }}
        >
          {Object.entries(properties).map(([key, item]) =>
            item.type === 'boolean' ? (
              <label className='workflow-checkbox-field' key={key}>
                <input
                  type='checkbox'
                  checked={Boolean(values[key])}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                />
                <span className='workflow-checkbox-copy'>
                  <span>{item.title ?? key}</span>
                  {item.description ? <small>{item.description}</small> : null}
                </span>
              </label>
            ) : (
              <label className='workflow-parameter-field' key={key}>
                <span>{item.title ?? key}</span>
                <input
                  type={
                    item.type === 'number' || item.type === 'integer'
                      ? 'number'
                      : 'text'
                  }
                  placeholder={
                    item.default === undefined
                      ? t('common.notSet')
                      : displayInputValue(
                          item.default,
                          t('inspector.unserializable'),
                        )
                  }
                  value={
                    Object.hasOwn(values, key)
                      ? displayInputValue(
                          values[key],
                          t('inspector.unserializable'),
                        )
                      : ''
                  }
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [key]:
                        item.type === 'number' || item.type === 'integer'
                          ? event.target.value === ''
                            ? undefined
                            : Number(event.target.value)
                          : event.target.value,
                    }))
                  }
                />
                {item.description ? <small>{item.description}</small> : null}
              </label>
            ),
          )}
          <DialogFooter>
            <button
              className='workflow-button workflow-button-outline'
              type='button'
              disabled={running}
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
            <button
              className='workflow-button'
              type='submit'
              disabled={running}
              aria-busy={running}
            >
              {running ? t('common.running') : t('common.run')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function ExecutionDialog({
  runs,
  total,
  onClose,
}: {
  runs: readonly WorkflowRunRecord[];
  total: number;
  onClose: () => void;
}): React.ReactElement {
  const { i18n, t } = useTranslation(WORKFLOW_NS);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='workflow-runs-dialog sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{t('runs.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('common.runCount', { count: total })}
          </DialogDescription>
        </DialogHeader>
        <ul className='workflow-list workflow-runs-dialog-list'>
          {runs.map((run) => (
            <li key={run.id}>
              <Link
                className='execution-item'
                to={workflowRunPath(run.id)}
                onClick={onClose}
              >
                <div>
                  <span className='execution-item-title'>
                    <span className='execution-run-id'>#{run.id}</span>{' '}
                    <span className='execution-workflow-title'>
                      {run.workflowTitle ?? run.workflowKey}
                    </span>
                  </span>
                  <span className='execution-item-time'>
                    {formatTime(
                      run.startedAt ?? run.createdAt,
                      i18n.resolvedLanguage,
                    )}
                  </span>
                </div>
                <div className='execution-item-meta'>
                  <WorkflowRunStatusTag status={run.status} />
                  <span>
                    {t('common.duration', { duration: duration(run) })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export interface NodeDescriptionDialogProps {
  description: string | null;
  title: string;
  onClose: () => void;
}

export function NodeDescriptionDialog({
  description,
  title,
  onClose,
}: NodeDescriptionDialogProps): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size='lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <section className='workflow-node-description-dialog'>
          <h3>{t('common.description')}</h3>
          <p>{description?.trim() || t('workflows.noNodeDescription')}</p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
function WorkflowRow({
  item,
  onChange,
  onReload,
}: {
  item: WorkflowListRecord;
  onChange: (item: WorkflowListRecord) => void;
  onReload: () => void;
}): React.ReactElement | null {
  const { t } = useTranslation(WORKFLOW_NS);
  const navigate = useNavigate();
  const [runs, setRuns] = useState<WorkflowRunRecord[] | null>(null);
  const [settings, setSettings] = useState<WorkflowDetailRecord | null>(null);
  const [manual, setManual] = useState<WorkflowDetailRecord | null>(null);
  const [running, setRunning] = useState(false);
  const toaster = useToaster();
  const identifier = item.id ?? item.hash;
  if (!identifier) return null;
  const pendingArtifact = item.pendingArtifact;
  const execute = (): void => {
    setRunning(true);
    void workflowApi
      .workflow(identifier)
      .then((workflow) => {
        if (Object.keys(contextProperties(workflow.inputSchema)).length > 0) {
          setManual(workflow);
          return undefined;
        }
        return workflowApi
          .execute(identifier, {}, createWorkflowEventKey())
          .then((run) => navigate(workflowRunPath(run.id)));
      })
      .catch((cause: unknown) =>
        toaster.show({
          type: 'error',
          title: t('workflows.runFailed'),
          description: cause instanceof Error ? cause.message : String(cause),
        }),
      )
      .finally(() => setRunning(false));
  };
  return (
    <>
      <TableRow>
        <TableCell>
          <div className='workflow-row-main'>
            <div className='workflow-row-title'>
              <Link
                className='font-medium text-primary underline-offset-4 hover:underline focus-visible:underline'
                to={workflowPath(identifier)}
              >
                {item.title ?? item.key}
              </Link>
              {pendingArtifact ? (
                <Link
                  className='workflow-pending-version-link'
                  to={workflowPath(pendingArtifact.hash)}
                >
                  <Badge className='bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'>
                    {t('workflows.newVersionAvailable')}
                  </Badge>
                </Link>
              ) : null}
            </div>
          </div>
        </TableCell>
        <TableCell className='workflow-table-run-count-cell'>
          {item.executed > 0 ? (
            <button
              type='button'
              className='workflow-execution-link'
              onClick={() =>
                void workflowApi.workflowRuns(identifier).then(setRuns)
              }
            >
              {t('common.runCount', { count: item.executed })}
            </button>
          ) : (
            <span className='workflow-execution-count'>
              {t('common.runCount', { count: 0 })}
            </span>
          )}
        </TableCell>
        <TableCell className='workflow-table-status-cell'>
          <WorkflowStatusSwitch
            checked={item.enabled}
            label={t(
              item.enabled
                ? 'actions.disableWorkflow'
                : 'actions.enableWorkflow',
              { title: item.title ?? item.key },
            )}
            onCheckedChange={(enabled) => {
              const update = enabled
                ? workflowApi.enable(identifier)
                : workflowApi.status(identifier, false);
              void update.then((next) => {
                onChange(next);
                onReload();
              });
            }}
          />
        </TableCell>
        <TableCell className='workflow-table-actions-cell'>
          <div className='workflow-row-actions'>
            {running ? <span role='status'>{t('common.running')}</span> : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    aria-label={t('actions.more')}
                    className='workflow-row-menu-trigger'
                    type='button'
                  >
                    ···
                  </button>
                }
              />
              <DropdownMenuContent
                align='end'
                className='workflow-row-menu-content'
              >
                <DropdownMenuItem
                  disabled={!item.hasParameters}
                  onClick={() =>
                    void workflowApi.workflow(identifier).then(setSettings)
                  }
                >
                  {t('actions.parameterSettings')}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={running} onClick={execute}>
                  {running ? t('common.running') : t('common.run')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      {runs ? (
        <ExecutionDialog
          runs={runs}
          total={item.executed}
          onClose={() => setRuns(null)}
        />
      ) : null}
      {settings ? (
        <InputDialog workflow={settings} onClose={() => setSettings(null)} />
      ) : null}
      {manual ? (
        <ManualRunDialog
          workflow={manual}
          onClose={() => setManual(null)}
          onExecuted={(run) => void navigate(workflowRunPath(run.id))}
        />
      ) : null}
    </>
  );
}

export function WorkflowListPage(): React.ReactElement {
  const detail = useOutlet();
  const { t } = useTranslation(WORKFLOW_NS);
  const [items, setItems] = useState<WorkflowListRecord[] | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [query, setQuery] = useState('');
  const [enabled, setEnabled] = useState('');
  const load = useCallback(
    (nextPage: number): void => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (enabled) params.set('enabled', enabled);
      params.set('page', String(nextPage));
      params.set('pageSize', String(pagination.pageSize));
      void workflowApi.workflowPage(`?${params}`).then((result) => {
        setItems(result.data);
        setPagination(result.meta);
      });
    },
    [enabled, pagination.pageSize, query],
  );
  useEffect(() => load(1), [load]);
  if (detail) return detail;
  return (
    <section className='workflow-list-card'>
      <header className='workflow-list-header'>
        <div className='workflow-filter-bar'>
          <WorkflowSearch
            label={t('filters.searchWorkflowTitle')}
            value={query}
            onChange={setQuery}
          />
          <Select
            items={[
              { value: '', label: t('filters.allStatuses') },
              { value: 'true', label: t('status.enabled') },
              { value: 'false', label: t('status.disabled') },
            ]}
            value={enabled}
            onValueChange={(value) => setEnabled(value ?? '')}
          >
            <SelectTrigger aria-label={t('filters.workflowStatus')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value=''>{t('filters.allStatuses')}</SelectItem>
                <SelectItem value='true'>{t('status.enabled')}</SelectItem>
                <SelectItem value='false'>{t('status.disabled')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <button
          className='workflow-button workflow-button-outline'
          type='button'
          onClick={() => load(pagination.page)}
        >
          {t('common.refresh')}
        </button>
      </header>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tables.workflow')}</TableHead>
            <TableHead>{t('tables.runCount')}</TableHead>
            <TableHead>{t('tables.status')}</TableHead>
            <TableHead>{t('tables.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <WorkflowRow
              key={item.id ?? item.hash ?? item.key}
              item={item}
              onReload={() => load(pagination.page)}
              onChange={(next) =>
                setItems(
                  (current) =>
                    current?.map((candidate) =>
                      candidate.key === next.key ? next : candidate,
                    ) ?? null,
                )
              }
            />
          ))}
          {items?.length === 0 ? (
            <TableRow>
              <TableCell className='workflow-list-empty' colSpan={4}>
                {t('common.noData')}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {pagination.total > pagination.pageSize ? (
        <WorkflowPagination
          pagination={pagination}
          onPageChange={(page) => load(page)}
        />
      ) : null}
    </section>
  );
}

export function WorkflowDetailPage(): React.ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const { id: workflowId = '' } = useParams();
  const navigate = useNavigate();
  const toaster = useToaster();
  const [running, setRunning] = useState(false);
  const loadWorkflow = useCallback(
    () => workflowApi.workflow(workflowId),
    [workflowId],
  );
  const loadRevisions = useCallback(
    () => workflowApi.revisions(workflowId),
    [workflowId],
  );
  const loaded = useAsync(loadWorkflow);
  // Load revisions alongside the definition so navigation and comparison are ready when the menu opens.
  const revisionList = useAsync(loadRevisions);
  const [comparisonTarget, setComparisonTarget] =
    useState<WorkflowDetailRecord | null>(null);
  const [dialog, setDialog] = useState<
    'parameters' | 'manual' | 'compare' | null
  >(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [runs, setRuns] = useState<WorkflowRunRecord[] | null>(null);
  const canvasCardRef = useRef<HTMLElement>(null);
  const workflow = loaded.value;
  const source = useMemo(
    () => (workflow ? definition(workflow) : null),
    [workflow],
  );
  const identifier = workflow?.id ?? workflow?.hash;
  if (!workflow || !source || !identifier)
    return (
      <PageContainer className='workflow-page'>
        <WorkflowBackButton />
        <PageHeader title={workflow?.title ?? t('workflows.title')} />
        <p
          className='text-sm text-muted-foreground'
          role={loaded.error ? 'alert' : 'status'}
        >
          {loaded.error ??
            (workflow && !identifier
              ? t('workflows.missingIdentifier')
              : t('workflows.loading'))}
        </p>
      </PageContainer>
    );
  const enabled = workflow.enabled;
  const pendingArtifact = workflow.pendingArtifact;
  const hasInput =
    Object.keys(contextProperties(workflow.inputSchema)).length > 0;
  const revisions = revisionList.value;
  const selectedNode = workflow.nodes.find(
    (node) => node.key === selectedNodeKey,
  );
  const enableRevision = (target: string): void => {
    void workflowApi.enable(target).then((next) => {
      const nextIdentifier = next.id ?? next.hash ?? identifier;
      if (nextIdentifier === workflowId) {
        loaded.reload();
        revisionList.reload();
        return;
      }
      void navigate(workflowPath(nextIdentifier), { replace: true });
    });
  };
  return (
    <PageContainer className='workflow-page'>
      <WorkflowBackButton />
      <PageHeader
        title={workflow.title ?? workflow.key}
        description={workflow.description || t('workflows.noDescription')}
      />
      <section ref={canvasCardRef} className='workflow-canvas-card'>
        <header className='workflow-canvas-header'>
          <div className='workflow-canvas-header-leading'>
            {running ? <span role='status'>{t('common.running')}</span> : null}
            <div className='flex items-center gap-2'>
              <span>{t('workflows.version')}</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      className='h-8 gap-1.5 py-0 pr-2 pl-2.5'
                      aria-label={t('workflows.version')}
                    />
                  }
                >
                  <span className={workflow.version ? '' : 'italic'}>
                    {workflow.version ?? t('common.unpublished')}
                  </span>
                  <ChevronDownIcon
                    className='size-4 shrink-0 text-muted-foreground'
                    aria-hidden='true'
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='start'
                  side='bottom'
                  className='min-w-64'
                >
                  {(revisions ?? [workflow]).map((item) => {
                    const target = item.id ?? item.hash ?? item.key;
                    const selected = target === identifier;
                    return (
                      <div key={target} className='workflow-version-menu-row'>
                        <DropdownMenuItem
                          className='workflow-version-menu-option'
                          onClick={() => {
                            if (!selected) void navigate(workflowPath(target));
                          }}
                        >
                          <span
                            aria-hidden='true'
                            className='workflow-version-current-marker'
                          >
                            {item.current === true ? '>' : ''}
                          </span>
                          <span className={item.version ? '' : 'italic'}>
                            {item.version ?? t('common.unpublished')}
                          </span>
                        </DropdownMenuItem>
                        {!selected ? (
                          <DropdownMenuItem
                            className='workflow-version-compare-action'
                            aria-label={t('comparison.compareWith', {
                              version: item.version ?? t('common.unpublished'),
                            })}
                            onClick={() => {
                              setComparisonTarget(item);
                              setDialog('compare');
                            }}
                          >
                            {t('comparison.compare')}
                          </DropdownMenuItem>
                        ) : null}
                      </div>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <WorkflowStatusSwitch
              checked={enabled}
              label={t(
                enabled ? 'actions.disableWorkflow' : 'actions.enableWorkflow',
                { title: workflow.title ?? workflow.key },
              )}
              onCheckedChange={(checked) => {
                if (checked) {
                  enableRevision(identifier);
                  return;
                }
                void workflowApi
                  .status(identifier, false)
                  .then(() => loaded.reload());
              }}
            />
            {revisionList.error ? (
              <span role='alert'>
                {revisionList.error}{' '}
                <Button onClick={revisionList.reload}>
                  {t('common.refresh')}
                </Button>
              </span>
            ) : null}
            {pendingArtifact ? (
              <Link
                className='workflow-pending-version-link'
                to={workflowPath(pendingArtifact.hash)}
              >
                <Badge className='bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'>
                  {t('workflows.newVersionAvailable')}
                </Badge>
              </Link>
            ) : null}
          </div>
          <div className='canvas-header-actions'>
            <div className='workflow-execution-summary'>
              {workflow.executed > 0 ? (
                <button
                  type='button'
                  onClick={() =>
                    void workflowApi.workflowRuns(identifier).then(setRuns)
                  }
                >
                  {t('common.runCount', { count: workflow.executed })}
                </button>
              ) : (
                <span>{t('common.runCount', { count: 0 })}</span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    aria-label={t('actions.more')}
                    className='workflow-row-menu-trigger'
                    type='button'
                  >
                    ···
                  </button>
                }
              />
              <DropdownMenuContent
                align='end'
                className='workflow-row-menu-content'
              >
                <DropdownMenuItem
                  disabled={!workflow.hasParameters}
                  onClick={() => setDialog('parameters')}
                >
                  {t('actions.parameterSettings')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={running || (!workflow.id && !workflow.hash)}
                  onClick={() => {
                    if (hasInput) {
                      setDialog('manual');
                      return;
                    }
                    if (running) return;
                    setRunning(true);
                    void workflowApi
                      .execute(identifier, {}, createWorkflowEventKey())
                      .then((run) => navigate(workflowRunPath(run.id)))
                      .catch((cause: unknown) =>
                        toaster.show({
                          type: 'error',
                          title: t('workflows.runFailed'),
                          description:
                            cause instanceof Error
                              ? cause.message
                              : String(cause),
                        }),
                      )
                      .finally(() => setRunning(false));
                  }}
                >
                  {running ? t('common.running') : t('actions.runManually')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CanvasFullscreenButton cardRef={canvasCardRef} />
          </div>
        </header>
        <WorkflowCanvas
          definition={source}
          selectedNodeKey={selectedNodeKey}
          onSelectNode={setSelectedNodeKey}
        />
      </section>
      {selectedNode ? (
        <NodeDescriptionDialog
          title={selectedNode.title ?? selectedNode.key}
          description={selectedNode.description}
          onClose={() => setSelectedNodeKey(null)}
        />
      ) : null}
      {dialog === 'compare' && revisions && comparisonTarget ? (
        <WorkflowComparisonDialog
          key={identifier}
          workflow={workflow}
          target={comparisonTarget}
          revisions={revisions}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'parameters' ? (
        <InputDialog workflow={workflow} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === 'manual' ? (
        <ManualRunDialog
          workflow={workflow}
          onClose={() => setDialog(null)}
          onExecuted={(run) => void navigate(workflowRunPath(run.id))}
        />
      ) : null}
      {runs ? (
        <ExecutionDialog
          runs={runs}
          total={workflow.executed}
          onClose={() => setRuns(null)}
        />
      ) : null}
    </PageContainer>
  );
}

export function WorkflowRunListPage(): React.ReactElement {
  const detail = useOutlet();
  const { i18n, t } = useTranslation(WORKFLOW_NS);
  const [items, setItems] = useState<WorkflowRunRecord[] | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const load = useCallback(
    (nextPage: number): void => {
      const params = new URLSearchParams();
      if (query) params.set('workflowTitle', query);
      if (status) params.set('status', status);
      params.set('page', String(nextPage));
      params.set('pageSize', String(pagination.pageSize));
      void workflowApi.runPage(`?${params}`).then((result) => {
        setItems(result.data);
        setPagination(result.meta);
      });
    },
    [pagination.pageSize, query, status],
  );
  useEffect(() => load(1), [load]);
  if (detail) return detail;
  const content = (
    <section className='workflow-list-card'>
      <header className='workflow-list-header'>
        <div className='workflow-filter-bar'>
          <WorkflowSearch
            label={t('filters.filterWorkflowTitle')}
            value={query}
            onChange={setQuery}
          />
          <Select
            items={[
              { value: '', label: t('filters.allStatuses') },
              { value: '0', label: t('status.running') },
              { value: '1', label: t('status.resolved') },
              { value: '-1', label: t('status.failed') },
              { value: '-2', label: t('status.error') },
            ]}
            value={status}
            onValueChange={(value) => setStatus(value ?? '')}
          >
            <SelectTrigger aria-label={t('filters.runStatus')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value=''>{t('filters.allStatuses')}</SelectItem>
                <SelectItem value='0'>{t('status.running')}</SelectItem>
                <SelectItem value='1'>{t('status.resolved')}</SelectItem>
                <SelectItem value='-1'>{t('status.failed')}</SelectItem>
                <SelectItem value='-2'>{t('status.error')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <button
          className='workflow-button workflow-button-outline'
          type='button'
          onClick={() => load(pagination.page)}
        >
          {t('common.refresh')}
        </button>
      </header>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tables.workflow')}</TableHead>
            <TableHead>{t('tables.status')}</TableHead>
            <TableHead>{t('tables.triggeredAt')}</TableHead>
            <TableHead>{t('tables.duration')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((run) => (
            <TableRow key={run.id}>
              <TableCell>
                <Link
                  className='execution-item-title'
                  to={workflowRunPath(run.id)}
                >
                  <span className='execution-run-id'>#{run.id}</span>{' '}
                  <span className='execution-workflow-title'>
                    {run.workflowTitle ?? run.workflowKey}
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                <WorkflowRunStatusTag status={run.status} />
              </TableCell>
              <TableCell className='execution-item-time'>
                {formatTime(
                  run.startedAt ?? run.createdAt,
                  i18n.resolvedLanguage,
                )}
              </TableCell>
              <TableCell>
                <div className='execution-item-meta'>{duration(run)}</div>
              </TableCell>
            </TableRow>
          ))}
          {items?.length === 0 ? (
            <TableRow>
              <TableCell className='workflow-list-empty' colSpan={4}>
                {t('common.noData')}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {pagination.total > pagination.pageSize ? (
        <WorkflowPagination
          pagination={pagination}
          onPageChange={(page) => load(page)}
        />
      ) : null}
    </section>
  );
  return content;
}

export function WorkflowRunDetailPage(): React.ReactElement {
  const { i18n, t } = useTranslation(WORKFLOW_NS);
  const { id: runId = '' } = useParams();
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [nodeRun, setNodeRun] = useState<WorkflowNodeRunRecord | null>(null);
  const [inputOpen, setInputOpen] = useState(false);
  const loadRun = useCallback(() => workflowApi.run(runId), [runId]);
  const state = useAsync(loadRun);
  const run = state.value;
  const workflowId = run?.workflowId;
  const loadWorkflow = useCallback(
    () =>
      workflowId
        ? workflowApi.workflow(workflowId)
        : Promise.reject(new Error(t('workflows.loading'))),
    [t, workflowId],
  );
  const workflow = useAsync(loadWorkflow);
  const canvasCardRef = useRef<HTMLElement>(null);
  const source = useMemo(
    () => (workflow.value ? definition(workflow.value) : null),
    [workflow.value],
  );
  if (!run || !workflow.value || !source)
    return (
      <PageContainer className='workflow-page'>
        <WorkflowBackButton />
        <PageHeader
          title={run?.workflowTitle ?? run?.workflowKey ?? t('nav.runs')}
        />
        <p
          className='text-sm text-muted-foreground'
          role={state.error || (run && workflow.error) ? 'alert' : 'status'}
        >
          {state.error ?? (run ? workflow.error : null) ?? t('runs.loading')}
        </p>
      </PageContainer>
    );
  const nodes = run.nodeRuns ?? [];
  const graph = projectWorkflowGraph(source);
  const selectedNode = workflow.value.nodes.find(
    (item) => item.key === (nodeRun?.nodeKey ?? selectedNodeKey),
  );
  const title = selectedNode?.title ?? selectedNode?.key ?? nodeRun?.nodeKey;
  const description = selectedNode?.description ?? null;
  return (
    <PageContainer className='workflow-page'>
      <WorkflowBackButton />
      <PageHeader
        title={
          <Link
            className='hover:underline underline-offset-4 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
            to={workflowPath(run.workflowId)}
          >
            {run.workflowTitle ?? run.workflowKey}
          </Link>
        }
        description={`${t('workflows.version')}: ${run.workflowVersion ?? t('common.unpublished')}`}
      />
      <section ref={canvasCardRef} className='workflow-canvas-card'>
        <header className='workflow-canvas-header workflow-run-detail-header'>
          <span className='workflow-run-triggered-at'>
            {t('runs.triggeredAt', {
              time: formatTriggeredTime(
                run.createdAt ?? run.startedAt,
                i18n.resolvedLanguage,
              ),
            })}
          </span>
          <div className='workflow-run-detail-meta'>
            <WorkflowRunStatusTag status={run.status} />
            <span>{t('common.duration', { duration: duration(run) })}</span>
            <CanvasFullscreenButton cardRef={canvasCardRef} />
          </div>
        </header>
        <WorkflowCanvas
          definition={source}
          overlay={buildExecutionOverlay(graph, run.id, run.status, nodes)}
          nodeRuns={nodes}
          selectedNodeKey={selectedNodeKey}
          onSelectNode={(key) => {
            setSelectedNodeKey(key);
            setNodeRun(null);
          }}
          onViewNodeRun={setNodeRun}
          onViewStartInput={() => setInputOpen(true)}
        />
      </section>
      {nodeRun || selectedNode ? (
        <WorkflowRunResultDialog
          runId={run.id}
          nodeRun={nodeRun}
          nodeTitle={title}
          nodeDescription={description}
          onClose={() => {
            setNodeRun(null);
            setSelectedNodeKey(null);
          }}
        />
      ) : null}
      {inputOpen ? (
        <WorkflowInputDialog
          input={run.input}
          onClose={() => setInputOpen(false)}
        />
      ) : null}
    </PageContainer>
  );
}

function WorkflowSearch({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <label className='workflow-search-field'>
      <Search
        aria-hidden='true'
        className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'
      />
      <Input
        className='pl-9'
        type='search'
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
