/**
 * The settings editors and summaries of Studio's workflow status rules (`stage-rules.ts`). The agents are the agents
 * plugin's (`useAgentOptions`).
 */
import { useAgentOptions } from '@nocobase/app-plugin-agents/client/kit';
import {
  PmExpandableTextarea,
  type StatusRuleEditorProps,
  type StatusRuleSummaryProps,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { AgentPicker } from '@/components/agent-picker';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

import { useAgentFieldLabels } from './agent-field-labels.js';
import { useAgentName } from './agent-name.js';

type StageRuleConfig = StatusRuleEditorProps['config'];

/** The same limits and placeholders as the server's (`server/agents/stage-rules.ts`). */
const INSTRUCTION_MAX = 4000;
const REASON_MAX = 500;
const PLACEHOLDERS = [
  'issue.identifier',
  'issue.title',
  'from',
  'to',
  'owner.name',
];

const textOf = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/** The first line of an instruction, shortened: what a collapsed rule shows of it. */
function excerpt(instruction: string): string {
  const line =
    instruction
      .split('\n')
      .map((part) => part.trim())
      .find(Boolean) ?? '';
  return line.length > 120 ? `${line.slice(0, 119)}…` : line;
}

/** Leaves out empty settings, so a rule keeps only what was chosen. */
function compact(config: Record<string, unknown>): StageRuleConfig {
  return Object.fromEntries(
    Object.entries(config).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  );
}

/** The agent a rule names, or with `allowCurrent` the issue's agent executor (an empty value). */
export function RuleAgentField({
  id,
  value,
  allowCurrent,
  onChange,
}: {
  readonly id: string;
  readonly value: string;
  readonly allowCurrent: boolean;
  readonly onChange: (agentId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  // A rule wakes the agent on an issue, which needs a working directory: only runner agents (the server refuses online ones).
  const agents = useAgentOptions({ type: 'runner' });
  const label = t('studioAgents.stageRules.agent');
  const labels = useAgentFieldLabels(label);
  const name = value ? agents.nameOf(value) : null;
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <AgentPicker
        id={id}
        agents={agents.agents}
        type='runner'
        value={value || null}
        onSelect={onChange}
        // A rule naming an agent the viewer cannot see keeps it, by name when it has one.
        {...(name && !agents.agents.some((agent) => agent.id === value)
          ? { shown: { name } }
          : {})}
        labels={{
          ...labels,
          unknown: t('studioAgents.stageRules.unknownAgent'),
        }}
        placeholder={t('studioAgents.stageRules.chooseAgent')}
        {...(allowCurrent
          ? {
              noneOption: {
                label: t('studioAgents.stageRules.currentExecutor'),
                onSelect: () => onChange(''),
              },
            }
          : {})}
      />
      {agents.failed ? (
        <FieldDescription>
          {t('studioAgents.stageRules.agentsUnavailable')}
        </FieldDescription>
      ) : null}
    </Field>
  );
}

export function RunAgentEditor({
  config,
  onChange,
  idPrefix,
}: StatusRuleEditorProps): ReactElement {
  const { t } = useTranslation();
  const agentId = textOf(config.agentId);
  const set = (patch: Record<string, unknown>) =>
    onChange(compact({ ...config, ...patch }));
  return (
    <div className='space-y-3'>
      <RuleAgentField
        id={`${idPrefix}-agent`}
        value={agentId}
        allowCurrent
        onChange={(next) =>
          set({ agentId: next, ...(next ? {} : { assign: undefined }) })
        }
      />
      {agentId ? (
        <label
          htmlFor={`${idPrefix}-assign`}
          className='flex items-start gap-3 text-sm'
        >
          <Switch
            id={`${idPrefix}-assign`}
            checked={config.assign !== false}
            onCheckedChange={(on) => set({ assign: on ? undefined : false })}
          />
          <span>
            <span className='font-medium'>
              {t('studioAgents.stageRules.assign')}
            </span>
            <span className='block text-muted-foreground'>
              {t('studioAgents.stageRules.assignHint')}
            </span>
          </span>
        </label>
      ) : null}
      <div className='grid gap-3 sm:grid-cols-2'>
        {(['maxRuns', 'windowHours'] as const).map((field) => (
          <Field key={field}>
            <FieldLabel htmlFor={`${idPrefix}-${field}`}>
              {t(`studioAgents.stageRules.${field}`)}
            </FieldLabel>
            <Input
              id={`${idPrefix}-${field}`}
              type='number'
              min={1}
              step={1}
              value={typeof config[field] === 'number' ? config[field] : ''}
              placeholder={field === 'maxRuns' ? '3' : '24'}
              onChange={(event) =>
                set({
                  [field]:
                    event.target.value === ''
                      ? undefined
                      : Number(event.target.value),
                })
              }
            />
          </Field>
        ))}
      </div>
      <FieldDescription>
        {t('studioAgents.stageRules.limitHint')}
      </FieldDescription>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-instruction`}>
          {t('studioAgents.stageRules.instruction')}
        </FieldLabel>
        <PmExpandableTextarea
          id={`${idPrefix}-instruction`}
          rows={3}
          maxLength={INSTRUCTION_MAX}
          value={textOf(config.instruction)}
          placeholder={t('studioAgents.stageRules.instructionPlaceholder')}
          onChange={(event) => set({ instruction: event.target.value })}
        />
        <FieldDescription>
          {t('studioAgents.stageRules.instructionHint', {
            placeholders: PLACEHOLDERS.map((name) => `{{${name}}}`).join(' '),
            interpolation: { escapeValue: false },
          })}
        </FieldDescription>
      </Field>
    </div>
  );
}

export function RunAgentSummary({
  config,
}: StatusRuleSummaryProps): ReactElement {
  const { t } = useTranslation();
  const name = useAgentName();
  const agentId = textOf(config.agentId);
  let text = t('studioAgents.stageRules.runAgentCurrent');
  if (agentId)
    text =
      config.assign === false
        ? t('studioAgents.stageRules.runAgentWithoutAssign', {
            agent: name(agentId),
          })
        : t('studioAgents.stageRules.runAgentAgent', { agent: name(agentId) });
  const instruction = excerpt(textOf(config.instruction));
  text = t('studioAgents.stageRules.withLimit', {
    summary: text,
    maxRuns: config.maxRuns ?? 3,
    windowHours: config.windowHours ?? 24,
  });
  return (
    <span>
      {instruction
        ? t('studioAgents.stageRules.withInstruction', {
            summary: text,
            instruction,
            interpolation: { escapeValue: false },
          })
        : text}
    </span>
  );
}

export function SuggestExecutorEditor({
  config,
  onChange,
  idPrefix,
}: StatusRuleEditorProps): ReactElement {
  const { t } = useTranslation();
  const set = (patch: Record<string, unknown>) =>
    onChange(compact({ ...config, ...patch }));
  return (
    <div className='space-y-3'>
      <RuleAgentField
        id={`${idPrefix}-agent`}
        value={textOf(config.agentId)}
        allowCurrent={false}
        onChange={(next) => set({ agentId: next })}
      />
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-reason`}>
          {t('studioAgents.stageRules.reason')}
        </FieldLabel>
        <PmExpandableTextarea
          id={`${idPrefix}-reason`}
          rows={2}
          maxLength={REASON_MAX}
          value={textOf(config.reason)}
          onChange={(event) => set({ reason: event.target.value })}
        />
      </Field>
    </div>
  );
}

export function SuggestExecutorSummary({
  config,
}: StatusRuleSummaryProps): ReactElement {
  const { t } = useTranslation();
  const name = useAgentName();
  const agentId = textOf(config.agentId);
  return (
    <span>
      {agentId
        ? t('studioAgents.stageRules.suggestExecutor', { agent: name(agentId) })
        : t('studioAgents.stageRules.suggestNoAgent')}
    </span>
  );
}
