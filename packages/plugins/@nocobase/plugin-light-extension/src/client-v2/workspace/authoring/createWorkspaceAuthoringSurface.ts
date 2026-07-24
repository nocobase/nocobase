/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CodeAuthoringCapabilities,
  CodeAuthoringDiagnostic,
  CodeAuthoringFile,
  CodeAuthoringFileMeta,
  CodeAuthoringRange,
  CodeAuthoringScope,
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
  scope: CodeAuthoringScope;
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
  reveal: (path: string, range?: CodeAuthoringRange) => void | Promise<void>;
  supportedLanguages?: readonly string[];
  planTtlMs?: number;
  maxPlans?: number;
  searchMaxResults?: number;
  searchMaxContextLength?: number;
  now?: () => number;
  unavailableReason?: string;
  changeCapabilities?: {
    prepareChanges: boolean;
    applyPreparedChanges: boolean;
  };
}

interface StoredWorkspaceAuthoringPlan extends PreparedCodeAuthoringChangeSet {
  nextSourceFiles: WorkspaceAuthoringFile[];
  changedPaths: string[];
  status: 'prepared' | 'applying' | 'consumed';
}

const DEFAULT_PLAN_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_PLANS = 32;
const DEFAULT_SEARCH_MAX_RESULTS = 50;
const DEFAULT_SEARCH_CONTEXT_LENGTH = 240;

export function createWorkspaceAuthoringSurface(options: CreateWorkspaceAuthoringSurfaceOptions): CodeAuthoringSurface {
  const now = options.now || Date.now;
  const planTtlMs = Math.max(1, options.planTtlMs ?? DEFAULT_PLAN_TTL_MS);
  const maxPlans = Math.max(1, options.maxPlans ?? DEFAULT_MAX_PLANS);
  const searchMaxResults = Math.max(1, options.searchMaxResults ?? DEFAULT_SEARCH_MAX_RESULTS);
  const searchMaxContextLength = Math.max(1, options.searchMaxContextLength ?? DEFAULT_SEARCH_CONTEXT_LENGTH);
  const plans = new Map<string, StoredWorkspaceAuthoringPlan>();
  let disposed = false;
  let applyingPlanId: string | undefined;
  let planSequence = 0;

  const capabilities: CodeAuthoringCapabilities = {
    describe: true,
    listFiles: true,
    readFiles: true,
    search: true,
    prepareChanges: options.changeCapabilities?.prepareChanges ?? true,
    applyPreparedChanges: options.changeCapabilities?.applyPreparedChanges ?? true,
    validateDraft: true,
    reveal: true,
    supportedChanges: ['create', 'update', 'patch', 'delete'],
    ...(options.unavailableReason ? { unavailableReason: options.unavailableReason } : {}),
  };

  const assertAvailable = () => {
    if (disposed) {
      throw new WorkspaceAuthoringError('SURFACE_DISPOSED', `Authoring surface is no longer available: ${options.id}`, {
        surfaceId: options.id,
      });
    }
  };

  const getInternalSnapshot = (sourceFiles?: WorkspaceAuthoringFile[]): WorkspaceAuthoringTreeSnapshot => {
    assertAvailable();
    return buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: sourceFiles || options.getSourceFiles(),
      virtualFiles: options.getVirtualFiles(),
      getPathWritable: (path, file) => {
        if (file.readOnly === true || file.writable === false) {
          return false;
        }
        const access = options.getPathAccess(path, 'update');
        return (access.canUpdate ?? access.canWrite) === true;
      },
    });
  };

  const canReadSnapshotFile = (file: WorkspaceAuthoringSnapshotFile): boolean => {
    try {
      return options.canReadForAI(file.source) === true;
    } catch (_) {
      return false;
    }
  };

  const sanitizeDiagnostics = (
    diagnostics: CodeAuthoringDiagnostic[],
    snapshot: WorkspaceAuthoringTreeSnapshot,
  ): CodeAuthoringDiagnostic[] => {
    const readablePaths = new Set(snapshot.files.filter(canReadSnapshotFile).map((file) => file.path));
    const workspacePaths = new Set(snapshot.files.map((file) => file.path));
    const sanitized: CodeAuthoringDiagnostic[] = [];
    for (const diagnostic of diagnostics) {
      const safeDiagnostic = options.sanitizeDiagnostic(diagnostic, readablePaths, workspacePaths);
      if (!safeDiagnostic) {
        continue;
      }
      if (safeDiagnostic.path) {
        let normalizedPath: string;
        try {
          normalizedPath = normalizeWorkspaceAuthoringPath(safeDiagnostic.path);
        } catch (_) {
          continue;
        }
        if (!readablePaths.has(normalizedPath)) {
          continue;
        }
        sanitized.push({ ...safeDiagnostic, path: normalizedPath });
      } else {
        sanitized.push({ ...safeDiagnostic });
      }
    }
    return sanitized;
  };

  const buildPublicSnapshot = async (
    internalSnapshot = getInternalSnapshot(),
    diagnostics?: CodeAuthoringDiagnostic[],
  ): Promise<CodeAuthoringSnapshot> => {
    const readableFiles = internalSnapshot.files.filter(canReadSnapshotFile);
    const activePath = normalizeOptionalPath(options.getActivePath());
    const rawDiagnostics = diagnostics ?? (await options.getDiagnostics());
    return {
      surfaceId: options.id,
      kind: options.kind,
      title: options.title,
      scope: { ...options.scope },
      snapshotId: internalSnapshot.snapshotId,
      ...(activePath && readableFiles.some((file) => file.path === activePath) ? { activePath } : {}),
      files: readableFiles.map(toCodeAuthoringFileMeta),
      diagnostics: sanitizeDiagnostics(rawDiagnostics, internalSnapshot),
      capabilities: { ...capabilities, supportedChanges: [...capabilities.supportedChanges] },
    };
  };

  const list = async (): Promise<CodeAuthoringFileMeta[]> => {
    assertAvailable();
    return getInternalSnapshot().files.filter(canReadSnapshotFile).map(toCodeAuthoringFileMeta);
  };

  const read = async (paths: string[]): Promise<CodeAuthoringFile[]> => {
    assertAvailable();
    const requestedPaths = new Set(paths.map((path) => normalizeRequestedPath(options.id, path)));
    const snapshot = getInternalSnapshot();
    return snapshot.files
      .filter((file) => requestedPaths.has(file.path) && canReadSnapshotFile(file))
      .map(({ source: _source, ...file }) => ({ ...file }));
  };

  const search = async (searchOptions: CodeAuthoringSearchOptions): Promise<CodeAuthoringSearchMatch[]> => {
    assertAvailable();
    const query = searchOptions.query || '';
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
    const snapshot = getInternalSnapshot();

    for (const file of snapshot.files) {
      if (!canReadSnapshotFile(file) || (requestedPaths && !requestedPaths.has(file.path))) {
        continue;
      }
      const normalizedContent = file.content.toLocaleLowerCase();
      let fromIndex = 0;
      while (matches.length < limit) {
        const matchIndex = normalizedContent.indexOf(normalizedQuery, fromIndex);
        if (matchIndex < 0) {
          break;
        }
        const before = file.content.slice(0, matchIndex);
        const lineStart = before.lastIndexOf('\n') + 1;
        const line = before.split('\n').length;
        const column = matchIndex - lineStart + 1;
        const previewStart = Math.max(lineStart, matchIndex - Math.floor(contextLength / 2));
        const previewEnd = Math.min(
          file.content.indexOf('\n', matchIndex) === -1 ? file.content.length : file.content.indexOf('\n', matchIndex),
          previewStart + contextLength,
        );
        matches.push({
          path: file.path,
          line,
          column,
          preview: file.content.slice(previewStart, previewEnd),
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
    if (!capabilities.prepareChanges) {
      throw new WorkspaceAuthoringError(
        'CAPABILITY_UNAVAILABLE',
        options.unavailableReason || `Preparing changes is unavailable for ${options.id}`,
        { surfaceId: options.id, reason: options.unavailableReason },
      );
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
    const createdAt = now();
    const planId = `${options.id}:plan:${createdAt.toString(36)}:${(planSequence += 1).toString(36)}`;
    const plan: StoredWorkspaceAuthoringPlan = {
      planId,
      surfaceId: options.id,
      baseSnapshotId: snapshot.snapshotId,
      changes: prepared.changes,
      diffs: prepared.diffs,
      warnings: [],
      createdAt,
      expiresAt: createdAt + planTtlMs,
      saved: false,
      nextSourceFiles: prepared.nextSourceFiles,
      changedPaths: prepared.changedPaths,
      status: 'prepared',
    };
    evictPlans(plans, maxPlans - 1);
    plans.set(planId, plan);
    return toPublicPlan(plan);
  };

  const applyPreparedChanges: CodeAuthoringSurface['applyPreparedChanges'] = async (planId) => {
    assertAvailable();
    if (!capabilities.applyPreparedChanges) {
      throw new WorkspaceAuthoringError(
        'CAPABILITY_UNAVAILABLE',
        options.unavailableReason || `Applying changes is unavailable for ${options.id}`,
        { surfaceId: options.id, planId, reason: options.unavailableReason },
      );
    }
    const plan = plans.get(planId);
    if (!plan || plan.surfaceId !== options.id) {
      throw new WorkspaceAuthoringError('PLAN_NOT_FOUND', `Unknown authoring plan: ${planId}`, {
        surfaceId: options.id,
        planId,
      });
    }
    if (plan.status === 'consumed') {
      throw new WorkspaceAuthoringError('PLAN_CONSUMED', `Authoring plan was already applied: ${planId}`, {
        surfaceId: options.id,
        planId,
      });
    }
    if (plan.status === 'applying') {
      throw new WorkspaceAuthoringError('PLAN_APPLYING', `Authoring plan is already being applied: ${planId}`, {
        surfaceId: options.id,
        planId,
      });
    }
    if (now() >= plan.expiresAt) {
      throw new WorkspaceAuthoringError('PLAN_EXPIRED', `Authoring plan expired: ${planId}`, {
        surfaceId: options.id,
        planId,
      });
    }
    if (applyingPlanId) {
      throw new WorkspaceAuthoringError(
        'PLAN_APPLYING',
        `Another authoring plan is already being applied: ${applyingPlanId}`,
        {
          surfaceId: options.id,
          planId,
        },
      );
    }

    const currentSnapshot = getInternalSnapshot();
    if (currentSnapshot.snapshotId !== plan.baseSnapshotId) {
      throw new WorkspaceAuthoringError(
        'STALE_SNAPSHOT',
        'The workspace changed; read it again and prepare a new plan',
        {
          surfaceId: options.id,
          planId,
          expectedSnapshotId: plan.baseSnapshotId,
          actualSnapshotId: currentSnapshot.snapshotId,
        },
      );
    }
    assertWorkspaceAuthoringPlanAccess(options.id, plan.changes, options.getPathAccess);

    plan.status = 'applying';
    applyingPlanId = planId;
    try {
      const nextSourceFiles = cloneWorkspaceAuthoringFiles(plan.nextSourceFiles);
      const committedSnapshot = getInternalSnapshot(nextSourceFiles);
      await options.commitSourceFiles(nextSourceFiles);
      plan.status = 'consumed';
      let publicSnapshot: CodeAuthoringSnapshot;
      try {
        publicSnapshot = await buildPublicSnapshot(committedSnapshot);
      } catch {
        publicSnapshot = await buildPublicSnapshot(committedSnapshot, []);
      }
      return {
        surfaceId: options.id,
        snapshot: publicSnapshot,
        changedPaths: [...plan.changedPaths],
        saved: false,
      };
    } catch (error) {
      if (plan.status !== 'consumed') {
        plan.status = 'prepared';
      }
      throw error;
    } finally {
      if (applyingPlanId === planId) {
        applyingPlanId = undefined;
      }
    }
  };

  const validateDraft: CodeAuthoringSurface['validateDraft'] = async () => {
    assertAvailable();
    const startedSnapshot = getInternalSnapshot();
    const diagnostics = await options.validateDraft();
    const currentSnapshot = getInternalSnapshot();
    return {
      surfaceId: options.id,
      snapshotId: startedSnapshot.snapshotId,
      diagnostics: sanitizeDiagnostics(diagnostics, startedSnapshot),
      stale: currentSnapshot.snapshotId !== startedSnapshot.snapshotId,
      saved: false,
    };
  };

  const reveal: CodeAuthoringSurface['reveal'] = async (path, range) => {
    assertAvailable();
    const normalizedPath = normalizeRequestedPath(options.id, path);
    const snapshot = getInternalSnapshot();
    const file = snapshot.files.find((candidate) => candidate.path === normalizedPath);
    if (!file || !canReadSnapshotFile(file)) {
      throw new WorkspaceAuthoringError('FILE_NOT_FOUND', `Readable file does not exist: ${normalizedPath}`, {
        surfaceId: options.id,
        path: normalizedPath,
      });
    }
    await options.reveal(normalizedPath, range);
  };

  return {
    id: options.id,
    describe: () => buildPublicSnapshot(),
    getSnapshot: () => buildPublicSnapshot(),
    list,
    read,
    search,
    prepareChanges,
    applyPreparedChanges,
    validateDraft,
    reveal,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      plans.clear();
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
  } catch (_) {
    return undefined;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return maximum;
  }
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

function evictPlans(plans: Map<string, StoredWorkspaceAuthoringPlan>, targetSize: number): void {
  while (plans.size > targetSize) {
    const oldestPlanId = plans.keys().next().value;
    if (typeof oldestPlanId !== 'string') {
      return;
    }
    plans.delete(oldestPlanId);
  }
}

function toPublicPlan(plan: StoredWorkspaceAuthoringPlan): PreparedCodeAuthoringChangeSet {
  return {
    planId: plan.planId,
    surfaceId: plan.surfaceId,
    baseSnapshotId: plan.baseSnapshotId,
    changes: plan.changes.map((change) => ({ ...change })),
    diffs: plan.diffs.map((diff) => ({ ...diff })),
    warnings: [...plan.warnings],
    createdAt: plan.createdAt,
    expiresAt: plan.expiresAt,
    saved: false,
  };
}
