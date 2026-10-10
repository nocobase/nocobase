/**
 * A person's own API keys: the list (scope, expiry, last use), creating a key with all of the person's permissions or
 * a scope, rotating in place and revoking. A personal key's scope does not change after it is made; making another is
 * the way. The secret is shown once, when the key is created or rotated. An organization may turn creating them off
 * (`studio.personalApiKeys`); the list and revoking stay.
 */
import type {
  ApiKeyView,
  CreatedApiKey,
  KeyScopeOptions,
} from '@nocobase/app-plugin-api-keys/shared/scopes';
import {
  DataTable,
  PmListSkeleton,
  PmLoadError,
  PmTag,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  CopyIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RotateCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useMemo, useState } from 'react';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useNotify } from '../../access/notify.js';
import type { KeyOwnerApi } from '../../access/keys-api.js';
import { ScopeEditor } from './scope-editor.js';
import {
  defaultExpiry,
  draftProblem,
  emptyDraft,
  expiryChoices,
  formatDate,
  requestOf,
  scopeLines,
  type ExpiryChoice,
  type KeyDraft,
} from './key-scope-model.js';

export interface KeysPanelProps {
  readonly api: KeyOwnerApi;
  /** Query keys of the list and of the editor's options. */
  readonly listKey: readonly unknown[];
  readonly optionsKey: readonly unknown[];
  /** Whether the viewer may create, rotate and revoke (the list shows either way). */
  readonly canManage: boolean;
  /** How "all permissions" reads for this owner. */
  readonly fullLabel: string;
  readonly fullDescription: string;
  /** Turns off creating; the reason shows instead. */
  readonly createDisabledReason?: string | null;
  readonly headingId: string;
  readonly title?: string;
  readonly description?: string;
}

function CreateKeyDialog({
  open,
  options,
  api,
  fullLabel,
  fullDescription,
  onClose,
  onCreated,
}: {
  readonly open: boolean;
  readonly options: KeyScopeOptions | undefined;
  readonly api: KeyOwnerApi;
  readonly fullLabel: string;
  readonly fullDescription: string;
  readonly onClose: () => void;
  readonly onCreated: (created: CreatedApiKey) => void;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const scopedOffered = (options?.groups.length ?? 0) > 0;
  const [draft, setDraft] = useState<KeyDraft>(() =>
    emptyDraft(options, scopedOffered ? 'scoped' : 'full'),
  );
  const reset = () =>
    setDraft(emptyDraft(options, scopedOffered ? 'scoped' : 'full'));
  const create = useMutation({
    mutationFn: () => api.create(requestOf(draft)),
    onSuccess: (created) => {
      reset();
      onCreated(created);
    },
    onError: (error) => notify.error(error, t('keys.createFailed')),
  });
  const problem = draftProblem(draft);
  const choices = expiryChoices(options, draft.mode === 'scoped');
  const expiryItems = choices.map((choice) => ({
    value: choice,
    label:
      choice === 'never'
        ? t('keys.expiry.never')
        : t('keys.expiry.days', { count: Number(choice) }),
  }));
  const setMode = (mode: KeyDraft['mode']) =>
    setDraft((current) => {
      const expiry = expiryChoices(options, mode === 'scoped').includes(
        current.expiry,
      )
        ? current.expiry
        : defaultExpiry(options, mode === 'scoped');
      return { ...current, mode, expiry };
    });

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
            <DialogTitle>{t('keys.createTitle')}</DialogTitle>
            <DialogDescription>{t('keys.createDescription')}</DialogDescription>
          </DialogHeader>
          <div className='-mx-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-1'>
            <Field>
              <FieldLabel htmlFor='studio-key-name'>
                {t('keys.name')}
              </FieldLabel>
              <Input
                id='studio-key-name'
                value={draft.name}
                maxLength={100}
                autoFocus
                placeholder={t('keys.namePlaceholder')}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='studio-key-description'>
                {t('keys.description')}
              </FieldLabel>
              <Textarea
                id='studio-key-description'
                value={draft.description}
                maxLength={500}
                rows={2}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            </Field>
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
                  className='w-56'
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
              {draft.mode === 'scoped' && options?.maxScopedKeyDays ? (
                <FieldDescription>
                  {t('keys.expiry.capped', { count: options.maxScopedKeyDays })}
                </FieldDescription>
              ) : null}
            </Field>
            <FieldSet>
              <FieldLegend>{t('keys.permissions')}</FieldLegend>
              <RadioGroup
                value={draft.mode}
                aria-label={t('keys.permissions')}
                onValueChange={(next) => setMode(next as KeyDraft['mode'])}
              >
                <label className='flex items-start gap-2 text-sm'>
                  <RadioGroupItem value='full' className='mt-0.5' />
                  <span>
                    <span className='block font-medium'>{fullLabel}</span>
                    <span className='block text-xs text-muted-foreground'>
                      {fullDescription}
                    </span>
                  </span>
                </label>
                {scopedOffered ? (
                  <label className='flex items-start gap-2 text-sm'>
                    <RadioGroupItem value='scoped' className='mt-0.5' />
                    <span>
                      <span className='block font-medium'>
                        {t('keys.scoped')}
                      </span>
                      <span className='block text-xs text-muted-foreground'>
                        {t('keys.scopedDescription')}
                      </span>
                    </span>
                  </label>
                ) : null}
              </RadioGroup>
            </FieldSet>
            {draft.mode === 'scoped' && options ? (
              <ScopeEditor
                options={options}
                draft={draft}
                objects={(group) => api.objects(group)}
                onChange={setDraft}
              />
            ) : null}
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
              {t('keys.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The secret of a key just made or rotated, shown once. */
export function SecretDialog({
  created,
  onClose,
}: {
  readonly created: CreatedApiKey | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  return (
    <Dialog
      open={created !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {t('keys.secretTitle', { name: created?.key.name ?? '' })}
          </DialogTitle>
          <DialogDescription>{t('keys.secretOnce')}</DialogDescription>
        </DialogHeader>
        <div className='flex gap-2'>
          <Input
            readOnly
            value={created?.secret ?? ''}
            aria-label={t('keys.secret')}
            className='font-mono text-xs'
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              if (!created) return;
              void navigator.clipboard
                ?.writeText(created.secret)
                .then(() => notify.success(t('keys.copied')));
            }}
          >
            <CopyIcon />
            {t('keys.copy')}
          </Button>
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

export function KeysPanel({
  api,
  listKey,
  optionsKey,
  canManage,
  fullLabel,
  fullDescription,
  createDisabledReason,
  headingId,
  title,
  description,
}: KeysPanelProps): ReactElement {
  const { t, i18n } = useTranslation();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const keys = useQuery({ queryKey: listKey, queryFn: () => api.list() });
  const options = useQuery({
    queryKey: optionsKey,
    queryFn: () => api.options(),
    enabled: canManage,
  });
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<CreatedApiKey | null>(null);
  // The organization may have turned creating keys of one's own off.
  const creationOff = options.data?.mayCreate === false;
  const disabledReason =
    createDisabledReason ?? (creationOff ? t('keys.creationOff') : null);
  const [rotating, setRotating] = useState<ApiKeyView | null>(null);
  const [revoking, setRevoking] = useState<ApiKeyView | null>(null);
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: listKey });

  const rotate = useMutation({
    mutationFn: (key: ApiKeyView) => api.rotate(key.id),
    onSuccess: (created) => {
      setRotating(null);
      setSecret(created);
    },
    onError: (error) => notify.error(error, t('keys.rotateFailed')),
    onSettled: refresh,
  });
  const revoke = useMutation({
    mutationFn: (key: ApiKeyView) => api.revoke(key.id),
    onSuccess: (_, key) => {
      setRevoking(null);
      notify.success(t('keys.revoked', { name: key.name ?? '' }));
    },
    onError: (error) => notify.error(error, t('keys.revokeFailed')),
    onSettled: refresh,
  });

  const groups = useMemo(() => options.data?.groups ?? [], [options.data]);
  const locale = i18n.language;
  const columns = useMemo<ColumnDef<ApiKeyView, unknown>[]>(
    () => [
      {
        id: 'name',
        header: t('keys.columns.name'),
        cell: ({ row }) => (
          <div className='min-w-0'>
            <div className='flex items-center gap-2 font-medium'>
              <KeyRoundIcon className='size-3.5 text-muted-foreground' />
              <span className='truncate'>{row.original.name}</span>
            </div>
            <div className='text-xs text-muted-foreground'>
              <span className='font-mono'>{row.original.start}…</span>
              {row.original.description ? ` · ${row.original.description}` : ''}
            </div>
          </div>
        ),
      },
      {
        id: 'scope',
        header: t('keys.columns.scope'),
        cell: ({ row }) => (
          <ul className='space-y-0.5 text-xs'>
            {scopeLines(t, row.original.scope, groups).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ),
      },
      {
        id: 'expires',
        header: t('keys.columns.expires'),
        cell: ({ row }) => {
          const expired =
            row.original.expiresAt !== null &&
            new Date(row.original.expiresAt).getTime() <= Date.now();
          return expired ? (
            <PmTag tone='amber'>{t('keys.expired')}</PmTag>
          ) : (
            <span className='text-sm text-muted-foreground'>
              {formatDate(row.original.expiresAt, locale) ??
                t('keys.expiry.never')}
            </span>
          );
        },
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
        id: 'created',
        header: t('keys.columns.created'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {formatDate(row.original.createdAt, locale)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('keys.actions')}</span>,
        meta: { className: 'w-24' },
        cell: ({ row }) =>
          canManage ? (
            <div className='flex justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={t('keys.actionsFor', {
                        name: row.original.name ?? '',
                      })}
                    />
                  }
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-auto min-w-40'>
                  <DropdownMenuItem
                    disabled={creationOff}
                    onClick={() => setRotating(row.original)}
                  >
                    <RotateCwIcon />
                    {t('keys.rotate')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() => setRevoking(row.original)}
                  >
                    <Trash2Icon />
                    {t('keys.revoke')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null,
      },
    ],
    [t, groups, locale, canManage, creationOff],
  );

  const createButton = canManage ? (
    <Button
      size='sm'
      disabled={Boolean(disabledReason) || !options.data}
      onClick={() => setCreating(true)}
    >
      <PlusIcon />
      {t('keys.create')}
    </Button>
  ) : null;

  let content: ReactElement;
  if (keys.isError && !keys.data)
    content = (
      <PmLoadError
        title={t('keys.loadFailed')}
        error={keys.error}
        onRetry={() => void keys.refetch()}
      />
    );
  else if (!keys.data) content = <PmListSkeleton rows={2} />;
  else if (keys.data.length === 0)
    content = (
      <Empty className='min-h-40 border border-dashed p-6 md:p-6'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <KeyRoundIcon />
          </EmptyMedia>
          <EmptyTitle>{t('keys.empty')}</EmptyTitle>
          <EmptyDescription>
            {canManage ? t('keys.emptyDescription') : t('keys.emptyNoAccess')}
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
    <section className='space-y-4' aria-labelledby={headingId}>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 space-y-1'>
          <h3 id={headingId} className='text-base font-semibold'>
            {title ?? t('keys.title')}
          </h3>
          {description ? (
            <p className='text-sm text-muted-foreground'>{description}</p>
          ) : null}
        </div>
        {keys.data && keys.data.length > 0 && createButton ? (
          <div className='shrink-0'>{createButton}</div>
        ) : null}
      </div>
      {disabledReason ? (
        <Alert>
          <AlertDescription>{disabledReason}</AlertDescription>
        </Alert>
      ) : null}
      {content}
      {options.data ? (
        <CreateKeyDialog
          open={creating}
          options={options.data}
          api={api}
          fullLabel={fullLabel}
          fullDescription={fullDescription}
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            setSecret(created);
            refresh();
          }}
        />
      ) : null}
      <SecretDialog created={secret} onClose={() => setSecret(null)} />
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
              {t('keys.rotateDescription')}
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
        open={revoking !== null}
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('keys.revokeTitle', { name: revoking?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('keys.revokeDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={revoke.isPending}
              onClick={() => {
                if (revoking) revoke.mutate(revoking);
              }}
            >
              {t('keys.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
