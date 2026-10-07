/**
 * Requirement intake with AI (`shared/intake-ai.ts`): the person's requests become jobs handed to the organiser the
 * application binds (`intake.ai.organizer.ts`), and the drafts it delivers become a pending intake plan the person
 * decides, in place of the draft the request was made on. AI never creates an issue: the plan is rehearsed with the
 * person's own permissions and executed only when they click "Create N issues".
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { IntakeSourceData } from '../../../../shared/intake.js';
import {
  INTAKE_AI_MODES,
  INTAKE_INSTRUCTION_MAX,
  type IntakeAiAvailability,
  type IntakeAiJob,
  type IntakeAiMode,
  type IntakeAiSourceData,
  type IntakeAiStartRequest,
  type IntakeAiTask,
} from '../../../../shared/intake-ai.js';
import {
  INTAKE_FILES_MAX,
  INTAKE_TEXT_MAX,
} from '../../../../shared/intake.js';
import type { Label } from '../../../../shared/labels.js';
import {
  PLAN_OPEN_STATUSES,
  PLAN_ROWS_MAX,
  PLAN_TITLE_MAX,
  type Plan,
  type PlanProposer,
  type PlanRowCheck,
} from '../../../../shared/plans.js';
import type { Viewer } from '../../../access/viewer.js';
import type { Actor } from '../../../kernel/actor.js';
import {
  conflict,
  DomainError,
  forbidden,
  invalid,
  notFound,
} from '../../../kernel/errors.js';
import type { IdSource } from '../../../kernel/ids.js';
import type { KindRegistry } from '../../../kernel/kinds.js';
import type { TxRunner } from '../../../kernel/tx.js';
import type { IssueQueries } from '../../issues/index.js';
import type { ProjectService } from '../../projects/index.js';
import type { PlanService } from '../ports.js';
import {
  changesOf,
  draftsOfPlan,
  normalizeDrafts,
  remapFileRefs,
  rowsOfDrafts,
  type BaseDraft,
} from './intake.ai.drafts.js';
import type {
  IntakeOrganizer,
  OrganizerJobRef,
} from './intake.ai.organizer.js';
import {
  findJob,
  insertJob,
  updateRunningJob,
  type IntakeJobRecord,
  type IntakeJobValues,
} from './intake.ai.store.js';
import type { IntakeFileStore } from './intake.files.js';
import { readIntakeTexts, type ExtractOffice } from './intake.text.js';
import './intake.ai.events.js';

/** Who hands drafts back: the person the job is for (as the organiser acts for them), and what to record. */
export interface IntakeDeliverer {
  readonly userId: string;
  /** Who submits the plan (for example, the agent). */
  readonly actor: Actor;
  /** The agent that proposed it, for "via ‹Agent›'s plan". */
  readonly proposer: PlanProposer | null;
}

export interface IntakeAiService {
  availability(viewer: Viewer): Promise<IntakeAiAvailability>;
  start(viewer: Viewer, request: IntakeAiStartRequest): Promise<IntakeAiJob>;
  get(viewer: Viewer, id: string): Promise<IntakeAiJob>;
  cancel(viewer: Viewer, id: string): Promise<IntakeAiJob>;
  /**
   * The task of a job, for the organiser: null when there is no such job. Read on `conn` when given, so a caller inside
   * its own transaction (an agent run's claim) reads through it.
   */
  task(id: string, conn?: DatabaseConnection): Promise<IntakeAiTask | null>;
  /** The organiser's drafts for a running job; answers the job, done, and the plan of the drafts. */
  deliver(
    id: string,
    drafts: unknown,
    by: IntakeDeliverer,
  ): Promise<{ readonly job: IntakeAiJob; readonly plan: Plan }>;
  /** The organiser ended without drafts; a running job fails with why. */
  ended(
    id: string,
    error: { readonly code: string; readonly message: string },
  ): Promise<void>;
}

export interface IntakeAiDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly kinds: KindRegistry;
  readonly plans: PlanService;
  readonly projects: Pick<ProjectService, 'get'>;
  readonly issueQueries: Pick<IssueQueries, 'detail'>;
  readonly labels: () => Promise<readonly Label[]>;
  readonly files: IntakeFileStore;
  readonly extract?: ExtractOffice;
  /** A person as a `Viewer`, with their own permissions: the decider of a delivered plan. */
  readonly viewerOf: (userId: string) => Promise<Viewer>;
  /** Asked on each use; unbound, AI is not available. */
  readonly organizer: () => IntakeOrganizer | undefined;
}

const mayCreate = (viewer: Viewer) =>
  viewer.permissions.scopes['pm.issues/create'] !== 'none';

function sourceDataOf(
  plan: Plan,
): (IntakeSourceData & Partial<IntakeAiSourceData>) | null {
  const data = plan.source.data;
  return data && typeof data === 'object'
    ? (data as IntakeSourceData & Partial<IntakeAiSourceData>)
    : null;
}

function refOf(record: IntakeJobRecord): OrganizerJobRef {
  return { jobId: record.id, ref: record.ref, userId: record.userId };
}

/** Why a delivered plan was refused, row by row, in words an organiser can act on. */
function refusal(error: unknown): DomainError | null {
  if (!(error instanceof DomainError) || error.code !== 'PLAN_INVALID')
    return null;
  const rows = (error.details?.rows ?? []) as readonly PlanRowCheck[];
  const failing = rows.flatMap((check, index) =>
    check.ok
      ? []
      : [`draft ${index + 1}: ${check.error?.message ?? 'refused'}`],
  );
  return invalid(
    'INVALID_DRAFTS',
    failing.length > 0
      ? `Some drafts cannot be created: ${failing.join('; ')}`
      : error.message,
    error.details,
  );
}

export function createIntakeAiService(deps: IntakeAiDeps): IntakeAiService {
  const { tx } = deps;

  function view(
    record: IntakeJobRecord,
    progress: IntakeAiJob['progress'] = null,
  ): IntakeAiJob {
    const issue = record.task.issue;
    return {
      id: record.id,
      mode: record.mode,
      status: record.status,
      instruction: record.instruction,
      basePlanId: record.basePlanId,
      issue: issue
        ? { id: issue.id, identifier: issue.identifier, title: issue.title }
        : null,
      planId: record.planId,
      changes: record.changes,
      unknownLabels: record.unknownLabels ?? [],
      dropped: record.dropped,
      error: record.error,
      progress: record.status === 'running' ? progress : null,
      createdAt: record.createdAt,
      finishedAt: record.finishedAt,
    };
  }

  async function update(id: string, values: IntakeJobValues) {
    return tx.run(async (unit) => {
      const changed = await updateRunningJob(unit.conn, id, values);
      if (changed) unit.emit({ type: 'intake.changed', jobId: id });
      return changed;
    });
  }

  async function finish(
    id: string,
    status: 'failed' | 'cancelled',
    error: { readonly code: string; readonly message: string },
  ) {
    return update(id, {
      status,
      error: { code: error.code, message: error.message.slice(0, 1000) },
      finishedAt: new Date().toISOString(),
    });
  }

  async function own(viewer: Viewer, id: string): Promise<IntakeJobRecord> {
    const record = await findJob(tx.read(), id);
    if (!record || record.userId !== viewer.userId) throw notFound('Job');
    return record;
  }

  async function projectOf(viewer: Viewer, projectId: string | null) {
    if (!projectId) return null;
    const project = await deps.projects.get(viewer, projectId);
    return {
      id: project.id,
      name: project.name,
      description: project.description,
    };
  }

  /** The draft a request is made on: an open intake plan the caller decides. */
  async function basePlan(viewer: Viewer, planId: string): Promise<Plan> {
    const plan = await deps.plans.get(viewer, planId);
    if (plan.deciderUserId !== viewer.userId || plan.source.kind !== 'intake')
      throw invalid('INVALID_INTAKE', 'That plan is not a draft of yours.');
    return plan;
  }

  /** What the organiser is handed for a split, a revision or a breakdown. */
  async function taskOf(
    viewer: Viewer,
    id: string,
    mode: IntakeAiMode,
    request: IntakeAiStartRequest,
    labels: readonly Label[],
  ): Promise<{
    readonly task: IntakeAiTask;
    readonly base: Plan | null;
    readonly projectId: string | null;
    readonly fileIds: readonly string[];
    readonly issueId: string | null;
  }> {
    const names = await deps.kinds.names(tx.read(), 'user', [viewer.userId]);
    const common = {
      jobId: id,
      mode,
      requester: {
        userId: viewer.userId,
        name: names.get(viewer.userId) ?? null,
      },
      labels: labels.map((label) => label.name),
      maxDrafts: PLAN_ROWS_MAX,
    };
    const text = typeof request.text === 'string' ? request.text : '';
    if (text.length > INTAKE_TEXT_MAX)
      throw invalid(
        'INVALID_INTAKE',
        `The text may have at most ${INTAKE_TEXT_MAX} characters.`,
      );
    const planId =
      typeof request.planId === 'string' && request.planId
        ? request.planId
        : null;

    if (mode === 'breakdown') {
      if (typeof request.issueId !== 'string' || !request.issueId)
        throw invalid('INVALID_INTAKE', 'Name the issue to break down.');
      const issue = await deps.issueQueries.detail(viewer, request.issueId);
      return {
        task: {
          ...common,
          text: issue.description,
          files: [],
          unreadFiles: [],
          project: issue.project
            ? await projectOf(viewer, issue.project.id).catch(() => ({
                id: issue.project?.id ?? '',
                name: issue.project?.name ?? '',
                description: null,
              }))
            : null,
          drafts: [],
          instruction: null,
          issue: {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description,
            subIssues: issue.subtasks.map((subtask) => subtask.title),
          },
        },
        base: planId ? await basePlan(viewer, planId) : null,
        projectId: issue.projectId,
        fileIds: [],
        issueId: issue.id,
      };
    }

    if (mode === 'revise') {
      const instruction =
        typeof request.instruction === 'string'
          ? request.instruction.trim()
          : '';
      if (!instruction) throw invalid('INVALID_INTAKE', 'Say what to change.');
      if (instruction.length > INTAKE_INSTRUCTION_MAX)
        throw invalid(
          'INVALID_INTAKE',
          `The instruction may have at most ${INTAKE_INSTRUCTION_MAX} characters.`,
        );
      if (!planId) throw invalid('INVALID_INTAKE', 'Name the draft to revise.');
      const base = await basePlan(viewer, planId);
      if (!PLAN_OPEN_STATUSES.includes(base.status))
        throw conflict('PLAN_NOT_OPEN', 'The draft is no longer open.');
      const drafts = draftsOfPlan(base.rows, labels);
      const data = sourceDataOf(base);
      // The text the drafts came from: what an earlier AI request was given, else what the page still shows.
      const earlier =
        typeof data?.jobId === 'string'
          ? await findJob(tx.read(), data.jobId)
          : undefined;
      const issue = data?.issue
        ? await deps.issueQueries.detail(viewer, data.issue.id)
        : null;
      const projectId =
        typeof data?.projectId === 'string' ? data.projectId : null;
      return {
        task: {
          ...common,
          text:
            earlier && earlier.userId === viewer.userId
              ? earlier.task.text
              : text,
          files: [],
          unreadFiles: [],
          project: await projectOf(viewer, projectId).catch(() => null),
          drafts: drafts.map((entry) => entry.draft),
          instruction,
          issue: issue
            ? {
                id: issue.id,
                identifier: issue.identifier,
                title: issue.title,
                description: issue.description,
                subIssues: issue.subtasks.map((subtask) => subtask.title),
              }
            : null,
        },
        base,
        projectId: issue?.projectId ?? projectId,
        fileIds: Array.isArray(data?.fileIds) ? data.fileIds : [],
        issueId: issue?.id ?? null,
      };
    }

    const fileIds = Array.isArray(request.fileIds)
      ? request.fileIds.filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    if (fileIds.length > INTAKE_FILES_MAX)
      throw invalid(
        'INVALID_INTAKE',
        `At most ${INTAKE_FILES_MAX} files may be read at once.`,
      );
    if (!text.trim() && fileIds.length === 0)
      throw invalid('INVALID_INTAKE', 'Give some text or a file.');
    const projectId =
      typeof request.projectId === 'string' && request.projectId
        ? request.projectId
        : null;
    const files = await deps.files.owned(viewer.userId, fileIds);
    const texts = await readIntakeTexts(files, {
      load: (file) => deps.files.bytes(file),
      ...(deps.extract ? { extract: deps.extract } : {}),
    });
    const read = new Set(texts.documents.map((document) => document.fileId));
    return {
      task: {
        ...common,
        text,
        files: texts.documents.map((document) => ({
          name: document.filename,
          text: document.text,
          truncated:
            texts.reads.find((entry) => entry.fileId === document.fileId)
              ?.state === 'truncated',
        })),
        unreadFiles: texts.reads
          .filter((entry) => !read.has(entry.fileId))
          .map((entry) => entry.filename),
        project: await projectOf(viewer, projectId),
        drafts: [],
        instruction: null,
        issue: null,
      },
      base: planId ? await basePlan(viewer, planId) : null,
      projectId,
      fileIds: files.map((file) => file.id),
      issueId: null,
    };
  }

  const service: IntakeAiService = {
    async availability(viewer) {
      const organizer = deps.organizer();
      if (!organizer)
        return {
          available: false,
          reason: 'notConfigured',
          by: null,
          waits: false,
        };
      if (!mayCreate(viewer))
        return {
          available: false,
          reason: 'forbidden',
          by: null,
          waits: false,
        };
      const answer = await organizer.availability(viewer.userId);
      return {
        available: answer.available,
        reason: answer.available ? null : (answer.reason ?? 'unavailable'),
        by: answer.by ?? null,
        waits: answer.waits ?? false,
      };
    },

    async start(viewer, request) {
      const mode = request.mode;
      if (!(INTAKE_AI_MODES as readonly unknown[]).includes(mode))
        throw invalid(
          'INVALID_INTAKE',
          'mode must be split, revise or breakdown.',
        );
      if (!mayCreate(viewer)) throw forbidden('You may not create issues.');
      const organizer = deps.organizer();
      if (!organizer)
        throw conflict('AI_UNAVAILABLE', 'AI is not set up for intake.');
      const id = deps.ids.next();
      const labels = await deps.labels();
      const prepared = await taskOf(viewer, id, mode, request, labels);
      const now = new Date().toISOString();
      const record: IntakeJobRecord = {
        id,
        userId: viewer.userId,
        mode,
        status: 'running',
        basePlanId: prepared.base?.id ?? null,
        issueId: prepared.issueId,
        projectId: prepared.projectId,
        instruction: prepared.task.instruction,
        fileIds: [...prepared.fileIds],
        task: prepared.task,
        ref: null,
        byName: null,
        planId: null,
        changes: null,
        unknownLabels: null,
        dropped: 0,
        error: null,
        createdAt: now,
        updatedAt: now,
        finishedAt: null,
      };
      await tx.run(async (unit) => {
        await insertJob(unit.conn, record);
        unit.emit({ type: 'intake.changed', jobId: id });
      });
      try {
        const started = await organizer.start(prepared.task);
        await update(id, { ref: started.ref, byName: started.by });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'AI could not start.';
        await finish(id, 'failed', { code: 'AI_UNAVAILABLE', message });
        throw conflict('AI_UNAVAILABLE', message);
      }
      return service.get(viewer, id);
    },

    async get(viewer, id) {
      const record = await own(viewer, id);
      if (record.status !== 'running') return view(record);
      const progress = await deps
        .organizer()
        ?.progress(refOf(record))
        .catch(() => null);
      if (progress && 'ended' in progress) {
        await finish(id, 'failed', progress.ended);
        return view(await own(viewer, id));
      }
      return view(record, progress ?? null);
    },

    async cancel(viewer, id) {
      const record = await own(viewer, id);
      if (record.status !== 'running')
        throw conflict(
          'INTAKE_JOB_CLOSED',
          'The request is no longer running.',
        );
      await deps
        .organizer()
        ?.cancel(refOf(record), viewer.userId)
        .catch(() => undefined);
      await finish(id, 'cancelled', {
        code: 'CANCELLED',
        message: 'Cancelled by the person who asked.',
      });
      return view(await own(viewer, id));
    },

    async task(id, conn) {
      return (await findJob(conn ?? tx.read(), id))?.task ?? null;
    },

    async deliver(id, value, by) {
      const record = await findJob(tx.read(), id);
      if (!record) throw notFound('Job');
      if (record.userId !== by.userId)
        throw forbidden('This request is someone else’s.');
      if (record.status !== 'running')
        throw conflict(
          'INTAKE_JOB_CLOSED',
          `The request is ${record.status}: it takes no drafts any more.`,
        );
      const decider = await deps.viewerOf(record.userId);
      const issue = record.task.issue;
      const { drafts, dropped } = normalizeDrafts(
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as { drafts?: unknown }).drafts
          : value,
        { flat: issue !== null },
      );
      const labels = await deps.labels();
      let base: BaseDraft[] = [];
      let basePlan: Plan | null = null;
      if (record.basePlanId) {
        basePlan = await deps.plans
          .get(decider, record.basePlanId)
          .catch(() => null);
        if (basePlan && record.mode === 'revise')
          base = draftsOfPlan(basePlan.rows, labels);
      }
      const { rows, unknownLabels } = rowsOfDrafts(drafts, {
        labels,
        projectId: record.projectId,
        parentIssueId: issue?.id ?? null,
        base,
      });
      const baseData = basePlan ? sourceDataOf(basePlan) : null;
      const fileRefs =
        record.mode === 'revise'
          ? remapFileRefs(baseData?.fileRefs, base, drafts)
          : undefined;
      const data: IntakeSourceData & IntakeAiSourceData = {
        fileIds: [...(record.fileIds ?? [])],
        projectId: record.projectId,
        ...(fileRefs ? { fileRefs } : {}),
        jobId: record.id,
        mode: record.mode,
        ...(issue
          ? {
              issue: {
                id: issue.id,
                identifier: issue.identifier,
                title: issue.title,
              },
            }
          : {}),
      };
      const first = drafts[0]?.title ?? 'Intake';
      let plan: Plan;
      try {
        plan = await deps.plans.propose(
          {
            title: (issue ? `${issue.identifier} ${first}` : first).slice(
              0,
              PLAN_TITLE_MAX,
            ),
            source: { kind: 'intake', data },
            proposer: by.proposer,
            rows,
            deciderUserId: record.userId,
          },
          by.actor,
        );
      } catch (error) {
        throw refusal(error) ?? error;
      }
      if (
        basePlan &&
        basePlan.id !== plan.id &&
        PLAN_OPEN_STATUSES.includes(basePlan.status)
      )
        await deps.plans
          .void(decider, basePlan.id, { revision: basePlan.revision })
          .catch(() => undefined);
      const done = await update(id, {
        status: 'done',
        planId: plan.id,
        changes: record.mode === 'revise' ? changesOf(base, drafts) : null,
        unknownLabels,
        dropped,
        finishedAt: new Date().toISOString(),
      });
      if (!done) {
        await deps.plans
          .void(decider, plan.id, { revision: plan.revision })
          .catch(() => undefined);
        throw conflict(
          'INTAKE_JOB_CLOSED',
          'The request was cancelled meanwhile.',
        );
      }
      const after = await findJob(tx.read(), id);
      return { job: view(after ?? record), plan };
    },

    async ended(id, error) {
      await finish(id, 'failed', error);
    },
  };
  return service;
}
