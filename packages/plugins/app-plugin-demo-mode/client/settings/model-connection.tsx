import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useEffect, useState, type ReactElement } from 'react';

import type { DemoModelService } from '../../shared/model-services.js';
import { Input } from '../components/ui/input.js';
import { Switch } from '../components/ui/switch.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { Button } from './components.js';
import { type Configuration, useT } from './context.js';
import { ErrorAlert, SettingRow } from './shared.js';

type Model = { modelService: string; model: string };

/** Connections are saved in Agents independently of the surrounding demo policy draft. */
export function ModelConnection({
  model,
  onChange,
  disabled,
  configuration,
  onPending,
  onSaving,
}: {
  readonly model: Model;
  readonly onChange: (model: Model) => void;
  readonly disabled: boolean;
  readonly configuration: Configuration;
  readonly onPending: (pending: boolean) => void;
  readonly onSaving: (saving: boolean) => void;
}): ReactElement {
  const t = useT();
  const api = useApiClient();
  const read = useCan({
    resource: { type: 'settings', id: 'agents.services' },
    action: 'read',
  });
  const manage = useCan({
    resource: { type: 'settings', id: 'agents.services' },
    action: 'manage',
  });
  const [services, setServices] = useState<readonly DemoModelService[]>();
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!read.can) return;
    let active = true;
    api
      .request<{ data: DemoModelService[] }>({
        path: '/demoMode/configuration/modelServices',
      })
      .then(({ data }) => {
        if (active) {
          setServices(data);
          setError(undefined);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause);
      });
    return () => {
      active = false;
    };
  }, [api, read.can, attempt]);
  const current = services?.find(
    (service) => service.name === model.modelService,
  );
  const known = !model.modelService || Boolean(current);
  return (
    <div className='grid gap-3 rounded-lg border p-4 sm:grid-cols-2'>
      <label className='flex flex-col gap-2 text-sm font-medium'>
        {t('simulation.chat.service')}
        {services ? (
          <Select
            value={model.modelService || '__new__'}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== null) {
                setSaved(false);
                onChange({
                  ...model,
                  modelService: value === '__new__' ? '' : value,
                });
              }
            }}
          >
            <SelectTrigger aria-label={t('simulation.chat.service')}>
              <SelectValue>
                {current?.title ??
                  (model.modelService || t('simulation.chat.connection.new'))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {manage.can ? (
                <SelectItem value='__new__'>
                  {t('simulation.chat.connection.new')}
                </SelectItem>
              ) : null}
              {!known ? (
                <SelectItem value={model.modelService}>
                  {model.modelService}
                </SelectItem>
              ) : null}
              {services.map((service) => (
                <SelectItem
                  key={service.name}
                  value={service.name}
                  disabled={!service.enabled}
                >
                  {service.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            disabled={disabled}
            value={model.modelService}
            onChange={(event) =>
              onChange({ ...model, modelService: event.target.value })
            }
          />
        )}
      </label>
      <label className='flex flex-col gap-2 text-sm font-medium'>
        {t('simulation.chat.modelId')}
        <Input
          required
          disabled={disabled}
          value={model.model}
          onChange={(event) =>
            onChange({ ...model, model: event.target.value })
          }
        />
      </label>
      <div className='sm:col-span-2'>
        <ErrorAlert
          error={error}
          action={
            <Button
              variant='outline'
              onClick={() => setAttempt((value) => value + 1)}
            >
              {t('retry')}
            </Button>
          }
        />
        {services && known ? (
          <ConnectionFields
            key={model.modelService || '__new__'}
            service={current}
            model={model.model}
            disabled={disabled || !manage.can}
            configuration={configuration}
            onPending={onPending}
            onSaving={onSaving}
            onSaved={(service) => {
              setServices((items) => [
                ...(items ?? []).filter((item) => item.name !== service.name),
                service,
              ]);
              onChange({ ...model, modelService: service.name });
              setSaved(true);
            }}
          />
        ) : null}
        {saved ? (
          <p role='status' className='mt-2 text-sm text-muted-foreground'>
            {t('simulation.chat.connection.saved')}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ConnectionFields({
  service,
  model,
  disabled,
  configuration,
  onSaved,
  onPending,
  onSaving,
}: {
  readonly service?: DemoModelService;
  readonly model: string;
  readonly disabled: boolean;
  readonly configuration: Configuration;
  readonly onSaved: (service: DemoModelService) => void;
  readonly onPending: (pending: boolean) => void;
  readonly onSaving: (saving: boolean) => void;
}): ReactElement {
  const t = useT();
  const api = useApiClient();
  const [baseUrl, setBaseUrl] = useState(service?.baseUrl ?? '');
  const [apiKey, setApiKey] = useState('');
  const [clearKey, setClearKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const missingModel =
    Boolean(model.trim()) &&
    !service?.models.some(
      (item) => item.kind === 'chat' && item.value === model.trim(),
    );
  const dirty =
    baseUrl !== (service?.baseUrl ?? '') || Boolean(apiKey) || clearKey;
  const pending = dirty || missingModel || !service || saving;
  const { onDirty } = configuration;
  useEffect(() => {
    onDirty('modelConnection', dirty);
    onPending(pending);
    return () => {
      onDirty('modelConnection', false);
      onPending(false);
    };
  }, [dirty, pending, onDirty, onPending]);
  const discard = () => {
    setBaseUrl(service?.baseUrl ?? '');
    setApiKey('');
    setClearKey(false);
    setError(undefined);
  };
  const save = async () => {
    setSaving(true);
    onSaving(true);
    setError(undefined);
    try {
      const { data } = await api.request<{ data: DemoModelService }>({
        path: '/demoMode/configuration/modelServices',
        method: 'POST',
        json: {
          service: service?.name ?? null,
          baseUrl: baseUrl.trim() || null,
          model: model.trim(),
          ...(clearKey
            ? { apiKey: null }
            : apiKey.trim()
              ? { apiKey: apiKey.trim() }
              : {}),
        },
      });
      setBaseUrl(data.baseUrl ?? '');
      setApiKey('');
      setClearKey(false);
      onSaved(data);
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
      onSaving(false);
    }
  };
  return (
    <div className='grid gap-3'>
      <p className='text-sm text-muted-foreground'>
        {service
          ? t('simulation.chat.connection.shared')
          : t('simulation.chat.connection.createHelp')}
      </p>
      <label className='flex flex-col gap-2 text-sm font-medium'>
        {t('simulation.chat.connection.endpoint')}
        <Input
          type='url'
          placeholder='https://api.example.com/v1'
          disabled={disabled || saving}
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
        />
      </label>
      <label className='flex flex-col gap-2 text-sm font-medium'>
        {t('simulation.chat.connection.apiKey')}
        <Input
          type='password'
          autoComplete='new-password'
          disabled={disabled || saving || clearKey}
          value={apiKey}
          placeholder={
            service?.apiKeySet
              ? t('simulation.chat.connection.keepKey')
              : t('simulation.chat.connection.enterKey')
          }
          onChange={(event) => setApiKey(event.target.value)}
        />
      </label>
      {service?.apiKeySet ? (
        <SettingRow
          label={t('simulation.chat.connection.clearKey')}
          htmlFor='demo-clear-model-key'
        >
          <Switch
            id='demo-clear-model-key'
            checked={clearKey}
            disabled={disabled || saving}
            onCheckedChange={(value) => {
              setClearKey(value);
              setApiKey('');
            }}
          />
        </SettingRow>
      ) : null}
      <ErrorAlert error={error} />
      <div className='flex justify-end gap-2'>
        <Button
          variant='outline'
          disabled={disabled || saving || !dirty}
          onClick={discard}
        >
          {t('cancel')}
        </Button>
        <Button
          disabled={
            disabled ||
            saving ||
            (!dirty && !missingModel) ||
            (!service && !baseUrl.trim()) ||
            !model.trim()
          }
          onClick={() => void save()}
        >
          {t('simulation.chat.connection.save')}
        </Button>
      </div>
    </div>
  );
}
