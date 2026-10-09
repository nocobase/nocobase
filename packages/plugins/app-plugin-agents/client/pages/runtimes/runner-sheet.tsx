/**
 * One runtime's sheet, opened from its row on the runtimes page: every setting of it. "General" holds its name, how
 * many runs it takes at once and who it works for (sharing it with the team asks first), and whether it takes build
 * jobs when the application gives runners any; "Tools" is one table of the coding tools it reported, a row each: whether
 * it is on here, its sign-in, how many runs of it at once and how many it runs now. Both are one form, saved together
 * with "Save". "Local policy" shows what its owner's policy on the machine lets it take; "Recent runs" lists its latest
 * runs. Only its owner and the managers of runtimes change it; everyone else reads it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router';

import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';

import {
  jobKindsOf,
  listedTools,
  RUNNER_TRUST,
  toolEnabled,
  toolState,
  type RunnerPatch,
  type RunnerSummary,
  type RunnerTrust,
} from '../../../shared/runners.js';
import { agentsKeys } from '../../api/keys.js';
import { AgSection } from '../../components/ag-section.js';
import { AgTag } from '../../components/ag-tag.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog.js';
import { Button } from '../../components/ui/button.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet.js';
import { Spinner } from '../../components/ui/spinner.js';
import { Switch } from '../../components/ui/switch.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useFormatters } from '../../lib/format.js';
import { RUN_STATUS_TONE } from '../../lib/runs.js';
import {
  RunnerStatusCell,
  RunnerUpgradeRequired,
  RunnerVersionCell,
  ToolStateTag,
} from './runner-cells.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { POLICY_FIELDS, policyRule } from './runner-policy.js';
import {
  readToolSlots,
  toolSlotsDraft,
  type ToolSlotsDraft,
} from '../../lib/tool-slots.js';
import { OverTotalHint, ToolLimitInput } from './tool-slots-fields.js';

export function RunnerSheet({
  runner,
  onClose,
}: {
  /** Null while closed. */
  readonly runner: RunnerSummary | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Sheet
      open={runner !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className='w-full gap-0 data-[side=right]:sm:max-w-xl'
        data-testid='runner-sheet'
      >
        {runner ? (
          <>
            <SheetHeader className='border-b pr-12'>
              <SheetTitle>{runner.name}</SheetTitle>
              <SheetDescription className='flex flex-wrap items-center gap-x-1'>
                <span>
                  {[
                    `${runner.os} · ${runner.arch}`,
                    runner.hostname,
                    runner.ownerName
                      ? t('runtimes.detail.owner', { name: runner.ownerName })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {runner.version ? (
                  <>
                    <span aria-hidden='true'>·</span>
                    <RunnerVersionCell runner={runner} plain />
                  </>
                ) : null}
              </SheetDescription>
              <div className='pt-1.5'>
                <RunnerStatusCell runner={runner} />
              </div>
            </SheetHeader>
            <RunnerDetail key={runner.id} runner={runner} />
          </>
        ) : (
          <SheetTitle className='sr-only'>{t('runtimes.title')}</SheetTitle>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RunnerDetail({
  runner,
}: {
  readonly runner: RunnerSummary;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const editable = runner.canManage && runner.status !== 'revoked';

  const update = useMutation({
    mutationFn: (patch: RunnerPatch) => api.updateRunner(runner.id, patch),
    onSuccess: (saved) =>
      notify.success(t('runtimes.edit.saved', { name: saved.name })),
    onError: (error) => notify.error(error),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.runners });
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
    },
  });

  return (
    <div className='min-h-0 flex-1 space-y-6 overflow-y-auto p-4'>
      {runner.status === 'upgrade_required' ? (
        <RunnerUpgradeRequired runner={runner} />
      ) : null}
      {runner.canManage ? null : (
        <p className='text-sm text-muted-foreground'>
          {t('runtimes.detail.readOnly')}
        </p>
      )}
      <SettingsForm
        runner={runner}
        editable={editable}
        pending={update.isPending}
        onSave={(patch) => update.mutate(patch)}
      />
      <AgSection
        id='ag-runner-policy'
        title={t('runtimes.policy.title')}
        description={t('runtimes.policy.description')}
      >
        <PolicyView runner={runner} />
      </AgSection>
      <AgSection id='ag-runner-runs' title={t('runtimes.detail.runs')}>
        <RecentRuns runnerId={runner.id} />
      </AgSection>
    </div>
  );
}

/** The tools a runner's choice (`enabledTools`) names, as a patch stores it: the reported ones as switched here. */
function enabledToolsOf(
  runner: RunnerSummary,
  switched: ReadonlySet<AgentTool>,
): AgentTool[] {
  const listed = listedTools(runner);
  return AGENT_TOOLS.filter((tool) =>
    listed.includes(tool) ? switched.has(tool) : toolEnabled(runner, tool),
  );
}

function SettingsForm({
  runner,
  editable,
  pending,
  onSave,
}: {
  readonly runner: RunnerSummary;
  readonly editable: boolean;
  readonly pending: boolean;
  readonly onSave: (patch: RunnerPatch) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [name, setName] = useState(runner.name);
  const [slots, setSlots] = useState(String(runner.slots));
  const [trust, setTrust] = useState<RunnerTrust>(runner.trust);
  const [acceptJobs, setAcceptJobs] = useState(runner.acceptJobs);
  const [toolSlots, setToolSlots] = useState<ToolSlotsDraft>(() =>
    toolSlotsDraft(runner.toolSlots ?? null),
  );
  const [switched, setSwitched] = useState<ReadonlySet<AgentTool>>(
    () =>
      new Set(listedTools(runner).filter((tool) => toolEnabled(runner, tool))),
  );
  const [errors, setErrors] = useState<{
    name?: string;
    slots?: string;
    toolSlots?: boolean;
  }>({});
  // The tools it reports, and any it has a limit for though it no longer reports them (so the limit can be cleared).
  const limitTools = AGENT_TOOLS.filter(
    (tool) =>
      listedTools(runner).includes(tool) ||
      runner.toolSlots?.[tool] !== undefined,
  );
  const [sharing, setSharing] = useState<RunnerPatch | null>(null);
  const jobKinds = jobKindsOf(runner);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const count = Number(slots);
    const limits = readToolSlots(toolSlots, limitTools);
    const found = {
      ...(name.trim() ? {} : { name: t('runtimes.edit.nameRequired') }),
      ...(Number.isInteger(count) && count >= 1 && count <= 64
        ? {}
        : { slots: t('runtimes.edit.slotsInvalid') }),
      ...(limits === undefined ? { toolSlots: true } : {}),
    };
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const patch: RunnerPatch = {
      ...(name.trim() === runner.name ? {} : { name: name.trim() }),
      ...(count === runner.slots ? {} : { slots: count }),
      ...(limits === undefined ||
      JSON.stringify(limits) === JSON.stringify(runner.toolSlots ?? null)
        ? {}
        : { toolSlots: limits }),
      ...(trust === runner.trust ? {} : { trust }),
      ...(acceptJobs === runner.acceptJobs ? {} : { acceptJobs }),
      ...(JSON.stringify(enabledToolsOf(runner, switched)) ===
      JSON.stringify(
        enabledToolsOf(
          runner,
          new Set(AGENT_TOOLS.filter((tool) => toolEnabled(runner, tool))),
        ),
      )
        ? {}
        : { enabledTools: enabledToolsOf(runner, switched) }),
    };
    if (Object.keys(patch).length === 0) return;
    // Sharing with the team lets other people's runs onto it: it asks first.
    if (patch.trust === 'team') setSharing(patch);
    else onSave(patch);
  }

  return (
    <form onSubmit={submit} noValidate className='space-y-6'>
      <AgSection id='ag-runner-general' title={t('runtimes.detail.general')}>
        <FieldGroup>
          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel htmlFor='ag-runner-name'>
              {t('runtimes.edit.name')}
            </FieldLabel>
            <Input
              id='ag-runner-name'
              value={name}
              maxLength={200}
              disabled={!editable}
              aria-invalid={errors.name ? true : undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {errors.name ? <FieldError>{errors.name}</FieldError> : null}
          </Field>
          <Field data-invalid={errors.slots ? true : undefined}>
            <FieldLabel htmlFor='ag-runner-slots'>
              {t('connect.slots')}
            </FieldLabel>
            <Input
              id='ag-runner-slots'
              inputMode='numeric'
              value={slots}
              disabled={!editable}
              aria-invalid={errors.slots ? true : undefined}
              onChange={(event) => setSlots(event.target.value)}
            />
            {errors.slots ? (
              <FieldError>{errors.slots}</FieldError>
            ) : (
              <FieldDescription>
                {t('runtimes.edit.slotsHint')}
              </FieldDescription>
            )}
          </Field>
          <FieldSet>
            <FieldLegend variant='label'>
              {t('runtimes.trust.label')}
            </FieldLegend>
            <RadioGroup
              value={trust}
              disabled={!editable || !runner.canChangeTrust}
              onValueChange={(value) => {
                const next = RUNNER_TRUST.find((level) => level === value);
                if (next) setTrust(next);
              }}
            >
              {(['ownerOnly', 'team'] as const).map((level) => (
                <Field key={level} orientation='horizontal'>
                  <RadioGroupItem
                    value={level}
                    id={`ag-runner-trust-${level}`}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={`ag-runner-trust-${level}`}>
                      {t(`runtimes.trust.${level}`)}
                    </FieldLabel>
                    <FieldDescription>
                      {t(`runtimes.trust.${level}Hint`)}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              ))}
            </RadioGroup>
          </FieldSet>
          {runner.offersJobs ? (
            <Field orientation='horizontal'>
              <Switch
                id='ag-runner-jobs'
                checked={acceptJobs}
                disabled={
                  !editable || (jobKinds.length === 0 && !runner.acceptJobs)
                }
                onCheckedChange={setAcceptJobs}
              />
              <FieldContent>
                <FieldLabel htmlFor='ag-runner-jobs'>
                  {t('runtimes.jobs.allow')}
                </FieldLabel>
                <FieldDescription>
                  {jobKinds.length > 0
                    ? t('runtimes.jobs.hint', { kinds: jobKinds.join(', ') })
                    : t('runtimes.jobs.unsupported')}
                </FieldDescription>
              </FieldContent>
            </Field>
          ) : null}
        </FieldGroup>
      </AgSection>
      <AgSection
        id='ag-runner-tools'
        title={t('runtimes.detail.tools')}
        description={t('runtimes.detail.toolsDescription')}
      >
        <ToolTable
          runner={runner}
          tools={limitTools}
          switched={switched}
          limits={toolSlots}
          invalid={errors.toolSlots === true}
          editable={editable}
          onSwitch={(tool, on) =>
            setSwitched(
              new Set(
                AGENT_TOOLS.filter((candidate) =>
                  candidate === tool ? on : switched.has(candidate),
                ),
              ),
            )
          }
          onLimits={setToolSlots}
        />
        {errors.toolSlots ? (
          <p className='mt-2 text-sm text-destructive' role='alert'>
            {t('runtimes.toolSlots.invalid')}
          </p>
        ) : null}
        <div className='mt-2'>
          <OverTotalHint tools={limitTools} draft={toolSlots} total={slots} />
        </div>
      </AgSection>
      {editable ? (
        <div className='flex justify-end'>
          <Button type='submit' disabled={pending}>
            {pending ? <Spinner data-icon='inline-start' /> : null}
            {t('actions.save')}
          </Button>
        </div>
      ) : null}
      <AlertDialog
        open={sharing !== null}
        onOpenChange={(open) => {
          if (!open) setSharing(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('runtimes.share.title', { name: runner.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('runtimes.share.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sharing) onSave(sharing);
                setSharing(null);
              }}
            >
              {t('runtimes.share.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

/**
 * One row per coding tool: its name with its version and where it is installed (when the server sent it: to the
 * runner's owner, the managers of runners and those who may use agents), whether it is on here, its sign-in, its limit
 * and how many runs of it the runner holds now. What is changed here is saved with the form.
 */
function ToolTable({
  runner,
  tools,
  switched,
  limits,
  invalid,
  editable,
  onSwitch,
  onLimits,
}: {
  readonly runner: RunnerSummary;
  readonly tools: readonly AgentTool[];
  readonly switched: ReadonlySet<AgentTool>;
  readonly limits: ToolSlotsDraft;
  readonly invalid: boolean;
  readonly editable: boolean;
  readonly onSwitch: (tool: AgentTool, on: boolean) => void;
  readonly onLimits: (draft: ToolSlotsDraft) => void;
}): ReactElement {
  const { t } = useTranslation();
  if (tools.length === 0)
    return (
      <p className='text-sm text-muted-foreground'>{t('runtimes.noTools')}</p>
    );
  const enabledTools = AGENT_TOOLS.filter((tool) =>
    listedTools(runner).includes(tool)
      ? switched.has(tool)
      : toolEnabled(runner, tool),
  );
  return (
    <div className='rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('runtimes.toolTable.tool')}</TableHead>
            <TableHead>{t('runtimes.toolTable.enabled')}</TableHead>
            <TableHead>{t('runtimes.toolTable.state')}</TableHead>
            <TableHead>{t('runtimes.toolTable.limit')}</TableHead>
            <TableHead className='text-right'>
              {t('runtimes.toolTable.active')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool) => {
            const info = runner.tools.find((item) => item.kind === tool);
            const enabled = enabledTools.includes(tool);
            return (
              <TableRow
                key={tool}
                data-testid={`runner-tool-${tool}`}
                data-enabled={enabled}
              >
                <TableCell className='max-w-48 whitespace-normal'>
                  <div
                    className={
                      enabled
                        ? 'font-medium'
                        : 'font-medium text-muted-foreground'
                    }
                  >
                    {t(`tools.${tool}`)}
                  </div>
                  {info?.version ? (
                    <div className='truncate text-xs text-muted-foreground'>
                      {t('runtimes.tool.version', { version: info.version })}
                    </div>
                  ) : null}
                  {info?.path ? (
                    <div
                      data-testid={`runner-tool-${tool}-path`}
                      className='font-mono text-xs break-all text-muted-foreground'
                    >
                      {info.path}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={enabled}
                    disabled={!editable}
                    aria-label={t('runtimes.tool.enableLabel', {
                      tool: t(`tools.${tool}`),
                      name: runner.name,
                    })}
                    onCheckedChange={(checked) => onSwitch(tool, checked)}
                  />
                </TableCell>
                <TableCell>
                  <ToolStateTag
                    state={toolState(
                      { enabledTools, tools: runner.tools },
                      tool,
                    )}
                  />
                </TableCell>
                <TableCell>
                  <ToolLimitInput
                    id={`ag-runner-tool-slots-${tool}`}
                    tool={tool}
                    draft={limits}
                    invalid={invalid}
                    disabled={!editable}
                    onChange={onLimits}
                  />
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {runner.activeByTool ? (runner.activeByTool[tool] ?? 0) : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** What the runner's owner's local policy lets it take, as it reported it; read only. */
function PolicyView({
  runner,
}: {
  readonly runner: RunnerSummary;
}): ReactElement {
  const { t } = useTranslation();
  const { policy } = runner;
  if (!policy)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('runtimes.policy.none')}
      </p>
    );
  return (
    <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
      {POLICY_FIELDS.map((field) => {
        const rule = policyRule(policy, field);
        return (
          <div key={field} className='contents'>
            <dt className='text-muted-foreground'>
              {t(`runtimes.policy.${field}`)}
            </dt>
            <dd className='flex min-w-0 flex-wrap gap-1'>
              {rule.kind === 'only' ? (
                rule.patterns.map((pattern) => (
                  <AgTag key={pattern} tone='grey' className='font-mono'>
                    {pattern}
                  </AgTag>
                ))
              ) : (
                <span
                  className={
                    rule.kind === 'nothing' ? 'text-destructive' : undefined
                  }
                >
                  {t(`runtimes.policy.${rule.kind}`)}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function RecentRuns({ runnerId }: { readonly runnerId: string }): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const format = useFormatters();
  const runs = useQuery({
    queryKey: agentsKeys.runnerRuns(runnerId),
    queryFn: () => api.runnerRuns(runnerId),
  });
  if (runs.isPending)
    return (
      <div className='flex justify-center py-4'>
        <Spinner />
      </div>
    );
  if (runs.isError)
    return (
      <p className='text-sm text-destructive'>
        {t('runtimes.detail.runsFailed')}
      </p>
    );
  if (runs.data.length === 0)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('runtimes.detail.runsEmpty')}
      </p>
    );
  return (
    <ul className='divide-y rounded-lg border' data-testid='runner-runs'>
      {runs.data.map((run) => (
        <li key={run.id} className='flex items-center gap-3 px-3 py-2'>
          <AgTag tone={RUN_STATUS_TONE[run.status]} dot>
            {t(`runs.status.${run.status}`)}
          </AgTag>
          <div className='min-w-0 flex-1 truncate'>
            {run.path ? (
              <Link to={run.path} className='font-medium hover:underline'>
                {run.title}
              </Link>
            ) : (
              <span className='font-medium'>{run.title}</span>
            )}
          </div>
          <span
            className='shrink-0 text-xs text-muted-foreground'
            title={format.dateTime(run.startedAt ?? run.createdAt)}
          >
            {format.relative(run.startedAt ?? run.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
