/**
 * Settings › API keys: the organization's keys, for CI, scripts and other systems. One row per key; a key belongs to
 * no person and acts under its own name with an "API key" tag. One form makes one: a name, a description, the
 * permissions (a preset such as "CI deploy", then each group's level and records) and an expiry, and answers the
 * secret once. Rotating keeps the key — its name, permissions and history — and changes only the secret. Seeing the
 * keys takes `studio.apiKeys` `read`; everything else `manage`. A level the viewer does not hold is greyed out.
 */
import type {
  KeyScopeInput,
  KeyScopeOptions,
} from '@nocobase/app-plugin-api-keys/shared/scopes';
import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import {
  DataTable,
  PmApiKeyTag,
  PmListSkeleton,
  PmLoadError,
  PmTag,
  SettingsPageHeader,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  HistoryIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  RotateCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useMemo, useState } from 'react';
import { Link } from 'react-router';

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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { CreatedOrgApiKey, OrgApiKey } from '../../../shared/access.js';
import { keyQueryKeys, useOrgKeysApi } from '../../access/keys-api.js';
import { useNotify } from '../../access/notify.js';
import {
  draftProblem,
  emptyDraft,
  expiryChoices,
  formatDate,
  requestOf,
  scopeLines,
  type ExpiryChoice,
  type GroupDraft,
  type KeyDraft,
} from './key-scope-model.js';
import { SecretDialog } from './keys-panel.js';
import { ScopeEditor } from './scope-editor.js';

/** A stored scope as the editor's draft groups. */
function draftGroups(scope: KeyScopeInput | null): Record<string, GroupDraft> {
  return Object.fromEntries(
    Object.entries(scope?.groups ?? {}).map(([id, grant]) => [
      id,
      {
        level: grant.level,
        objects:
          grant.objects === undefined || grant.objects === 'all'
            ? 'all'
            : grant.objects,
      },
    ]),
  );
}

/** The scope a draft sends: always scoped, as an organization's key is. */
function scopeOf(draft: KeyDraft): KeyScopeInput {
  return requestOf({ ...draft, mode: 'scoped' }).scope!;
}

/** The locale key of a failed key write, by the server's error reason. */
function errorKey(reason: string | undefined): string | undefined {
  switch (reason) {
    case 'KEY_SCOPE_EXCEEDS_YOURS':
      return 'orgKeys.errors.exceeds';
    case 'UNKNOWN_SCOPE_OBJECT':
      return 'orgKeys.errors.objects';
    default:
      return undefined;
  }
}

/** Toasts a failed key write: refusals that say why in words of their own, anything else as usual. */
function useKeyError(): (error: unknown, fallback: string) => void {
  const { t } = useTranslation();
  const notify = useNotify();
  const toaster = useToaster();
  return (error, fallback) => {
    const key =
      error instanceof ApiClientError ? errorKey(error.reason) : undefined;
    if (key) void toaster.show({ type: 'error', title: t(key) });
    else notify.error(error, fallback);
  };
}

/** Creating a key: one form, one key, the secret once. */
function CreateOrgKeyDialog({
  open,
  options,
  onClose,
  onCreated,
}: {
  readonly open: boolean;
  readonly options: KeyScopeOptions;
  readonly onClose: () => void;
  readonly onCreated: (created: CreatedOrgApiKey) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useOrgKeysApi();
  const fail = useKeyError();
  const [draft, setDraft] = useState<KeyDraft>(() =>
    emptyDraft(options, 'scoped'),
  );
  const reset = () => setDraft(emptyDraft(options, 'scoped'));
  const create = useMutation({
    mutationFn: () => {
      const request = requestOf(draft);
      return api.create({ ...request, scope: scopeOf(draft) });
    },
    onSuccess: (created) => {
      reset();
      onCreated(created);
    },
    onError: (error) => fail(error, t('orgKeys.createFailed')),
  });
  const problem = draftProblem(draft);
  const expiryItems = expiryChoices(options, true).map((choice) => ({
    value: choice,
    label:
      choice === 'never'
        ? t('keys.expiry.never')
        : t('keys.expiry.days', { count: Number(choice) }),
  }));

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (!problem) create.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <form onSubmit={submit} className='contents'>
          <DialogHeader>
            <DialogTitle>{t('orgKeys.createTitle')}</DialogTitle>
            <DialogDescription>
              {t('orgKeys.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='-mx-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-1'>
            <Field>
              <FieldLabel htmlFor='studio-org-key-name'>
                {t('keys.name')}
              </FieldLabel>
              <Input
                id='studio-org-key-name'
                value={draft.name}
                maxLength={100}
                autoFocus
                placeholder={t('orgKeys.namePlaceholder')}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='studio-org-key-description'>
                {t('keys.description')}
              </FieldLabel>
              <Textarea
                id='studio-org-key-description'
                value={draft.description}
                maxLength={500}
                rows={2}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            </Field>
            <FieldSet>
              <FieldLegend>{t('keys.permissions')}</FieldLegend>
              <FieldDescription>
                {t('orgKeys.permissionsHint')}
              </FieldDescription>
              <ScopeEditor
                options={options}
                draft={draft}
                objects={(group) => api.objects(group)}
                onChange={setDraft}
              />
            </FieldSet>
            <Field>
              <FieldLabel>{t('keys.expiry.label')}</FieldLabel>
              <Select
                items={expiryItems}
                value={draft.expiry}
                onValueChange={(next: string | null) => {
                  if (next)
                    setDraft({ ...draft, expiry: next as ExpiryChoice });
                }}
              >
                <SelectTrigger
                  className='w-full sm:w-56'
                  aria-label={t('keys.expiry.label')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  {expiryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {options.maxScopedKeyDays ? (
                <FieldDescription>
                  {t('keys.expiry.capped', { count: options.maxScopedKeyDays })}
                </FieldDescription>
              ) : null}
            </Field>
          </div>
          <DialogFooter className='items-center'>
            {problem ? (
              <span className='mr-auto text-xs text-muted-foreground'>
                {t(problem)}
              </span>
            ) : null}
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                reset();
                onClose();
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={Boolean(problem) || create.isPending}
            >
              {t('orgKeys.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Editing a key: its name, description and permissions; the same no-escalation rule as creating, recorded. */
function EditOrgKeyDialog({
  apiKey,
  options,
  onClose,
}: {
  readonly apiKey: OrgApiKey;
  readonly options: KeyScopeOptions;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useOrgKeysApi();
  const notify = useNotify();
  const fail = useKeyError();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<KeyDraft>(() => ({
    ...emptyDraft(options, 'scoped'),
    name: apiKey.name,
    description: apiKey.description ?? '',
    groups: draftGroups(apiKey.scope),
  }));
  const save = useMutation({
    mutationFn: async () => {
      const name = draft.name.trim();
      const description = draft.description.trim() || null;
      if (name !== apiKey.name || description !== apiKey.description)
        await api.update(apiKey.id, { name, description });
      const scope = scopeOf(draft);
      if (JSON.stringify(scope) !== JSON.stringify(apiKey.scope))
        await api.setScope(apiKey.id, scope);
    },
    onSuccess: () => {
      notify.success(t('orgKeys.saved', { name: draft.name.trim() }));
      onClose();
    },
    onError: (error) => fail(error, t('orgKeys.saveFailed')),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: keyQueryKeys.org }),
  });
  const problem = draftProblem(draft);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <form
          className='contents'
          onSubmit={(event) => {
            event.preventDefault();
            if (!problem) save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {t('orgKeys.editTitle', { name: apiKey.name })}
            </DialogTitle>
            <DialogDescription>
              {t('orgKeys.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='-mx-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-1'>
            <Field>
              <FieldLabel htmlFor='studio-org-key-edit-name'>
                {t('keys.name')}
              </FieldLabel>
              <Input
                id='studio-org-key-edit-name'
                value={draft.name}
                maxLength={100}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='studio-org-key-edit-description'>
                {t('keys.description')}
              </FieldLabel>
              <Textarea
                id='studio-org-key-edit-description'
                value={draft.description}
                maxLength={500}
                rows={2}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            </Field>
            <FieldSet>
              <FieldLegend>{t('keys.permissions')}</FieldLegend>
              <ScopeEditor
                options={options}
                draft={draft}
                objects={(group) => api.objects(group)}
                onChange={setDraft}
              />
            </FieldSet>
          </div>
          <DialogFooter className='items-center'>
            {problem ? (
              <span className='mr-auto text-xs text-muted-foreground'>
                {t(problem)}
              </span>
            ) : null}
            <Button type='button' variant='outline' onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button type='submit' disabled={Boolean(problem) || save.isPending}>
              {t('orgKeys.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// i18n: orgKeys.events.created, orgKeys.events.updated, orgKeys.events.permissions-changed, orgKeys.events.rotated
// i18n: orgKeys.events.disabled, orgKeys.events.enabled, orgKeys.events.deleted
/** What happened to a key, newest first, with who did it. */
function HistoryDialog({
  apiKey,
  onClose,
}: {
  readonly apiKey: OrgApiKey;
  readonly onClose: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useOrgKeysApi();
  const events = useQuery({
    queryKey: keyQueryKeys.orgEvents(apiKey.id),
    queryFn: () => api.events(apiKey.id),
  });
  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {t('orgKeys.historyTitle', { name: apiKey.name })}
          </DialogTitle>
          <DialogDescription>
            {t('orgKeys.historyDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4'>
          {events.isError && !events.data ? (
            <PmLoadError
              title={t('orgKeys.historyFailed')}
              error={events.error}
              onRetry={() => void events.refetch()}
            />
          ) : !events.data ? (
            <PmListSkeleton rows={3} />
          ) : (
            <ol className='space-y-2' aria-label={t('orgKeys.history')}>
              {events.data.map((event) => (
                <li
                  key={event.id}
                  className='rounded-md border px-3 py-2 text-sm'
                >
                  <div className='font-medium'>
                    {t(`orgKeys.events.${event.action}`)}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {event.actor?.name ?? t('common.unknown')} ·{' '}
                    {formatDate(event.createdAt, i18n.language)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <DialogFooter>
          <Button type='button' onClick={onClose}>
            {t('keys.done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// i18n: orgKeys.status.active, orgKeys.status.disabled, orgKeys.status.expired
const STATUS_TONE = {
  active: 'green',
  disabled: 'grey',
  expired: 'amber',
} as const;

export function OrgKeysPanel(): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useOrgKeysApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const canManage = useCan({
    resource: { type: 'settings', id: 'studio.apiKeys' },
    action: 'manage',
  }).can;
  const keys = useQuery({
    queryKey: keyQueryKeys.org,
    queryFn: () => api.list(),
  });
  const options = useQuery({
    queryKey: keyQueryKeys.orgOptions,
    queryFn: () => api.options(),
    enabled: canManage,
  });
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<CreatedOrgApiKey | null>(null);
  const [editing, setEditing] = useState<OrgApiKey | null>(null);
  const [history, setHistory] = useState<OrgApiKey | null>(null);
  const [rotating, setRotating] = useState<OrgApiKey | null>(null);
  const [deleting, setDeleting] = useState<OrgApiKey | null>(null);
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: keyQueryKeys.org });

  const rotate = useMutation({
    mutationFn: (key: OrgApiKey) => api.rotate(key.id),
    onSuccess: (created) => {
      setRotating(null);
      setSecret(created);
    },
    onError: (error) => notify.error(error, t('keys.rotateFailed')),
    onSettled: refresh,
  });
  const toggle = useMutation({
    mutationFn: (key: OrgApiKey) =>
      key.status === 'disabled' ? api.enable(key.id) : api.disable(key.id),
    onSuccess: (key) =>
      notify.success(
        t(key.status === 'disabled' ? 'orgKeys.disabled' : 'orgKeys.enabled', {
          name: key.name,
        }),
      ),
    onError: (error) => notify.error(error, t('orgKeys.saveFailed')),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (key: OrgApiKey) => api.remove(key.id),
    onSuccess: (_, key) => {
      setDeleting(null);
      notify.success(t('orgKeys.deleted', { name: key.name }));
    },
    onError: (error) => notify.error(error, t('orgKeys.deleteFailed')),
    onSettled: refresh,
  });

  const groups = useMemo(() => options.data?.groups ?? [], [options.data]);
  const locale = i18n.language;
  const columns = useMemo<ColumnDef<OrgApiKey, unknown>[]>(
    () => [
      {
        id: 'name',
        header: t('keys.columns.name'),
        cell: ({ row }) => (
          <div className='min-w-0'>
            <div className='flex items-center gap-2 font-medium'>
              <KeyRoundIcon
                className='size-3.5 shrink-0 text-muted-foreground'
                aria-hidden='true'
              />
              <span className='truncate'>{row.original.name}</span>
              {row.original.managedBy ? (
                <Link
                  to={`/projects/${encodeURIComponent(row.original.managedBy.projectId)}/settings`}
                  title={t('orgKeys.managedHint', {
                    project: row.original.managedBy.projectName,
                  })}
                  className='shrink-0'
                  data-managed-by={row.original.managedBy.resourceId}
                >
                  <PmTag tone='blue'>
                    {t('orgKeys.managedBy', {
                      repo:
                        row.original.managedBy.repo ??
                        row.original.managedBy.projectName,
                    })}
                  </PmTag>
                </Link>
              ) : null}
            </div>
            <div className='text-xs text-muted-foreground'>
              {row.original.start ? (
                <span className='font-mono'>{row.original.start}…</span>
              ) : null}
              {row.original.description
                ? `${row.original.start ? ' · ' : ''}${row.original.description}`
                : ''}
            </div>
          </div>
        ),
      },
      {
        id: 'scope',
        header: t('keys.permissions'),
        cell: ({ row }) => (
          <ul className='space-y-0.5 text-xs'>
            {scopeLines(t, row.original.scope, groups).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ),
      },
      {
        id: 'created',
        header: t('orgKeys.columns.created'),
        cell: ({ row }) => (
          <div className='text-sm'>
            <div>{row.original.createdBy?.name ?? '—'}</div>
            <div className='text-xs text-muted-foreground'>
              {formatDate(row.original.createdAt, locale)}
            </div>
          </div>
        ),
      },
      {
        id: 'expires',
        header: t('keys.columns.expires'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {formatDate(row.original.expiresAt, locale) ??
              t('keys.expiry.never')}
          </span>
        ),
      },
      {
        id: 'lastUsed',
        header: t('keys.columns.lastUsed'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {formatDate(row.original.lastUsedAt, locale) ?? t('keys.neverUsed')}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('orgKeys.columns.status'),
        cell: ({ row }) => (
          <PmTag tone={STATUS_TONE[row.original.status]}>
            {t(`orgKeys.status.${row.original.status}`)}
          </PmTag>
        ),
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('keys.actions')}</span>,
        meta: { className: 'w-12' },
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('orgKeys.actionsFor', {
                      name: row.original.name,
                    })}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-auto min-w-40'>
                {canManage ? (
                  <>
                    <DropdownMenuItem
                      disabled={!options.data}
                      onClick={() => setEditing(row.original)}
                    >
                      <PencilIcon />
                      {t('orgKeys.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!row.original.keyId}
                      onClick={() => setRotating(row.original)}
                    >
                      <RotateCwIcon />
                      {t('keys.rotate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate(row.original)}
                    >
                      {row.original.status === 'disabled' ? (
                        <PlayIcon />
                      ) : (
                        <PauseIcon />
                      )}
                      {row.original.status === 'disabled'
                        ? t('orgKeys.enable')
                        : t('orgKeys.disable')}
                    </DropdownMenuItem>
                  </>
                ) : null}
                <DropdownMenuItem onClick={() => setHistory(row.original)}>
                  <HistoryIcon />
                  {t('orgKeys.history')}
                </DropdownMenuItem>
                {canManage ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => setDeleting(row.original)}
                    >
                      <Trash2Icon />
                      {t('orgKeys.delete')}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [t, groups, locale, canManage, options.data, toggle],
  );

  const createButton = canManage ? (
    <Button disabled={!options.data} onClick={() => setCreating(true)}>
      <PlusIcon />
      {t('orgKeys.create')}
    </Button>
  ) : null;

  let content: ReactElement;
  if (keys.isError && !keys.data)
    content = (
      <PmLoadError
        title={t('orgKeys.loadFailed')}
        error={keys.error}
        onRetry={() => void keys.refetch()}
      />
    );
  else if (!keys.data) content = <PmListSkeleton rows={3} />;
  else if (keys.data.length === 0)
    content = (
      <Empty className='min-h-48 border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <KeyRoundIcon />
          </EmptyMedia>
          <EmptyTitle>{t('orgKeys.empty')}</EmptyTitle>
          <EmptyDescription>
            {canManage
              ? t('orgKeys.emptyDescription')
              : t('orgKeys.emptyNoAccess')}
          </EmptyDescription>
        </EmptyHeader>
        {createButton ? <EmptyContent>{createButton}</EmptyContent> : null}
      </Empty>
    );
  else
    content = (
      <DataTable
        columns={columns}
        data={keys.data}
        pageSize={50}
        showSelectedCount={false}
        getRowId={(key) => key.id}
      />
    );

  return (
    <section className='space-y-4' aria-labelledby='studio-org-keys-heading'>
      <SettingsPageHeader
        id='studio-org-keys-heading'
        title={t('orgKeys.title')}
        description={t('orgKeys.description')}
        readOnly={!canManage}
        actions={keys.data && keys.data.length > 0 ? createButton : null}
      />
      <p className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
        <PmApiKeyTag />
        <span>{t('orgKeys.actsAs')}</span>
        <Link
          to='/account/api-keys'
          className='underline underline-offset-2 hover:text-foreground'
        >
          {t('orgKeys.personalLink')}
        </Link>
      </p>
      {content}
      {options.data ? (
        <CreateOrgKeyDialog
          open={creating}
          options={options.data}
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            setSecret(created);
            refresh();
          }}
        />
      ) : null}
      {editing && options.data ? (
        <EditOrgKeyDialog
          apiKey={editing}
          options={options.data}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {history ? (
        <HistoryDialog apiKey={history} onClose={() => setHistory(null)} />
      ) : null}
      <SecretDialog
        created={
          secret
            ? {
                key: {
                  id: secret.key.keyId ?? secret.key.id,
                  name: secret.key.name,
                  description: secret.key.description,
                  start: secret.key.start,
                  enabled: secret.key.status !== 'disabled',
                  createdAt: secret.key.createdAt,
                  expiresAt: secret.key.expiresAt,
                  lastUsedAt: secret.key.lastUsedAt,
                  scope: secret.key.scope,
                },
                secret: secret.secret,
              }
            : null
        }
        onClose={() => setSecret(null)}
      />
      <AlertDialog
        open={rotating !== null}
        onOpenChange={(open) => {
          if (!open) setRotating(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('keys.rotateTitle', { name: rotating?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('orgKeys.rotateDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={rotate.isPending}
              onClick={() => {
                if (rotating) rotate.mutate(rotating);
              }}
            >
              {t('keys.rotate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('orgKeys.deleteTitle', { name: deleting?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('orgKeys.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={remove.isPending}
              onClick={() => {
                if (deleting) remove.mutate(deleting);
              }}
            >
              {t('orgKeys.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
