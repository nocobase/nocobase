/**
 * Enabled agents first, with collapsed, searchable discoveries grouped by tool and catalog model. Shared ignore
 * preferences hide pending groups and can be restored; disabled agents remain accessible. A row shows where it
 * can run now (team and personal runners, with a few names), its default reasoning effort and its state: a pending
 * agent offers "Fill in and enable", an enabled or disabled one "Edit" (`agent-dialog.tsx`), for someone who manages
 * agents; everyone else reads. Under the table, how to add an agent: connect a runner whose tool has the model.
 */
import { AgentQuotaHint, QuotaLabel } from '../../components/quota-status.js';
import { modelLabel, TOOL_LABELS } from '../../../shared/model-catalog.js';

import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type { AgentView } from '../../../shared/agents.js';
import { discoveryKey } from '../../../shared/model-catalog.js';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '../../components/ui/collapsible.js';
import { Checkbox } from '../../components/ui/checkbox.js';
import { Input } from '../../components/ui/input.js';
import { useNotify } from '../../hooks/use-notify.js';
import { agentsKeys } from '../../api/keys.js';
import {
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
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useFormatters } from '../../lib/format.js';
import { useQuotaExpiry } from '../../hooks/use-quota-expiry.js';
import { AgentDialog } from './agent-dialog.js';
import { ordered, stateOf, type AgentState } from './agent-state.js';

const STATE_TONE: Readonly<Record<AgentState, Tone>> = {
  enabled: 'green',
  pending: 'amber',
  disabled: 'grey',
  unreported: 'slate',
};

function groupDiscoveries(agents: readonly AgentView[]): AgentView[][] {
  const groups = new Map<string, AgentView[]>();
  for (const agent of agents) {
    const key =
      agent.discoveryKey ??
      (agent.tool && agent.model
        ? discoveryKey(agent.tool, agent.model)
        : agent.id);
    const members = groups.get(key) ?? [];
    members.push({ ...agent, discoveryKey: key });
    groups.set(key, members);
  }
  return [...groups.values()];
}

export function RunnerAgentsSection(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [disabled, setDisabled] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<AgentView | null>(null);
  const agents = useQuery({
    queryKey: agentsKeys.agents,
    queryFn: () => api.agents(),
  });
  useQuotaExpiry(agents.data ?? []);
  const groups = groupDiscoveries(agents.data ?? []);
  const discovered = groups
    .filter((group) => !group.some((agent) => agent.status === 'enabled'))
    .map((group) => group.filter((agent) => agent.status === 'pending'))
    .filter((group) => group.length);
  const visible = discovered.filter((group) => !group[0].ignored);
  const ignored = discovered.filter((group) => group[0].ignored);
  const preference = useMutation({
    mutationFn: ({
      groups: targets,
      ignored,
    }: {
      groups: readonly AgentView[][];
      ignored: boolean;
    }) =>
      api.setIgnored(
        targets.map((group) => ({
          key: group[0].discoveryKey!,
          expectedRevision: group[0].discoveryRevision ?? 0,
        })),
        ignored,
      ),
    onSuccess: () => {
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      notify.success(t('agents.discovery.saved'));
    },
    onError: (error) => {
      notify.error(error);
      void agents.refetch();
    },
  });
  const matchesSearch = (group: AgentView[]) =>
    group.some((agent) =>
      `${agent.name} ${agent.model} ${agent.tool}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const list = (targets: AgentView[][], restoring: boolean) => {
    const filtered = targets.filter(matchesSearch);
    const selectable = filtered.filter((group) => group[0].canEdit);
    const batch = selectable.slice(0, 256);
    const allSelected =
      selectable.length > 0 &&
      batch.every((group) => selected.includes(group[0].discoveryKey!));
    return (
      <div className='space-y-3'>
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelected([]);
          }}
          placeholder={t('agents.discovery.search')}
          aria-label={t('agents.discovery.search')}
        />
        {selectable.length ? (
          <Button
            variant='outline'
            disabled={preference.isPending}
            onClick={() =>
              setSelected(
                allSelected ? [] : batch.map((group) => group[0].discoveryKey!),
              )
            }
          >
            {t(
              allSelected
                ? 'agents.discovery.clearSelection'
                : selectable.length > 256
                  ? 'agents.discovery.selectFirst'
                  : 'agents.discovery.selectAll',
              { limit: 256 },
            )}
          </Button>
        ) : null}
        <p className='text-sm text-muted-foreground'>
          {t('agents.discovery.selectionCount', {
            count: selected.length,
            limit: 256,
          })}
        </p>
        {filtered.some((group) => group[0].canEdit) ? (
          <Button
            disabled={
              preference.isPending ||
              !selected.some((key) =>
                filtered.some((group) => group[0].discoveryKey === key),
              )
            }
            onClick={() =>
              preference.mutate({
                groups: filtered.filter((group) =>
                  selected.includes(group[0].discoveryKey!),
                ),
                ignored: !restoring,
              })
            }
          >
            {t(
              restoring
                ? 'agents.discovery.restoreSelected'
                : 'agents.discovery.ignoreSelected',
            )}
          </Button>
        ) : null}
        {filtered.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {t('agents.noneInFilter')}
          </p>
        ) : null}
        {Object.entries(TOOL_LABELS).map(([tool, label]) => {
          const byTool = filtered.filter((group) => group[0].tool === tool);
          return byTool.length ? (
            <div key={tool} className='space-y-2'>
              <h3 className='font-medium'>{label}</h3>
              {byTool.map((group) => {
                const agent = group[0];
                return (
                  <div
                    key={agent.discoveryKey}
                    data-testid={`agent-discovery-${agent.id}`}
                    className='flex items-center gap-3 rounded-lg border p-3'
                  >
                    {agent.canEdit ? (
                      <Checkbox
                        disabled={
                          preference.isPending ||
                          (selected.length >= 256 &&
                            !selected.includes(agent.discoveryKey!))
                        }
                        aria-label={t('agents.discovery.select', {
                          name: agent.name,
                        })}
                        checked={selected.includes(agent.discoveryKey!)}
                        onCheckedChange={(checked) =>
                          setSelected((current) =>
                            checked
                              ? [
                                  ...new Set([...current, agent.discoveryKey!]),
                                ].slice(0, 256)
                              : current.filter(
                                  (key) => key !== agent.discoveryKey,
                                ),
                          )
                        }
                      />
                    ) : null}
                    <div className='min-w-0 flex-1'>
                      <div className='font-medium'>{agent.name}</div>
                      <div className='break-all text-xs text-muted-foreground'>
                        {group
                          .map((candidate) =>
                            candidate.tool && candidate.model
                              ? modelLabel(candidate.tool, candidate.model)
                              : t('agents.effort.default'),
                          )
                          .join(', ')}
                      </div>
                    </div>
                    {agent.canEdit ? (
                      <>
                        <Button
                          variant='outline'
                          disabled={preference.isPending}
                          onClick={() =>
                            preference.mutate({
                              groups: [group],
                              ignored: !restoring,
                            })
                          }
                        >
                          {t(
                            restoring
                              ? 'agents.discovery.restore'
                              : 'agents.discovery.ignore',
                          )}
                        </Button>
                        {!restoring ? (
                          <Button
                            disabled={preference.isPending}
                            data-testid={`agent-edit-${agent.id}`}
                            onClick={() => setEditing(agent)}
                          >
                            {t('agents.enable.button')}
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null;
        })}
      </div>
    );
  };
  const candidates = editing
    ? groups.find((group) => group.some((agent) => agent.id === editing.id))
    : undefined;
  return (
    <section className='space-y-3' aria-labelledby='agents-runner-heading'>
      <SectionHeading
        id='agents-runner-heading'
        title={t('agents.fromRunners')}
        actions={
          <Button
            variant='outline'
            onClick={() => setDisabled((value) => !value)}
          >
            {t(
              disabled
                ? 'agents.discovery.enabled'
                : 'agents.discovery.disabled',
            )}
          </Button>
        }
      />
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
            agents.data.filter(
              (agent) => agent.status === (disabled ? 'disabled' : 'enabled'),
            ),
          )}
          onEdit={setEditing}
        />
      )}
      <Collapsible>
        <CollapsibleTrigger
          className='flex items-center gap-2 py-1 font-medium'
          data-testid='agents-discovery-toggle'
        >
          <ChevronDownIcon className='size-4' aria-hidden />
          {t('agents.discovery.new', { count: visible.length })}
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-3'>
          {list(visible, false)}
        </CollapsibleContent>
      </Collapsible>
      {ignored.length > 0 ? (
        <Collapsible>
          <CollapsibleTrigger
            data-testid='agents-ignored-toggle'
            className='flex items-center gap-2 py-1 text-sm text-muted-foreground'
          >
            <ChevronDownIcon className='size-4' aria-hidden />
            {t('agents.discovery.ignored', { count: ignored.length })}
          </CollapsibleTrigger>
          <CollapsibleContent className='pt-3'>
            {list(ignored, true)}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      <p className='text-sm text-muted-foreground'>{t('agents.howToAdd')}</p>
      <AgentDialog
        agent={editing}
        candidates={candidates}
        onClose={() => setEditing(null)}
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
            <TableHead>
              <span className='sr-only'>{t('agents.edit.button')}</span>
            </TableHead>
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
  return (
    <TableRow
      data-testid={`agent-${agent.id}`}
      data-state={state}
      className={quotaBlocked ? 'bg-destructive/5' : undefined}
    >
      <TableCell>
        <div className='min-w-0 leading-tight'>
          <div className='truncate font-medium'>{agent.name}</div>
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
        </div>
      </TableCell>
      <TableCell className='text-right'>
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
      </TableCell>
    </TableRow>
  );
}
