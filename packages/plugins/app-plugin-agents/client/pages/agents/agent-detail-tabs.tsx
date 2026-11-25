/**
 * The tabs of an agent's details beside its settings: the business actions it may perform (the application's, the same
 * for every agent discovered from runners), the team's default skills every run of it gets, and its recent runs. Each
 * reads what the viewer may read; none of them changes anything.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type { AgentView } from '../../../shared/agents.js';
import { agentModelOf } from '../../../shared/model-catalog.js';
import { GLOBAL_SKILL_TARGET } from '../../../shared/skills.js';
import { agentsKeys } from '../../api/keys.js';
import { AgTag } from '../../components/ag-tag.js';
import { TONE_CLASS } from '../../components/ag-tag-tones.js';
import { Badge } from '../../components/ui/badge.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useText } from '../../hooks/use-vocabulary.js';
import { useAgentActions } from '../../lib/action-catalog.js';
import {
  compactDateTime,
  durationText,
  useFormatters,
} from '../../lib/format.js';
import { RUN_STATUS_TONE } from '../../lib/runs.js';
import { useRoleTitle, useChatRoles } from './chat-roles.js';

const Empty = ({ children }: { readonly children: string }): ReactElement => (
  <p className='text-sm text-muted-foreground'>{children}</p>
);

/** What an agent is, for a viewer who may not change it. */
export function AgentSummary({
  agent,
}: {
  readonly agent: AgentView;
}): ReactElement {
  const { t } = useTranslation();
  const roles = useChatRoles();
  const roleTitle = useRoleTitle(roles.data);
  const rows: readonly (readonly [string, string])[] = [
    [
      t('agents.columns.goodAt'),
      agent.description ?? t('agents.goodAtMissing'),
    ],
    [t('agents.edit.model'), agentModelOf(agent).model ?? '—'],
    [
      t('agents.columns.effort'),
      agent.effort
        ? t(`agents.effort.${agent.effort}`, { defaultValue: agent.effort })
        : t('agents.effort.default'),
    ],
    [
      t('agents.chatRoles.label'),
      agent.chatRoles?.length
        ? agent.chatRoles.map(roleTitle).join(', ')
        : t('agents.chatRoles.everyone'),
    ],
    [
      t('agents.columns.state'),
      t(`agents.state.${agent.status === 'enabled' ? 'enabled' : 'disabled'}`),
    ],
  ];
  return (
    <div className='space-y-3' data-testid='agent-summary'>
      <p className='text-sm text-muted-foreground'>
        {t('agents.detail.readOnly')}
      </p>
      <dl className='grid gap-3 text-sm sm:grid-cols-[10rem_1fr]'>
        {rows.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='whitespace-pre-wrap break-words'>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The business actions the agent may perform, by group, within what the person who woke it may do. */
export function AgentActionsTab({
  agent,
}: {
  readonly agent: AgentView;
}): ReactElement {
  const { t } = useTranslation();
  const text = useText();
  const options = useAgentActions(agent.actions);
  if (!options) return <Skeleton className='h-16' />;
  const held = new Set(agent.actions);
  const granted = options.filter((option) => held.has(option.key));
  const groups = new Map<string, typeof granted>();
  for (const option of granted)
    groups.set(option.group, [...(groups.get(option.group) ?? []), option]);
  return (
    <div className='space-y-4' data-testid='agent-actions'>
      <p className='text-sm text-muted-foreground'>
        {t('agents.detail.actionsHint')}
      </p>
      {granted.length === 0 ? (
        <Empty>{t('agents.detail.actionsNone')}</Empty>
      ) : (
        [...groups].map(([group, list]) => (
          <section key={group} className='space-y-1.5'>
            <h3 className='text-sm font-medium'>
              {text(list[0]?.groupTitle, group)}
            </h3>
            <ul className='flex flex-wrap gap-1.5'>
              {list.map((option) => (
                <li key={option.key}>
                  <AgTag
                    tone='blue'
                    title={
                      option.description
                        ? text(option.description, option.key)
                        : option.key
                    }
                  >
                    {text(option.title, option.key)}
                  </AgTag>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

/** The team's default skills: every run of every agent gets them. */
export function AgentSkillsTab(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const attached = useQuery({
    queryKey: [
      ...agentsKeys.skills,
      'attached',
      GLOBAL_SKILL_TARGET.scope,
      GLOBAL_SKILL_TARGET.scopeId,
    ],
    queryFn: () =>
      api.scopeSkills(GLOBAL_SKILL_TARGET.scope, GLOBAL_SKILL_TARGET.scopeId),
    retry: false,
  });
  const skills = useQuery({
    queryKey: agentsKeys.skills,
    queryFn: () => api.skills(),
    retry: false,
  });
  if (attached.isError || skills.isError)
    return <Empty>{t('agents.detail.skillsUnavailable')}</Empty>;
  if (!attached.data || !skills.data) return <Skeleton className='h-16' />;
  const ids = new Set(attached.data);
  const list = skills.data.filter((skill) => ids.has(skill.id));
  return (
    <div className='space-y-3' data-testid='agent-skills'>
      <p className='text-sm text-muted-foreground'>
        {t('agents.detail.skillsHint')}
      </p>
      {list.length === 0 ? (
        <Empty>{t('agents.detail.skillsNone')}</Empty>
      ) : (
        <ul className='divide-y rounded-md border'>
          {list.map((skill) => (
            <li key={skill.id} className='px-3 py-2 text-sm'>
              <div className='font-medium'>{skill.name}</div>
              <div className='line-clamp-2 text-muted-foreground'>
                {skill.description}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The agent's latest runs the viewer may see, newest first. */
export function AgentRunsTab({
  agentId,
}: {
  readonly agentId: string;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useAgentsApi();
  const format = useFormatters();
  const query = { agentId, pageSize: 20 };
  const runs = useQuery({
    queryKey: ['agents', 'runs', 'agent', agentId],
    queryFn: () => api.runs(query),
  });
  if (runs.isError) return <Empty>{t('runs.loadFailed')}</Empty>;
  if (!runs.data) return <Skeleton className='h-16' />;
  if (runs.data.length === 0) return <Empty>{t('runs.empty')}</Empty>;
  return (
    <div className='rounded-lg border' data-testid='agent-runs'>
      <Table className='table-fixed'>
        <colgroup>
          <col />
          <col className='w-28' />
          <col className='w-28' />
          <col className='w-20' />
        </colgroup>
        <TableHeader>
          <TableRow>
            {['issue', 'status', 'started', 'duration'].map((key) => (
              <TableHead key={key}>
                {t(`runtimes.quota.runColumns.${key}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.data.map((run) => (
            <TableRow key={run.id}>
              <TableCell
                className='truncate'
                title={`${run.subject.kind} · ${run.subject.id}`}
              >
                {run.subject.kind} · {run.subject.id}
              </TableCell>
              <TableCell>
                <Badge
                  variant='secondary'
                  className={TONE_CLASS[RUN_STATUS_TONE[run.status]]}
                >
                  <span
                    aria-hidden='true'
                    className='size-1.5 rounded-full bg-current'
                  />
                  {t(`runs.status.${run.status}`)}
                </Badge>
              </TableCell>
              <TableCell
                className='whitespace-nowrap text-xs text-muted-foreground'
                title={format.dateTime(run.startedAt ?? run.createdAt)}
              >
                {compactDateTime(run.startedAt ?? run.createdAt, i18n.language)}
              </TableCell>
              <TableCell className='text-xs tabular-nums'>
                {durationText(run.startedAt, run.finishedAt) ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
