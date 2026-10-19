import {
  clonePageUIContext,
  useAIFormRegistry,
  type AIToolRendererProps,
} from '@nocobase/app-plugin-agents/client/chat';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { Spinner } from '#components/ui/spinner';
import { toast } from '#components/ui/toast';
import {
  formProposalSchema,
  formProposalValuesSchema,
  type FormProposal,
} from '../../../shared/ai-form-fill.js';
import { FormValuesEditor } from './form-values-editor.js';
import {
  parseEditorValues,
  type FormEditorValues,
} from './form-editor-values.js';

export function FormProposalRenderer(props: AIToolRendererProps): ReactElement {
  const { t } = useTranslation();
  const { part } = props;
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
    <FormProposalCard key={part.toolCallId} {...props} proposal={parsed.data} />
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
  const [values, setValues] = useState<FormEditorValues>(() => ({
    ...(proposal.values.name === undefined
      ? {}
      : { name: proposal.values.name }),
    ...(proposal.values.priority === undefined
      ? {}
      : { priority: proposal.values.priority }),
    ...(proposal.values.budget === undefined
      ? {}
      : { budget: String(proposal.values.budget) }),
    ...(proposal.values.subscribe === undefined
      ? {}
      : { subscribe: proposal.values.subscribe }),
  }));
  const [invalid, setInvalid] = useState<string[]>([]);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [status, setStatus] = useState<
    | 'idle'
    | 'pending'
    | 'applied'
    | 'dismissed'
    | 'stale'
    | 'failed'
    | 'partial'
  >('idle');
  const inFlightRef = useRef<AbortController | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
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
  const disabled =
    context.readOnly ||
    context.streaming ||
    !authorized ||
    status === 'pending' ||
    status === 'applied' ||
    status === 'dismissed' ||
    status === 'stale' ||
    status === 'failed' ||
    status === 'partial';

  const apply = async () => {
    if (disabled || inFlightRef.current || !source) return;
    setValidationAttempted(true);
    const parsed = formProposalValuesSchema.safeParse(
      parseEditorValues(values),
    );
    if (!parsed.success) {
      const fields = parsed.error.issues.map((issue) =>
        String(issue.path[0] ?? ''),
      );
      setInvalid(fields);
      if (fields.includes('name')) nameRef.current?.focus();
      else if (fields.includes('budget')) budgetRef.current?.focus();
      return;
    }
    setInvalid([]);
    const controller = new AbortController();
    inFlightRef.current = controller;
    setStatus('pending');
    try {
      const snapshot = clonePageUIContext({ version: 1, items: [source] })
        .items[0];
      const result = await registry.apply({
        source: snapshot,
        operationId: JSON.stringify([
          message.metadata?.conversationId,
          message.id,
          part.toolCallId,
        ]),
        values: parsed.data,
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
      titleRef.current?.focus();
      if (result.status === 'applied')
        toast.add({ type: 'success', title: t('aiFormFill.applied') });
    } catch {
      if (!controller.signal.aborted && inFlightRef.current === controller)
        setStatus('failed');
    } finally {
      if (inFlightRef.current === controller) inFlightRef.current = null;
    }
  };
  const feedback =
    status !== 'idle' && status !== 'pending'
      ? status
      : !authorized
        ? 'missingSource'
        : null;
  return (
    <Card data-testid='form-proposal-card' className='min-w-0'>
      <CardHeader>
        <CardTitle>
          <h3 ref={titleRef} tabIndex={-1}>
            {t('aiFormFill.proposalTitle')}
          </h3>
        </CardTitle>
        <CardDescription>{t('aiFormFill.draftOnly')}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <FormValuesEditor
          prefix='proposal'
          values={values}
          onChange={(next) => {
            setValues(next);
            if (validationAttempted) {
              const parsed = formProposalValuesSchema.safeParse(
                parseEditorValues(next),
              );
              setInvalid(
                parsed.success
                  ? []
                  : parsed.error.issues.map((issue) =>
                      String(issue.path[0] ?? ''),
                    ),
              );
            }
          }}
          disabled={disabled}
          invalid={invalid}
          nameRef={nameRef}
          budgetRef={budgetRef}
        />
        {feedback ? (
          <p
            role={
              feedback === 'applied' || feedback === 'dismissed'
                ? 'status'
                : 'alert'
            }
            className='text-sm'
          >
            {t(`aiFormFill.${feedback}`)}
          </p>
        ) : null}
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            data-testid='apply-form-proposal'
            disabled={disabled}
            onClick={() => void apply()}
          >
            {status === 'pending' ? <Spinner /> : null}
            {t('aiFormFill.apply')}
          </Button>
          <Button
            type='button'
            data-testid='dismiss-form-proposal'
            variant='outline'
            disabled={
              status === 'pending' ||
              status === 'applied' ||
              status === 'dismissed'
            }
            onClick={() => {
              setStatus('dismissed');
              titleRef.current?.focus();
            }}
          >
            {t('aiFormFill.dismiss')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
