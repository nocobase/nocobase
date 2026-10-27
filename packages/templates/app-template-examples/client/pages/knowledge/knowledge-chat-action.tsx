import { ApiClientError } from '@nocobase/app-client';
import {
  useChatController,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { BotMessageSquare } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '#components/ui/field';
import { RadioGroup, RadioGroupItem } from '#components/ui/radio-group';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Spinner } from '#components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { ModelsLink } from '#components/online-agent/models-link';
import { useModelCatalog } from '#components/online-agent/use-model-catalog';
import { useOnlineAgentIdentityActive } from '#components/online-agent/identity-context';
import {
  KNOWLEDGE_CHAT_SCOPE,
  KNOWLEDGE_CHAT_SOURCE,
  type KnowledgeRetrievalPolicy,
} from '../../../shared/knowledge-chat.js';

type Failure = 'expired' | 'forbidden' | 'failed' | 'unknown';
type Destination =
  { conversationId: string; view: 'chat' } | { view: 'history' };

export function KnowledgeChatAction(): ReactElement | null {
  const panel = useChatPanel();
  return panel.available ? <KnowledgeChatLauncher /> : null;
}

/** A temporary policy picker; creating a session never sends a model message. */
function KnowledgeChatLauncher(): ReactElement {
  const { t } = useTranslation();
  const controller = useChatController();
  const { openChat } = useChatPanel();
  const { refresh } = useAuthentication();
  const isIdentityActive = useOnlineAgentIdentityActive();
  const [open, setOpen] = useState(false);
  const [policy, setPolicy] = useState<KnowledgeRetrievalPolicy>('on-demand');
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const catalog = useModelCatalog(open);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(false);
  const creatingRef = useRef(false);
  const destinationRef = useRef<Destination | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const active = () => mountedRef.current && isIdentityActive();
  const start = async () => {
    if (
      !active() ||
      !open ||
      creatingRef.current ||
      destinationRef.current ||
      failure === 'unknown' ||
      failure === 'expired' ||
      failure === 'forbidden' ||
      !catalog.canSend
    )
      return;
    creatingRef.current = true;
    setPending(true);
    setFailure(null);
    try {
      // A fresh session is essential: variable-only updates do not regenerate saved Knowledge prompts.
      const conversation = await controller.api.createConversation({
        agentId: 'online',
        source: KNOWLEDGE_CHAT_SOURCE,
        title: `${t('knowledge.title')} · ${t(policy === 'always' ? 'knowledge.chat.always' : 'knowledge.chat.onDemand')}`,
        config: {
          scope: [KNOWLEDGE_CHAT_SCOPE],
          context: { variable: { knowledgeRetrieval: policy } },
        },
      });
      if (!active()) return;
      destinationRef.current = {
        conversationId: conversation.id,
        view: 'chat',
      };
      setOpen(false);
    } catch (error: unknown) {
      if (!active()) return;
      setFailure(
        error instanceof ApiClientError && error.status < 500
          ? error.status === 401
            ? 'expired'
            : error.status === 403
              ? 'forbidden'
              : 'failed'
          : 'unknown',
      );
    } finally {
      creatingRef.current = false;
      if (active()) setPending(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!creatingRef.current && active()) setOpen(next);
      }}
      onOpenChangeComplete={(opened) => {
        if (opened || !destinationRef.current) return;
        const destination = destinationRef.current;
        destinationRef.current = null;
        // Let modal focus restoration finish before the shared composer takes focus.
        if (active())
          openChat(
            destination.view === 'chat'
              ? { ...destination, draft: '' }
              : destination,
          );
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              ref={triggerRef}
              type='button'
              variant='ghost'
              size='icon'
              aria-label={t('knowledge.chat.title')}
              onClick={() => {
                if (active()) setOpen(true);
              }}
            />
          }
        >
          <BotMessageSquare />
        </TooltipTrigger>
        <TooltipContent>{t('knowledge.chat.title')}</TooltipContent>
      </Tooltip>
      <DialogContent
        finalFocus={triggerRef}
        showCloseButton={!pending}
        className='flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-md'
      >
        <DialogHeader>
          <DialogTitle>{t('knowledge.chat.title')}</DialogTitle>
          <DialogDescription>
            {t('knowledge.chat.description')}
          </DialogDescription>
        </DialogHeader>
        <form
          id={id}
          className='-mx-6 min-h-0 flex-1 overflow-y-auto px-6'
          onSubmit={(event) => {
            event.preventDefault();
            void start();
          }}
        >
          <FieldGroup>
            {failure ? (
              <Alert variant='destructive'>
                <AlertDescription>
                  <p>{t(`knowledge.chat.${failure}`)}</p>
                  {failure === 'expired' ? (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        if (!active()) return;
                        void refresh().catch(() => {
                          // Keep the actionable session notice when the read-only refresh fails.
                          if (active()) setFailure('expired');
                        });
                      }}
                    >
                      {t('knowledge.chat.signIn')}
                    </Button>
                  ) : null}
                  {failure === 'unknown' ? (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        if (!active()) return;
                        destinationRef.current = { view: 'history' };
                        setOpen(false);
                      }}
                    >
                      {t('knowledge.chat.history')}
                    </Button>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}
            <FieldSet disabled={pending}>
              <FieldLegend variant='label'>
                {t('knowledge.chat.strategy')}
              </FieldLegend>
              <RadioGroup
                aria-label={t('knowledge.chat.strategy')}
                value={policy}
                disabled={pending}
                onValueChange={(value: unknown) => {
                  if (value === 'on-demand' || value === 'always')
                    setPolicy(value);
                }}
              >
                {(['on-demand', 'always'] as const).map((value) => (
                  <Field key={value} orientation='horizontal'>
                    <RadioGroupItem
                      id={`${id}-${value}`}
                      value={value}
                      aria-describedby={`${id}-${value}-description`}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={`${id}-${value}`}>
                        {t(
                          value === 'always'
                            ? 'knowledge.chat.always'
                            : 'knowledge.chat.onDemand',
                        )}
                      </FieldLabel>
                      <FieldDescription id={`${id}-${value}-description`}>
                        {t(
                          value === 'always'
                            ? 'knowledge.chat.alwaysDescription'
                            : 'knowledge.chat.onDemandDescription',
                        )}
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                ))}
              </RadioGroup>
              <FieldDescription>
                {t('knowledge.chat.policyNote')}
              </FieldDescription>
            </FieldSet>
            {catalog.phase === 'loading' ? (
              <p
                role='status'
                className='flex items-center gap-2 text-sm text-muted-foreground'
              >
                <Spinner />
                {t('onlineAgent.checkingModels')}
              </p>
            ) : catalog.phase === 'error' ? (
              <Alert variant='destructive'>
                <AlertDescription>
                  <p>{t('onlineAgent.catalogFailed')}</p>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={catalog.refresh}
                  >
                    {t('knowledge.chat.retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : !catalog.canSend ? (
              <Alert>
                <AlertDescription>
                  <p>{t('onlineAgent.noModels.description')}</p>
                  <ModelsLink explain />
                </AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type='submit'
            form={id}
            disabled={
              pending ||
              failure === 'unknown' ||
              failure === 'expired' ||
              failure === 'forbidden' ||
              !catalog.canSend
            }
          >
            {pending ? <Spinner data-icon='inline-start' /> : null}
            {t(pending ? 'knowledge.chat.starting' : 'knowledge.chat.start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
