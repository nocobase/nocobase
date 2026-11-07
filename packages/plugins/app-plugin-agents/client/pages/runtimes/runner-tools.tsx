import { Fragment, useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';
import {
  toolState,
  type RunnerSummary,
  type UnavailableModel,
} from '../../../shared/runners.js';
import { quotaTargetLabel } from '../../../shared/model-catalog.js';
import type { QuotaMarkTarget } from '../../../shared/quota.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useMediaQuery } from '../../hooks/use-media-query.js';
import { Switch } from '../../components/ui/switch.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import type { ToolSlotsDraft } from '../../lib/tool-slots.js';
import { ToolStateTag } from './runner-cells.js';
import { ToolLimitInput } from './tool-slots-fields.js';
import { quotaTargets } from './quota-targets.js';
import { QuotaCell, QuotaClearDialog } from './quota.js';

/** One form state, rendered as full-width rows on desktop and one card per tool on phones. */
export function ToolTable({
  runner,
  tools,
  switched,
  limits,
  invalid,
  editable,
  onSwitch,
  onLimits,
  now,
}: {
  readonly runner: RunnerSummary;
  readonly tools: readonly AgentTool[];
  readonly switched: ReadonlySet<AgentTool>;
  readonly limits: ToolSlotsDraft;
  readonly invalid: boolean;
  readonly editable: boolean;
  readonly onSwitch: (tool: AgentTool, on: boolean) => void;
  readonly onLimits: (draft: ToolSlotsDraft) => void;
  readonly now: number;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const query = useQueryClient();
  const notify = useNotify();
  const phone = useMediaQuery('(max-width: 639px)');
  const [selected, setSelected] = useState<UnavailableModel | null>(null);
  const clear = useMutation({
    mutationFn: (target: QuotaMarkTarget) => api.clearQuota(runner.id, target),
    onSuccess: () => {
      setSelected(null);
      void query.invalidateQueries({ queryKey: agentsKeys.runners });
      void query.invalidateQueries({ queryKey: agentsKeys.agents });
    },
    onError: (error) => notify.error(error),
  });
  const enabledTools = AGENT_TOOLS.filter((tool) => switched.has(tool));
  const nameOf = (tool: AgentTool, target: string) =>
    target
      ? quotaTargetLabel(
          tool,
          tool === 'opencode' || tool === 'pi' ? 'provider' : 'model',
          target,
        )
      : t(`tools.${tool}`);
  const confirm = () => {
    if (selected)
      clear.mutate({
        tool: selected.tool,
        scope: selected.scope ?? 'model',
        target: selected.model,
        window: selected.window ?? 'account',
      });
  };
  const dialog = (
    <QuotaClearDialog
      name={selected ? nameOf(selected.tool, selected.model) : null}
      pending={clear.isPending}
      onClear={confirm}
      onCancel={() => setSelected(null)}
    />
  );
  const quota = (tool: AgentTool, target = '') => (
    <QuotaCell
      runner={runner}
      tool={tool}
      target={target}
      now={now}
      onClear={setSelected}
    />
  );
  const limit = (tool: AgentTool) => (
    <ToolLimitInput
      id={`ag-runner-tool-slots-${tool}`}
      tool={tool}
      draft={limits}
      invalid={invalid}
      disabled={!editable}
      onChange={onLimits}
    />
  );
  const toggle = (tool: AgentTool) => (
    <Switch
      checked={enabledTools.includes(tool)}
      disabled={
        runner.status === 'revoked' || !(runner.canManageTools ?? editable)
      }
      aria-label={t('runtimes.tool.enableLabel', {
        tool: t(`tools.${tool}`),
        name: runner.name,
      })}
      onCheckedChange={(value) => onSwitch(tool, value)}
    />
  );
  const state = (tool: AgentTool) => (
    <ToolStateTag
      state={toolState({ enabledTools, tools: runner.tools }, tool)}
    />
  );
  if (!tools.length)
    return (
      <p className='text-sm text-muted-foreground'>{t('runtimes.noTools')}</p>
    );
  if (phone)
    return (
      <div className='space-y-3'>
        {dialog}
        {tools.map((tool) => (
          <div
            key={tool}
            data-testid={`runner-tool-${tool}`}
            data-enabled={enabledTools.includes(tool)}
            className='min-w-0 overflow-hidden rounded-lg border'
          >
            <div className='flex items-center gap-2 p-3'>
              <span className='min-w-0 font-medium'>{t(`tools.${tool}`)}</span>
              {state(tool)}
              <span className='ml-auto flex items-center'>{toggle(tool)}</span>
            </div>
            <div className='border-t p-3'>{quota(tool)}</div>
            {quotaTargets(runner, tool).map((target) => (
              <div key={target} className='border-t bg-muted/30 p-3'>
                <div className='mb-1 text-xs font-medium text-muted-foreground'>
                  {nameOf(tool, target)}
                </div>
                {quota(tool, target)}
              </div>
            ))}
            <div className='flex items-center justify-between gap-3 border-t px-3 py-2 text-xs'>
              <label
                className='flex min-w-0 items-center gap-2'
                htmlFor={`ag-runner-tool-slots-${tool}`}
              >
                <span className='shrink-0 text-muted-foreground'>
                  {t('runtimes.toolTable.limit')}
                </span>
                {limit(tool)}
              </label>
              <span className='shrink-0 text-muted-foreground'>
                {t('runtimes.toolTable.active')}{' '}
                <span className='text-foreground'>
                  {runner.activeByTool?.[tool] ?? 0}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <div className='w-full rounded-lg border'>
      {dialog}
      <Table className='table-fixed'>
        <colgroup>
          <col className='w-36' />
          <col className='w-14' />
          <col className='w-28' />
          <col />
          <col className='w-28' />
          <col className='w-20' />
        </colgroup>
        <TableHeader>
          <TableRow>
            {['tool', 'enabled', 'state'].map((key) => (
              <TableHead key={key}>{t(`runtimes.toolTable.${key}`)}</TableHead>
            ))}
            <TableHead>{t('runtimes.quota.title')}</TableHead>
            <TableHead>{t('runtimes.toolTable.limit')}</TableHead>
            <TableHead className='text-right'>
              {t('runtimes.toolTable.active')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool) => (
            <Fragment key={tool}>
              <TableRow
                data-testid={`runner-tool-${tool}`}
                data-enabled={enabledTools.includes(tool)}
              >
                <TableCell className='whitespace-normal'>
                  <span
                    className={
                      enabledTools.includes(tool)
                        ? 'font-medium'
                        : 'font-medium text-muted-foreground'
                    }
                  >
                    {t(`tools.${tool}`)}
                  </span>
                  {runner.tools.find((item) => item.kind === tool)?.version ? (
                    <span
                      title={
                        runner.tools.find((item) => item.kind === tool)?.path
                      }
                      className='block text-xs text-muted-foreground'
                    >
                      {runner.tools.find((item) => item.kind === tool)?.version}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className='flex items-center'>{toggle(tool)}</div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center'>{state(tool)}</div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center'>{quota(tool)}</div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center'>{limit(tool)}</div>
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  <div className='flex items-center justify-end'>
                    {runner.activeByTool?.[tool] ?? 0}
                  </div>
                </TableCell>
              </TableRow>
              {quotaTargets(runner, tool).map((target) => (
                <TableRow key={target} className='bg-muted/30'>
                  <TableCell
                    colSpan={3}
                    className='pl-6 text-xs text-muted-foreground'
                  >
                    <div className='flex items-center'>
                      {nameOf(tool, target)}
                    </div>
                  </TableCell>
                  <TableCell colSpan={3}>
                    <div className='flex items-center'>
                      {quota(tool, target)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
