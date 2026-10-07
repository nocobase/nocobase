/**
 * An agent's history (`GET /agents/:id/history`): who changed its configuration, when, and what, a field at a time.
 * Long text shows as a line diff, lists as what was added and removed (skills, runners, people and business actions by
 * name), other values as before → after. A variable is named with what happened to it, never with a value.
 *
 * `AgentChangeList` also tells someone whose save was refused what changed since they opened the agent.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ServerCogIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

import type {
  AgentChange,
  AgentFieldChange,
  AgentHistoryField,
  AgentModelEntry,
} from '../../../../shared/agents.js';
import { agentsKeys } from '../../../api/keys.js';
import { AgSection } from '../../../components/ag-section.js';
import { AgTag } from '../../../components/ag-tag.js';
import { DiffBlock } from '../../../components/diff-block.js';
import { Skeleton } from '../../../components/ui/skeleton.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { useText } from '../../../hooks/use-vocabulary.js';
import { useAgentActions } from '../../../lib/action-catalog.js';
import { entryText } from '../../../lib/agents.js';
import { useFormatters } from '../../../lib/format.js';

/** Fields shown as a line diff. */
const TEXT_FIELDS: ReadonlySet<AgentHistoryField> = new Set([
  'description',
  'instructions',
  'toolPolicy',
]);

/** Fields holding ids, named through `Names`. */
const LIST_FIELDS: ReadonlySet<AgentHistoryField> = new Set([
  'skillIds',
  'runnerIds',
  'actions',
  'userIds',
]);

/** Names of the ids a change may hold. */
interface Names {
  readonly skillIds: ReadonlyMap<string, string>;
  readonly runnerIds: ReadonlyMap<string, string>;
  readonly userIds: ReadonlyMap<string, string>;
  readonly actions: ReadonlyMap<string, string>;
}

const NO_ACTIONS: readonly string[] = [];

/** The names of skills, runners, people and business actions, as far as the caller may read them. */
function useNames(): Names {
  const api = useAgentsApi();
  const text = useText();
  const skills = useQuery({
    queryKey: agentsKeys.skills,
    queryFn: () => api.skills(),
  });
  const runners = useQuery({
    queryKey: agentsKeys.runners,
    queryFn: () => api.runners(),
  });
  const users = useQuery({
    queryKey: agentsKeys.users,
    queryFn: () => api.users(),
  });
  const actions = useAgentActions(NO_ACTIONS);
  return {
    skillIds: new Map((skills.data ?? []).map((item) => [item.id, item.name])),
    runnerIds: new Map(
      (runners.data ?? []).map((item) => [item.id, item.name]),
    ),
    userIds: new Map((users.data ?? []).map((item) => [item.id, item.name])),
    actions: new Map(
      (actions ?? []).map((option) => [
        option.key,
        text(option.title, option.key),
      ]),
    ),
  };
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function asList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function Chip({
  tone,
  children,
}: {
  readonly tone: 'added' | 'removed';
  readonly children: ReactNode;
}): ReactElement {
  return (
    <AgTag tone={tone === 'added' ? 'green' : 'red'}>
      {tone === 'added' ? '+ ' : '− '}
      {children}
    </AgTag>
  );
}

/** One field that changed. */
function FieldChange({
  change,
  names,
}: {
  readonly change: AgentFieldChange;
  readonly names: Names;
}): ReactElement {
  const { t } = useTranslation();
  if (change.field === 'variable')
    return (
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>
          {t('history.fields.variable')}
        </span>
        <code className='font-mono text-xs'>{change.name}</code>
        <span>{t(`history.variable.${change.change}`)}</span>
        <span className='text-xs text-muted-foreground'>
          {t('history.valueHidden')}
        </span>
      </div>
    );
  const { field, before, after } = change;
  const label = (
    <span className='text-muted-foreground'>
      {t(`history.fields.${field}`)}
    </span>
  );
  if (TEXT_FIELDS.has(field))
    return (
      <div className='space-y-1 text-sm'>
        {label}
        <DiffBlock before={asText(before)} after={asText(after)} />
      </div>
    );
  if (LIST_FIELDS.has(field)) {
    const map = names[field as keyof Names];
    const from = asList(before);
    const to = asList(after);
    const name = (id: string) => map.get(id) ?? id;
    return (
      <div className='flex flex-wrap items-center gap-1.5 text-sm'>
        {label}
        {to
          .filter((id) => !from.includes(id))
          .map((id) => (
            <Chip key={`+${id}`} tone='added'>
              {name(id)}
            </Chip>
          ))}
        {from
          .filter((id) => !to.includes(id))
          .map((id) => (
            <Chip key={`-${id}`} tone='removed'>
              {name(id)}
            </Chip>
          ))}
      </div>
    );
  }
  const show = (value: unknown): string => {
    if (value === null || value === undefined || value === '')
      return t('history.none');
    const plain = asText(value);
    if (field === 'modelEntries' && Array.isArray(value))
      return (value as AgentModelEntry[])
        .map((entry) => entryText(entry, t))
        .join(', ');
    if (field === 'type') return t(`agentTypes.${plain}`);
    if (field === 'access') return t(`agents.access.${plain}`);
    if (field === 'confirmChanges') return t(`capabilities.confirm.${plain}`);
    if (field === 'ownerUserId') return names.userIds.get(plain) ?? plain;
    return plain;
  };
  return (
    <div className='flex flex-wrap items-center gap-2 text-sm'>
      {label}
      <span className='text-muted-foreground line-through'>{show(before)}</span>
      <span aria-hidden='true'>→</span>
      <span className='font-medium'>{show(after)}</span>
    </div>
  );
}

/**
 * Who made a change: a person by name, the system when no person did (a seed, a migration, a background job), or a
 * person whose account is gone.
 */
function Actor({ entry }: { readonly entry: AgentChange }): ReactElement {
  const { t } = useTranslation();
  if (entry.actorUserId === null)
    return (
      <span className='inline-flex items-center gap-1 font-medium'>
        <ServerCogIcon
          aria-hidden='true'
          className='size-3.5 text-muted-foreground'
        />
        {t('history.system')}
      </span>
    );
  return (
    <span className='font-medium'>
      {entry.actorName ?? t('history.deletedUser')}
    </span>
  );
}

/** Entries of an agent's history, newest first. */
export function AgentChangeList({
  entries,
}: {
  readonly entries: readonly AgentChange[];
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  const names = useNames();
  if (entries.length === 0)
    return (
      <p className='text-sm text-muted-foreground'>{t('history.empty')}</p>
    );
  return (
    <ol className='divide-y rounded-lg border'>
      {entries.map((entry) => (
        <li
          key={entry.id}
          data-testid={`agent-change-${entry.id}`}
          className='space-y-2 px-3 py-2.5'
        >
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <Actor entry={entry} />
            <span>{t(`history.actions.${entry.action}`)}</span>
            <AgTag tone='grey'>
              {t('history.version', { revision: entry.revision })}
            </AgTag>
            <time
              dateTime={entry.createdAt}
              title={format.dateTime(entry.createdAt)}
              className='ml-auto text-xs text-muted-foreground'
            >
              {format.relative(entry.createdAt)}
            </time>
          </div>
          {entry.changes.length > 0 ? (
            <div className='space-y-2 pl-7'>
              {entry.changes.map((change) => (
                <FieldChange
                  key={
                    change.field === 'variable'
                      ? `variable:${change.name}`
                      : change.field
                  }
                  change={change}
                  names={names}
                />
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/** The history tab of an agent's page. */
export function AgentHistory({
  agentId,
}: {
  readonly agentId: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const history = useQuery({
    queryKey: agentsKeys.agentHistory(agentId),
    queryFn: () => api.agentHistory(agentId),
  });
  return (
    <AgSection
      id='ag-agent-history'
      title={t('history.title')}
      description={t('history.description')}
      className='max-w-3xl'
    >
      {history.data ? (
        <AgentChangeList entries={history.data} />
      ) : (
        <Skeleton className='h-24 w-full' />
      )}
    </AgSection>
  );
}
