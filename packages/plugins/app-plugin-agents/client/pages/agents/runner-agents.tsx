/**
 * The agents discovered from runners: one row for each coding tool and model a runner reported, filtered by All,
 * Enabled, Pending and No runner. A row shows the agent's name with its tool and model, what it is good at, where it
 * can run now (team and personal runners, with a few names), its default reasoning effort and its state: a pending
 * agent offers "Fill in and enable", an enabled or disabled one "Edit" (`agent-dialog.tsx`), for someone who manages
 * agents; everyone else reads. Under the table, how to add an agent: connect a runner whose tool has the model.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { BotIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type { AgentView } from '../../../shared/agents.js';
import { agentsKeys } from '../../api/keys.js';
import {
  AgEmpty,
  AgListSkeleton,
  AgLoadError,
  SectionHeading,
} from '../../components/ag-states.js';
import { AgTag, type Tone } from '../../components/ag-tag.js';
import { Button } from '../../components/ui/button.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useFormatters } from '../../lib/format.js';
import { AgentDialog } from './agent-dialog.js';
import {
  AGENT_FILTERS,
  matches,
  ordered,
  stateOf,
  type AgentFilter,
  type AgentState,
} from './agent-state.js';

const STATE_TONE: Readonly<Record<AgentState, Tone>> = {
  enabled: 'green',
  pending: 'amber',
  disabled: 'grey',
  unreported: 'slate',
};

export function RunnerAgentsSection(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const [filter, setFilter] = useState<AgentFilter>('all');
  const [editing, setEditing] = useState<AgentView | null>(null);
  const agents = useQuery({
    queryKey: agentsKeys.agents,
    queryFn: () => api.agents(),
  });

  let content: ReactElement;
  if (agents.isError && !agents.data)
    content = (
      <AgLoadError
        title={t('agents.loadFailed')}
        error={agents.error}
        onRetry={() => void agents.refetch()}
      />
    );
  else if (!agents.data) content = <AgListSkeleton />;
  else if (agents.data.length === 0)
    content = (
      <AgEmpty
        icon={<BotIcon />}
        title={t('agents.emptyTitle')}
        description={t('agents.emptyDescription')}
      />
    );
  else {
    const shown = ordered(
      agents.data.filter((agent) => matches(agent, filter)),
    );
    content =
      shown.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('agents.noneInFilter')}
        </p>
      ) : (
        <AgentTable agents={shown} onEdit={setEditing} />
      );
  }

  const counts = (agents.data ?? []).reduce<Record<AgentFilter, number>>(
    (all, agent) => {
      for (const each of AGENT_FILTERS)
        if (matches(agent, each)) all[each] += 1;
      return all;
    },
    { all: 0, enabled: 0, pending: 0, unreported: 0 },
  );

  return (
    <section className='space-y-3' aria-labelledby='agents-runner-heading'>
      <SectionHeading
        id='agents-runner-heading'
        title={t('agents.fromRunners')}
        actions={
          <Tabs
            value={filter}
            onValueChange={(value: string) => setFilter(value as AgentFilter)}
          >
            <TabsList aria-label={t('agents.filterLabel')}>
              {AGENT_FILTERS.map((each) => (
                <TabsTrigger
                  key={each}
                  value={each}
                  data-testid={`agents-filter-${each}`}
                >
                  {t(`agents.filters.${each}`, { count: counts[each] })}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />
      {content}
      <p className='text-sm text-muted-foreground'>{t('agents.howToAdd')}</p>
      <AgentDialog agent={editing} onClose={() => setEditing(null)} />
    </section>
  );
}

function AgentTable({
  agents,
  onEdit,
}: {
  readonly agents: readonly AgentView[];
  readonly onEdit: (agent: AgentView) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('agents.columns.agent')}</TableHead>
            <TableHead>{t('agents.columns.goodAt')}</TableHead>
            <TableHead>{t('agents.columns.where')}</TableHead>
            <TableHead>{t('agents.columns.effort')}</TableHead>
            <TableHead>{t('agents.columns.state')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} onEdit={onEdit} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AgentRow({
  agent,
  onEdit,
}: {
  readonly agent: AgentView;
  readonly onEdit: (agent: AgentView) => void;
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  const state = stateOf(agent);
  const { runners } = agent;
  const where =
    runners.team + runners.personal === 0
      ? t('agents.where.none')
      : runners.team > 0 && runners.personal > 0
        ? t('agents.where.both', {
            team: runners.team,
            personal: runners.personal,
          })
        : runners.team > 0
          ? t('agents.where.team', { count: runners.team })
          : t('agents.where.personal', { count: runners.personal });
  const whereNote = !agent.reported
    ? t('agents.where.lastReported', {
        when: format.relative(agent.lastReportedAt),
      })
    : runners.team + runners.personal === 0
      ? t('agents.where.noneOnline')
      : runners.team === 0
        ? t('agents.where.personalOnly')
        : runners.names.length > 0
          ? t('agents.where.names', { names: runners.names.join(', ') })
          : '';
  return (
    <TableRow data-testid={`agent-${agent.id}`} data-state={state}>
      <TableCell>
        <div className='min-w-0 leading-tight'>
          <div className='truncate font-medium'>{agent.name}</div>
          <div className='truncate font-mono text-xs text-muted-foreground'>
            {agent.tool} / {agent.model}
          </div>
        </div>
      </TableCell>
      <TableCell className='max-w-80 whitespace-normal'>
        {agent.description ? (
          <span className='line-clamp-2'>{agent.description}</span>
        ) : (
          <span className='text-muted-foreground'>
            {t('agents.goodAtMissing')}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className='leading-tight'>
          <div>{where}</div>
          {whereNote ? (
            <div className='text-xs text-muted-foreground'>{whereNote}</div>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        {agent.effort
          ? t(`agents.effort.${agent.effort}`, { defaultValue: agent.effort })
          : t('agents.effort.default')}
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <AgTag tone={STATE_TONE[state]} dot>
            {t(`agents.state.${state}`)}
          </AgTag>
          {agent.canEdit ? (
            <Button
              variant={agent.status === 'pending' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => onEdit(agent)}
              aria-label={t(
                agent.status === 'pending'
                  ? 'agents.enable.buttonFor'
                  : 'agents.edit.buttonFor',
                { name: agent.name },
              )}
              data-testid={`agent-edit-${agent.id}`}
            >
              {t(
                agent.status === 'pending'
                  ? 'agents.enable.button'
                  : 'agents.edit.button',
              )}
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
