import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import type { ModelService } from '@nocobase/app-plugin-agents/shared/models';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { ModelsLink } from '#components/online-agent/models-link';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { Textarea } from '#components/ui/textarea';
import {
  TRANSLATION_LANGUAGES,
  TRANSLATION_MAX_LENGTH,
  type TranslationInput,
  type TranslationResult,
} from '../../../shared/ai-translation.js';

type Catalog =
  | { phase: 'loading' }
  | { phase: 'ready'; data: ModelService[] }
  | { phase: 'error'; error: unknown };

export default function AiTranslationPage(): ReactElement | null {
  const { session, isPending } = useAuthentication();
  const userId = isPending ? undefined : session?.user.id;
  // A fresh identity gets a fresh draft, model catalog and request lifetime.
  return userId ? <TranslationDemo key={userId} /> : null;
}

function TranslationDemo(): ReactElement {
  const api = useApiClient();
  const toaster = useToaster();
  const { refresh } = useAuthentication();
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState<Catalog>({ phase: 'loading' });
  const [reload, setReload] = useState(0);
  const [modelKey, setModelKey] = useState('');
  const [text, setText] = useState('');
  const [sourceLanguage, setSourceLanguage] =
    useState<TranslationInput['sourceLanguage']>('auto');
  const [targetLanguage, setTargetLanguage] =
    useState<TranslationInput['targetLanguage']>('en');
  const [translation, setTranslation] = useState('');
  const [validation, setValidation] = useState<'required' | 'limit' | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [denied, setDenied] = useState<401 | 403 | null>(null);
  const originalRef = useRef<HTMLTextAreaElement>(null);
  const busyRef = useRef(false);
  const lifetimeRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    lifetimeRef.current = controller;
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void api
      .request<{ data: ModelService[] }>({
        path: 'agents/models',
        query: { kind: 'chat' },
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setCatalog({ phase: 'ready', data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setCatalog({ phase: 'error', error });
        },
      );
    return () => controller.abort();
  }, [api, reload]);

  const models =
    catalog.phase === 'ready'
      ? catalog.data.flatMap((service) =>
          service.models
            .filter((model) => model.kind === 'chat')
            .map((model) => ({
              value: JSON.stringify([service.name, model.value]),
              label: `${service.title} / ${model.label}`,
              ref: { modelService: service.name, model: model.value },
            })),
        )
      : [];
  const selected =
    models.find((model) => model.value === modelKey) ?? models[0];
  const catalogStatus =
    catalog.phase === 'error' && catalog.error instanceof ApiClientError
      ? catalog.error.status
      : undefined;
  const accessStatus =
    denied ??
    (catalogStatus === 401 || catalogStatus === 403 ? catalogStatus : null);
  const validate = (value: string) =>
    !value.trim()
      ? 'required'
      : value.length > TRANSLATION_MAX_LENGTH
        ? 'limit'
        : null;

  async function translate(): Promise<void> {
    if (busyRef.current || !selected || accessStatus) return;
    const invalid = validate(text);
    setValidation(invalid);
    if (invalid) {
      originalRef.current?.focus();
      return;
    }
    const owner = lifetimeRef.current;
    if (!owner || owner.signal.aborted) return;
    busyRef.current = true;
    setPending(true);
    setTranslation('');
    try {
      // One POST, no automatic resubmission: background.run() is awaited on the server through status()/get().
      const { data } = await api.request<
        { data: TranslationResult },
        TranslationInput
      >({
        path: 'aiTranslation',
        method: 'POST',
        signal: owner.signal,
        json: { text, sourceLanguage, targetLanguage, model: selected.ref },
      });
      if (owner.signal.aborted) return;
      setTranslation(data.translation);
      // Reuse feedback so an earlier success cannot obscure a subsequent error.
      toaster.show({
        id: 'ai-translation',
        type: 'success',
        title: t('aiTranslation.success'),
      });
    } catch (error: unknown) {
      if (owner.signal.aborted) return;
      const status = error instanceof ApiClientError ? error.status : undefined;
      if (status === 401 || status === 403) setDenied(status);
      const key =
        status === 401
          ? 'sessionExpired'
          : status === 403
            ? 'forbidden'
            : error instanceof ApiClientError &&
                error.reason === 'TRANSLATION_TIMEOUT'
              ? 'timeout'
              : !(error instanceof ApiClientError) ||
                  error.reason === 'REQUEST_TIMEOUT'
                ? 'unknownOutcome'
                : 'failed';
      toaster.show({
        id: 'ai-translation',
        type: 'error',
        title: t(`aiTranslation.${key}`),
      });
    } finally {
      if (!owner.signal.aborted) {
        busyRef.current = false;
        setPending(false);
      }
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('aiTranslation.title')}
        description={t('aiTranslation.description')}
        actions={
          <div className='flex min-w-0 flex-wrap items-end gap-2'>
            <Field className='w-full min-w-0 sm:w-64'>
              <FieldLabel htmlFor='translation-model'>
                {t('aiTranslation.model')} *
              </FieldLabel>
              {catalog.phase === 'loading' ? (
                <Skeleton
                  className='h-8 w-full'
                  role='status'
                  aria-label={t('status.loading')}
                />
              ) : (
                <Select
                  items={models}
                  value={selected?.value ?? null}
                  disabled={pending || !selected || Boolean(accessStatus)}
                  onValueChange={(value) => {
                    if (value) {
                      setModelKey(value);
                      setTranslation('');
                    }
                  }}
                >
                  <SelectTrigger
                    id='translation-model'
                    className='w-full'
                    aria-required
                  >
                    <SelectValue placeholder={t('aiTranslation.selectModel')} />
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                    <SelectGroup>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </Field>
            <Button
              disabled={pending || !selected || Boolean(accessStatus)}
              onClick={() => void translate()}
            >
              {pending && <Spinner data-icon='inline-start' />}
              {pending
                ? t('aiTranslation.translating')
                : t('aiTranslation.translate')}
            </Button>
          </div>
        }
      />
      {accessStatus ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {accessStatus === 401
              ? t('aiTranslation.sessionExpired')
              : t('aiTranslation.forbidden')}
            {accessStatus === 401 && (
              <Button variant='outline' onClick={() => void refresh()}>
                {t('aiTranslation.signIn')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : catalog.phase === 'error' ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {catalogStatus === 404
              ? t('aiTranslation.unavailable')
              : t('aiTranslation.catalogFailed')}
            {catalogStatus !== 404 && (
              <Button
                variant='outline'
                onClick={() => {
                  setCatalog({ phase: 'loading' });
                  setReload((value) => value + 1);
                }}
              >
                {t('aiTranslation.retry')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : catalog.phase === 'ready' && models.length === 0 ? (
        <Alert role='status'>
          <AlertDescription>
            {t('aiTranslation.noModels')} <ModelsLink explain />
          </AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className='grid gap-4 md:grid-cols-2'>
        <Field
          className='min-w-0 rounded-lg border bg-card p-4'
          data-invalid={Boolean(validation)}
        >
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <FieldLabel htmlFor='translation-original'>
              {t('aiTranslation.original')} *
            </FieldLabel>
            <LanguageSelect
              source
              value={sourceLanguage}
              disabled={pending}
              onChange={(value) => {
                setSourceLanguage(value);
                setTranslation('');
              }}
            />
          </div>
          <Textarea
            id='translation-original'
            ref={originalRef}
            value={text}
            readOnly={pending}
            className='field-sizing-fixed h-80 overflow-y-auto'
            aria-required
            aria-invalid={Boolean(validation)}
            aria-describedby={
              validation ? 'translation-error' : 'translation-limit'
            }
            placeholder={t('aiTranslation.sourcePlaceholder')}
            onChange={(event) => {
              setText(event.target.value);
              setTranslation('');
              if (validation) setValidation(validate(event.target.value));
            }}
          />
          <FieldDescription id='translation-limit'>
            {t('aiTranslation.limit')}
          </FieldDescription>
          {validation && (
            <FieldError id='translation-error'>
              {t(`aiTranslation.${validation}`)}
            </FieldError>
          )}
        </Field>
        <Field
          className='min-w-0 rounded-lg border bg-card p-4'
          aria-busy={pending}
        >
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <FieldLabel htmlFor='translation-result'>
              {t('aiTranslation.translation')}
            </FieldLabel>
            <LanguageSelect
              value={targetLanguage}
              disabled={pending}
              onChange={(value) => {
                if (value !== 'auto') {
                  setTargetLanguage(value);
                  setTranslation('');
                }
              }}
            />
          </div>
          <Textarea
            id='translation-result'
            value={translation}
            readOnly
            className='field-sizing-fixed h-80 overflow-y-auto'
            placeholder={t('aiTranslation.resultPlaceholder')}
          />
        </Field>
      </FieldGroup>
    </PageContainer>
  );
}

function LanguageSelect({
  source = false,
  value,
  disabled,
  onChange,
}: {
  readonly source?: boolean;
  readonly value: TranslationInput['sourceLanguage'];
  readonly disabled: boolean;
  readonly onChange: (value: TranslationInput['sourceLanguage']) => void;
}): ReactElement {
  const { t } = useTranslation();
  const languages = source
    ? ['auto' as const, ...TRANSLATION_LANGUAGES]
    : TRANSLATION_LANGUAGES;
  const items = languages.map((language) => ({
    value: language,
    label: t(`aiTranslation.languages.${language}`),
  }));
  return (
    <Select
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <SelectTrigger
        aria-label={
          source
            ? t('aiTranslation.sourceLanguage')
            : t('aiTranslation.targetLanguage')
        }
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
