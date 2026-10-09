/**
 * `ServiceDialog`: one model service in a dialog, added or edited in a single form saved at once: the provider type
 * (when adding), name, base URL, the write-only API key (`SecretInput`: empty keeps the saved key), a connection test,
 * the models (fetched from the provider or added by ID, each checked or not, each a chat, embedding or rerank model of
 * the kinds the provider serves, an embedding model with an optional vector size) and the on/off switch. A model's kind
 * is guessed from its id only as a default: it can be changed on any row, before the model is checked too, and each
 * row's Test checks the model as its kind, saying when it looks like a model of another kind instead. The form scrolls
 * between a fixed header and footer. Who only reads services sees the same form, unchangeable.
 *
 * For an OpenCode base URL the form says which provider type serves which of its model families; the session
 * header is sent automatically.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlaskConicalIcon, PlusIcon, RefreshCwIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import {
  isOpenCodeUrl,
  MODEL_PROVIDERS,
  providerOf,
  type ModelCheck,
  type ModelConnectionRequest,
  type ModelKind,
  type ModelOption,
  type ModelProviderOption,
  type ModelServiceView,
} from '../../shared/models.js';
import { agentsKeys } from '../api/keys.js';
import { SecretInput } from '../components/secret-input.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Checkbox } from '../components/ui/checkbox.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '../components/ui/field.js';
import { Input } from '../components/ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { Spinner } from '../components/ui/spinner.js';
import { Switch } from '../components/ui/switch.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { useNotify } from '../hooks/use-notify.js';
import {
  baseUrlOf,
  modelRows,
  newServiceTitle,
  setModelDimensions,
  setModelKind,
  testModelOf,
  toggleModel,
  validBaseUrl,
} from './model.js';

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** A model's own test: running, or what it answered when checked as `kind`. */
type ModelTest =
  | { readonly state: 'running' }
  | {
      readonly state: 'done';
      readonly kind: ModelKind;
      readonly check: ModelCheck;
    };

/** The model list shows a search box past this many models. */
const SEARCH_FROM = 8;

export function ServiceDialog({
  open,
  service,
  services,
  canManage,
  onOpenChange,
}: {
  readonly open: boolean;
  /** The service edited; null adds one. */
  readonly service: ModelServiceView | null;
  readonly services: readonly ModelServiceView[];
  readonly canManage: boolean;
  readonly onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {service ? service.title : t('services.add.title')}
          </DialogTitle>
        </DialogHeader>
        <ServiceForm
          key={`${String(open)}:${service?.name ?? ''}`}
          service={service}
          services={services}
          canManage={canManage}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ServiceForm({
  service,
  services,
  canManage,
  onDone,
}: {
  readonly service: ModelServiceView | null;
  readonly services: readonly ModelServiceView[];
  readonly canManage: boolean;
  readonly onDone: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<ModelProviderOption | null>(() =>
    service ? providerOf(service.provider) : null,
  );
  const [title, setTitle] = useState(service?.title ?? '');
  const [url, setUrl] = useState(service?.baseUrl ?? '');
  const [key, setKey] = useState('');
  const [enabled, setEnabled] = useState(service?.enabled ?? true);
  const [models, setModels] = useState<readonly ModelOption[]>(
    service?.models ?? [],
  );
  const [search, setSearch] = useState('');
  // The kinds people chose for models the provider lists before they are checked; a checked model keeps its own.
  const [kindOf, setKindOf] = useState<Readonly<Record<string, ModelKind>>>({});
  const [tests, setTests] = useState<Readonly<Record<string, ModelTest>>>({});
  const [added, setAdded] = useState('');
  const id = (part: string) => `ag-service-${part}`;

  // What is typed over the saved service: an empty key tries the saved one, or none when adding.
  const connection = (): ModelConnectionRequest => ({
    ...(service ? { service: service.name } : {}),
    ...(provider ? { provider: provider.name } : {}),
    baseUrl: baseUrlOf(url, provider),
    ...(key.trim() ? { apiKey: key.trim() } : service ? {} : { apiKey: null }),
  });
  const listed = useQuery({
    queryKey: agentsKeys.providerModels(service?.name ?? ''),
    queryFn: async () => {
      const answer = await api.providerModels(connection());
      if (!answer.ok) throw new Error(answer.message);
      return answer.items;
    },
    enabled:
      canManage &&
      service !== null &&
      (service.apiKeySet || !provider?.keyRequired),
    retry: false,
    staleTime: 5 * 60_000,
    // A new service's list is not kept for the next one added.
    gcTime: service ? undefined : 0,
  });
  // One model, checked as the kind it is given: a mismatch says which kind it answers as instead.
  const testModel = async (id: string, kind: ModelKind) => {
    setTests((current) => ({ ...current, [id]: { state: 'running' } }));
    const dimensions = offered.get(id)?.dimensions ?? null;
    let check: ModelCheck;
    try {
      check = await api.checkConnection({
        ...connection(),
        model: id,
        kind,
        dimensions: kind === 'embedding' ? dimensions : null,
      });
    } catch (error) {
      check = { ok: false, message: messageOf(error) };
    }
    setTests((current) => ({
      ...current,
      [id]: { state: 'done', kind, check },
    }));
  };
  const test = useMutation({
    mutationFn: (model: ModelOption) =>
      api.checkConnection({
        ...connection(),
        model: model.value,
        kind: model.kind,
        dimensions: model.dimensions,
      }),
  });
  const save = useMutation({
    mutationFn: (chosen: ModelProviderOption) => {
      const fields = {
        title: title.trim(),
        baseUrl: baseUrlOf(url, chosen),
        models: [...models],
        enabled,
        ...(key.trim() ? { apiKey: key.trim() } : {}),
      };
      return service
        ? api.updateService(service.name, fields)
        : api.createService({ ...fields, provider: chosen.name });
    },
    onSuccess: async (saved) => {
      // Its models are the catalog's: the default chat model and the agents' state follow from them.
      await queryClient.invalidateQueries({ queryKey: agentsKeys.all });
      notify.success(
        t(service ? 'services.service.saved' : 'services.add.created', {
          title: saved.title,
        }),
      );
      onDone();
    },
    onError: (error) => notify.error(error),
  });

  const choose = (name: string | null) => {
    const next = MODEL_PROVIDERS.find((option) => option.name === name);
    if (!next) return;
    if (
      !title.trim() ||
      (provider && title === newServiceTitle(provider, services))
    )
      setTitle(newServiceTitle(next, services));
    if (!url.trim() || url === provider?.defaultBaseUrl)
      setUrl(next.defaultBaseUrl ?? '');
    setProvider(next);
  };
  const addModel = () => {
    const value = added.trim();
    if (!value) return;
    setModels(toggleModel(models, value, true, provider));
    setAdded('');
  };

  const urlInvalid =
    !validBaseUrl(url) ||
    (provider !== null && !provider.defaultBaseUrl && !url.trim());
  const canSave =
    canManage && provider !== null && Boolean(title.trim()) && !urlInvalid;
  const connectionModel = testModelOf(models);
  const kinds = provider?.kinds ?? ['chat'];
  const kindItems = kinds.map((kind) => ({
    value: kind,
    label: t(`services.models.kinds.${kind}`),
  }));
  const offered = new Map(models.map((model) => [model.value, model]));
  const rows = modelRows(models, listed.data ?? []).map((row) =>
    row.on ? row : { ...row, kind: kindOf[row.id] ?? row.kind },
  );
  const changeKind = (id: string, kind: ModelKind) => {
    if (offered.has(id)) setModels(setModelKind(models, id, kind));
    else setKindOf((current) => ({ ...current, [id]: kind }));
    setTests(({ [id]: _dropped, ...rest }) => rest);
  };
  const query = search.trim().toLowerCase();
  const shown = query
    ? rows.filter((row) => row.id.toLowerCase().includes(query))
    : rows;
  const providerItems = MODEL_PROVIDERS.map((option) => ({
    value: option.name,
    label: option.title,
  }));

  return (
    <form
      className='flex min-h-0 flex-1 flex-col gap-4'
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave && provider && !save.isPending) save.mutate(provider);
      }}
    >
      <FieldGroup className='-mx-4 min-h-0 flex-1 gap-5 overflow-y-auto px-4'>
        {service ? null : (
          <Field>
            <FieldLabel htmlFor={id('provider')}>
              {t('services.add.provider')}
            </FieldLabel>
            <Select
              items={providerItems}
              value={provider?.name ?? null}
              onValueChange={(value: string | null) => choose(value)}
            >
              <SelectTrigger id={id('provider')} className='w-full'>
                <SelectValue placeholder={t('services.add.provider')} />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                {providerItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor={id('title')}>
            {t('services.service.name')}
          </FieldLabel>
          <Input
            id={id('title')}
            value={title}
            disabled={!canManage}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>

        <Field data-invalid={!validBaseUrl(url) || undefined}>
          <FieldLabel htmlFor={id('url')}>
            {t('services.connection.baseUrl')}
          </FieldLabel>
          <Input
            id={id('url')}
            className='font-mono'
            value={url}
            disabled={!canManage}
            aria-invalid={!validBaseUrl(url) || undefined}
            placeholder={provider?.defaultBaseUrl ?? 'https://'}
            onChange={(event) => setUrl(event.target.value)}
          />
          <FieldDescription>
            {!validBaseUrl(url)
              ? t('services.connection.baseUrlInvalid')
              : provider?.defaultBaseUrl
                ? t('services.connection.baseUrlHint', {
                    url: provider.defaultBaseUrl,
                  })
                : t('services.connection.baseUrlRequired')}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor={id('key')}>
            {t('services.connection.apiKey')}
          </FieldLabel>
          <SecretInput
            id={id('key')}
            isSet={service?.apiKeySet ?? false}
            placeholder={t('services.connection.keyPlaceholder')}
            value={key}
            disabled={!canManage}
            onChange={(event) => setKey(event.target.value)}
          />
        </Field>

        {isOpenCodeUrl(url.trim()) ? (
          <p role='note' className='text-sm text-muted-foreground'>
            {t('services.connection.openCodeHint')}
          </p>
        ) : null}

        {canManage ? (
          <div className='flex flex-wrap items-center gap-3'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!connectionModel || !provider || test.isPending}
              onClick={() => {
                if (connectionModel) test.mutate(connectionModel);
              }}
            >
              {test.isPending ? <Spinner data-icon='inline-start' /> : null}
              {test.isPending
                ? t('services.connection.testing')
                : t('services.connection.test')}
            </Button>
            <p role='status' className='text-sm'>
              {!connectionModel ? (
                <span className='text-muted-foreground'>
                  {t('services.connection.testNeedsModel')}
                </span>
              ) : test.isError || (test.data && !test.data.ok) ? (
                <span className='text-destructive'>
                  {t('services.connection.testFailed', {
                    model: test.variables?.value,
                    message: test.isError
                      ? messageOf(test.error)
                      : (test.data?.message ?? ''),
                  })}
                </span>
              ) : test.data ? (
                <span className='text-foreground'>
                  {t('services.connection.testOk', {
                    model: test.variables?.value,
                  })}
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        <section className='flex flex-col gap-3' aria-labelledby={id('models')}>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='min-w-0'>
              <h3 id={id('models')} className='text-sm font-medium'>
                {t('services.models.title')}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {t('services.models.description')}
              </p>
            </div>
            {canManage ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={!provider || listed.isFetching}
                onClick={() => void listed.refetch()}
              >
                <RefreshCwIcon data-icon='inline-start' />
                {t('services.models.fetch')}
              </Button>
            ) : null}
          </div>
          {listed.isFetching ? (
            <p
              role='status'
              className='flex items-center gap-2 text-sm text-muted-foreground'
            >
              <Spinner />
              {t('services.models.fetching')}
            </p>
          ) : listed.isError ? (
            <p role='alert' className='text-sm text-destructive'>
              {t('services.models.fetchFailed', {
                message: messageOf(listed.error),
              })}
            </p>
          ) : null}
          {rows.length > SEARCH_FROM ? (
            <Input
              type='search'
              aria-label={t('services.models.search')}
              placeholder={t('services.models.search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          ) : null}
          {rows.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('services.models.empty')}
            </p>
          ) : shown.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('services.models.noMatch')}
            </p>
          ) : (
            <ul
              className='flex max-h-72 flex-col overflow-y-auto rounded-lg border p-1'
              aria-label={t('services.models.title')}
            >
              {shown.map((row) => {
                const model = offered.get(row.id);
                const tested = tests[row.id];
                return (
                  <li
                    key={row.id}
                    aria-label={row.id}
                    className='flex min-w-0 flex-col rounded-md pr-1 hover:bg-muted/50'
                  >
                    <div className='flex min-w-0 items-center gap-2'>
                      <label className='flex min-w-0 flex-1 items-center gap-2.5 px-2 py-1.5'>
                        <Checkbox
                          checked={row.on}
                          aria-label={row.id}
                          disabled={!canManage}
                          onCheckedChange={(on: boolean) =>
                            setModels(
                              toggleModel(
                                models,
                                row.id,
                                on,
                                provider,
                                row.kind,
                              ),
                            )
                          }
                        />
                        <span className='truncate font-mono text-sm'>
                          {row.id}
                        </span>
                      </label>
                      {model && model.kind === 'embedding' ? (
                        <Input
                          type='number'
                          min={1}
                          max={8192}
                          inputMode='numeric'
                          className='h-7 w-24 shrink-0'
                          aria-label={t('services.models.dimensions', {
                            model: row.id,
                          })}
                          placeholder={t(
                            'services.models.dimensionsPlaceholder',
                          )}
                          disabled={!canManage}
                          value={model.dimensions ?? ''}
                          onChange={(event) =>
                            setModels(
                              setModelDimensions(
                                models,
                                row.id,
                                event.target.value,
                              ),
                            )
                          }
                        />
                      ) : null}
                      {kinds.length > 1 && canManage ? (
                        <Select
                          items={kindItems}
                          value={row.kind}
                          onValueChange={(value: string | null) => {
                            if (value) changeKind(row.id, value as ModelKind);
                          }}
                        >
                          <SelectTrigger
                            size='sm'
                            className='w-28 shrink-0'
                            aria-label={t('services.models.kind', {
                              model: row.id,
                            })}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                            {kindItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant={row.on ? 'secondary' : 'outline'}
                          className='shrink-0'
                          data-testid='ag-model-kind'
                        >
                          {t(`services.models.kinds.${row.kind}`)}
                        </Badge>
                      )}
                      {canManage ? (
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-sm'
                          className='shrink-0'
                          aria-label={t('services.models.test', {
                            model: row.id,
                          })}
                          title={t('services.models.test', { model: row.id })}
                          disabled={!provider || tested?.state === 'running'}
                          onClick={() => void testModel(row.id, row.kind)}
                        >
                          {tested?.state === 'running' ? (
                            <Spinner />
                          ) : (
                            <FlaskConicalIcon />
                          )}
                        </Button>
                      ) : null}
                    </div>
                    {tested?.state === 'done' ? (
                      <ModelTestResult
                        kind={tested.kind}
                        check={tested.check}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {canManage ? (
            <div className='flex gap-2'>
              <Input
                className='font-mono'
                aria-label={t('services.models.addPlaceholder')}
                placeholder={t('services.models.addPlaceholder')}
                value={added}
                onChange={(event) => setAdded(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  addModel();
                }}
              />
              <Button
                type='button'
                variant='outline'
                disabled={!added.trim()}
                onClick={addModel}
              >
                <PlusIcon data-icon='inline-start' />
                {t('services.models.add')}
              </Button>
            </div>
          ) : null}
        </section>

        <Field orientation='horizontal'>
          <FieldContent>
            <FieldLabel htmlFor={id('enabled')}>
              {t('services.service.enabled')}
            </FieldLabel>
            <FieldDescription>
              {t('services.service.enabledHint')}
            </FieldDescription>
          </FieldContent>
          <Switch
            id={id('enabled')}
            checked={enabled}
            disabled={!canManage}
            onCheckedChange={setEnabled}
          />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type='button' variant='outline' />}>
          {t(canManage ? 'actions.cancel' : 'actions.close')}
        </DialogClose>
        {canManage ? (
          <Button type='submit' disabled={!canSave || save.isPending}>
            {save.isPending ? <Spinner data-icon='inline-start' /> : null}
            {t('actions.save')}
          </Button>
        ) : null}
      </DialogFooter>
    </form>
  );
}

/** What a model's own test found: that it answered as its kind, that it looks like another kind, or why it failed. */
function ModelTestResult({
  kind,
  check,
}: {
  readonly kind: ModelKind;
  readonly check: ModelCheck;
}): ReactElement {
  const { t } = useTranslation();
  const noun = (of: ModelKind) => t(`services.models.kindNouns.${of}`);
  return (
    <p
      role='status'
      className={
        check.ok
          ? 'px-2 pb-1.5 text-xs text-muted-foreground'
          : 'px-2 pb-1.5 text-xs break-words text-destructive'
      }
    >
      {check.ok
        ? t('services.models.testOk', { kind: noun(kind) })
        : check.looksLike
          ? t('services.models.looksLike', {
              notKind: t(`services.models.notKind.${kind}`),
              kind: noun(check.looksLike),
            })
          : t('services.models.testFailed', { message: check.message ?? '' })}
    </p>
  );
}
