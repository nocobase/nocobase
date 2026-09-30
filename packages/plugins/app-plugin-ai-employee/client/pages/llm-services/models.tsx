import { CircleAlert, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useOutletContext, useParams } from 'react-router';
import { RouteDialog } from '../../components/route-dialog.js';
import { useRouteOverlay } from '../../components/use-route-overlay.js';
import { useLeaveGuard } from '../../components/use-leave-guard.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { ConfirmDialog } from '../../components/confirm-dialog.js';
import { Button } from '../../components/ui/button.js';
import { Field, FieldLabel } from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group.js';
import {
  normalizeEnabledModels,
  prepareEnabledModels,
  type EnabledModel,
  type EnabledModelsConfig,
  type LLMService,
} from '../../llm-service-service.js';
import { useT } from '../../locales/index.js';
import type { LLMServicesContext } from './context.js';
import { ModelMultiSelect } from './model-multi-select.js';

export default function ModelsPage(): ReactElement {
  const context = useOutletContext<LLMServicesContext>();
  const { serviceName } = useParams();
  const t = useT();
  const service = context.services.find((item) => item.name === serviceName);
  if (context.loading || context.loadError || !service) {
    return (
      <RouteDialog title={t('Edit models')}>
        {context.loading ? (
          <p role='status'>{t('Loading…')}</p>
        ) : (
          <p role='alert' className='text-sm text-destructive'>
            {context.loadError ?? t('LLM service not found.')}
          </p>
        )}
      </RouteDialog>
    );
  }
  return <ModelEditor key={service.name} service={service} context={context} />;
}

function ModelEditor({
  service,
  context,
}: {
  service: LLMService;
  context: LLMServicesContext;
}): ReactElement {
  const { ai, onSaved } = context;
  const t = useT();
  const id = useId();
  const [savedConfig, setSavedConfig] = useState<EnabledModelsConfig>(() =>
    normalizeEnabledModels(service.enabledModels),
  );
  const [config, setConfig] = useState<EnabledModelsConfig>(() =>
    normalizeEnabledModels(service.enabledModels),
  );
  const nextCustomModelKeyRef = useRef(config.models.length);
  const [customModelKeys, setCustomModelKeys] = useState<string[]>(() =>
    config.models.map((_, index) => `${service.name}-model-${index}`),
  );
  const [providerModels, setProviderModels] = useState<EnabledModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);
  const modelRequestRef = useRef(0);
  const dirty = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const guard = useLeaveGuard({ dirty, pending });
  const { reportLeaveState } = context;
  useEffect(() => {
    reportLeaveState({ dirty, pending });
  }, [dirty, pending, reportLeaveState]);
  useEffect(
    () => () => reportLeaveState({ dirty: false, pending: false }),
    [reportLeaveState],
  );
  const loadProviderModels = useCallback(
    async (searchValue: string): Promise<void> => {
      const request = ++modelRequestRef.current;
      setLoading(true);
      try {
        const models = await ai.listProviderModels(service.name, searchValue);
        if (mountedRef.current && request === modelRequestRef.current)
          setProviderModels(models);
      } catch (cause) {
        if (mountedRef.current && request === modelRequestRef.current)
          setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (mountedRef.current && request === modelRequestRef.current)
          setLoading(false);
      }
    },
    [ai, service.name],
  );
  useEffect(() => {
    mountedRef.current = true;
    void loadProviderModels('');
    return () => {
      mountedRef.current = false;
      modelRequestRef.current += 1;
    };
  }, [loadProviderModels]);
  const save = async (): Promise<boolean> => {
    if (pendingRef.current) return false;
    pendingRef.current = true;
    setPending(true);
    setError(undefined);
    try {
      const enabledModels = prepareEnabledModels(config);
      const result = await ai.updateLLMServiceEnabledModels(
        service.name,
        enabledModels,
      );
      if (!mountedRef.current) return false;
      const nextConfig = normalizeEnabledModels(result.enabledModels);
      setSavedConfig(nextConfig);
      setConfig(nextConfig);
      onSaved(result);
      guard.release();
      return true;
    } catch (cause) {
      if (mountedRef.current)
        setError(cause instanceof Error ? cause.message : String(cause));
      return false;
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) setPending(false);
    }
  };
  return (
    <RouteDialog
      title={t('Edit models')}
      beforeClose={guard.confirmLeave}
      footer={
        <EditorActions
          pending={pending}
          confirming={guard.confirming}
          save={save}
          reportError={setError}
        />
      }
      className='sm:max-w-xl'
    >
      <div className='space-y-4'>
        <Alert role='note'>
          <CircleAlert aria-hidden='true' />
          <AlertDescription>
            {t(
              'Configure LLM models. Embedding models do not need to be added.',
            )}
          </AlertDescription>
        </Alert>
        <RadioGroup
          aria-label={t('Model source')}
          value={config.mode}
          disabled={pending}
          onValueChange={(mode: unknown) => {
            if (
              pendingRef.current ||
              (mode !== 'provider' && mode !== 'custom') ||
              mode === config.mode
            )
              return;
            setConfig({ mode, models: [] });
            setCustomModelKeys([]);
            if (mode === 'provider') void loadProviderModels('');
          }}
        >
          <Field orientation='horizontal' className='w-fit'>
            <RadioGroupItem id={`${id}-provider`} value='provider' />
            <FieldLabel htmlFor={`${id}-provider`} className='font-normal'>
              {t('Select models')}
            </FieldLabel>
          </Field>
          {config.mode === 'provider' && (
            <div className='pl-6'>
              <ModelMultiSelect
                disabled={pending}
                loading={loading}
                models={providerModels}
                value={config.models}
                onSearch={(value) => void loadProviderModels(value)}
                onChange={(models) => {
                  if (!pendingRef.current)
                    setConfig({ mode: 'provider', models });
                }}
              />
            </div>
          )}
          <Field orientation='horizontal' className='w-fit'>
            <RadioGroupItem id={`${id}-custom`} value='custom' />
            <FieldLabel htmlFor={`${id}-custom`} className='font-normal'>
              {t('Manual input')}
            </FieldLabel>
          </Field>
        </RadioGroup>
        {config.mode === 'custom' && (
          <fieldset disabled={pending} className='space-y-2 pl-6'>
            {config.models.map((model, index) => (
              <div key={customModelKeys[index]} className='flex gap-2'>
                <Input
                  className='min-w-0 flex-1'
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
                <Input
                  className='min-w-0 flex-1'
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
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  aria-label={t('Remove model {{number}}', {
                    number: index + 1,
                  })}
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
                  <X className='size-4' />
                </Button>
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              className='w-full border-dashed'
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
            </Button>
          </fieldset>
        )}
        {error && (
          <div role='alert' className='text-sm text-destructive'>
            {error}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={guard.confirming}
        title={t('Discard unsaved changes?')}
        description={t('Your changes have not been saved.')}
        confirmLabel={t('Discard changes')}
        cancelLabel={t('Keep editing')}
        onConfirm={guard.confirm}
        onOpenChange={(open) => {
          if (!open) guard.cancel();
        }}
      />
    </RouteDialog>
  );
}

function EditorActions({
  pending,
  confirming,
  save,
  reportError,
}: {
  pending: boolean;
  confirming: boolean;
  save: () => Promise<boolean>;
  reportError: (error: string) => void;
}): ReactElement {
  const t = useT();
  const { close, isClosing } = useRouteOverlay();
  const closeEditor = (): void => {
    void close().catch((cause: unknown) =>
      reportError(cause instanceof Error ? cause.message : String(cause)),
    );
  };
  return (
    <>
      <Button
        variant='outline'
        disabled={pending || isClosing || confirming}
        onClick={closeEditor}
      >
        {t('Cancel')}
      </Button>
      <Button
        disabled={pending || isClosing || confirming}
        onClick={() => {
          void save().then((saved) => {
            if (saved) closeEditor();
          });
        }}
      >
        {t('Submit')}
      </Button>
    </>
  );
}
