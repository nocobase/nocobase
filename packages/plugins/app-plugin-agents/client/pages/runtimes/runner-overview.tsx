/** Overview settings preserve drafts while the other tabs load independently. */
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type FormEvent, type ReactElement } from 'react';
import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';
import {
  jobKindsOf,
  listedTools,
  RUNNER_TRUST,
  toolEnabled,
  type RunnerPatch,
  type RunnerSummary,
  type RunnerTrust,
} from '../../../shared/runners.js';
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
import { Switch } from '../../components/ui/switch.js';
import { POLICY_FIELDS, policyRule } from './runner-policy.js';
import {
  readToolSlots,
  toolSlotsDraft,
  type ToolSlotsDraft,
} from '../../lib/tool-slots.js';
import { OverTotalHint } from './tool-slots-fields.js';
import { ToolTable } from './runner-tools.js';

export function RunnerOverview({
  runner,
  editable,
  onSave,
  now,
}: {
  readonly runner: RunnerSummary;
  readonly editable: boolean;
  readonly onSave: (patch: RunnerPatch) => void;
  readonly now: number;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='space-y-6'>
      <SettingsForm
        runner={runner}
        editable={editable}
        onSave={onSave}
        now={now}
      />
      <AgSection
        className='max-w-none'
        id='ag-runner-policy'
        title={t('runtimes.policy.title')}
        description={t('runtimes.policy.description')}
      >
        <PolicyView runner={runner} />
      </AgSection>
      <AgSection
        className='max-w-none'
        id='ag-runner-variables'
        title={t('runtimes.variables.title')}
        description={t('runtimes.variables.description')}
      >
        <VariablesView runner={runner} />
      </AgSection>
    </div>
  );
}
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
  onSave,
  now,
}: {
  readonly runner: RunnerSummary;
  readonly editable: boolean;
  readonly onSave: (patch: RunnerPatch) => void;
  readonly now: number;
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
    <form
      id='runtime-settings'
      onSubmit={submit}
      noValidate
      className='space-y-6'
    >
      <AgSection
        className='max-w-none'
        id='ag-runner-general'
        title={t('runtimes.detail.general')}
      >
        <FieldGroup className='sm:grid sm:grid-cols-2'>
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
          <FieldSet className='sm:col-span-2'>
            <FieldLegend variant='label'>
              {t('runtimes.trust.label')}
            </FieldLegend>
            <RadioGroup
              className='sm:grid sm:grid-cols-2'
              value={trust}
              disabled={!editable || !runner.canChangeTrust}
              onValueChange={(value) => {
                const next = RUNNER_TRUST.find((level) => level === value);
                if (next) setTrust(next);
              }}
            >
              {(['ownerOnly', 'team'] as const).map((level) => (
                <Field
                  key={level}
                  orientation='horizontal'
                  className={`rounded-lg border p-3 ${trust === level ? 'border-primary/40 bg-primary/5' : ''}`}
                >
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
        className='max-w-none'
        id='ag-runner-tools'
        title={t('runtimes.detail.tools')}
        description={t('runtimes.detail.toolsDescription')}
      >
        <ToolTable
          runner={runner}
          now={now}
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

/** The names of the variables the runner provides to runs that take them from it, as it reported them; read only. */
function VariablesView({
  runner,
}: {
  readonly runner: RunnerSummary;
}): ReactElement {
  const { t } = useTranslation();
  const names = runner.variables;
  if (!names || names.length === 0)
    return (
      <p className='text-sm text-muted-foreground'>
        {names ? t('runtimes.variables.none') : t('runtimes.variables.unknown')}
      </p>
    );
  return (
    <div className='flex flex-wrap gap-1' data-runner-variables>
      {names.map((name) => (
        <AgTag key={name} tone='grey' className='font-mono'>
          {name}
        </AgTag>
      ))}
    </div>
  );
}
