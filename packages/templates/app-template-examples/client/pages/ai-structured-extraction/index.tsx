import { FeedbackForm } from '#components/feedback-form';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { StatusBadge } from '#components/status-badge';
import {
  FileTextIcon,
  ScanTextIcon,
  SparklesIcon,
  UserRoundIcon,
  ShoppingBagIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#components/ui/tabs';
import { useModelCatalog } from '#components/online-agent/use-model-catalog';
import { useOnlineAgentIdentityActive } from '#components/online-agent/identity-context';
import { Alert, AlertDescription, AlertTitle } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { ChatModelSelect } from '#components/chat-model-select';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { Textarea } from '#components/ui/textarea';
import { ContactFields, OrderFields } from './result-fields.js';
import {
  contactSchema,
  orderSchema,
  contactJsonSchema,
  orderJsonSchema,
  emptyContact,
  emptyOrder,
} from './schemas.js';

function SignInAgain() {
  const { refresh } = useAuthentication();
  const { t } = useTranslation();
  return (
    <Button type='button' variant='outline' onClick={() => void refresh()}>
      {t('structuredExtraction.signIn')}
    </Button>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden='true' className='text-destructive'>
      *
    </span>
  );
}

type Catalog = ReturnType<typeof useModelCatalog>;

function ExtractionDemo<T>({
  id,
  title,
  description,
  sample,
  schema,
  jsonSchema,
  empty,
  children,
  catalog,
}: {
  id: string;
  title: string;
  description: string;
  sample: string;
  schema: z.ZodType<T>;
  jsonSchema: Record<string, unknown>;
  empty: T;
  children: (data: T, busy: boolean) => ReactNode;
  catalog: Catalog;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const identityActive = useOnlineAgentIdentityActive();
  const [result, setResult] = useState(empty);
  const [failure, setFailure] = useState<
    | 'requestFailed'
    | 'timeout'
    | 'forbidden'
    | 'sessionExpired'
    | 'invalidSchema'
    | null
  >(null);
  const inFlightRef = useRef<AbortController | null>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    defaultValues: { text: sample, model: '' },
    shouldFocusError: false,
  });
  const text = useWatch({ control: form.control, name: 'text' });
  const selected = useWatch({ control: form.control, name: 'model' });
  const busy = form.formState.isSubmitting;
  const models = catalog.services.flatMap((service) =>
    service.models
      .filter((model) => model.kind === 'chat')
      .map((model) => ({
        value: JSON.stringify([service.name, model.value]),
        label: model.label,
        ref: { modelService: service.name, model: model.value },
      })),
  );
  const selectedModel = models.find((model) => model.value === selected);
  const firstModel = models[0]?.value;
  useEffect(() => {
    if (catalog.phase === 'ready' && !selected && firstModel) {
      form.setValue('model', firstModel);
    }
  }, [catalog.phase, selected, firstModel, form]);
  const ready =
    catalog.phase === 'ready' && Boolean(selectedModel) && Boolean(text.trim());
  useEffect(() => () => inFlightRef.current?.abort(), []);

  const extract = async (values: { text: string; model: string }) => {
    if (inFlightRef.current || !identityActive()) return;
    const model = models.find((item) => item.value === values.model);
    if (!model || catalog.phase !== 'ready') {
      form.setError(
        'model',
        { message: t('structuredExtraction.invalidModel') },
        { shouldFocus: false },
      );
      return;
    }
    const controller = new AbortController();
    inFlightRef.current = controller;
    setFailure(null);
    let timedOut = false;
    const deadline = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 70_000);
    const current = () =>
      identityActive() &&
      inFlightRef.current === controller &&
      (!controller.signal.aborted || timedOut);
    try {
      const response = await api.request<{ data: unknown }>({
        path: 'aiStructuredExtraction',
        method: 'POST',
        json: {
          text: values.text.trim(),
          model: model.ref,
          schema: jsonSchema,
        },
        signal: controller.signal,
      });
      if (!current()) return;
      if (timedOut) {
        setFailure('timeout');
        return;
      }
      const parsed = schema.safeParse(response.data);
      if (!parsed.success) {
        setFailure('requestFailed');
        return;
      }
      setResult(parsed.data);
      toaster.show({
        type: 'success',
        title: t('structuredExtraction.success'),
      });
    } catch (error: unknown) {
      if (!current()) return;
      if (
        timedOut ||
        (error instanceof ApiClientError &&
          error.reason === 'EXTRACTION_TIMEOUT')
      )
        setFailure('timeout');
      else if (error instanceof ApiClientError && error.status === 401)
        setFailure('sessionExpired');
      else if (error instanceof ApiClientError && error.status === 403)
        setFailure('forbidden');
      else if (
        error instanceof ApiClientError &&
        error.reason === 'INVALID_MODEL'
      )
        form.setError(
          'model',
          { message: t('structuredExtraction.invalidModel') },
          { shouldFocus: false },
        );
      else if (
        error instanceof ApiClientError &&
        error.reason === 'INVALID_TEXT'
      )
        form.setError(
          'text',
          { message: t('structuredExtraction.invalidText') },
          { shouldFocus: false },
        );
      else
        setFailure(
          error instanceof ApiClientError && error.reason === 'INVALID_SCHEMA'
            ? 'invalidSchema'
            : 'requestFailed',
        );
    } finally {
      window.clearTimeout(deadline);
      if (inFlightRef.current === controller) inFlightRef.current = null;
    }
  };

  return (
    <Card
      role='region'
      aria-labelledby={`${id}-title`}
      className='gap-0 overflow-hidden py-0'
    >
      <CardHeader className='sr-only'>
        <CardTitle>
          <h2 id={`${id}-title`}>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='grid min-w-0 lg:grid-cols-2'>
          <FeedbackForm
            submitting={busy}
            validationErrors={form.formState.errors}
            noValidate
            aria-label={title}
            onSubmit={(event) => void form.handleSubmit(extract)(event)}
            className='flex min-w-0 flex-col gap-6 border-b bg-muted/20 p-6 lg:border-r lg:border-b-0'
          >
            {failure ? (
              <Alert variant='destructive'>
                <AlertTitle>{t('structuredExtraction.errorTitle')}</AlertTitle>
                <AlertDescription>
                  <p>{t(`structuredExtraction.${failure}`)}</p>
                  {failure === 'sessionExpired' ? <SignInAgain /> : null}
                </AlertDescription>
              </Alert>
            ) : null}
            <FieldGroup className='flex-1'>
              <Controller
                control={form.control}
                name='text'
                rules={{
                  required: t('structuredExtraction.missingInput'),
                  maxLength: {
                    value: 20_000,
                    message: t('structuredExtraction.textTooLong'),
                  },
                }}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    data-disabled={busy}
                    className='h-full'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <FieldLabel htmlFor={`${id}-source`}>
                        <FileTextIcon className='size-4 text-muted-foreground' />
                        {t('structuredExtraction.source')}
                        <RequiredMark />
                      </FieldLabel>
                    </div>
                    <Textarea
                      {...field}
                      id={`${id}-source`}
                      disabled={busy}
                      aria-required='true'
                      aria-invalid={fieldState.invalid}
                      className='min-h-64 flex-1'
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              {catalog.phase === 'loading' && models.length === 0 ? (
                <Skeleton
                  role='status'
                  aria-label={t('status.loading')}
                  className='h-8 w-full'
                />
              ) : null}
              {catalog.phase === 'error' ? (
                <Alert variant='destructive'>
                  <AlertTitle>
                    {t('structuredExtraction.catalogFailed')}
                  </AlertTitle>
                  <AlertDescription>
                    {catalog.error instanceof ApiClientError &&
                    catalog.error.status === 401 ? (
                      <>
                        <p>{t('structuredExtraction.sessionExpired')}</p>
                        <SignInAgain />
                      </>
                    ) : catalog.error instanceof ApiClientError &&
                      catalog.error.status === 403 ? (
                      <p>{t('structuredExtraction.forbidden')}</p>
                    ) : (
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          modelTriggerRef.current?.focus();
                          catalog.refresh();
                        }}
                      >
                        {t('structuredExtraction.retry')}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className='flex flex-wrap items-end justify-end gap-3'>
                <Controller
                  control={form.control}
                  name='model'
                  rules={{ required: t('structuredExtraction.missingInput') }}
                  render={({ field, fieldState }) => (
                    <Field
                      orientation='horizontal'
                      className='w-auto min-w-0'
                      data-invalid={fieldState.invalid}
                      data-disabled={busy}
                    >
                      <FieldLabel htmlFor={`${id}-model`} className='sr-only'>
                        {t('structuredExtraction.model')}
                      </FieldLabel>
                      <div className='w-48 min-w-0'>
                        <ChatModelSelect
                          services={catalog.services}
                          value={field.value || null}
                          onValueChange={(value) => field.onChange(value ?? '')}
                          disabled={
                            busy ||
                            catalog.phase !== 'ready' ||
                            models.length === 0
                          }
                          id={`${id}-model`}
                          data-field-path='model'
                          ref={(element) => {
                            field.ref(element);
                            modelTriggerRef.current = element;
                          }}
                          onBlur={field.onBlur}
                          aria-required='true'
                          aria-invalid={fieldState.invalid}
                          placeholder={t('structuredExtraction.selectModel')}
                        />
                      </div>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Button type='submit' disabled={busy || !ready}>
                  {busy ? (
                    <Spinner data-icon='inline-start' />
                  ) : (
                    <SparklesIcon data-icon='inline-start' />
                  )}
                  {busy
                    ? t('structuredExtraction.extracting')
                    : t('structuredExtraction.extract')}
                </Button>
              </div>
            </FieldGroup>
          </FeedbackForm>
          <section
            className='flex min-w-0 flex-col gap-6 p-6'
            aria-labelledby={`${id}-result-title`}
          >
            <div className='flex items-center justify-between gap-2'>
              <h3
                id={`${id}-result-title`}
                className='flex items-center gap-2 text-sm font-medium'
              >
                <ScanTextIcon className='size-4 text-muted-foreground' />
                {t('structuredExtraction.result')}
              </h3>
              {result !== empty ? (
                <StatusBadge tone='success' size='sm'>
                  {t('structuredExtraction.extracted')}
                </StatusBadge>
              ) : null}
            </div>
            {children(result, busy)}
            <FieldDescription>
              {t('structuredExtraction.localOnly')}
            </FieldDescription>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StructuredExtractionPage() {
  const { t } = useTranslation();
  const catalog = useModelCatalog(true);
  return (
    <PageContainer className='mx-auto max-w-7xl'>
      <PageHeader
        title={t('structuredExtraction.title')}
        description={t('structuredExtraction.description')}
      />
      <Tabs defaultValue='contact' className='gap-6'>
        <TabsList
          variant='line'
          aria-label={t('structuredExtraction.scenarios')}
        >
          <TabsTrigger value='contact'>
            <UserRoundIcon />
            {t('structuredExtraction.contactTitle')}
          </TabsTrigger>
          <TabsTrigger value='order'>
            <ShoppingBagIcon />
            {t('structuredExtraction.orderTitle')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value='contact' keepMounted>
          <ExtractionDemo
            id='contact'
            title={t('structuredExtraction.contactTitle')}
            description={t('structuredExtraction.contactDescription')}
            sample={t('structuredExtraction.contactSample')}
            schema={contactSchema}
            jsonSchema={contactJsonSchema}
            empty={emptyContact}
            catalog={catalog}
          >
            {(data, busy) => <ContactFields data={data} disabled={busy} />}
          </ExtractionDemo>
        </TabsContent>
        <TabsContent value='order' keepMounted>
          <ExtractionDemo
            id='order'
            title={t('structuredExtraction.orderTitle')}
            description={t('structuredExtraction.orderDescription')}
            sample={t('structuredExtraction.orderSample')}
            schema={orderSchema}
            jsonSchema={orderJsonSchema}
            empty={emptyOrder}
            catalog={catalog}
          >
            {(data, busy) => <OrderFields data={data} disabled={busy} />}
          </ExtractionDemo>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
