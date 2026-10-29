import {
  ApiClientError,
  createUuid,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  IndexingConfig,
  IndexingInstanceView,
  IndexingReceipt,
  IndexingSettingsView,
  IndexingStatus,
  JsonObject,
  RebuildIndexingRequest,
  RetryIndexingRequest,
  SaveIndexingRequest,
} from '../../shared/indexing.js';
import {
  knowledgeIndexingKeys,
  useKnowledgeEmbeddingModels,
  useKnowledgeIndexingApi,
  useKnowledgeIndexingInstances,
  useKnowledgeIndexingSettings,
  useKnowledgeIndexingStatus,
} from '../indexing/api.js';
import { useIndexingForms } from '../indexing/context.js';
import { IndexingForm } from '../indexing/form.js';
import type { IndexingFormProps } from '../indexing/types.js';
import { indexingFailureKey } from '../indexing/failures.js';
import { useNotify } from '../hooks/use-notify.js';
import { IndexingEmpty } from './indexing-empty.js';
import { IndexingSettingsFrame } from './indexing-settings-frame.js';
import { Switch } from './ui/switch.js';
import { Badge } from './ui/badge.js';
import { Progress } from './ui/progress.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip.js';
import { CircleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Field, FieldLabel } from './ui/field.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { Spinner } from './ui/spinner.js';

export interface KnowledgeIndexingDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
export interface KnowledgeIndexingSettingsProps {
  readonly className?: string;
}
function PageLeaveGuard({
  guard,
}: {
  readonly guard: () => boolean | Promise<boolean>;
}): null {
  useNavigationGuard(guard);
  return null;
}
const resource = { type: 'settings', id: 'kb.indexing' };
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function fieldsOf(error: unknown): readonly string[] {
  if (!(error instanceof ApiClientError) || !isRecord(error.payload)) return [];
  const body = error.payload.error;
  if (!isRecord(body) || !Array.isArray(body.fieldViolations)) return [];
  return body.fieldViolations.flatMap((item: unknown) =>
    isRecord(item) &&
    typeof item.field === 'string' &&
    /^options(?:\.[a-zA-Z0-9_]+)*$/.test(item.field)
      ? [item.field]
      : [],
  );
}

function useMounted(): { current: boolean } {
  const liveRef = useRef(false);
  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
    };
  }, []);
  return liveRef;
}
class FormBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  public state = { failed: false };
  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  public override componentDidCatch(): void {
    this.props.onFailure();
  }
  public override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
/** A new lifetime for each selected key/revision; detached custom callbacks cannot edit its replacement. */
function FormSession(
  props: IndexingFormProps & {
    readonly onFailure: () => void;
    readonly onReady: () => void;
  },
): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const liveRef = useMounted();
  const unavailable = (
    <Alert variant='destructive'>
      <AlertDescription>{t('indexing.missingForm')}</AlertDescription>
    </Alert>
  );
  return (
    <FormBoundary onFailure={props.onFailure} fallback={unavailable}>
      <IndexingForm
        {...props}
        onChange={(value) => {
          if (liveRef.current && !props.disabled) props.onChange(value);
        }}
        loading={
          <p
            role='status'
            className='flex items-center gap-2 text-sm text-muted-foreground'
          >
            <Spinner />
            {t('knowledge.loading')}
          </p>
        }
        unavailable={unavailable}
      />
    </FormBoundary>
  );
}
function StatusPanel({
  status,
}: {
  readonly status: IndexingStatus | undefined;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const failureTooltipId = useId();
  if (!status) return null;
  const generation = status.target ?? status.serving;
  const processed = generation
    ? generation.documents.done + generation.documents.failed
    : 0;
  const total = generation?.documents.total ?? null;
  const percentage =
    total === null
      ? null
      : total > 0
        ? Math.max(0, Math.min(100, (processed / total) * 100))
        : generation?.scanComplete
          ? 100
          : 0;
  const failureKeys = [
    ...new Set(
      [
        status.target?.error?.reason,
        status.serving?.error?.reason,
        status.reason,
      ]
        .filter(
          (reason): reason is string =>
            typeof reason === 'string' && reason.length > 0,
        )
        .map(indexingFailureKey),
    ),
  ];
  if (!failureKeys.length && generation?.documents.failed)
    failureKeys.push('indexing.workFailed');
  return (
    <section
      className='space-y-2 rounded-md border p-3'
      aria-label={t('indexing.progress')}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-sm font-medium'>{t('indexing.progress')}</h3>
        <p
          role='status'
          className='rounded-md bg-muted px-2 py-1 text-xs font-medium'
        >
          {t('indexing.availability.' + status.availability)}
        </p>
      </div>
      <div className='flex flex-col gap-2 border-t pt-3'>
        <div className='flex items-center gap-1'>
          <span className='text-xs text-muted-foreground'>
            {t('indexing.documentProgress')}
          </span>
          {generation && generation.documents.failed > 0 ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-xs'
                      className='text-destructive hover:text-destructive'
                      aria-label={t('indexing.failedDocuments')}
                      aria-describedby={failureTooltipId}
                    />
                  }
                >
                  <CircleAlertIcon aria-hidden='true' />
                </TooltipTrigger>
                <TooltipContent id={failureTooltipId} role='tooltip'>
                  {t('indexing.failedDocumentCount', {
                    count: generation.documents.failed,
                  })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        <Progress
          aria-label={t('indexing.documentProgress')}
          value={percentage}
        />
        <p className='text-xs tabular-nums text-muted-foreground'>
          {processed} / {total ?? '…'}
        </p>
      </div>
      {failureKeys.map((key) => (
        <p key={key} role='alert' className='text-sm text-destructive'>
          {t(key)}
        </p>
      ))}
    </section>
  );
}
type Operation =
  | { kind: 'save'; input: SaveIndexingRequest; config: IndexingConfig | null }
  | {
      kind: 'rebuild';
      input: RebuildIndexingRequest;
      config: IndexingConfig | null;
    }
  | {
      kind: 'retry';
      input: RetryIndexingRequest;
      config: IndexingConfig | null;
    };

function SettingsEditor({
  initial,
  instances,
  status,
  layout,
  className,
  onOpenChange,
  onReload,
}: {
  readonly initial: IndexingSettingsView;
  readonly instances: ReturnType<typeof useKnowledgeIndexingInstances>;
  readonly status: ReturnType<typeof useKnowledgeIndexingStatus>;
  readonly layout: 'dialog' | 'page';
  readonly className?: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onReload: () => Promise<IndexingSettingsView | undefined>;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeIndexingApi();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const forms = useIndexingForms();
  const liveRef = useMounted();
  const configure = useCan({ resource, action: 'configure' });
  const rebuild = useCan({ resource, action: 'rebuild' });
  const [baseline, setBaseline] = useState(initial);
  const canConfigure = configure.can && baseline.capabilities.configure;
  const canRebuild = rebuild.can && baseline.capabilities.rebuild;
  const [invalidFields, setInvalidFields] = useState<readonly string[]>([]);
  const [draft, setDraft] = useState(initial.config);
  const [enabled, setEnabled] = useState(initial.config !== null);
  const configToSave = enabled ? draft : null;
  const [confirm, setConfirm] = useState<Operation['kind'] | 'discard' | null>(
    null,
  );
  const [failure, setFailure] = useState<{
    kind: 'conflict' | 'saveFailed';
    reason: string | null;
  } | null>(null);
  const [formFailed, setFormFailed] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const markFormReady = useCallback(() => setFormReady(true), []);
  const previousRequestRef = useRef<{
    fingerprint: string;
    operation: Operation;
  } | null>(null);
  const current = instances.data?.items.find((item) => item.key === draft?.key);
  const dirty =
    enabled !== (baseline.config !== null) ||
    JSON.stringify(configToSave) !== JSON.stringify(baseline.config);
  const vector = current
    ? forms.get(current.type)?.requiresEmbedding === true
    : false;
  const models = useKnowledgeEmbeddingModels(enabled && vector);
  const noInstances =
    instances.isSuccess &&
    instances.data.reason === null &&
    instances.data.items.length === 0;
  const directoryFailed = instances.isError || Boolean(instances.data?.reason);
  const draftsRef = useRef(new Map<string, IndexingConfig>());
  const leaveRef = useRef<(() => void) | null>(null);
  const navigationRef = useRef<((allowed: boolean) => void) | null>(null);
  const allowNavigationRef = useRef(false);
  const modelUnavailable =
    vector &&
    (models.isPending || models.isError || models.data?.reason !== null);
  const mutation = useMutation({
    mutationFn: (operation: Operation) =>
      operation.kind === 'save'
        ? api.save(operation.input)
        : operation.kind === 'rebuild'
          ? api.rebuild(operation.input)
          : api.retry(operation.input),
    onSuccess: (receipt: IndexingReceipt, operation: Operation) => {
      if (!liveRef.current) return;
      const accepted = {
        ...baseline,
        revision: receipt.revision,
        config: operation.config,
        updatedAt: receipt.acceptedAt,
      };
      setBaseline(accepted);
      setEnabled(operation.config !== null);
      if (operation.config) setDraft(operation.config);
      setFailure(null);
      setInvalidFields([]);
      previousRequestRef.current = null;
      draftsRef.current.clear();
      queryClient.setQueryData(knowledgeIndexingKeys.settings, accepted);
      notify.success(t('indexing.saved'));
      // Status projection is independent of durable admission; a failed GET cannot undo the receipt.
      void queryClient
        .invalidateQueries({ queryKey: knowledgeIndexingKeys.status })
        .catch(() => {});
    },
    onError: (error) => {
      if (!liveRef.current) return;
      setInvalidFields(fieldsOf(error));
      const reason =
        error instanceof ApiClientError ? (error.reason ?? null) : null;
      setFailure({
        kind:
          reason &&
          ['INDEXING_REVISION_CONFLICT', 'INDEXING_REQUEST_CONFLICT'].includes(
            reason,
          )
            ? 'conflict'
            : 'saveFailed',
        reason,
      });
    },
  });
  const locked = mutation.isPending || confirm !== null;
  const select = (key: string | null) => {
    if (
      locked ||
      !canConfigure ||
      !enabled ||
      key === null ||
      key === draft?.key
    )
      return;
    const instance = instances.data?.items.find((item) => item.key === key);
    if (!instance) return;
    setFailure(null);
    setInvalidFields([]);
    setFormFailed(false);
    setFormReady(false);
    if (draft) draftsRef.current.set(draft.key, draft);
    setDraft(
      draftsRef.current.get(key) ??
        (baseline.config?.key === key
          ? baseline.config
          : {
              version: 1,
              key,
              options: {},
            }),
    );
  };
  const execute = (kind: Operation['kind']) => {
    setConfirm(null);
    if (
      (kind === 'save' && !canConfigure) ||
      (kind !== 'save' && !canRebuild) ||
      mutation.isPending
    )
      return;
    if (kind === 'save' && enabled && !draft) return;
    const config = kind === 'save' ? configToSave : baseline.config;
    const common = {
      expectedRevision: baseline.revision,
      acknowledgeFullRebuild: true as const,
    };
    const generationId = status.data?.target?.id ?? status.data?.serving?.id;
    if (kind === 'retry' && !generationId) return;
    const fingerprint = JSON.stringify({
      kind,
      config,
      ...common,
      ...(kind === 'retry' ? { generationId } : {}),
    });
    let operation =
      previousRequestRef.current?.fingerprint === fingerprint
        ? previousRequestRef.current.operation
        : null;
    if (!operation) {
      const input = { ...common, requestId: createUuid() };
      operation =
        kind === 'save'
          ? { kind, input: { ...input, config }, config }
          : kind === 'retry'
            ? { kind, input: { ...input, generationId: generationId! }, config }
            : { kind, input, config };
      previousRequestRef.current = { fingerprint, operation };
    }
    mutation.mutate(operation);
  };
  const close = (open: boolean) => {
    if (open || mutation.isPending) return;
    if (dirty) {
      leaveRef.current = () => onOpenChange(false);
      setConfirm('discard');
    } else onOpenChange(false);
  };
  const requestNavigation = (): boolean | Promise<boolean> => {
    if (allowNavigationRef.current) return true;
    if (mutation.isPending) return false;
    if (!dirty) return true;
    return new Promise<boolean>((resolve) => {
      navigationRef.current = resolve;
      setConfirm('discard');
    });
  };
  useEffect(() => {
    if (!dirty && !mutation.isPending) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, mutation.isPending]);
  useEffect(
    () => () => {
      navigationRef.current?.(false);
    },
    [],
  );
  const missing =
    draft !== null && (!current || !forms.get(current.type) || formFailed);
  const disabled = locked || !canConfigure;
  const groups = new Map<string, IndexingInstanceView[]>();
  for (const item of instances.data?.items ?? [])
    groups.set(item.type, [...(groups.get(item.type) ?? []), item]);
  const items = (instances.data?.items ?? []).map((item) => ({
    value: item.key,
    label: item.name,
  }));
  const failed = Boolean(
    status.data?.target?.error ||
    status.data?.target?.documents.failed ||
    status.data?.serving?.error ||
    status.data?.serving?.documents.failed,
  );
  const requestFailureKey = failure?.reason
    ? indexingFailureKey(failure.reason)
    : null;
  return (
    <>
      {layout === 'page' ? <PageLeaveGuard guard={requestNavigation} /> : null}
      <IndexingSettingsFrame
        layout={layout}
        onClose={() => close(false)}
        locked={mutation.isPending}
        className={className}
        status={
          !noInstances ? (
            <div className='space-y-3'>
              <StatusPanel status={status.data} />
              {status.isError ? (
                <Alert variant='destructive'>
                  <AlertDescription>
                    {t('indexing.statusFailed')}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : undefined
        }
        footer={
          noInstances && layout === 'dialog' ? null : (
            <>
              <div className='mr-auto flex flex-wrap items-center gap-2'>
                {!noInstances && canRebuild ? (
                  <>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={locked || dirty || !enabled || !baseline.config}
                      onClick={() => setConfirm('rebuild')}
                    >
                      {t('indexing.rebuild')}
                    </Button>
                    {failed ? (
                      <Button
                        type='button'
                        variant='outline'
                        disabled={
                          locked || dirty || !enabled || !baseline.config
                        }
                        onClick={() => setConfirm('retry')}
                      >
                        {t('indexing.retry')}
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
              {layout === 'page' && noInstances ? (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    void instances.refetch();
                  }}
                >
                  {t('knowledge.editor.reload')}
                </Button>
              ) : null}
              {canConfigure && !noInstances ? (
                <Button
                  type='button'
                  disabled={
                    locked ||
                    !dirty ||
                    (enabled &&
                      (!draft ||
                        directoryFailed ||
                        instances.isPending ||
                        !formReady ||
                        missing ||
                        !current?.available ||
                        modelUnavailable))
                  }
                  onClick={() => setConfirm('save')}
                >
                  {mutation.isPending ? <Spinner /> : null}
                  {t('knowledge.editor.save')}
                </Button>
              ) : null}
            </>
          )
        }
      >
        {failure ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('indexing.' + failure.kind)}
              {failure.kind === 'saveFailed' &&
              requestFailureKey &&
              requestFailureKey !== 'indexing.workFailed' ? (
                <p>{t(requestFailureKey)}</p>
              ) : null}
              {failure.kind === 'conflict' ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={locked}
                  onClick={() => {
                    void onReload().then((latest) => {
                      if (liveRef.current && latest) {
                        setBaseline((current) =>
                          BigInt(latest.revision) >= BigInt(current.revision)
                            ? latest
                            : current,
                        );
                        setFailure(null);
                      }
                    });
                  }}
                >
                  {t('knowledge.editor.reload')}
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {!noInstances ? (
          <Field
            orientation='horizontal'
            className='justify-between rounded-lg border p-4'
          >
            <div className='space-y-1'>
              <FieldLabel htmlFor='knowledge-indexing-enabled'>
                {t('indexing.enabled')}
              </FieldLabel>
              <p
                id='knowledge-indexing-enabled-hint'
                className='text-xs text-muted-foreground'
              >
                {t('indexing.enabledHint')}
              </p>
            </div>
            <Switch
              id='knowledge-indexing-enabled'
              aria-describedby='knowledge-indexing-enabled-hint'
              checked={enabled}
              disabled={
                disabled ||
                (!enabled && (directoryFailed || instances.isPending))
              }
              onCheckedChange={(checked) => {
                if (disabled) return;
                setEnabled(checked);
              }}
            />
          </Field>
        ) : null}
        {instances.isPending ? (
          <p
            role='status'
            className='flex items-center gap-2 text-sm text-muted-foreground'
          >
            <Spinner />
            {t('knowledge.loading')}
          </p>
        ) : directoryFailed ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('indexing.loadFailed')}
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  void instances.refetch();
                }}
              >
                {t('knowledge.editor.reload')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : noInstances ? (
          <IndexingEmpty />
        ) : (
          <div className='space-y-6'>
            <Field>
              <div className='flex items-center gap-2'>
                <FieldLabel htmlFor='knowledge-indexing-instance'>
                  {t('indexing.instance')}
                </FieldLabel>
                {current ? (
                  <Badge variant='secondary'>{current.type}</Badge>
                ) : null}
              </div>
              <Select
                items={items}
                value={draft?.key ?? null}
                disabled={disabled || !enabled}
                onValueChange={select}
              >
                <SelectTrigger
                  id='knowledge-indexing-instance'
                  className='w-full'
                >
                  <SelectValue placeholder={t('indexing.chooseInstance')}>
                    {(value: string | null) =>
                      items.find((item) => item.value === value)?.label ?? value
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[...groups].map(([type, entries]) => (
                    <SelectGroup key={type}>
                      <SelectLabel>{type}</SelectLabel>
                      {entries.map((item) => (
                        <SelectItem
                          key={item.key}
                          value={item.key}
                          disabled={!item.available}
                        >
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {draft && current ? (
              <section className='space-y-4 border-t pt-6'>
                <FormSession
                  key={draft.key + ':' + baseline.revision}
                  instance={current}
                  value={draft.options}
                  onChange={(value: JsonObject) =>
                    setDraft({ ...draft, options: value })
                  }
                  errors={invalidFields.map((field) => ({
                    field,
                    message: t('indexing.invalidValue'),
                  }))}
                  disabled={disabled || !enabled || !current.available}
                  services={models.data?.items ?? []}
                  modelsLoading={vector && models.isPending}
                  modelsError={
                    models.isError || models.data?.reason ? 'unavailable' : null
                  }
                  onFailure={() => setFormFailed(true)}
                  onReady={markFormReady}
                />
              </section>
            ) : draft ? (
              <Alert variant='destructive'>
                <AlertDescription>{t('indexing.missingForm')}</AlertDescription>
              </Alert>
            ) : null}
            {missing && draft ? (
              <pre className='overflow-x-auto rounded-md bg-muted p-3 text-xs'>
                {JSON.stringify(draft.options, null, 2)}
              </pre>
            ) : null}
          </div>
        )}
      </IndexingSettingsFrame>
      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirm(null);
            navigationRef.current?.(false);
            navigationRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                confirm === 'discard'
                  ? 'indexing.discardTitle'
                  : 'indexing.confirmTitle',
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                confirm === 'discard'
                  ? 'indexing.discardDescription'
                  : confirm === 'save' && !enabled
                    ? 'indexing.confirmDisable'
                    : confirm === 'retry'
                      ? vector
                        ? 'indexing.confirmRetryEmbedding'
                        : 'indexing.confirmRetry'
                      : vector
                        ? 'indexing.confirmRebuild'
                        : 'indexing.confirmResources',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('knowledge.editor.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm === 'discard') {
                  setConfirm(null);
                  allowNavigationRef.current = true;
                  if (navigationRef.current) {
                    navigationRef.current(true);
                    navigationRef.current = null;
                  } else {
                    const leave = leaveRef.current;
                    leaveRef.current = null;
                    leave?.();
                  }
                } else if (confirm) execute(confirm);
              }}
            >
              {t(
                confirm === 'discard' ? 'indexing.discard' : 'indexing.confirm',
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function OpenedDialog(
  props: KnowledgeIndexingDialogProps & {
    readonly layout?: 'dialog' | 'page';
    readonly className?: string;
  },
): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const read = useCan({ resource, action: 'read' });
  const settings = useKnowledgeIndexingSettings(read.can);
  const instances = useKnowledgeIndexingInstances(read.can);
  const status = useKnowledgeIndexingStatus(read.can);
  if (read.can && settings.data)
    return (
      <SettingsEditor
        initial={settings.data}
        instances={instances}
        status={status}
        layout={props.layout ?? 'dialog'}
        className={props.className}
        onOpenChange={props.onOpenChange}
        onReload={async () => {
          const result = await settings.refetch();
          return result.isSuccess ? result.data : undefined;
        }}
      />
    );
  if (props.layout === 'page')
    return (
      <IndexingSettingsFrame
        layout='page'
        onClose={() => props.onOpenChange(false)}
        className={props.className}
        footer={
          settings.isError ? (
            <Button
              variant='outline'
              onClick={() => {
                void settings.refetch();
              }}
            >
              {t('knowledge.editor.reload')}
            </Button>
          ) : null
        }
      >
        {settings.isError || read.error || (!read.isPending && !read.can) ? (
          <Alert variant='destructive'>
            <AlertDescription>{t('indexing.loadFailed')}</AlertDescription>
          </Alert>
        ) : (
          <p role='status'>
            <Spinner />
            {t('knowledge.loading')}
          </p>
        )}
      </IndexingSettingsFrame>
    );
  return (
    <Dialog open onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('indexing.title')}</DialogTitle>
          <DialogDescription>{t('indexing.description')}</DialogDescription>
        </DialogHeader>
        {settings.isError || read.error || (!read.isPending && !read.can) ? (
          <Alert variant='destructive'>
            <AlertDescription>{t('indexing.loadFailed')}</AlertDescription>
          </Alert>
        ) : (
          <p role='status' className='flex items-center gap-2'>
            <Spinner />
            {t('knowledge.loading')}
          </p>
        )}
        <DialogFooter>
          {settings.isError ? (
            <Button
              type='button'
              onClick={() => {
                void settings.refetch();
              }}
            >
              {t('knowledge.editor.reload')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function KnowledgeIndexingDialog(
  props: KnowledgeIndexingDialogProps,
): ReactElement | null {
  return props.open ? <OpenedDialog {...props} /> : null;
}

/** The application owns the protected route, placement and navigation. */
export function KnowledgeIndexingSettings({
  className,
}: KnowledgeIndexingSettingsProps): ReactElement {
  return (
    <OpenedDialog
      open
      layout='page'
      className={className}
      onOpenChange={() => undefined}
    />
  );
}
