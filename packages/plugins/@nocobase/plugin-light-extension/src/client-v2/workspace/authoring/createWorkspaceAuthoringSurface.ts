/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CodeAuthoringDiagnostic,
  CodeAuthoringFile,
  CodeAuthoringSearchMatch,
  CodeAuthoringSearchOptions,
  CodeAuthoringSnapshot,
  CodeAuthoringSurface,
  PreparedCodeAuthoringChangeSet,
} from '@nocobase/client-v2';

import {
  assertWorkspaceAuthoringPlanAccess,
  prepareWorkspaceAuthoringChanges,
  WorkspaceAuthoringError,
  type WorkspaceAuthoringPathAccessResolver,
} from './workspaceChanges';
import {
  buildWorkspaceAuthoringTreeSnapshot,
  cloneWorkspaceAuthoringFiles,
  normalizeWorkspaceAuthoringPath,
  toCodeAuthoringFileMeta,
  type WorkspaceAuthoringFile,
  type WorkspaceAuthoringSnapshotFile,
  type WorkspaceAuthoringTreeSnapshot,
} from './workspaceSnapshot';

export interface CreateWorkspaceAuthoringSurfaceOptions {
  id: string;
  kind: string;
  title: string;
  getSourceFiles: () => WorkspaceAuthoringFile[];
  getVirtualFiles: () => WorkspaceAuthoringFile[];
  commitSourceFiles: (files: WorkspaceAuthoringFile[]) => void | Promise<void>;
  getActivePath: () => string | undefined;
  getPathAccess: WorkspaceAuthoringPathAccessResolver;
  canReadForAI: (file: WorkspaceAuthoringFile) => boolean;
  getDiagnostics: () => CodeAuthoringDiagnostic[] | Promise<CodeAuthoringDiagnostic[]>;
  sanitizeDiagnostic: (
    diagnostic: CodeAuthoringDiagnostic,
    readablePaths: ReadonlySet<string>,
    workspacePaths: ReadonlySet<string>,
  ) => CodeAuthoringDiagnostic | null;
  validateDraft: () => CodeAuthoringDiagnostic[] | Promise<CodeAuthoringDiagnostic[]>;
  supportedLanguages?: readonly string[];
  searchMaxResults?: number;
  searchMaxContextLength?: number;
}

interface StoredPlan extends PreparedCodeAuthoringChangeSet {
  nextSourceFiles: WorkspaceAuthoringFile[];
  changedPaths: string[];
  applying: boolean;
}

const DEFAULT_SEARCH_MAX_RESULTS = 50;
const DEFAULT_SEARCH_CONTEXT_LENGTH = 240;
let surfaceSequence = 0;

export function createWorkspaceAuthoringSurface(options: CreateWorkspaceAuthoringSurfaceOptions): CodeAuthoringSurface {
  const searchMaxResults = Math.max(1, options.searchMaxResults ?? DEFAULT_SEARCH_MAX_RESULTS);
  const searchMaxContextLength = Math.max(1, options.searchMaxContextLength ?? DEFAULT_SEARCH_CONTEXT_LENGTH);
  const instanceId =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}:${(surfaceSequence += 1).toString(36)}`;
  let preparedPlan: StoredPlan | undefined;
  let disposed = false;
  let planSequence = 0;

  const assertAvailable = () => {
    if (disposed) {
      throw new WorkspaceAuthoringError('SURFACE_DISPOSED', `Authoring surface is unavailable: ${options.id}`, {
        surfaceId: options.id,
      });
    }
  };

  const getInternalSnapshot = (sourceFiles?: WorkspaceAuthoringFile[]): WorkspaceAuthoringTreeSnapshot => {
    assertAvailable();
    return buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: sourceFiles || options.getSourceFiles(),
      virtualFiles: options.getVirtualFiles(),
      getPathWritable: (path, file) => options.getPathAccess(path, 'update').canUpdate && file.writable !== false,
    });
  };

  const canRead = (file: WorkspaceAuthoringSnapshotFile): boolean => {
    try {
      return options.canReadForAI(file.source) === true;
    } catch {
      return false;
    }
  };

  const sanitizeDiagnostics = (
    diagnostics: CodeAuthoringDiagnostic[],
    snapshot: WorkspaceAuthoringTreeSnapshot,
  ): CodeAuthoringDiagnostic[] => {
    const readablePaths = new Set(snapshot.files.filter(canRead).map((file) => file.path));
    const workspacePaths = new Set(snapshot.files.map((file) => file.path));
    return diagnostics.flatMap((diagnostic) => {
      const safe = options.sanitizeDiagnostic(diagnostic, readablePaths, workspacePaths);
      if (!safe) {
        return [];
      }
      if (!safe.path) {
        return [{ ...safe }];
      }
      try {
        const path = normalizeWorkspaceAuthoringPath(safe.path);
        return readablePaths.has(path) ? [{ ...safe, path }] : [];
      } catch {
        return [];
      }
    });
  };

  const getSnapshot = async (): Promise<CodeAuthoringSnapshot> => {
    const snapshot = getInternalSnapshot();
    const readableFiles = snapshot.files.filter(canRead);
    const activePath = normalizeOptionalPath(options.getActivePath());
    return {
      surfaceId: options.id,
      kind: options.kind,
      title: options.title,
      snapshotId: snapshot.snapshotId,
      ...(activePath && readableFiles.some((file) => file.path === activePath) ? { activePath } : {}),
      files: readableFiles.map(toCodeAuthoringFileMeta),
      diagnostics: sanitizeDiagnostics(await options.getDiagnostics(), snapshot),
    };
  };

  const read = async (paths: string[]): Promise<CodeAuthoringFile[]> => {
    const requestedPaths = new Set(paths.map((path) => normalizeRequestedPath(options.id, path)));
    return getInternalSnapshot()
      .files.filter((file) => requestedPaths.has(file.path) && canRead(file))
      .map(({ source: _source, ...file }) => ({ ...file }));
  };

  const search = async (searchOptions: CodeAuthoringSearchOptions): Promise<CodeAuthoringSearchMatch[]> => {
    const query = searchOptions.query;
    if (!query) {
      return [];
    }
    const requestedPaths = searchOptions.paths
      ? new Set(searchOptions.paths.map((path) => normalizeRequestedPath(options.id, path)))
      : undefined;
    const limit = clamp(searchOptions.limit ?? searchMaxResults, 1, searchMaxResults);
    const contextLength = clamp(searchOptions.contextLength ?? searchMaxContextLength, 1, searchMaxContextLength);
    const normalizedQuery = query.toLocaleLowerCase();
    const matches: CodeAuthoringSearchMatch[] = [];

    for (const file of getInternalSnapshot().files) {
      if (!canRead(file) || (requestedPaths && !requestedPaths.has(file.path))) {
        continue;
      }
      const content = file.content;
      const normalizedContent = content.toLocaleLowerCase();
      let fromIndex = 0;
      while (matches.length < limit) {
        const matchIndex = normalizedContent.indexOf(normalizedQuery, fromIndex);
        if (matchIndex < 0) {
          break;
        }
        const before = content.slice(0, matchIndex);
        const lineStart = before.lastIndexOf('\n') + 1;
        matches.push({
          path: file.path,
          line: before.split('\n').length,
          column: matchIndex - lineStart + 1,
          preview: content.slice(
            Math.max(lineStart, matchIndex - Math.floor(contextLength / 2)),
            matchIndex + contextLength,
          ),
        });
        fromIndex = matchIndex + Math.max(1, query.length);
      }
      if (matches.length >= limit) {
        break;
      }
    }
    return matches;
  };

  const prepareChanges: CodeAuthoringSurface['prepareChanges'] = async (input) => {
    assertAvailable();
    if (preparedPlan?.applying) {
      throw new WorkspaceAuthoringError('PLAN_APPLYING', 'A workspace plan is already being applied', {
        surfaceId: options.id,
        planId: preparedPlan.planId,
      });
    }
    const snapshot = getInternalSnapshot();
    const prepared = prepareWorkspaceAuthoringChanges({
      surfaceId: options.id,
      baseSnapshotId: input.baseSnapshotId,
      changes: input.changes,
      snapshot,
      getPathAccess: options.getPathAccess,
      supportedLanguages: options.supportedLanguages,
    });
    preparedPlan = {
      planId: `${options.id}:plan:${instanceId}:${(planSequence += 1).toString(36)}`,
      surfaceId: options.id,
      baseSnapshotId: snapshot.snapshotId,
      changes: prepared.changes,
      diffs: prepared.diffs,
      nextSourceFiles: prepared.nextSourceFiles,
      changedPaths: prepared.changedPaths,
      applying: false,
    };
    return toPublicPlan(preparedPlan);
  };

  const applyPreparedChanges: CodeAuthoringSurface['applyPreparedChanges'] = async (planId) => {
    assertAvailable();
    const plan = preparedPlan;
    if (!plan || plan.planId !== planId) {
      throw new WorkspaceAuthoringError('PLAN_NOT_FOUND', `Unknown authoring plan: ${planId}`, {
        surfaceId: options.id,
        planId,
      });
    }
    if (plan.applying) {
      throw new WorkspaceAuthoringError('PLAN_APPLYING', `Authoring plan is already being applied: ${planId}`, {
        surfaceId: options.id,
        planId,
      });
    }
    const snapshot = getInternalSnapshot();
    if (snapshot.snapshotId !== plan.baseSnapshotId) {
      throw new WorkspaceAuthoringError('STALE_SNAPSHOT', 'The workspace changed; prepare a new plan', {
        surfaceId: options.id,
        planId,
        expectedSnapshotId: plan.baseSnapshotId,
        actualSnapshotId: snapshot.snapshotId,
      });
    }
    assertWorkspaceAuthoringPlanAccess(options.id, plan.changes, options.getPathAccess);

    plan.applying = true;
    try {
      const nextFiles = cloneWorkspaceAuthoringFiles(plan.nextSourceFiles);
      await options.commitSourceFiles(nextFiles);
      const nextSnapshotId = getInternalSnapshot().snapshotId;
      preparedPlan = undefined;
      return { surfaceId: options.id, snapshotId: nextSnapshotId, changedPaths: [...plan.changedPaths] };
    } catch (error) {
      if (preparedPlan === plan) {
        plan.applying = false;
      }
      throw error;
    }
  };

  const validateDraft: CodeAuthoringSurface['validateDraft'] = async () => {
    const startedSnapshot = getInternalSnapshot();
    const diagnostics = await options.validateDraft();
    const currentSnapshot = getInternalSnapshot();
    return {
      surfaceId: options.id,
      snapshotId: startedSnapshot.snapshotId,
      diagnostics: sanitizeDiagnostics(diagnostics, startedSnapshot),
      stale: currentSnapshot.snapshotId !== startedSnapshot.snapshotId,
    };
  };

  return {
    id: options.id,
    getSnapshot,
    read,
    search,
    prepareChanges,
    applyPreparedChanges,
    validateDraft,
    dispose() {
      disposed = true;
      preparedPlan = undefined;
    },
  };
}

function normalizeRequestedPath(surfaceId: string, path: string): string {
  try {
    return normalizeWorkspaceAuthoringPath(path);
  } catch (error) {
    throw new WorkspaceAuthoringError('INVALID_PATH', error instanceof Error ? error.message : 'Invalid path', {
      surfaceId,
      path,
    });
  }
}

function normalizeOptionalPath(path: string | undefined): string | undefined {
  if (!path) {
    return undefined;
  }
  try {
    return normalizeWorkspaceAuthoringPath(path);
  } catch {
    return undefined;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Math.floor(value))) : maximum;
}

function toPublicPlan(plan: StoredPlan): PreparedCodeAuthoringChangeSet {
  return {
    planId: plan.planId,
    surfaceId: plan.surfaceId,
    baseSnapshotId: plan.baseSnapshotId,
    changes: plan.changes.map((change) => ({ ...change })),
    diffs: plan.diffs.map((diff) => ({ ...diff })),
  };
}
