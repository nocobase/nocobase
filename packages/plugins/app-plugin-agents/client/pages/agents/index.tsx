/**
 * Route `/agents`: the agents that can take on work, with where they run and what they are doing now; a row opens
 * `/agents/:agentId`, "New agent" opens `new`.
 *
 * Mirrors NocoProject's agent list (`nocoproject/client/pages/np/agents/index.tsx`). An agent is no longer bound to one
 * runtime: "Where it runs" says "Any runner" or names the runners it is limited to, with how many of them are online
 * with its tool signed in. An online agent runs on the server: its row shows its model service and model, and whether the
 * service still offers it. The list filters by type.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { BotIcon, PlusIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { AgentAvatar } from '../../components/agent-avatar.js';
import { Link, Outlet, useNavigate } from 'react-router';

import {
  entryTools,
  type AgentModelEntry,
  type AgentSummary,
  type AgentType,
} from '../../../shared/agents.js';
import { AgentTypeTag } from '../../components/agent-type.js';
import { useDefaultModelText } from '../../hooks/use-model-catalog.js';
import { agentsKeys } from '../../api/keys.js';
import { AgPulse } from '../../components/ag-pulse.js';
import {
  AgEmpty,
  AgListSkeleton,
  AgLoadError,
} from '../../components/ag-states.js';
import { AgTag } from '../../components/ag-tag.js';
import { PageContainer } from '../../components/page-container.js';
import { ChatSettingsSection } from '../../chat/settings-section.js';
import { PageHeader } from '../../components/page-header.js';
import { Button } from '../../components/ui/button.js';
import { Label } from '../../components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import { Switch } from '../../components/ui/switch.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { useSetting } from '../../hooks/use-access.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useAgentText } from '../../hooks/use-vocabulary.js';
import { entryText } from '../../lib/agents.js';

/** The list refreshes this often for its active-run counts. */
const REFRESH_MS = 15_000;

export default function AgentsPage(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const navigate = useNavigate();
  const canManage = useSetting('agents.agents', 'manage');
  const [archived, setArchived] = useState(false);
  const [type, setType] = useState<AgentType | 'all'>('all');
  const typeItems = [
    { value: 'all', label: t('agentTypes.filterAll') },
    { value: 'online', label: t('agentTypes.online') },
    { value: 'runner', label: t('agentTypes.runner') },
  ];

  const agents = useQuery({
    queryKey: [...agentsKeys.agents, archived],
    queryFn: () => api.agents(archived),
    refetchInterval: REFRESH_MS,
  });
  const runners = useQuery({
    queryKey: agentsKeys.runners,
    queryFn: () => api.runners(),
  });
  const runnerName = (id: string): string =>
    runners.data?.find((runner) => runner.id === id)?.name ?? id;

  const newButton = () =>
    canManage ? (
      <Button nativeButton={false} render={<Link to='new' />}>
        <PlusIcon data-icon='inline-start' />
        {t('agents.new')}
      </Button>
    ) : null;

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
  else if (
    agents.data.length > 0 &&
    !agents.data.some((agent) => type === 'all' || agent.type === type)
  )
    content = (
      <AgEmpty
        icon={<BotIcon />}
        title={t('agents.emptyTitle')}
        description={t('agentTypes.noneOfType')}
      />
    );
  else if (agents.data.length === 0)
    content = (
      <AgEmpty
        icon={<BotIcon />}
        title={t('agents.emptyTitle')}
        description={
          canManage ? t('agents.emptyDescription') : t('agents.emptyReadOnly')
        }
        action={newButton()}
      />
    );
  else
    content = (
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('agents.columns.name')}</TableHead>
              <TableHead>{t('agents.columns.type')}</TableHead>
              <TableHead>{t('agents.columns.model')}</TableHead>
              <TableHead>{t('agents.columns.placement')}</TableHead>
              <TableHead>{t('agents.columns.activeRuns')}</TableHead>
              <TableHead>{t('agents.columns.access')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.data
              .filter((agent) => type === 'all' || agent.type === type)
              .map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  runnerName={runnerName}
                  onOpen={() => void navigate(encodeURIComponent(agent.id))}
                />
              ))}
          </TableBody>
        </Table>
      </div>
    );

  return (
    <PageContainer>
      <PageHeader
        title={t('agents.title')}
        description={t('agents.description')}
        actions={
          <>
            <Select
              items={typeItems}
              value={type}
              onValueChange={(next: string | null) =>
                setType(next === 'online' || next === 'runner' ? next : 'all')
              }
            >
              <SelectTrigger
                aria-label={t('agentTypes.label')}
                className='w-32'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                {typeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='flex items-center gap-2'>
              <Switch
                id='ag-agents-archived'
                checked={archived}
                onCheckedChange={(checked) => setArchived(checked)}
              />
              <Label htmlFor='ag-agents-archived' className='font-normal'>
                {t('agents.showArchived')}
              </Label>
            </div>
            {agents.data && agents.data.length > 0 ? newButton() : null}
          </>
        }
      />
      {archived ? null : <ChatSettingsSection canManage={canManage} />}
      {content}
      <Outlet />
    </PageContainer>
  );
}

/**
 * The default entry's model, and how many others the agent may fall to; for an online agent that lists none, the system
 * default chat model.
 */
function EntriesCell({
  type,
  entries,
}: {
  readonly type: AgentSummary['type'];
  readonly entries: readonly AgentModelEntry[];
}): ReactElement {
  const { t } = useTranslation();
  const defaultModel = useDefaultModelText();
  const [first, ...others] = entries;
  if (!first)
    return (
      <span className='text-muted-foreground'>
        {type === 'online' && defaultModel
          ? t('agents.defaultModelShort', { model: defaultModel })
          : t('agents.needsModel')}
      </span>
    );
  const model =
    'tool' in first ? first.model : `${first.modelService} · ${first.model}`;
  return (
    <span
      className='inline-flex items-center gap-1.5'
      title={entries.map((entry) => entryText(entry, t)).join('\n')}
    >
      {model ? (
        <span className='font-mono text-xs'>{model}</span>
      ) : (
        <span className='text-muted-foreground'>
          {t('agents.defaultModel')}
        </span>
      )}
      {others.length > 0 ? <AgTag tone='grey'>+{others.length}</AgTag> : null}
    </span>
  );
}

function AgentRow({
  agent,
  runnerName,
  onOpen,
}: {
  readonly agent: AgentSummary;
  readonly runnerName: (id: string) => string;
  readonly onOpen: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const text = useAgentText();
  const name = text.name(agent);
  const description = text.description(agent);
  return (
    <TableRow
      data-testid={`agent-${agent.id}`}
      className='cursor-pointer'
      onClick={onOpen}
    >
      <TableCell>
        <div className='flex min-w-0 items-center gap-2'>
          <AgentAvatar name={name} size='sm' />
          <div className='min-w-0 leading-tight'>
            <div className='flex min-w-0 items-center gap-2'>
              <Link
                to={encodeURIComponent(agent.id)}
                onClick={(event) => event.stopPropagation()}
                className='block truncate font-medium hover:underline'
              >
                {name}
              </Link>
              {agent.archivedAt ? (
                <AgTag tone='grey'>{t('agents.archivedTag')}</AgTag>
              ) : null}
            </div>
            {description ? (
              <div className='line-clamp-1 text-xs text-muted-foreground'>
                {description}
              </div>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className='inline-flex flex-wrap items-center gap-1'>
          <AgentTypeTag type={agent.type} />
          {entryTools(agent).map((tool) => (
            <AgTag key={tool} tone='grey'>
              {t(`tools.${tool}`)}
            </AgTag>
          ))}
        </span>
      </TableCell>
      <TableCell>
        <EntriesCell type={agent.type} entries={agent.modelEntries} />
      </TableCell>
      <TableCell>
        {agent.type === 'online' ? (
          <div className='flex flex-col gap-0.5 text-sm'>
            <span className='truncate'>{t('agentTypes.onServer')}</span>
            <span
              className={
                agent.onlineRunners > 0
                  ? 'text-xs text-muted-foreground'
                  : 'text-xs text-destructive'
              }
            >
              {agent.onlineRunners > 0
                ? t('agents.modelReady')
                : agent.modelEntries.length === 0
                  ? t('agents.needsModel')
                  : t('agents.modelUnavailable')}
            </span>
          </div>
        ) : (
          <div className='flex flex-col gap-0.5 text-sm'>
            <span className='truncate'>
              {agent.runnerIds.length === 0
                ? t('agents.anyRunner')
                : agent.runnerIds.map(runnerName).join(', ')}
            </span>
            <span
              className={
                agent.onlineRunners > 0
                  ? 'text-xs text-muted-foreground'
                  : 'text-xs text-destructive'
              }
            >
              {t('agents.onlineCount', { count: agent.onlineRunners })}
            </span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <span className='inline-flex items-center gap-1.5 tabular-nums'>
          {agent.activeRuns > 0 ? <AgPulse /> : null}
          {agent.activeRuns}
          {agent.type === 'online' ? null : (
            <span className='text-muted-foreground'>
              / {agent.maxConcurrentRuns}
            </span>
          )}
        </span>
      </TableCell>
      <TableCell>{t(`agents.access.${agent.access}`)}</TableCell>
    </TableRow>
  );
}
