import {
  clonePageUIContext,
  useAIFormRegistry,
  type AIToolRendererProps,
} from '@nocobase/app-plugin-agents/client/chat';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { Spinner } from '#components/ui/spinner';
import {
  formProposalSchema,
  type FormProposal,
} from '../../../shared/ai-form-fill.js';
import { FormValuesEditor } from './form-values-editor.js';
import { toEditorValues } from './form-editor-values.js';

export function FormProposalRenderer(props: AIToolRendererProps): ReactElement {
  const { t } = useTranslation();
  const { part, message } = props;
  if (part.state !== 'output-available') {
    const failed =
      part.state === 'output-error' || part.state === 'output-denied';
    return (
      <p
        role={failed ? 'alert' : 'status'}
        className='text-sm text-muted-foreground'
      >
        {t(failed ? 'aiFormFill.proposalFailed' : 'aiFormFill.proposalPending')}
      </p>
    );
  }
  const parsed = formProposalSchema.safeParse(part.output);
  if (!parsed.success)
    return <p role='alert'>{t('aiFormFill.invalidProposal')}</p>;
  return (
    <FormProposalCard
      key={JSON.stringify([
        message.metadata?.conversationId,
        message.id,
        part.toolCallId,
      ])}
      {...props}
      proposal={parsed.data}
    />
  );
}

function FormProposalCard({
  proposal,
  part,
  message,
  context,
}: AIToolRendererProps & { proposal: FormProposal }): ReactElement {
  const { t } = useTranslation();
  const registry = useAIFormRegistry();
  const [status, setStatus] = useState<
    'idle' | 'pending' | 'applied' | 'stale' | 'failed' | 'partial'
  >('idle');
  const attemptedRef = useRef(false);
  const inFlightRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      inFlightRef.current?.abort();
      inFlightRef.current = null;
    },
    [],
  );

  // Only the exact server-linked user message grants this local action a selected target.
  const matching =
    context.sourceContext?.ui?.items.filter(
      (item) => item.kind === 'form' && item.id === proposal.formId,
    ) ?? [];
  const source = matching.length === 1 ? matching[0] : undefined;
  const authorized = Boolean(
    source &&
    source.instance === proposal.instance &&
    source.identity === proposal.identity &&
    source.revision === proposal.revision,
  );
  const readOnly = context.readOnly;
  const conversationId = message.metadata?.conversationId;
  const messageId = message.id;
  const toolCallId = part.toolCallId;

  useEffect(() => {
    if (readOnly || !authorized || !source || attemptedRef.current) return;
    let cancelled = false;
    // Defer admission so StrictMode's setup/cleanup replay cannot cache an aborted operation.
    // Output-available is sufficient: no confirmation or model approval is needed for a local draft.
    void Promise.resolve().then(async () => {
      if (cancelled || attemptedRef.current) return;
      attemptedRef.current = true;
      const controller = new AbortController();
      inFlightRef.current = controller;
      setStatus('pending');
      try {
        const snapshot = clonePageUIContext({ version: 1, items: [source] })
          .items[0];
        const result = await registry.apply({
          source: snapshot,
          operationId: JSON.stringify([conversationId, messageId, toolCallId]),
          values: proposal.values,
          signal: controller.signal,
        });
        if (controller.signal.aborted || inFlightRef.current !== controller)
          return;
        setStatus(
          result.status === 'applied'
            ? 'applied'
            : result.status === 'partial'
              ? 'partial'
              : result.code === 'adapter-failed' || result.status === 'failed'
                ? 'failed'
                : 'stale',
        );
      } catch {
        if (!controller.signal.aborted && inFlightRef.current === controller)
          setStatus('failed');
      } finally {
        if (inFlightRef.current === controller) inFlightRef.current = null;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    authorized,
    conversationId,
    messageId,
    proposal,
    readOnly,
    registry,
    source,
    toolCallId,
  ]);

  const feedback =
    status !== 'idle' && status !== 'pending'
      ? status
      : !authorized
        ? 'missingSource'
        : null;
  return (
    <Card
      data-testid='form-proposal-card'
      data-chat-width='full'
      className='w-full min-w-0'
    >
      <CardHeader>
        <CardTitle>
          <h3>{t('aiFormFill.proposalTitle')}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <FormValuesEditor
          prefix='proposal'
          values={toEditorValues(proposal.values)}
          onChange={() => undefined}
          disabled
        />
        {status === 'pending' ? (
          <p role='status' className='flex items-center gap-2 text-sm'>
            <Spinner />
            {t('aiFormFill.applying')}
          </p>
        ) : feedback ? (
          <p
            role={feedback === 'applied' ? 'status' : 'alert'}
            className='text-sm'
          >
            {t(`aiFormFill.${feedback}`)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
