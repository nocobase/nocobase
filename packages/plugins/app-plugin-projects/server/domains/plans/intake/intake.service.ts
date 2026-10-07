/**
 * Splitting an intake (`shared/intake.ts`): the text and each readable file are parsed by the rules, the drafts become
 * `issue.create` rows of one plan decided by the caller, and the plan is stored pending. When a row fails its
 * rehearsal nothing is stored, and the caller gets every row's check to correct the rows in the editor.
 */
import type { Label } from '../../../../shared/labels.js';
import {
  INTAKE_FILES_MAX,
  INTAKE_TEXT_MAX,
  type IntakeFile,
  type IntakeFileRead,
  type IntakeSourceData,
  type IntakeSplitRequest,
  type IntakeSplitResult,
  type IntakeTextsRequest,
  type IntakeTextsResult,
} from '../../../../shared/intake.js';
import {
  PLAN_ROWS_MAX,
  PLAN_TITLE_MAX,
  type CreatePlanRequest,
  type IssueCreateParams,
  type PlanRehearsal,
  type PlanRowCheck,
  type PlanRowInput,
} from '../../../../shared/plans.js';
import type { Viewer } from '../../../access/viewer.js';
import { DomainError, invalid } from '../../../kernel/errors.js';
import type { PlanService } from '../ports.js';
import type { IntakeFileStore } from './intake.files.js';
import {
  INTAKE_TITLE_MAX,
  parseIntake,
  type IntakeDraft,
} from './intake.parser.js';
import { readIntakeTexts, type ExtractOffice } from './intake.text.js';

export interface IntakeService {
  upload(viewer: Viewer, file: File): Promise<IntakeFile>;
  removeFile(viewer: Viewer, id: string): Promise<void>;
  split(viewer: Viewer, input: IntakeSplitRequest): Promise<IntakeSplitResult>;
  /** The text of the caller's own files, read as `split` reads them. */
  texts(viewer: Viewer, input: IntakeTextsRequest): Promise<IntakeTextsResult>;
}

export interface IntakeDeps {
  readonly plans: PlanService;
  readonly files: IntakeFileStore;
  readonly labels: () => Promise<readonly Label[]>;
  readonly extract?: ExtractOffice;
}

/** The ref of the row made from draft `position`. */
const refOf = (position: number) => `r${position}`;

/** A group of drafts from one source, numbered within that source. */
interface Source {
  readonly drafts: readonly IntakeDraft[];
}

/**
 * Joins the sources' drafts into plan rows (parents point at earlier rows by ref), keeping at most `PLAN_ROWS_MAX`.
 * A row whose parent was left out is kept at the top level. Labels become the ids of existing labels.
 */
export function rowsFromDrafts(
  sources: readonly Source[],
  options: {
    readonly projectId: string | null;
    readonly labels: readonly Label[];
  },
): {
  readonly rows: PlanRowInput[];
  readonly unknownLabels: string[];
  readonly dropped: number;
  /** Per source, the ref of the first row it gave (null when it gave none). */
  readonly sourceRefs: (string | null)[];
} {
  const byName = new Map(
    options.labels.map((label) => [label.name.toLowerCase(), label.id]),
  );
  const unknown = new Set<string>();
  const rows: PlanRowInput[] = [];
  let dropped = 0;
  const sourceRefs: (string | null)[] = [];
  for (const source of sources) {
    const positions = new Map<number, number>();
    const first = rows.length;
    for (const draft of source.drafts) {
      if (rows.length >= PLAN_ROWS_MAX) {
        dropped += 1;
        continue;
      }
      const position = rows.length + 1;
      positions.set(draft.position, position);
      const parent =
        draft.parentPosition === null
          ? undefined
          : positions.get(draft.parentPosition);
      const labelIds: string[] = [];
      for (const name of draft.labels) {
        const id = byName.get(name.toLowerCase());
        if (id) {
          if (!labelIds.includes(id)) labelIds.push(id);
        } else unknown.add(name);
      }
      const params: IssueCreateParams = {
        title: draft.title,
        ...(draft.description ? { description: draft.description } : {}),
        ...(options.projectId ? { projectId: options.projectId } : {}),
        ...(parent === undefined
          ? {}
          : { parentIssueId: { ref: refOf(parent) } }),
        ...(draft.priority ? { priority: draft.priority } : {}),
        ...(labelIds.length > 0 ? { labelIds } : {}),
        ...(draft.stage !== undefined && parent !== undefined
          ? { stage: draft.stage }
          : {}),
      };
      rows.push({ op: 'issue.create', ref: refOf(position), params });
    }
    sourceRefs.push(rows.length > first ? refOf(first + 1) : null);
  }
  return { rows, unknownLabels: [...unknown], dropped, sourceRefs };
}

function planTitle(rows: readonly PlanRowInput[]): string {
  const first = rows[0];
  const title = first?.op === 'issue.create' ? first.params.title : 'Intake';
  return title.slice(0, PLAN_TITLE_MAX);
}

/** The per-row checks of a refused plan (`PLAN_INVALID` with `details.rows`), or null for any other error. */
function rehearsalOf(error: unknown): PlanRehearsal | null {
  if (!(error instanceof DomainError) || error.code !== 'PLAN_INVALID')
    return null;
  const rows = error.details?.rows;
  return Array.isArray(rows)
    ? { ok: false, rows: rows as PlanRowCheck[] }
    : null;
}

export function createIntakeService(deps: IntakeDeps): IntakeService {
  return {
    upload: (viewer, file) => deps.files.upload(viewer.userId, file),

    removeFile: (viewer, id) => deps.files.remove(viewer.userId, id),

    async split(viewer, input) {
      const text = typeof input.text === 'string' ? input.text : '';
      const fileIds = Array.isArray(input.fileIds)
        ? input.fileIds.filter((id): id is string => typeof id === 'string')
        : [];
      const projectId =
        typeof input.projectId === 'string' && input.projectId
          ? input.projectId
          : null;
      if (text.length > INTAKE_TEXT_MAX)
        throw invalid(
          'INVALID_INTAKE',
          `The text may have at most ${INTAKE_TEXT_MAX} characters.`,
        );
      if (!text.trim() && fileIds.length === 0)
        throw invalid('INVALID_INTAKE', 'Give some text or a file.');

      const files = await deps.files.owned(viewer.userId, fileIds);
      const texts = await readIntakeTexts(files, {
        load: (file) => deps.files.bytes(file),
        ...(deps.extract ? { extract: deps.extract } : {}),
      });
      const sources: Source[] = [
        { drafts: text.trim() ? parseIntake(text) : [] },
        ...texts.documents.map((document) => ({
          drafts: parseIntake(document.text),
        })),
      ];
      // Nothing to split but files that could not be read: one issue named after the first, the others listed.
      if (sources.every((source) => source.drafts.length === 0) && files[0])
        sources.push({
          drafts: [
            {
              position: 1,
              parentPosition: null,
              title: files[0].filename.slice(0, INTAKE_TITLE_MAX),
              labels: [],
              ...(files.length > 1
                ? {
                    description: files
                      .map((file) => `- ${file.filename}`)
                      .join('\n'),
                  }
                : {}),
            },
          ],
        });
      if (sources.every((source) => source.drafts.length === 0))
        throw invalid('INVALID_INTAKE', 'The text describes no issue.');

      const { rows, unknownLabels, dropped, sourceRefs } = rowsFromDrafts(
        sources,
        { projectId, labels: await deps.labels() },
      );
      // Each file goes to the first issue its own text gave; the others to the plan's first issue.
      const fileRefs: Record<string, string> = {};
      texts.documents.forEach((document, index) => {
        const ref = sourceRefs[index + 1];
        if (ref) fileRefs[document.fileId] = ref;
      });
      const data: IntakeSourceData = {
        fileIds: files.map((f) => f.id),
        projectId,
        ...(Object.keys(fileRefs).length > 0 ? { fileRefs } : {}),
      };
      const request: CreatePlanRequest = {
        title: planTitle(rows),
        source: { kind: 'intake', data },
        rows,
      };
      const reads: IntakeFileRead[] = texts.reads.map((read) => ({ ...read }));
      try {
        const plan = await deps.plans.create(viewer, request);
        return {
          plan,
          request,
          rehearsal: null,
          files: reads,
          unknownLabels,
          dropped,
        };
      } catch (error) {
        const rehearsal = rehearsalOf(error);
        if (!rehearsal) throw error;
        return {
          plan: null,
          request,
          rehearsal,
          files: reads,
          unknownLabels,
          dropped,
        };
      }
    },

    async texts(viewer, input) {
      const fileIds = Array.isArray(input.fileIds)
        ? input.fileIds.filter((id): id is string => typeof id === 'string')
        : [];
      if (fileIds.length > INTAKE_FILES_MAX)
        throw invalid(
          'INVALID_INTAKE',
          `At most ${INTAKE_FILES_MAX} files may be read at once.`,
        );
      const files = await deps.files.owned(viewer.userId, fileIds);
      const texts = await readIntakeTexts(files, {
        load: (file) => deps.files.bytes(file),
        ...(deps.extract ? { extract: deps.extract } : {}),
      });
      return {
        documents: texts.documents.map((document) => ({ ...document })),
        files: texts.reads.map((read) => ({ ...read })),
      };
    },
  };
}
