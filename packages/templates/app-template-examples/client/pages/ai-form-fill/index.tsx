import {
  useAIForm,
  useAIFormRegistry,
  useChatApi,
  useChatPanel,
  useChatSources,
  useChatUIContextSource,
  type AIFormField,
} from '@nocobase/app-plugin-agents/client/chat';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { BotMessageSquare } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { ModelsLink } from '#components/online-agent/models-link';
import { useModelCatalog } from '#components/online-agent/use-model-catalog';
import { useOnlineAgentIdentityActive } from '#components/online-agent/identity-context';
import { FormValuesEditor } from '#components/online-agent/form-values-editor';
import {
  parseEditorValues,
  type FormEditorValues,
} from '#components/online-agent/form-editor-values';
import { Button } from '#components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { Field, FieldDescription, FieldLabel } from '#components/ui/field';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Spinner } from '#components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#components/ui/tooltip';
import {
  EXAMPLES_FORM_SCOPE,
  formProposalValuesSchema,
} from '../../../shared/ai-form-fill.js';

const FORM_ID = 'example-request';
const sourceRef = { kind: 'form', id: FORM_ID };
function emptyDraft(): FormEditorValues {
  return { name: '', priority: 'normal', budget: '0', subscribe: false };
}

export default function AIFormFillPage(): ReactElement {
  const { t } = useTranslation();
  const { session } = useAuthentication();
  const registry = useAIFormRegistry();
  const sources = useChatSources();
  const panel = useChatPanel();
  const api = useChatApi();
  const catalog = useModelCatalog(true);
  const identityActive = useOnlineAgentIdentityActive();
  const [record, setRecord] = useState('record-a');
  const [values, setValues] = useState<FormEditorValues>(emptyDraft);
  const draftRef = useRef(values);
  const revisionRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const identity = `${session?.user.id ?? 'anonymous'}:${record}`;
  const updateDraft = (next: FormEditorValues) => {
    revisionRef.current += 1;
    draftRef.current = next;
    setValues(next);
  };
  const fields: readonly AIFormField[] = useMemo(
    () => [
      {
        name: 'name',
        title: t('aiFormFill.name'),
        type: 'string',
        editable: true,
      },
      {
        name: 'priority',
        title: t('aiFormFill.priority'),
        type: 'string',
        enum: ['low', 'normal', 'high'],
        editable: true,
      },
      {
        name: 'budget',
        title: t('aiFormFill.budget'),
        type: 'number',
        editable: true,
      },
      {
        name: 'subscribe',
        title: t('aiFormFill.subscribe'),
        type: 'boolean',
        editable: true,
      },
      {
        name: 'recordId',
        title: t('aiFormFill.record'),
        type: 'string',
        editable: false,
      },
    ],
    [t],
  );
  const ref = useAIForm<HTMLFormElement>({
    id: FORM_ID,
    identity,
    title: t('aiFormFill.draftTitle'),
    fields,
    getRevision: () => String(revisionRef.current),
    getValues: () => {
      const snapshot = parseEditorValues(draftRef.current);
      if (
        typeof snapshot.budget !== 'number' ||
        !Number.isFinite(snapshot.budget)
      )
        throw new Error(t('aiFormFill.invalidDraft'));
      return { ...snapshot, recordId: record };
    },
    validate: (patch) =>
      formProposalValuesSchema.safeParse(patch).success
        ? undefined
        : t('aiFormFill.invalidProposal'),
    setValues: (patch, operation) => {
      if (operation.signal.aborted || !operation.isCurrent())
        throw new Error(t('aiFormFill.stale'));
      const parsed = formProposalValuesSchema.parse(patch);
      // This synchronous adapter commits one local patch; it never submits or saves a business record.
      updateDraft({
        ...draftRef.current,
        ...(parsed.name === undefined ? {} : { name: parsed.name }),
        ...(parsed.priority === undefined ? {} : { priority: parsed.priority }),
        ...(parsed.subscribe === undefined
          ? {}
          : { subscribe: parsed.subscribe }),
        ...(parsed.budget === undefined
          ? {}
          : { budget: String(parsed.budget) }),
      });
    },
  });
  const source = useMemo(
    () => ({
      ...sourceRef,
      label: t('aiFormFill.draftTitle'),
      getSnapshot: async () => {
        const snapshot = await registry.snapshot(FORM_ID);
        if (snapshot.identity !== identity)
          throw new Error(t('aiFormFill.stale'));
        return snapshot;
      },
    }),
    [registry, t, identity],
  );
  useChatUIContextSource(source);
  const records = [
    { value: 'record-a', label: t('aiFormFill.recordA') },
    { value: 'record-b', label: t('aiFormFill.recordB') },
  ];

  const ask = async () => {
    if (busy || !catalog.canSend || !identityActive()) return;
    setBusy(true);
    setFailure(false);
    try {
      const service = catalog.services.find((item) =>
        item.models.some((model) => model.kind === 'chat'),
      );
      const model = service?.models.find((item) => item.kind === 'chat');
      if (!service || !model) return;
      const conversation = await api.createConversation({
        agentId: 'online',
        config: { scope: [EXAMPLES_FORM_SCOPE] },
        selectedModel: { modelService: service.name, model: model.value },
      });
      if (!mountedRef.current || !identityActive()) return;
      sources.selectUI(sourceRef, true);
      panel.openChat({
        conversationId: conversation.id,
        draft: t('aiFormFill.prompt'),
      });
    } catch {
      if (mountedRef.current && identityActive()) setFailure(true);
    } finally {
      if (mountedRef.current && identityActive()) setBusy(false);
    }
  };
  return (
    <PageContainer data-testid='ai-form-fill'>
      <PageHeader
        title={t('aiFormFill.title')}
        description={t('aiFormFill.description')}
      />
      {failure ? <p role='alert'>{t('aiFormFill.askFailed')}</p> : null}
      {catalog.phase === 'loading' ? (
        <p role='status'>{t('onlineAgent.checkingModels')}</p>
      ) : !catalog.canSend ? (
        <div className='flex flex-col gap-2'>
          <p role={catalog.phase === 'error' ? 'alert' : undefined}>
            {t(
              catalog.phase === 'error'
                ? 'onlineAgent.catalogFailed'
                : 'onlineAgent.noModels.description',
            )}
          </p>
          <ModelsLink explain />
          {catalog.phase === 'error' ? (
            <Button variant='outline' onClick={catalog.refresh}>
              {t('aiFormFill.retry')}
            </Button>
          ) : null}
        </div>
      ) : null}
      <Card className='w-full max-w-2xl'>
        <CardHeader>
          <CardTitle>{t('aiFormFill.draftTitle')}</CardTitle>
          <CardAction>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      data-testid='open-form-chat'
                      aria-label={t('aiFormFill.openChat')}
                      disabled={busy || !catalog.canSend || !panel.available}
                      onClick={() => void ask()}
                    >
                      {busy ? (
                        <Spinner />
                      ) : (
                        <BotMessageSquare aria-hidden='true' />
                      )}
                    </Button>
                  }
                />
                <TooltipContent>{t('aiFormFill.openChat')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardAction>
          <CardDescription>{t('aiFormFill.draftOnly')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-6'>
          <Field>
            <FieldLabel htmlFor='draft-record'>
              {t('aiFormFill.target')}
            </FieldLabel>
            <Select
              items={records}
              value={record}
              onValueChange={(value) => {
                if (value !== 'record-a' && value !== 'record-b') return;
                setRecord(value);
                updateDraft(emptyDraft());
              }}
            >
              <SelectTrigger
                id='draft-record'
                data-testid='draft-record'
                className='w-full'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                <SelectGroup>
                  {records.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>{t('aiFormFill.switchHint')}</FieldDescription>
          </Field>
          <form
            ref={ref}
            onSubmit={(event) => event.preventDefault()}
            className='flex flex-col gap-6'
          >
            <FormValuesEditor
              prefix='draft'
              values={values}
              onChange={updateDraft}
            />
            <Field>
              <FieldLabel htmlFor='draft-record-id'>
                {t('aiFormFill.record')}
              </FieldLabel>
              <Input id='draft-record-id' readOnly value={record} />
            </Field>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
