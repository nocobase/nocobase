/**
 * The ways a "Configure CI" run goes (`shared/ci-modes.ts`):
 *
 * - `CiMethodChoice`: one radio group in two parts, each a row of compact radio cards: "Studio writes it" (write the
 *   standard workflow, start from it and edit, or hand it to an agent) and "Handle it yourself" (copy the workflow and
 *   commands, or a prompt for one's own agent). What the chosen way needs besides (`details`: the agent's executor,
 *   the file to edit, the steps and commands, the prompt) shows right beneath its own part. Without a Git connection
 *   the first part is disabled, saying why with a link to connect one;
 * - `CiAgentField`: who works on the "Set up deployment" issue of `agent`.
 */
import { useAgentOptions } from '@nocobase/app-plugin-agents/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useId, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';

import { AgentPicker } from '@/components/agent-picker';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { CiMethod } from '../../../shared/ci-modes.js';
import { useAgentFieldLabels } from '../../agents/agent-field-labels.js';
import { STUDIO_METHODS, SELF_METHODS } from './model.js';
import { RADIO_CARD } from './target-fields.js';

/**
 * The built-in senior developer agent, the issue's executor unless someone chooses another: setting up CI changes the
 * repository and opens a pull request, which the project lead, a coordinator, may not do.
 */
export const CI_SETUP_AGENT = 'studio-senior-developer';

export function CiMethodChoice({
  value,
  onChange,
  connected,
  details,
}: {
  readonly value: CiMethod;
  readonly onChange: (method: CiMethod) => void;
  /** Whether the repository is reached through a Git connection: Studio's ways need it. */
  readonly connected: boolean;
  /** What the chosen way needs besides, shown beneath its part. */
  readonly details?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const id = useId();
  const option = (method: CiMethod, disabled: boolean) => (
    <FieldLabel
      key={method}
      htmlFor={`${id}-${method}`}
      data-ci-method={method}
      data-unavailable={disabled ? true : undefined}
      className={`${RADIO_CARD} data-unavailable:cursor-not-allowed`}
    >
      <Field orientation='horizontal' data-disabled={disabled || undefined}>
        <RadioGroupItem
          id={`${id}-${method}`}
          value={method}
          disabled={disabled}
        />
        <FieldContent>
          <FieldTitle>{t(`ciSetup.methods.${method}.title`)}</FieldTitle>
          <FieldDescription className='text-xs'>
            {t(`ciSetup.methods.${method}.description`)}
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  );
  const part = (
    group: 'studio' | 'self',
    methods: readonly CiMethod[],
    disabled: boolean,
  ) => (
    <FieldSet className='min-w-0 gap-3' data-ci-method-group={group}>
      <FieldLegend variant='label'>{t(`ciSetup.method.${group}`)}</FieldLegend>
      {group === 'studio' && !connected ? (
        <p className='text-sm text-muted-foreground' data-ci-auto-unavailable>
          {t('ciSetup.method.autoUnavailable')}{' '}
          <Link
            to='/config/git'
            className='font-medium text-primary underline-offset-4 hover:underline'
          >
            {t('ciSetup.method.connect')}
          </Link>
        </p>
      ) : null}
      <div className='grid gap-2 @md/ci:grid-cols-2 @2xl/ci:grid-cols-3'>
        {methods.map((method) => option(method, disabled))}
      </div>
      {methods.includes(value) ? details : null}
    </FieldSet>
  );
  return (
    <RadioGroup
      value={value}
      aria-label={t('ciSetup.method.label')}
      onValueChange={(next: unknown) => {
        const found = [...STUDIO_METHODS, ...SELF_METHODS].find(
          (method) => method === next,
        );
        if (found) onChange(found);
      }}
      className='flex min-w-0 flex-col gap-5'
      data-ci-method-choice
    >
      {part('studio', STUDIO_METHODS, !connected)}
      {part('self', SELF_METHODS, false)}
    </RadioGroup>
  );
}

/** Who works on the "Set up deployment" issue: the senior developer agent unless someone chooses another. */
export function CiAgentField({
  agentId,
  onChange,
  className,
}: {
  readonly agentId: string;
  readonly onChange: (agentId: string) => void;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const agents = useAgentOptions({ type: 'runner' });
  const items = agents.options;
  const labels = useAgentFieldLabels(t('ciSetup.agent.label'));
  const fallback = (items.find((item) => item.value === CI_SETUP_AGENT) ??
    items[0]) as { readonly value: string } | undefined;
  useEffect(() => {
    if (!agentId && fallback) onChange(fallback.value);
  }, [agentId, fallback, onChange]);
  return (
    <Field className={className}>
      <FieldLabel htmlFor='ci-method-agent'>
        {t('ciSetup.agent.label')}
      </FieldLabel>
      <AgentPicker
        id='ci-method-agent'
        agents={agents.agents}
        type='runner'
        value={agentId || null}
        onSelect={onChange}
        labels={labels}
        placeholder={t('ciSetup.agent.choose')}
      />
      <FieldDescription>{t('ciSetup.agent.hint')}</FieldDescription>
    </Field>
  );
}
