import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, ScissorsIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';

import {
  INTAKE_TEXT_MAX,
  type IntakeSplitResult,
} from '../../../shared/intake.js';
import type {
  IntakeAiJob,
  IntakeAiSourceData,
  IntakeAiStartRequest,
  IntakeRowChange,
} from '../../../shared/intake-ai.js';
import type { Plan, PlanRowInput } from '../../../shared/plans.js';
import { pmKeys } from '../../api/keys.js';
import { PropertySelect } from '../../components/pm-property-fields.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
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
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../../components/ui/field.js';
import { Spinner } from '../../components/ui/spinner.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { IntakeAgentSlot } from '../../kit/page-slots.js';
import { planKeys, usePlanApi } from '../../kit/plans/api.js';
import {
  PlanEditor,
  type PlanEditorState,
} from '../../kit/plans/plan-editor.js';
import { usePlanMutations, usePlanQuery } from '../../kit/plans/use-plan.js';
import { usePresetProjectId } from '../issues/use-preset-project.js';
import { IntakeAiProgress } from './intake-ai-progress.js';
import { IntakeFiles } from './intake-files.js';
import { IntakeRevise, type Revision } from './intake-revise.js';
import { InvalidDraft } from './invalid-draft.js';
import {
  INTAKE_JOB_PARAM,
  useIntakeAiAvailability,
  useIntakeJob,
} from './use-intake-ai.js';
import { useIntakeUploads } from './use-intake-uploads.js';

/** The URL parameter holding the draft being edited, so a reload or a link resumes it. */
export const INTAKE_DRAFT_PARAM = 'draft';

/** What a revision did, for the draft it made. */
interface Marks {
  readonly planId: string;
  readonly rows: ReadonlyMap<string, IntakeRowChange>;
  readonly removed: readonly string[];
}

/** What the last finished request said beside its draft. */
interface Outcome {
  readonly planId: string;
  readonly unknownLabels: readonly string[];
  readonly dropped: number;
}

function aiDataOf(plan: Plan | null): Partial<IntakeAiSourceData> | null {
  const data = plan?.source.data;
  return data && typeof data === 'object' ? data : null;
}

/**
 * The "AI draft" tab of the New issue dialog (`/issues/new?tab=ai`): requirements in, issues out, as the old
 * NocoProject's intake. The text (or files) becomes a draft of new issues, edited row by row in the draft editor and
 * created together with "Create N issues"; the dialog then closes. The project is preselected (`usePresetProjectId`), `?draft=`
 * resumes a draft.
 *
 * The draft comes from the rule split (at once), or from AI when the application binds an organiser
 * (`shared/intake-ai.ts`): "AI split" asks it, a progress card follows the request (`?job=`, so a reload, or the issue
 * page's "Break into sub-issues", lands on it) until the drafts appear in place, and "Ask AI to revise" under the drafts asks
 * it to change them by an instruction; the rows it added or changed are highlighted, and a revision can be undone. A
 * breakdown's drafts are sub-issues of its issue, so the requirements box is hidden for them. "Let an agent organize"
 * is a slot the application fills; the draft the agent proposes replaces this one.
 *
 * The draft is kept by the server as an intake plan decided by the person (`shared/intake.ts`), so creating stays one
 * transaction that is checked first; it is never listed anywhere else.
 */
export function IntakePanel({
  onCreated,
  onDraftChange,
}: {
  /** The issues were created: the plan, executed. */
  readonly onCreated: (plan: Plan) => void;
  /** Whether a draft is shown, so the dialog widens for the editor. */
  readonly onDraftChange?: (shown: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const api = usePmApi();
  const plans = usePlanApi();
  const queryClient = useQueryClient();
  const mutations = usePlanMutations();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState('');
  const presetProjectId = usePresetProjectId();
  const [projectId, setProjectId] = useState<string | null>(presetProjectId);
  const uploads = useIntakeUploads();
  const [split, setSplit] = useState<IntakeSplitResult | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [revisions, setRevisions] = useState<readonly Revision[]>([]);
  const [marks, setMarks] = useState<Marks | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const draftId = params.get(INTAKE_DRAFT_PARAM) ?? '';
  const jobId = params.get(INTAKE_JOB_PARAM) ?? '';
  const plan = usePlanQuery(draftId);
  const job = useIntakeJob(jobId);
  const availability = useIntakeAiAvailability();
  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => api.projects(),
  });

  const running = job.data?.status === 'running' ? job.data : null;
  const tooLong = text.length > INTAKE_TEXT_MAX;
  const fileIds = uploads.files.map((file) => file.id);
  const empty = !text.trim() && fileIds.length === 0;
  const blocked =
    empty ||
    tooLong ||
    uploads.uploading ||
    splitting ||
    starting ||
    running !== null;
  const draft = plan.data ?? null;
  const editable =
    draft?.status === 'pending' ||
    draft?.status === 'failed' ||
    draft?.status === 'stale';
  const aiReady = availability?.available === true;
  // A breakdown's drafts are sub-issues of one issue: there are no requirements to type for them.
  const breakdown = running?.issue ?? aiDataOf(draft)?.issue ?? null;

  /** Changes the dialog's own URL parameters in one step: the draft shown and the request followed. */
  const follow = (next: {
    readonly draft?: string | null;
    readonly job?: string | null;
  }) => {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        for (const [key, value] of [
          [INTAKE_DRAFT_PARAM, next.draft],
          [INTAKE_JOB_PARAM, next.job],
        ] as const) {
          if (value === undefined) continue;
          if (value) updated.set(key, value);
          else updated.delete(key);
        }
        return updated;
      },
      { replace: true },
    );
    if (next.draft !== undefined) onDraftChange?.(Boolean(next.draft));
  };

  function finish(ended: IntakeAiJob): void {
    if (ended.status === 'done' && ended.planId) {
      const planId = ended.planId;
      setSplit(null);
      setFailure(null);
      setOutcome({
        planId,
        unknownLabels: ended.unknownLabels,
        dropped: ended.dropped,
      });
      if (ended.mode === 'revise' && ended.basePlanId) {
        const beforePlanId = ended.basePlanId;
        setRevisions((current) => [
          ...current,
          {
            key: current.length + 1,
            instruction: ended.instruction ?? '',
            beforePlanId,
            planId,
            undone: false,
          },
        ]);
        setMarks({
          planId,
          rows: new Map(Object.entries(ended.changes?.rows ?? {})),
          removed: ended.changes?.removed ?? [],
        });
        notify.success(t('intakeAi.revised'));
      } else {
        setMarks(null);
        setRevisions([]);
        notify.success(t('intakeAi.drafted'));
      }
      void queryClient.invalidateQueries({ queryKey: planKeys.plan(planId) });
      follow({ draft: planId, job: null });
      return;
    }
    if (ended.status === 'failed') {
      setFailure(ended.error?.message ?? '');
      notify.error(null, t('intakeAi.failed'));
    }
    follow({ job: null });
  }

  // A request that ended: its drafts take the place of the draft, or it says why it did not. Once per request.
  const handledRef = useRef<string | null>(null);
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });
  useEffect(() => {
    const ended = job.data;
    if (!ended || ended.status === 'running') return;
    if (handledRef.current === ended.id) return;
    handledRef.current = ended.id;
    finishRef.current(ended);
  }, [job.data]);

  async function runSplit(): Promise<void> {
    setSplitting(true);
    try {
      const previous = draft;
      const result = await plans.splitIntake({ text, fileIds, projectId });
      setSplit(result);
      setMarks(null);
      setRevisions([]);
      setOutcome(null);
      setFailure(null);
      follow({ draft: result.plan?.id ?? null });
      if (result.plan)
        notify.success(
          t('intake.splitDone', { count: result.plan.rows.length }),
        );
      // The draft it replaces is dropped.
      if (result.plan && previous?.status === 'pending')
        await mutations.act('void', previous).catch(() => undefined);
    } catch (error) {
      notify.error(error, t('intake.splitFailed'));
    } finally {
      setSplitting(false);
    }
  }

  /** Starts a request to AI; answers whether it started. */
  async function ask(request: IntakeAiStartRequest): Promise<boolean> {
    setStarting(true);
    try {
      const started = await plans.startIntakeAi(request);
      queryClient.setQueryData(planKeys.intakeJob(started.id), started);
      setFailure(null);
      follow({ job: started.id });
      return true;
    } catch (error) {
      notify.error(error, t('intakeAi.startFailed'));
      return false;
    } finally {
      setStarting(false);
    }
  }

  async function cancel(): Promise<void> {
    if (!running) return;
    setCancelling(true);
    try {
      await plans.cancelIntakeJob(running.id);
      handledRef.current = running.id;
      follow({ job: null });
    } catch (error) {
      notify.error(error);
    } finally {
      setCancelling(false);
    }
  }

  /** Puts back the draft before a revision: a new draft with its rows, in place of the current one. */
  async function undo(revision: Revision): Promise<void> {
    try {
      const before = await plans.plan(revision.beforePlanId);
      const restored = await plans.create({
        title: before.title,
        ...(before.description ? { description: before.description } : {}),
        source: before.source,
        ...(before.proposer ? { proposer: before.proposer } : {}),
        rows: before.rows.map(
          (row) =>
            ({
              op: row.op,
              params: row.params,
              ...(row.ref ? { ref: row.ref } : {}),
            }) as PlanRowInput,
        ),
      });
      if (draft?.status === 'pending')
        await mutations.act('void', draft).catch(() => undefined);
      setRevisions((current) =>
        current.map((item) =>
          item.key === revision.key ? { ...item, undone: true } : item,
        ),
      );
      setMarks(null);
      follow({ draft: restored.id });
      notify.success(t('intakeAi.revise.undone'));
    } catch (error) {
      notify.error(error, t('intakeAi.revise.undoFailed'));
    }
  }

  const executed = (next: Plan) => {
    if (next.status !== 'executed') return;
    onCreated(next);
  };

  const replaceOrRun = () => {
    if (draft?.status === 'pending') setReplacing(true);
    else void runSplit();
  };

  const revise = (state: PlanEditorState) => (
    <IntakeRevise
      revisions={revisions}
      pending={running?.mode === 'revise' || (starting && !running)}
      disabled={state.busy || running !== null}
      onSubmit={async (instruction) => {
        const saved = state.dirty ? await state.save() : draft;
        if (!saved) return false;
        return ask({ mode: 'revise', planId: saved.id, instruction, text });
      }}
      onUndo={(revision) => void undo(revision)}
    />
  );

  const shownMarks = marks && draft && marks.planId === draft.id ? marks : null;
  const shownOutcome =
    outcome && draft && outcome.planId === draft.id ? outcome : null;
  const unknownLabels =
    split?.unknownLabels ?? shownOutcome?.unknownLabels ?? [];
  const dropped = split?.dropped ?? shownOutcome?.dropped ?? 0;

  return (
    <div className='space-y-4'>
      {breakdown ? (
        <p
          className='text-sm text-muted-foreground'
          data-testid='intake-breakdown'
        >
          {t('intakeAi.breakdownHint', {
            issue: `${breakdown.identifier} ${breakdown.title}`,
          })}
        </p>
      ) : (
        <>
          <Field data-invalid={tooLong ? true : undefined}>
            <FieldLabel htmlFor='pm-intake-text'>
              {t('intake.textLabel')}
            </FieldLabel>
            <Textarea
              id='pm-intake-text'
              value={text}
              rows={draft ? 4 : 8}
              className='min-h-24 text-sm'
              placeholder={t('intake.textPlaceholder')}
              aria-invalid={tooLong ? true : undefined}
              onChange={(event) => setText(event.target.value)}
              onDragOver={uploads.onDragOver}
              onDrop={uploads.onDrop}
            />
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <FieldDescription className='max-w-3xl'>
                {t('intake.textHint')}
              </FieldDescription>
              <span
                className={
                  tooLong
                    ? 'text-xs text-destructive tabular-nums'
                    : 'text-xs text-muted-foreground tabular-nums'
                }
              >
                {t('intake.count', {
                  count: text.length,
                  max: INTAKE_TEXT_MAX,
                })}
              </span>
            </div>
            {tooLong ? (
              <FieldError>
                {t('intake.textTooLong', { max: INTAKE_TEXT_MAX })}
              </FieldError>
            ) : null}
          </Field>
          <IntakeFiles uploads={uploads} reads={split?.files ?? []} />
          <div className='flex flex-wrap items-end gap-3'>
            <Field className='w-full sm:max-w-xs'>
              <FieldLabel htmlFor='pm-intake-project'>
                {t('intake.project')}
              </FieldLabel>
              <PropertySelect
                id='pm-intake-project'
                size='default'
                options={(projects.data ?? []).map((project) => ({
                  value: project.id,
                  label: project.name,
                }))}
                value={projectId}
                noneLabel={t('plans.noProject')}
                onChange={setProjectId}
              />
            </Field>
            <div className='ml-auto flex flex-wrap items-center gap-2'>
              <IntakeAgentSlot
                text={text}
                fileIds={fileIds}
                projectId={projectId}
                disabled={blocked}
                onPlan={(id) => {
                  const previous = draft;
                  setSplit(null);
                  setMarks(null);
                  setRevisions([]);
                  follow({ draft: id });
                  // The rule split's draft it replaces is dropped, as a new split's would be; an agent's earlier draft in
                  // the same conversation is replaced by the server (same source key).
                  if (
                    previous &&
                    previous.id !== id &&
                    previous.status === 'pending' &&
                    !previous.source.key
                  )
                    void mutations.act('void', previous).catch(() => undefined);
                }}
              />
              <Button
                variant={aiReady ? 'outline' : 'default'}
                disabled={blocked}
                data-testid='intake-split'
                onClick={replaceOrRun}
              >
                {splitting ? (
                  <Spinner data-icon='inline-start' />
                ) : (
                  <ScissorsIcon data-icon='inline-start' />
                )}
                {splitting
                  ? t('intake.splitting')
                  : aiReady
                    ? t('intakeAi.splitByRules')
                    : draft
                      ? t('intake.resplit')
                      : t('intake.splitAction')}
              </Button>
            </div>
          </div>
          {availability?.reason === 'noAgent' ? (
            <p className='text-xs text-muted-foreground'>
              {t('intakeAi.unavailable.noAgent')}
            </p>
          ) : aiReady && availability.waits ? (
            <p className='text-xs text-muted-foreground'>
              {t('intakeAi.waitsHint')}
            </p>
          ) : null}
        </>
      )}
      {failure !== null ? (
        <Alert variant='destructive' data-testid='intake-ai-failed'>
          <AlertCircleIcon />
          <AlertDescription>
            {failure
              ? t('intakeAi.failedWhy', { message: failure })
              : t('intakeAi.failed')}
          </AlertDescription>
        </Alert>
      ) : null}
      {running ? (
        <IntakeAiProgress
          job={running}
          cancelling={cancelling}
          onCancel={() => void cancel()}
        />
      ) : null}
      {split && !split.plan ? (
        <InvalidDraft result={split} />
      ) : draft && editable ? (
        <section className='space-y-3' aria-labelledby='pm-intake-draft'>
          <div className='flex flex-wrap items-baseline justify-between gap-2'>
            <h2
              id='pm-intake-draft'
              className='font-heading text-base font-semibold'
            >
              {t('intake.draftTitle', { count: draft.rows.length })}
            </h2>
            <p className='text-xs text-muted-foreground'>
              {t('intake.draftHint')}
            </p>
          </div>
          {unknownLabels.length > 0 ? (
            <Alert>
              <AlertCircleIcon />
              <AlertDescription>
                {t('intake.unknownLabels', {
                  labels: unknownLabels.join(', '),
                })}
              </AlertDescription>
            </Alert>
          ) : null}
          {dropped > 0 ? (
            <Alert>
              <AlertCircleIcon />
              <AlertDescription>
                {t('intake.dropped', { count: dropped })}
              </AlertDescription>
            </Alert>
          ) : null}
          {shownMarks && shownMarks.removed.length > 0 ? (
            <p
              className='text-xs text-muted-foreground'
              data-testid='intake-removed'
            >
              {t('intakeAi.removed', {
                count: shownMarks.removed.length,
                titles: shownMarks.removed.join(t('intakeAi.separator')),
              })}
            </p>
          ) : null}
          <PlanEditor
            key={draft.id}
            plan={draft}
            {...(shownMarks ? { rowMarks: shownMarks.rows } : {})}
            {...(aiReady ? { below: revise } : {})}
            locked={running !== null}
            onExecuted={executed}
          />
        </section>
      ) : draft ? (
        <Alert>
          <AlertCircleIcon />
          <AlertDescription>
            {t(
              draft.status === 'executed'
                ? 'intake.draftCreated'
                : 'intake.draftClosed',
            )}
          </AlertDescription>
        </Alert>
      ) : draftId && plan.isPending ? (
        <Spinner className='mx-auto size-5 text-muted-foreground' />
      ) : null}
      <AlertDialog
        open={replacing}
        onOpenChange={(open) => {
          if (!open) setReplacing(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('intake.splitAgainTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('intake.splitAgainDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setReplacing(false);
                void runSplit();
              }}
            >
              {t('intake.resplit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
