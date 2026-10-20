import {
  useAIForm,
  useAIFormRegistry,
  useChatApi,
  useChatPanel,
  useChatUIContextSource,
  type AIFormField,
} from '@nocobase/app-plugin-agents/client/chat';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { BotMessageSquare, Check, Info } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { useModelCatalog } from '#components/online-agent/use-model-catalog';
import { useOnlineAgentIdentityActive } from '#components/online-agent/identity-context';
import { FormValuesEditor } from '#components/online-agent/form-values-editor';
import {
  parseEditorValues,
  toEditorValues,
  type FormEditorValues,
} from '#components/online-agent/form-editor-values';
import { Button } from '#components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { Spinner } from '#components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#components/ui/tooltip';
import {
  EXAMPLES_FORM_SCOPE,
  PROCUREMENT_DEPARTMENTS,
  procurementFieldsSchema,
  procurementProposalValuesSchema,
} from '../../../shared/ai-form-fill.js';

const FORM_ID = 'example-request';
const sourceRef = { kind: 'form', id: FORM_ID };

export default function AIFormFillPage(): ReactElement {
  const { t } = useTranslation();
  const { session } = useAuthentication();
  const registry = useAIFormRegistry();
  const panel = useChatPanel();
  const api = useChatApi();
  const catalog = useModelCatalog(true);
  const identityActive = useOnlineAgentIdentityActive();
  const [values, setValues] = useState<FormEditorValues>({});
  const draftRef = useRef(values);
  const revisionRef = useRef(0);
  const [completion, setCompletion] = useState<{
    previous: FormEditorValues;
    count: number;
  } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const identity = `${session?.user.id ?? 'anonymous'}:procurement`;
  const commitDraft = (next: FormEditorValues) => {
    revisionRef.current += 1;
    draftRef.current = next;
    setValues(next);
  };
  const updateDraft = (next: FormEditorValues) => {
    commitDraft(next);
    setCompletion(null);
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
        name: 'department',
        title: t('aiFormFill.department'),
        type: 'string',
        enum: [...PROCUREMENT_DEPARTMENTS],
        editable: true,
      },
      {
        name: 'quantity',
        title: t('aiFormFill.quantity'),
        type: 'number',
        editable: true,
      },
      {
        name: 'budget',
        title: t('aiFormFill.budget'),
        type: 'number',
        editable: true,
      },
      {
        name: 'arrival',
        title: t('aiFormFill.arrival'),
        type: 'string',
        editable: true,
      },
      {
        name: 'purpose',
        title: t('aiFormFill.purpose'),
        type: 'string',
        editable: true,
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
      // Blank optional fields are absent, not zero/NaN; nonempty invalid drafts must not enter chat context.
      const nonempty = Object.fromEntries(
        Object.entries(draftRef.current).filter(
          ([, value]) => typeof value !== 'string' || value.trim() !== '',
        ),
      );
      const snapshot = procurementFieldsSchema.safeParse(
        parseEditorValues(nonempty),
      );
      if (!snapshot.success) throw new Error(t('aiFormFill.invalidDraft'));
      return snapshot.data;
    },
    validate: (patch) =>
      procurementProposalValuesSchema.safeParse(patch).success
        ? undefined
        : t('aiFormFill.invalidProposal'),
    setValues: (patch, operation) => {
      if (operation.signal.aborted || !operation.isCurrent())
        throw new Error(t('aiFormFill.stale'));
      const parsed = procurementProposalValuesSchema.parse(patch);
      const previous = { ...draftRef.current };
      // Commit one local patch; never submit or save a business record.
      commitDraft({ ...previous, ...toEditorValues(parsed) });
      setCompletion({ previous, count: Object.keys(parsed).length });
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

  const ask = async () => {
    if (busy || !catalog.canSend || !panel.available || !identityActive())
      return;
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
      panel.openChat({
        conversationId: conversation.id,
        draft: t('aiFormFill.prompt'),
        uiSources: [sourceRef],
      });
    } catch {
      if (mountedRef.current && identityActive()) setFailure(true);
    } finally {
      if (mountedRef.current && identityActive()) setBusy(false);
    }
  };
  const unavailable = !catalog.canSend || !panel.available;
  return (
    <PageContainer className='mx-auto max-w-3xl' data-testid='ai-form-fill'>
      <PageHeader
        title={t('aiFormFill.title')}
        description={t('aiFormFill.description')}
      />
      {failure ? (
        <p role='alert' className='text-sm text-destructive'>
          {t('aiFormFill.askFailed')}
        </p>
      ) : null}
      {completion ? (
        <div
          className='flex flex-wrap items-center gap-2 rounded-lg bg-accent p-3 text-sm text-accent-foreground'
          data-testid='form-fill-completion'
        >
          <Check aria-hidden='true' className='size-4 shrink-0' />
          <span role='status'>
            {t('aiFormFill.completed', { count: completion.count })}
          </span>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='ml-auto'
            onClick={() => {
              updateDraft(completion.previous);
              nameRef.current?.focus();
            }}
          >
            {t('aiFormFill.undo')}
          </Button>
        </div>
      ) : null}
      <Card className='w-full'>
        <CardHeader className='border-b'>
          <CardTitle>
            <h2>{t('aiFormFill.draftTitle')}</h2>
          </CardTitle>
          <CardDescription>{t('aiFormFill.formDescription')}</CardDescription>
          <CardAction className='self-center'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      className='inline-flex'
                      tabIndex={unavailable ? 0 : undefined}
                    />
                  }
                >
                  <Button
                    type='button'
                    data-testid='open-form-chat'
                    disabled={busy || unavailable}
                    onClick={() => void ask()}
                  >
                    {busy ? (
                      <Spinner />
                    ) : (
                      <BotMessageSquare
                        aria-hidden='true'
                        data-icon='inline-start'
                      />
                    )}
                    {t('aiFormFill.openChat')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t(
                    catalog.phase === 'loading'
                      ? 'onlineAgent.checkingModels'
                      : unavailable
                        ? 'aiFormFill.unavailable'
                        : 'aiFormFill.chatHint',
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form ref={ref} onSubmit={(event) => event.preventDefault()}>
            <FormValuesEditor
              prefix='draft'
              showAllFields
              nameRef={nameRef}
              values={values}
              onChange={updateDraft}
            />
          </form>
        </CardContent>
        <CardFooter className='flex-wrap justify-between gap-2'>
          <p className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Info aria-hidden='true' className='size-4 shrink-0' />
            {t('aiFormFill.hint')}
          </p>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => {
              updateDraft({});
              nameRef.current?.focus();
            }}
          >
            {t('aiFormFill.clear')}
          </Button>
        </CardFooter>
      </Card>
    </PageContainer>
  );
}
