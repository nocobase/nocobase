import { useTranslation } from '@nocobase/i18n/client';
import { CircleAlertIcon, PuzzleIcon } from 'lucide-react';
import { createElement, type ReactElement } from 'react';

import {
  isBuiltInEvent,
  type WorkflowStatusRule,
  type TransitionActor,
  type WorkflowDefinition,
  type WorkflowStatus,
} from '../../../../shared/workflows.js';
import { useStatusRuleTypes } from '../../../lib/status-rule-types.js';
import { useEventTitle } from '../../../lib/workflow-events.js';
import { PmTag } from '../../../components/pm-tag.js';
import { useKindLabel } from '../../../lib/kinds.js';
import { cn } from 'cn';
import { StatusRulesButton } from './status-rules.js';
import { useStatusName } from './use-status-name.js';
import { flowOrder, workflowRules } from './workflow-model.js';
import { PmKindIcon } from '../../../components/pm-kind-icon.js';

/**
 * The workflow in words: actor icons, status names, and the rules as sentences, the same in view and edit mode. The
 * picture is `WorkflowDiagram`, the matrix `TransitionsMatrix`.
 */

type Change = (
  change: (definition: WorkflowDefinition) => WorkflowDefinition,
) => void;

/** The actors of a move as icons, each with its name for screen readers and on hover. */
export function ActorIcons({
  actors,
}: {
  readonly actors: readonly TransitionActor[];
}): ReactElement {
  const kindLabel = useKindLabel('workflows.actors');
  return (
    <span className='inline-flex items-center gap-1'>
      {actors.map((actor) => {
        const label = kindLabel(actor);
        return (
          <span key={actor} title={label} data-actor={actor}>
            <PmKindIcon kind={actor} className='size-3.5' aria-hidden='true' />
            <span className='sr-only'>{label}</span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * A status rule as the short phrase listed under its status: its type's icon and summary, the same for this plugin's
 * own types and contributed ones; one whose plugin is gone says it is unavailable.
 */
export function RulePhrase({
  rule,
  status,
  statusName,
}: {
  readonly rule: WorkflowStatusRule;
  readonly status: Pick<WorkflowStatus, 'key' | 'category'>;
  readonly statusName: string;
}): ReactElement {
  const { t } = useTranslation();
  const type = useStatusRuleTypes().find((item) => item.type === rule.type);
  if (!type)
    return (
      <span
        className='inline-flex items-center gap-1.5 text-muted-foreground'
        data-rule-unavailable={rule.type}
      >
        <CircleAlertIcon className='size-3.5' aria-hidden='true' />
        {t('workflows.rules.unavailableShort', { type: rule.type })}
      </span>
    );
  const Icon = type.Icon ?? PuzzleIcon;
  return (
    <span
      className='inline-flex max-w-full min-w-0 items-center gap-1.5'
      data-rule-type={rule.type}
    >
      <Icon className='size-3.5 shrink-0' aria-hidden='true' />
      <span className='truncate'>
        {createElement(type.Summary, {
          config: ('config' in rule ? rule.config : undefined) ?? {},
          status: { ...status, name: statusName },
        })}
      </span>
    </span>
  );
}

/**
 * The workflow's rules as sentences, the same in view and edit mode: every transition (approvals first), then what
 * entering each status does. Transitions are changed in the matrix, so they stay sentences in edit mode too; with
 * `onChange` each status gets the button that opens its rules, and statuses without any are listed, muted, to add one.
 */
export function WorkflowRules({
  definition,
  onChange,
}: {
  readonly definition: WorkflowDefinition;
  readonly onChange?: Change;
}): ReactElement {
  const { t } = useTranslation();
  const kindLabel = useKindLabel('workflows.actors');
  const name = useStatusName(definition);
  const eventTitle = useEventTitle();
  const separator = t('workflows.listSeparator');
  const lines = workflowRules(definition);
  const transitions = lines.flatMap((line) =>
    line.kind === 'transition' ? [line] : [],
  );
  const autoMoves = lines.flatMap((line) =>
    line.kind === 'autoMove' ? [line] : [],
  );
  const statuses = flowOrder(definition).filter(
    (status) => onChange || (status.rules ?? []).length > 0,
  );
  return (
    <div className='space-y-5'>
      <section aria-labelledby='pm-workflow-rules-transitions'>
        <div className='mb-2 flex flex-wrap items-baseline justify-between gap-2'>
          <h3
            id='pm-workflow-rules-transitions'
            className='text-sm font-semibold'
          >
            {t('workflows.rulesTransitions')}
          </h3>
          {onChange ? (
            <p className='text-xs text-muted-foreground'>
              {t('workflows.rulesTransitionsHint')}
            </p>
          ) : null}
        </div>
        <ul className='divide-y rounded-lg border'>
          {transitions.map((rule) => (
            <li
              key={`${rule.from}>${rule.to}:${rule.actors.join(',')}`}
              className='flex flex-wrap items-center gap-2 px-3 py-2 text-sm'
            >
              <ActorIcons actors={rule.actors} />
              <span>
                {t('workflows.rule', {
                  actors: rule.actors.map(kindLabel).join(separator),
                  from: name(rule.from),
                  to: name(rule.to),
                })}
              </span>
              {rule.approval ? (
                <PmTag tone='amber'>
                  {t('workflows.approvalBy', {
                    roles: rule.approval
                      .map((role) => t(`workflows.approvers.${role}`))
                      .join(separator),
                  })}
                </PmTag>
              ) : null}
            </li>
          ))}
          {autoMoves.map((rule) => (
            <li
              key={`${rule.from}>${rule.to}@${rule.event}`}
              data-auto-move={rule.from}
              className='flex flex-wrap items-center gap-2 px-3 py-2 text-sm'
            >
              <ActorIcons actors={['system']} />
              <span>
                {isBuiltInEvent(rule.event)
                  ? t('workflows.autoMove.rule', {
                      from: name(rule.from),
                      to: name(rule.to),
                    })
                  : t('workflows.autoMove.eventRule', {
                      event: eventTitle(rule.event) ?? rule.event,
                      from: name(rule.from),
                      to: name(rule.to),
                    })}
              </span>
              {!isBuiltInEvent(rule.event) &&
              eventTitle(rule.event) === null ? (
                <PmTag tone='grey'>
                  {t('workflows.autoMove.unavailableShort')}
                </PmTag>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby='pm-workflow-rules-entering'>
        <h3
          id='pm-workflow-rules-entering'
          className='mb-2 text-sm font-semibold'
        >
          {t('workflows.rulesOnEnter')}
        </h3>
        {statuses.length === 0 ? (
          <p className='rounded-lg border px-3 py-2 text-sm text-muted-foreground'>
            {t('workflows.rulesNone')}
          </p>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {statuses.map((status) => {
              const rules = status.rules ?? [];
              return (
                <li
                  key={status.key}
                  data-status={status.key}
                  className={cn(
                    'flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm',
                    rules.length === 0 && 'text-muted-foreground',
                  )}
                >
                  <span className='w-28 shrink-0 font-medium'>
                    {name(status.key)}
                  </span>
                  {rules.length > 0 ? (
                    rules.map((rule) => (
                      <RulePhrase
                        key={rule.type}
                        rule={rule}
                        status={status}
                        statusName={name(status.key)}
                      />
                    ))
                  ) : (
                    <span>{t('workflows.rulesNoneHere')}</span>
                  )}
                  {onChange ? (
                    <span className='ml-auto'>
                      <StatusRulesButton
                        status={status}
                        definition={definition}
                        label={name(status.key)}
                        add={rules.length === 0}
                        onChange={onChange}
                      />
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
