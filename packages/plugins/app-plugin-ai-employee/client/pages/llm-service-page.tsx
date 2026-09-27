import { Check, ChevronDown, CircleAlert, Pencil, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  normalizeEnabledModels,
  prepareEnabledModels,
  type EnabledModel,
  type EnabledModelsConfig,
  type LLMService,
  type LLMProvider,
} from '../llm-service-service.js';
import { useT } from '../locales/index.js';

import { Button } from '../../registry/nocobase-ai/shared/ui/button.js';
import { Combobox } from '@base-ui/react/combobox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../registry/nocobase-ai/shared/ui/dialog.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../registry/nocobase-ai/shared/ui/table.js';
import {
  useAIEmployeeClient,
  type AIEmployeeClient,
} from '../ai-employee-client.js';
export default function LLMServicePage(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const [services, setServices] = useState<LLMService[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<LLMService>();
  useEffect(() => {
    setLoading(true);
    setError(undefined);
    void Promise.all([ai.listLLMServices(), ai.listLLMProviders()])
      .then(([nextServices, nextProviders]) => {
        setServices(nextServices);
        setProviders(nextProviders);
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [ai]);
  const toggle = async (service: LLMService, enabled: boolean) => {
    setServices((items) =>
      items.map((item) =>
        item.name === service.name ? { ...item, enabled } : item,
      ),
    );
    try {
      await ai.updateLLMServiceEnabled(service.name, enabled);
    } catch (e) {
      setServices((items) =>
        items.map((item) => (item.name === service.name ? service : item)),
      );
      setError(String(e));
    }
  };
  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {error && (
        <div
          role='alert'
          className='rounded-md border border-destructive p-3 text-sm'
        >
          {error}
        </div>
      )}
      <div className='overflow-hidden rounded-xl border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12 text-center'>#</TableHead>
              <TableHead>{t('UID')}</TableHead>
              <TableHead>{t('Title')}</TableHead>
              <TableHead>{t('Provider')}</TableHead>
              <TableHead>{t('Models')}</TableHead>
              <TableHead>{t('Enabled')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || (!error && !services.length) ? (
              <TableRow>
                <TableCell
                  className='px-3 py-10 text-center text-muted-foreground'
                  colSpan={6}
                >
                  {loading ? t('Loading…') : t('No LLM services configured.')}
                </TableCell>
              </TableRow>
            ) : null}
            {services.map((service, index) => (
              <TableRow key={service.name}>
                <TableCell className='text-center text-muted-foreground'>
                  {index + 1}
                </TableCell>
                <TableCell className='font-mono text-xs'>
                  {service.name}
                </TableCell>
                <TableCell>{service.title}</TableCell>
                <TableCell>
                  <ProviderCell
                    name={service.provider}
                    provider={providers.find(
                      (item) => item.name === service.provider,
                    )}
                  />
                </TableCell>
                <TableCell>
                  <ModelsCell
                    service={service}
                    onEdit={() => setEditing(service)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={service.enabled}
                    label={t('Enable {{name}}', { name: service.name })}
                    onCheckedChange={(enabled) => void toggle(service, enabled)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editing && (
        <ModelEditor
          ai={ai}
          service={editing}
          onClose={() => setEditing(undefined)}
          onSaved={(next) => {
            setServices((items) =>
              items.map((item) => (item.name === next.name ? next : item)),
            );
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}

function ProviderCell({
  name,
  provider,
}: {
  name: string;
  provider?: LLMProvider;
}): ReactElement {
  const t = useT();
  const supportedModel = provider?.supportedModel ?? ['LLM'];
  return (
    <div className='min-w-0'>
      <div className='truncate'>{provider?.title ?? name}</div>
      <div className='mt-1 flex flex-wrap gap-1'>
        {supportedModel.map((modelType) => (
          <span
            key={modelType}
            className='rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'
          >
            {modelType === 'EMBEDDING' ? t('Embedding') : t('LLM')}
          </span>
        ))}
      </div>
    </div>
  );
}

function ModelsCell({
  service,
  onEdit,
}: {
  service: LLMService;
  onEdit: () => void;
}): ReactElement {
  const t = useT();
  const config = normalizeEnabledModels(service.enabledModels);
  const models = config.models;
  return (
    <div className='flex max-w-xl items-center gap-2'>
      <button
        type='button'
        aria-label={t('Edit models for {{name}}', { name: service.name })}
        title={t('Edit models')}
        className='shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        onClick={onEdit}
      >
        <Pencil className='h-4 w-4' />
      </button>
      <div className='flex min-w-0 flex-wrap gap-1'>
        {models.length ? (
          models.map((model) => (
            <span
              key={model.value}
              title={model.value}
              className='max-w-48 truncate rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground'
            >
              {model.label}
            </span>
          ))
        ) : (
          <span className='py-0.5 text-xs text-muted-foreground'>
            {t('No models')}
          </span>
        )}
      </div>
    </div>
  );
}
function Switch({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}): ReactElement {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${checked ? 'bg-primary' : 'bg-input'}`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function ModelMultiSelect({
  disabled,
  loading,
  models,
  value,
  onChange,
  onSearch,
  placeholder,
  removeLabel,
}: {
  disabled: boolean;
  loading: boolean;
  models: EnabledModel[];
  value: EnabledModel[];
  onChange: (value: EnabledModel[]) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  removeLabel: string;
}): ReactElement {
  const t = useT();
  return (
    <Combobox.Root
      multiple
      disabled={disabled}
      items={models}
      value={value}
      onValueChange={onChange}
      onInputValueChange={onSearch}
      isItemEqualToValue={(item, selected) => item.value === selected.value}
      filter={(item, query) => {
        const search = query.trim().toLocaleLowerCase();
        return `${item.label} ${item.value}`
          .toLocaleLowerCase()
          .includes(search);
      }}
    >
      <Combobox.InputGroup className='flex min-h-10 w-full items-center gap-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring'>
        <Combobox.Value>
          {(selected: EnabledModel[]) => (
            <Combobox.Chips className='flex min-w-0 flex-1 flex-wrap items-center gap-1'>
              {selected.map((model) => (
                <Combobox.Chip
                  key={model.value}
                  aria-label={model.label}
                  className='flex max-w-full items-center gap-1 rounded bg-muted px-2 py-0.5 outline-none focus-within:ring-2 focus-within:ring-ring'
                >
                  <span className='truncate' title={model.value}>
                    {model.label}
                  </span>
                  <Combobox.ChipRemove
                    aria-label={`${removeLabel} ${model.label}`}
                    className='shrink-0 rounded-sm text-muted-foreground hover:text-foreground'
                  >
                    <X className='size-3' />
                  </Combobox.ChipRemove>
                </Combobox.Chip>
              ))}
              <Combobox.Input
                aria-label={t('Search provider models')}
                placeholder={selected.length ? t('Search models') : placeholder}
                className='min-w-16 flex-1 bg-transparent outline-none placeholder:text-muted-foreground'
              />
            </Combobox.Chips>
          )}
        </Combobox.Value>
        <Combobox.Trigger
          aria-label={t('Select models')}
          className='shrink-0 rounded-sm text-muted-foreground hover:text-foreground'
        >
          <ChevronDown className='size-4' />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner
          align='start'
          sideOffset={4}
          className='isolate z-50'
        >
          <Combobox.Popup className='max-h-[min(var(--available-height),340px)] w-(--anchor-width) max-w-(--available-width) overflow-y-auto overscroll-contain rounded-lg bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10'>
            {loading && (
              <p
                role='status'
                className='px-3 py-2 text-sm text-muted-foreground'
              >
                {t('Loading…')}
              </p>
            )}
            {!loading && (
              <Combobox.Empty className='px-3 py-2 text-sm text-muted-foreground'>
                {t('No models')}
              </Combobox.Empty>
            )}
            <Combobox.List aria-label={t('Select models')}>
              {(model: EnabledModel) => (
                <Combobox.Item
                  key={model.value}
                  value={model}
                  className='flex w-full cursor-default items-center gap-2 py-1.5 pr-3 pl-2 text-left text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground'
                >
                  <span className='flex size-4 shrink-0 items-center justify-center'>
                    <Combobox.ItemIndicator>
                      <Check className='size-4' />
                    </Combobox.ItemIndicator>
                  </span>
                  <span className='block min-w-0 truncate' title={model.value}>
                    {model.label}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function ModelEditor({
  ai,
  service,
  onClose,
  onSaved,
}: {
  ai: AIEmployeeClient;
  service: LLMService;
  onClose: () => void;
  onSaved: (service: LLMService) => void;
}): ReactElement {
  const t = useT();
  const [config, setConfig] = useState<EnabledModelsConfig>(() => {
    const normalized = normalizeEnabledModels(service.enabledModels);
    return normalized.mode === 'custom'
      ? normalized
      : { mode: 'provider', models: normalized.models };
  });
  const nextCustomModelKeyRef = useRef(config.models.length);
  const [customModelKeys, setCustomModelKeys] = useState<string[]>(() =>
    config.models.map((_, index) => `${service.name}-model-${index}`),
  );
  const [providerModels, setProviderModels] = useState<EnabledModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const modelRequestRef = useRef(0);

  const loadProviderModels = useCallback(
    async (searchValue: string): Promise<void> => {
      const request = ++modelRequestRef.current;
      setLoading(true);
      try {
        const models = await ai.listProviderModels(service.name, searchValue);
        if (request === modelRequestRef.current) setProviderModels(models);
      } catch (loadError) {
        if (request === modelRequestRef.current) setError(String(loadError));
      } finally {
        if (request === modelRequestRef.current) setLoading(false);
      }
    },
    [ai, service.name],
  );

  useEffect(() => {
    void loadProviderModels('');
  }, [loadProviderModels]);

  const save = async (): Promise<void> => {
    try {
      const enabledModels = prepareEnabledModels(config);
      onSaved(
        await ai.updateLLMServiceEnabledModels(service.name, enabledModels),
      );
    } catch (saveError) {
      setError(String(saveError));
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-modal='true'
        className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl'
      >
        <DialogHeader>
          <DialogTitle>{t('Edit models')}</DialogTitle>
        </DialogHeader>
        <div className='flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground'>
          <CircleAlert className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
          <span>
            {t(
              'Configure LLM models. Embedding models do not need to be added.',
            )}
          </span>
        </div>
        <fieldset className='space-y-4'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='radio'
              name='model-mode'
              value='provider'
              checked={config.mode === 'provider'}
              onChange={() => {
                setConfig({ mode: 'provider', models: [] });
                void loadProviderModels('');
              }}
            />
            {t('Select models')}
          </label>
          {config.mode === 'provider' && (
            <div className='space-y-2 pl-6'>
              <ModelMultiSelect
                disabled={false}
                loading={loading}
                models={providerModels}
                value={config.models}
                onSearch={(value) => void loadProviderModels(value)}
                onChange={(models) => setConfig({ mode: 'provider', models })}
                placeholder={t('Select models to enable')}
                removeLabel={t('Remove')}
              />
            </div>
          )}
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='radio'
              name='model-mode'
              value='custom'
              checked={config.mode === 'custom'}
              onChange={() => {
                setConfig({ mode: 'custom', models: [] });
                setCustomModelKeys([]);
              }}
            />
            {t('Manual input')}
          </label>
          {config.mode === 'custom' && (
            <div className='space-y-2 pl-6'>
              {config.models.map((model, index) => (
                <div key={customModelKeys[index]} className='flex gap-2'>
                  <input
                    className='min-w-0 flex-1 rounded border px-3 py-2 text-sm'
                    aria-label={t('Model ID')}
                    placeholder={t('Model ID')}
                    value={model.value}
                    onChange={(event) =>
                      setConfig({
                        mode: 'custom',
                        models: config.models.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, value: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <input
                    className='min-w-0 flex-1 rounded border px-3 py-2 text-sm'
                    aria-label={t('Model label')}
                    placeholder={t('Display name')}
                    value={model.label}
                    onChange={(event) =>
                      setConfig({
                        mode: 'custom',
                        models: config.models.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, label: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <button
                    type='button'
                    aria-label={t('Remove model {{number}}', {
                      number: index + 1,
                    })}
                    className='rounded px-2 text-muted-foreground hover:bg-muted'
                    onClick={() => {
                      setConfig({
                        mode: 'custom',
                        models: config.models.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      });
                      setCustomModelKeys((keys) =>
                        keys.filter((_, itemIndex) => itemIndex !== index),
                      );
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type='button'
                className='w-full rounded border border-dashed px-3 py-2 text-sm'
                onClick={() => {
                  const key = `${service.name}-model-${nextCustomModelKeyRef.current++}`;
                  setConfig({
                    mode: 'custom',
                    models: [...config.models, { label: '', value: '' }],
                  });
                  setCustomModelKeys((keys) => [...keys, key]);
                }}
              >
                {t('Add model')}
              </button>
            </div>
          )}
        </fieldset>
        {error && (
          <div role='alert' className='text-sm text-destructive'>
            {error}
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button onClick={() => void save()}>{t('Submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
