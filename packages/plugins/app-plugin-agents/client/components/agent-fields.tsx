/**
 * Fields the new-agent dialog and the agent page share: the coding tool (with how many runners offer it now), an
 * entry's reasoning effort, and the business actions the application lets an agent be given.
 */
import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { type AgentActionOption, type AgentType } from '../../shared/agents.js';
import type { RunnerSummary } from '../../shared/runners.js';
import { useText } from '../hooks/use-vocabulary.js';
import { useAgentActions } from '../lib/action-catalog.js';
import { onlineFor } from '../lib/agents.js';
import { cn } from 'cn';
import { Checkbox } from './ui/checkbox.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from './ui/field.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { Skeleton } from './ui/skeleton.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

/** How many runtimes can run a tool now, as a dot and a count, with the full sentence in a tooltip. */
function OnlineCount({ count }: { readonly count: number }): ReactElement {
  const { t } = useTranslation();
  const label = t('agentForm.toolOnline', { count });
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={label}
            className='ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums'
          />
        }
      >
        <span
          aria-hidden
          className={cn(
            'size-1.5 rounded-full',
            count > 0 ? 'bg-primary' : 'bg-muted-foreground/40',
          )}
        />
        {count}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ToolSelect({
  id,
  value,
  runners,
  disabled,
  ariaLabel,
  onChange,
}: {
  readonly id: string;
  readonly value: AgentTool;
  /** For the count of runners each tool can run on now; none while loading. */
  readonly runners: readonly RunnerSummary[] | undefined;
  readonly disabled?: boolean;
  /** For a select with no visible label. */
  readonly ariaLabel?: string;
  readonly onChange: (tool: AgentTool) => void;
}): ReactElement {
  const { t } = useTranslation();
  const items = AGENT_TOOLS.map((tool) => ({
    value: tool,
    label: t(`tools.${tool}`),
  }));
  return (
    <Select
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={(next: string | null) => {
        const tool = AGENT_TOOLS.find((candidate) => candidate === next);
        if (tool) onChange(tool);
      }}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {AGENT_TOOLS.map((tool) => (
          <SelectItem key={tool} value={tool}>
            <span className='flex min-w-0 flex-1 items-center gap-2'>
              <span>{t(`tools.${tool}`)}</span>
              {runners ? (
                <OnlineCount count={onlineFor(runners, tool)} />
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** An entry's reasoning effort, among those its tool or service takes (`effortsFor`). */
export function EffortSelect({
  id,
  efforts,
  value,
  disabled,
  ariaLabel,
  onChange,
}: {
  readonly id: string;
  readonly efforts: readonly string[];
  /** Empty: the tool's or provider's default. */
  readonly value: string;
  readonly disabled?: boolean;
  /** For a select with no visible label. */
  readonly ariaLabel?: string;
  readonly onChange: (effort: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const items = [
    { value: 'default', label: t('agentForm.reasoningDefault') },
    ...efforts.map((effort) => ({
      value: effort,
      label: t(`agentForm.efforts.${effort}`, { defaultValue: effort }),
    })),
    // An effort saved before stays listed so it shows.
    ...(value && !efforts.includes(value) ? [{ value, label: value }] : []),
  ];
  return (
    <Select
      items={items}
      value={value || 'default'}
      disabled={disabled}
      onValueChange={(next: string | null) =>
        onChange(!next || next === 'default' ? '' : next)
      }
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The business actions as checkboxes, grouped as the application groups them, with its titles. Actions meant for
 * another type of agent (`AgentActionOption.types`) are left out. `detailed` (the agent page) adds each action's
 * description, and lists the actions that are never granted to an agent greyed out with the reason, so people see the
 * boundary; elsewhere those are left out.
 */
export function ActionCheckboxes({
  idPrefix,
  value,
  type,
  disabled,
  detailed,
  onChange,
}: {
  readonly idPrefix: string;
  readonly value: readonly string[];
  /** The agent's type; every action when absent. */
  readonly type?: AgentType;
  readonly disabled?: boolean;
  readonly detailed?: boolean;
  readonly onChange: (actions: string[]) => void;
}): ReactElement {
  const { t } = useTranslation();
  const text = useText();
  const all = useAgentActions(value);
  const actions = all?.filter(
    (action) =>
      (!type || !action.types || action.types.includes(type)) &&
      (detailed || action.grantable !== false),
  );
  if (!actions) return <Skeleton className='h-16 w-full' />;
  const groups = new Map<string, AgentActionOption[]>();
  for (const action of actions)
    groups.set(action.group, [...(groups.get(action.group) ?? []), action]);
  if (![...actions].some((action) => action.grantable !== false))
    return (
      <p className='text-sm text-muted-foreground'>{t('capabilities.none')}</p>
    );
  return (
    <div
      className={
        detailed
          ? 'grid gap-x-6 gap-y-5 sm:grid-cols-2'
          : 'grid gap-3 sm:grid-cols-2'
      }
    >
      {[...groups].map(([group, options]) => (
        <div
          key={group}
          role='group'
          aria-label={text(options[0]?.groupTitle, group)}
          className={detailed ? 'space-y-3' : 'space-y-2'}
        >
          <p className='text-xs font-medium text-muted-foreground'>
            {text(options[0]?.groupTitle, group)}
          </p>
          {options.map((option) => {
            const grantable = option.grantable !== false;
            const id = `${idPrefix}-${option.key}`;
            const label = text(option.title, option.key);
            return (
              <Field
                key={option.key}
                orientation='horizontal'
                data-disabled={grantable ? undefined : true}
                data-testid={detailed ? `capability-${option.key}` : undefined}
              >
                <Checkbox
                  id={id}
                  checked={grantable && value.includes(option.key)}
                  disabled={disabled || !grantable}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked
                        ? [...value, option.key]
                        : value.filter((item) => item !== option.key),
                    )
                  }
                />
                {detailed ? (
                  <FieldContent>
                    <FieldLabel htmlFor={id} className='font-normal'>
                      {label}
                    </FieldLabel>
                    {grantable ? (
                      option.description ? (
                        <FieldDescription>
                          {text(option.description, '')}
                        </FieldDescription>
                      ) : null
                    ) : (
                      <FieldDescription>
                        {option.reason
                          ? t('capabilities.notGrantableBecause', {
                              reason: text(option.reason, ''),
                            })
                          : t('capabilities.notGrantable')}
                      </FieldDescription>
                    )}
                  </FieldContent>
                ) : (
                  <FieldLabel htmlFor={id} className='font-normal'>
                    {label}
                  </FieldLabel>
                )}
              </Field>
            );
          })}
        </div>
      ))}
    </div>
  );
}
