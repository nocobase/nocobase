/**
 * The agents, enabled or disabled as the filter above the list says. A row shows its type and model, who may chat with
 * it (every member or some roles), where it can run now (team and personal runners, with a few names), its default
 * reasoning effort and its state; an enabled or
 * disabled one offers "Edit" (`agent-dialog.tsx`), for someone who manages agents; everyone else reads. The header's
 * "Add agent" opens the live available models drawer (`available-models-drawer.tsx`).
 */
import { AgentQuotaHint, QuotaLabel } from '../../components/quota-status.js';

import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import type { AgentView } from '../../../shared/agents.js';
import { agentsKeys } from '../../api/keys.js';
import {
  AgListSkeleton,
  AgLoadError,
  SectionHeading,
} from '../../components/ag-states.js';
import { AgTag, type Tone } from '../../components/ag-tag.js';
import { Button } from '../../components/ui/button.js';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useFormatters } from '../../lib/format.js';
import { useQuotaExpiry } from '../../hooks/use-quota-expiry.js';
import { AgentDialog } from './agent-dialog.js';
import { useChatRoles, useRoleTitle } from './chat-roles.js';
import { TeamDefaultAgent } from './team-default.js';
import { agentModelOf } from '../../../shared/model-catalog.js';
import { AvailableModelsDrawer } from './available-models-drawer.js';
import { ordered, stateOf, type AgentState } from './agent-state.js';

const STATE_TONE: Readonly<Record<AgentState, Tone>> = {
  enabled: 'green',
  disabled: 'grey',
  unreported: 'slate',
};

export function RunnerAgentsSection(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const [shown, setShown] = useState<'enabled' | 'disabled'>('enabled');
  const [editing, setEditing] = useState<AgentView | null>(null);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const agents = useQuery({
    queryKey: agentsKeys.agents,
    queryFn: () => api.agents(),
  });
  useQuotaExpiry(agents.data ?? []);
  return (
    <section
      className='min-w-0 space-y-3'
      aria-labelledby='agents-runner-heading'
    >
      <SectionHeading
        id='agents-runner-heading'
        title={t('agents.fromRunners')}
        actions={
          <>
            <Button
              variant='outline'
              onClick={() => setCreatingOpen(true)}
              data-testid='agents-available-open'
            >
              {t('agents.available.open')}
            </Button>
            <Tabs
              value={shown}
              onValueChange={(value) =>
                setShown(value === 'disabled' ? 'disabled' : 'enabled')
              }
            >
              <TabsList aria-label={t('agents.filterLabel')}>
                <TabsTrigger
                  value='enabled'
                  data-testid='agents-filter-enabled'
                >
                  {t('agents.filters.enabledOnly')}
                </TabsTrigger>
                <TabsTrigger
                  value='disabled'
                  data-testid='agents-filter-disabled'
                >
                  {t('agents.filters.disabled')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        }
      />
      <TeamDefaultAgent agents={agents.data} />
      {agents.isError && !agents.data ? (
        <AgLoadError
          title={t('agents.loadFailed')}
          error={agents.error}
          onRetry={() => void agents.refetch()}
        />
      ) : !agents.data ? (
        <AgListSkeleton />
      ) : (
        <AgentTable
          agents={ordered(
            agents.data.filter((agent) => agent.status === shown),
          )}
          onEdit={setEditing}
        />
      )}
      <p className='text-sm text-muted-foreground'>{t('agents.howToAdd')}</p>
      <AgentDialog agent={editing} onClose={() => setEditing(null)} />
      <AvailableModelsDrawer
        open={creatingOpen}
        onClose={() => setCreatingOpen(false)}
      />
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
  const roles = useChatRoles();
  const roleTitle = useRoleTitle(roles.data);
  return (
    <div className='min-w-0 max-w-full overflow-x-auto rounded-lg border'>
      <Table className='min-w-[48rem]'>
        <TableHeader>
          <TableRow>
            <TableHead>{t('agents.columns.agent')}</TableHead>
            <TableHead>{t('agents.columns.goodAt')}</TableHead>
            <TableHead>{t('agents.columns.chatRoles')}</TableHead>
            <TableHead>{t('agents.columns.where')}</TableHead>
            <TableHead>{t('agents.columns.effort')}</TableHead>
            <TableHead>{t('agents.columns.state')}</TableHead>
            <TableHead>
              <span className='sr-only'>{t('agents.edit.button')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              onEdit={onEdit}
              roleTitle={roleTitle}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AgentRow({
  agent,
  onEdit,
  roleTitle,
}: {
  readonly agent: AgentView;
  readonly onEdit: (agent: AgentView) => void;
  readonly roleTitle: (key: string) => string;
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  const state = stateOf(agent);
  const quotaBlocked =
    agent.status === 'enabled' &&
    !!agent.quota?.length &&
    ['noRunner', 'othersPersonal'].includes(agent.unusable ?? '');
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
        ? `${t('agents.where.personalOnly')}${runners.names.length ? `: ${runners.names.join(', ')}` : ''}`
        : runners.names.length > 0
          ? t('agents.where.names', { names: runners.names.join(', ') })
          : '';
  // Every agent shows its whole model id below its name.
  const qualifiedModel = agentModelOf(agent).model ?? null;
  return (
    <TableRow
      data-testid={`agent-${agent.id}`}
      data-state={state}
      className={quotaBlocked ? 'bg-destructive/5' : undefined}
    >
      <TableCell>
        <div className='min-w-0 leading-tight'>
          <div className='truncate font-medium'>{agent.name}</div>
          {qualifiedModel ? (
            <div
              className='truncate font-mono text-xs text-muted-foreground'
              title={qualifiedModel}
              data-testid='agent-model'
            >
              {qualifiedModel}
            </div>
          ) : null}
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
      <TableCell data-testid='agent-chat-roles-cell'>
        {agent.chatRoles?.length ? (
          <span className='line-clamp-2'>
            {agent.chatRoles.map(roleTitle).join(', ')}
          </span>
        ) : (
          <span className='text-muted-foreground'>
            {t('agents.chatRoles.everyone')}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className='leading-tight'>
          <div>
            {quotaBlocked
              ? agent.quota?.map((q) => q.runnerName).join(', ')
              : where}
          </div>
          <AgentQuotaHint
            quota={agent.quota}
            online={!quotaBlocked}
            names={runners.names}
          />
          {!quotaBlocked && !agent.quota?.length && whereNote ? (
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
          {quotaBlocked ? (
            <QuotaLabel />
          ) : (
            <AgTag tone={STATE_TONE[state]} dot>
              {t(`agents.state.${state}`)}
            </AgTag>
          )}
          {agent.status === 'enabled' && agent.unusable && !quotaBlocked ? (
            <AgTag
              tone='red'
              title={t(
                agent.unusable === 'othersPersonal'
                  ? 'agents.where.personalOnly'
                  : 'agents.where.noneOnline',
              )}
            >
              {t('agents.unavailableNow')}
            </AgTag>
          ) : null}
        </div>
      </TableCell>
      <TableCell className='text-right'>
        {agent.canEdit ? (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(agent)}
            aria-label={t('agents.edit.buttonFor', { name: agent.name })}
            data-testid={`agent-edit-${agent.id}`}
          >
            {t('agents.edit.button')}
          </Button>
        ) : (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(agent)}
            aria-label={t('agents.detail.viewFor', { name: agent.name })}
            data-testid={`agent-view-${agent.id}`}
          >
            {t('agents.detail.view')}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
