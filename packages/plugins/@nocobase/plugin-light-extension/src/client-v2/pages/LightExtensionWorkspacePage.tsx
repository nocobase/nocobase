/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownloadOutlined, ImportOutlined, SaveOutlined } from '@ant-design/icons';
import {
  createActiveEntryContextType,
  generateBindingContextTypes,
  generateClientSettingsTypes,
  type LightExtensionBindingContextTypegenResult,
  type LightExtensionSettingsTypegenResult,
} from '@nocobase/light-extension-sdk/typegen';
import { encodeLightExtensionPreviewSessionDescriptor } from '@nocobase/light-extension-sdk/agent-loop';
import {
  CodeTab,
  CloseConfirmModal,
  FilesPanel,
  RestoreVersionModal,
  SaveVersionModal,
  VersionHistoryDock,
  buildLineDiff,
  inferLanguageFromPath,
  mergeHistoryItems,
  summarizeWorkspaceChanges,
  type RunJSSourceHistoryItem,
  type RunJSWorkspacePathAccess,
  type RunJSWorkspacePathType,
  type RunJSWorkspaceFile,
  useVscFileT,
} from '../vsc-file/public-api';
import {
  type CodeEditorDiagnostic,
  type CodeEditorRevealTarget,
  type EmbeddedRunJSEditorSaveResult,
  createRunJSHostPreviewSession,
  type RunJSHostPreviewSourceRef,
  useFullscreenOverlay,
} from '@nocobase/client-v2';
import type { RunJSApiFailureEvent, RunJSRuntimeEvent } from '@nocobase/flow-engine';
import {
  getFirstMappedRunJSStackFrame,
  mapRunJSStack,
  mapRunJSStackFrame,
  parseRunJSLineMapV1,
} from '@nocobase/runjs/compiler/line-map';
import { Alert, Button, Empty, Flex, Modal, Space, Spin, Tag, Tooltip, Typography, message, theme } from 'antd';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE,
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
  LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
  NAMESPACE,
} from '../../constants';
import { DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES } from '../../shared/default-template';
import type {
  LightExtensionProblem,
  LightExtensionEntryRuntimeArtifact,
  LightExtensionFileEncoding,
  LightExtensionFileChange,
  LightExtensionRepoRecord,
  LightExtensionCommitRecord,
  LightExtensionReferenceOwnerLocator,
  LightExtensionTreeEntryInput,
} from '../../shared/types';
import type { LightExtensionContextPack } from '../../shared/context-pack';
import { createLightExtensionProblemFactory } from '../../shared/problems';
import ProblemsPanel from '../components/ProblemsPanel';
import { isBrowserProvisionalPreviewEnabled } from '../browser-preview/BrowserPreviewSession';
import {
  getLightExtensionPreviewSurfaceStyle,
  useBrowserProvisionalPreview,
} from '../browser-preview/useBrowserProvisionalPreview';
import {
  getLightExtensionErrorProblems,
  LightExtensionHookError,
  useLightExtensionRepo,
} from '../hooks/useLightExtensionRepo';
import {
  canChangeLightExtensionWorkspacePath,
  getLightExtensionEntryRoot,
  getManagedLightExtensionEntryRoot,
  getLightExtensionWorkspacePathAccess,
  normalizeWorkspacePath,
  type LightExtensionWorkspaceScope,
} from '../workspace/lightExtensionWorkspaceAccess';
import {
  buildLightExtensionWorkspaceArchiveFileName,
  createLightExtensionWorkspaceArchive,
  downloadLightExtensionWorkspaceArchive,
  readLightExtensionWorkspaceArchive,
} from '../workspace/lightExtensionWorkspaceArchive';
import { resolveLightExtensionWorkspaceJsonSchema } from '../workspace/lightExtensionWorkspaceJsonSchema';
import { useWorkspaceProblemStore, WorkspaceProblemStore } from '../problems/workspaceProblemStore';
import {
  LightExtensionPreviewProblemClient,
  openLightExtensionPreviewProblemSession,
  type ActiveLightExtensionPreviewProblemSession,
} from '../problems/previewProblemClient';

interface WorkspaceFile extends RunJSWorkspaceFile {
  encoding?: LightExtensionFileEncoding;
  size?: number;
}

interface LightExtensionWorkspacePageProps {
  browserProvisionalPreview?: boolean;
  embedded?: boolean;
  defaultFilesCollapsed?: boolean;
  repoId?: string;
  initialPath?: string;
  workspaceScope?: LightExtensionWorkspaceScope;
  entryId?: string | null;
  ownerLocator?: LightExtensionReferenceOwnerLocator;
  previewProblemClient?: LightExtensionPreviewProblemClient;
  referenceId?: string;
  onPreview?: (request: LightExtensionHostPreviewRequest) => void | Promise<void>;
  onMoveToInline?: (input: LightExtensionMoveToInlineRequest) => void | Promise<void>;
  onFooterActionsChange?: (actions: LightExtensionWorkspaceFooterActions | null) => void;
  onRequestClose?: () => void | Promise<void>;
  onSaved?: () => void | Promise<void>;
}

interface ActiveHostPreviewSession {
  sourceRef: RunJSHostPreviewSourceRef;
  close(): void;
  closeRemote(state: 'completed' | 'stale'): Promise<void>;
  remote?: ActiveLightExtensionPreviewProblemSession;
}

type PreviewAgentStatus = 'idle' | 'active' | 'completed' | 'stale' | 'expired';

interface PreviewAgentSessionState {
  status: PreviewAgentStatus;
  snapshotId?: string;
  sessionId?: string;
  token?: string;
}

export interface LightExtensionMoveToInlineRequest {
  entryPath: string;
  files: RunJSWorkspaceFile[];
  version: string;
}

export interface LightExtensionHostPreviewRequest {
  artifact: LightExtensionEntryRuntimeArtifact;
  requestId: string;
  snapshotId: string;
  sourceRef: RunJSHostPreviewSourceRef;
}

export interface LightExtensionWorkspaceFooterActions {
  dirty: boolean;
  disabled: boolean;
  loading: boolean;
  onCancel: () => void | Promise<void>;
  onSave: () => void;
  requestSave: () => Promise<EmbeddedRunJSEditorSaveResult>;
}

const LIGHT_EXTENSION_SOURCE_ROOT = 'src/client/js-blocks';
const LIGHT_EXTENSION_PORTAL_ROOT = 'src/client/js-portals';
const LIGHT_EXTENSION_SHARED_ROOT = 'src/shared';
const LIGHT_EXTENSION_REPO_ROOT_FILE_PATHS = ['README.md', 'tsconfig.json'] as const;
const LIGHT_EXTENSION_REPO_ROOT_FILES = new Set<string>(LIGHT_EXTENSION_REPO_ROOT_FILE_PATHS);
const LIGHT_EXTENSION_CLIENT_KIND_TEMPLATE_FILES = [
  'src/client/js-pages/hello-page/index.tsx',
  'src/client/js-pages/hello-page/entry.json',
  'src/client/js-fields/status-tag/index.tsx',
  'src/client/js-actions/refresh-data/index.ts',
  'src/client/js-items/form-total-preview/index.tsx',
  'src/client/runjs/calculate-subtotal/index.ts',
] as const;
const LIGHT_EXTENSION_CLIENT_KIND_ROOTS = [
  'src/client/js-pages',
  'src/client/js-fields',
  'src/client/js-actions',
  'src/client/js-items',
  'src/client/runjs',
] as const;
const DEFAULT_NEW_FILE_NAME = 'helper';
const DEFAULT_NEW_FILE_EXTENSION = '.ts';
const HISTORY_PAGE_SIZE = 20;
const REPOSITORY_WORKSPACE_SCOPE: LightExtensionWorkspaceScope = { mode: 'repository' };

function LightExtensionWorkspacePage({
  browserProvisionalPreview,
  embedded = false,
  defaultFilesCollapsed = false,
  repoId: repoIdProp,
  initialPath,
  workspaceScope = REPOSITORY_WORKSPACE_SCOPE,
  entryId,
  ownerLocator,
  previewProblemClient,
  referenceId,
  onPreview,
  onMoveToInline,
  onFooterActionsChange,
  onRequestClose,
  onSaved,
}: LightExtensionWorkspacePageProps) {
  const { t } = useTranslation(NAMESPACE);
  const { token } = theme.useToken();
  const studioT = useVscFileT();
  const [searchParams] = useSearchParams();
  const repoId = repoIdProp || searchParams.get('repoId') || '';
  const {
    compileWorkspacePreview,
    getContextPack,
    getRepo,
    inspectSourceArchive,
    listCommits,
    pull,
    pullCommit,
    saveSource,
  } = useLightExtensionRepo();
  const [repo, setRepo] = useState<LightExtensionRepoRecord | null>(null);
  const [baseCommitSeq, setBaseCommitSeq] = useState<number>();
  const [baseHeadCommitId, setBaseHeadCommitId] = useState<string | null>(null);
  const [baseFiles, setBaseFiles] = useState<WorkspaceFile[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | undefined>();
  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [filesCollapsed, setFilesCollapsed] = useState(defaultFilesCollapsed);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  const [historyItems, setHistoryItems] = useState<RunJSSourceHistoryItem[]>([]);
  const problemStore = useMemo(() => new WorkspaceProblemStore(), []);
  const problemState = useWorkspaceProblemStore(problemStore);
  const [revealTarget, setRevealTarget] = useState<CodeEditorRevealTarget>();
  const [loading, setLoading] = useState(false);
  const [initializedRepoId, setInitializedRepoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewAgentSession, setPreviewAgentSession] = useState<PreviewAgentSessionState>({ status: 'idle' });
  const [diffReviewedSnapshotKey, setDiffReviewedSnapshotKey] = useState<string>();
  const [movingToInline, setMovingToInline] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyNextBeforeSeq, setHistoryNextBeforeSeq] = useState<number | null>(null);
  const [isDiff, setIsDiff] = useState(false);
  const [restoreCommit, setRestoreCommit] = useState<RunJSSourceHistoryItem | null>(null);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(
    null,
  );
  const [bindingContextPack, setBindingContextPack] = useState<LightExtensionContextPack>();
  const [bindingContextStatus, setBindingContextStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const workspaceFullscreen = useFullscreenOverlay();
  const embeddedSaveRequestRef = useRef<{
    resolve: (result: EmbeddedRunJSEditorSaveResult) => void;
    reject: (error: unknown) => void;
  } | null>(null);
  const embeddedSavePromiseRef = useRef<Promise<EmbeddedRunJSEditorSaveResult> | null>(null);
  const historyRequestSeqRef = useRef(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const latestPreviewSnapshotRef = useRef('');
  const previousPreviewSnapshotKeyRef = useRef('');
  const previewRequestSequenceRef = useRef(0);
  const activePreviewSessionRef = useRef<ActiveHostPreviewSession | null>(null);
  const revealRequestSequenceRef = useRef(0);
  const bindingContextRequestSequenceRef = useRef(0);
  const ownerLocatorSignature = useMemo(() => JSON.stringify(ownerLocator || null), [ownerLocator]);
  const entryRoot = getLightExtensionEntryRoot(workspaceScope);
  const entryScoped = workspaceScope.mode === 'entry';
  const pathRestrictionReason = t('Other light extension entries are read-only here');
  const resolveWorkspacePathAccess = useCallback(
    (path: string, pathType: RunJSWorkspacePathType): RunJSWorkspacePathAccess => {
      const access = getLightExtensionWorkspacePathAccess(workspaceScope, path, pathType);
      return {
        ...access,
        reason: access.canWrite ? undefined : pathRestrictionReason,
      };
    },
    [pathRestrictionReason, workspaceScope],
  );

  const loadBindingContext = useCallback(async () => {
    const requestSequence = bindingContextRequestSequenceRef.current + 1;
    bindingContextRequestSequenceRef.current = requestSequence;
    if (!repoId || !entryId) {
      setBindingContextPack(undefined);
      setBindingContextStatus('idle');
      return;
    }

    setBindingContextPack(undefined);
    setBindingContextStatus('loading');
    try {
      const nextContextPack = await getContextPack({
        repoId,
        entryId,
        ...(referenceId ? { referenceId } : {}),
        ...(ownerLocatorSignature !== 'null'
          ? { ownerLocator: JSON.parse(ownerLocatorSignature) as LightExtensionReferenceOwnerLocator }
          : {}),
      });
      if (bindingContextRequestSequenceRef.current !== requestSequence) {
        return;
      }
      setBindingContextPack((current) =>
        current?.contextHash === nextContextPack.contextHash ? current : nextContextPack,
      );
      setBindingContextStatus('ready');
    } catch {
      if (bindingContextRequestSequenceRef.current !== requestSequence) {
        return;
      }
      setBindingContextPack(undefined);
      setBindingContextStatus('error');
    }
  }, [entryId, getContextPack, ownerLocatorSignature, referenceId, repoId]);

  const loadWorkspace = useCallback(
    async (options: { resetNotice?: boolean } = {}) => {
      if (!repoId) {
        return;
      }

      const historyRequestSeq = historyRequestSeqRef.current + 1;
      historyRequestSeqRef.current = historyRequestSeq;
      setHistoryLoading(false);
      setHistoryLoadingMore(false);
      setLoading(true);
      if (options.resetNotice !== false) {
        setNotice(null);
      }
      try {
        const nextRepo = await getRepo(repoId);
        setRepo(nextRepo);
        if (nextRepo.lifecycleStatus === 'archived') {
          setBaseFiles([]);
          setFiles([]);
          setFolders([]);
          setActivePath(undefined);
          setOpenPaths([]);
          setBaseCommitSeq(undefined);
          setBaseHeadCommitId(null);
          setHistoryItems([]);
          setHistoryNextBeforeSeq(null);
          setNotice({ type: 'warning', message: t('Archived repositories are read-only') });
          return;
        }

        const pullResult = await pull({ repoId, includeContent: 'all' });
        const pulledFiles = normalizeWorkspaceFiles(pullResult.files || []);
        const nextFiles = pulledFiles;
        const nextActivePath = resolveActivePath(nextFiles, initialPath);
        const commits = await listCommits({ repoId, limit: HISTORY_PAGE_SIZE }).catch(() => []);
        const nextBaseCommitId = pullResult.commit?.id || null;
        setBaseHeadCommitId(nextBaseCommitId);
        setBaseCommitSeq(commits.find((commit) => commit.id === nextBaseCommitId)?.seq);
        setBaseFiles(pulledFiles);
        setFiles(nextFiles);
        setFolders(collectWorkspaceFolders(nextFiles));
        setActivePath(nextActivePath);
        setOpenPaths(nextActivePath ? [nextActivePath] : []);
        if (historyRequestSeqRef.current === historyRequestSeq) {
          setHistoryItems(toRunJSHistoryItems(commits));
          setHistoryNextBeforeSeq(getNextHistoryCursor(commits, HISTORY_PAGE_SIZE));
        }
        problemStore.clear();
        setIsDiff(false);
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load source') });
      } finally {
        setLoading(false);
        setInitializedRepoId(repoId);
      }
    },
    [getRepo, initialPath, listCommits, problemStore, pull, repoId, t],
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    loadBindingContext();
  }, [loadBindingContext]);

  const activeFile = files.find((file) => file.path === activePath);
  const textFiles = useMemo(() => files.filter((file) => !isBinaryWorkspaceFile(file)), [files]);
  const sourceFiles = useMemo(() => textFiles.filter((file) => !isPortalWorkspacePath(file.path)), [textFiles]);
  const settingsTypegen = useMemo(() => generateClientSettingsTypes({ files: sourceFiles }), [sourceFiles]);
  const activeBindingContextPack =
    bindingContextPack?.repoId === repoId && bindingContextPack.entry.id === entryId ? bindingContextPack : undefined;
  const bindingContextTypegen = useMemo<LightExtensionBindingContextTypegenResult | undefined>(
    () => (activeBindingContextPack ? generateBindingContextTypes(activeBindingContextPack) : undefined),
    [activeBindingContextPack],
  );
  const activeEntryContext = useMemo(
    () =>
      createActiveEntryContextType({
        activePath,
        bindingTypes: bindingContextTypegen,
        entries: settingsTypegen.entries,
      }),
    [activePath, bindingContextTypegen, settingsTypegen.entries],
  );
  const authoringFiles = useMemo(
    () =>
      addGeneratedTypeFiles(
        textFiles,
        [...settingsTypegen.files, ...(bindingContextTypegen?.files || [])],
        activeEntryContext.file,
      ),
    [activeEntryContext.file, bindingContextTypegen?.files, settingsTypegen.files, textFiles],
  );
  const showGenericContextHint =
    Boolean(activeEntryContext.entry) &&
    bindingContextStatus !== 'loading' &&
    (bindingContextStatus === 'error' || !bindingContextTypegen?.precise);
  const filesForSave = files;
  const dirtyChanges = useMemo(() => buildFileChanges(baseFiles, filesForSave), [baseFiles, filesForSave]);
  const saveSummary = useMemo(() => summarizeWorkspaceChanges(baseFiles, filesForSave), [baseFiles, filesForSave]);
  const diffRows = useMemo(
    () =>
      activeFile && isBinaryWorkspaceFile(activeFile) ? [] : buildLineDiff(baseFiles, filesForSave, activePath, false),
    [activeFile, activePath, baseFiles, filesForSave],
  );
  const hasUnsavedLocalChanges = dirtyChanges.length > 0;
  const canWrite = Boolean(repo && repo.lifecycleStatus !== 'archived');
  const hasBlockedDirtyChanges = dirtyChanges.some(
    (change) => !canChangeLightExtensionWorkspacePath(workspaceScope, change.path),
  );
  const activeFileReadOnly =
    !canWrite ||
    !activePath ||
    Boolean(activeFile && isBinaryWorkspaceFile(activeFile)) ||
    !getLightExtensionWorkspacePathAccess(workspaceScope, activePath, 'file').canWrite;
  const previewSnapshotKey = useMemo(
    () => buildWorkspacePreviewSnapshot(sourceFiles, workspaceScope, repoId, entryId),
    [entryId, repoId, sourceFiles, workspaceScope],
  );
  latestPreviewSnapshotRef.current = previewSnapshotKey;
  const previewHasErrors = problemState.problems.some((problem) => problem.severity === 'error');
  const previewDiffReviewed = diffReviewedSnapshotKey === previewSnapshotKey;
  const agentSaveGateEnabled = Boolean(previewProblemClient && ownerLocator);
  const previewSaveGateReady =
    (previewAgentSession.status === 'active' || previewAgentSession.status === 'completed') &&
    Boolean(previewAgentSession.snapshotId) &&
    previewDiffReviewed &&
    !previewHasErrors;
  const agentSaveBlocked = agentSaveGateEnabled && !previewSaveGateReady;
  const canPreview = entryScoped && Boolean(onPreview);
  const canMoveToInline = entryScoped && Boolean(onMoveToInline);
  const browserPreviewEntry = useMemo(
    () =>
      workspaceScope.mode === 'entry'
        ? {
            entryPath: workspaceScope.entryPath,
            kind: workspaceScope.kind,
            runtimeVersion: 'v2',
            surfaceStyle: getLightExtensionPreviewSurfaceStyle(workspaceScope.kind),
          }
        : undefined,
    [workspaceScope],
  );
  const browserPreviewEnabled = entryScoped && (browserProvisionalPreview ?? isBrowserProvisionalPreviewEnabled());
  const provisionalPreview = useBrowserProvisionalPreview({
    enabled: browserPreviewEnabled,
    files: sourceFiles,
    entry: browserPreviewEntry,
    workspaceSnapshotId: previewSnapshotKey,
  });

  useLayoutEffect(() => {
    problemStore.setSnapshot(previewSnapshotKey);
    return () => {
      previewRequestSequenceRef.current += 1;
      const session = activePreviewSessionRef.current;
      activePreviewSessionRef.current = null;
      session?.close();
      session?.closeRemote('stale').catch(() => undefined);
    };
  }, [previewSnapshotKey, problemStore]);

  useEffect(() => {
    const previousSnapshotKey = previousPreviewSnapshotKeyRef.current;
    previousPreviewSnapshotKeyRef.current = previewSnapshotKey;
    if (!previousSnapshotKey || previousSnapshotKey === previewSnapshotKey) {
      return;
    }
    setPreviewAgentSession((current) =>
      current.status === 'idle' ? current : { ...current, status: 'stale', token: undefined },
    );
  }, [previewSnapshotKey]);

  useEffect(() => {
    if (!provisionalPreview.enabled || provisionalPreview.workspaceSnapshotId !== previewSnapshotKey) {
      return;
    }
    problemStore.replaceProblems({
      producer: 'provisional',
      snapshotId: previewSnapshotKey,
      problems: provisionalPreview.problems,
    });
  }, [previewSnapshotKey, problemStore, provisionalPreview]);

  const openFilePath = useCallback((path?: string) => {
    if (!path) {
      return;
    }

    setActivePath(path);
    setOpenPaths((current) => (current.includes(path) ? current : [...current, path]));
    setIsDiff(false);
  }, []);

  const closeOpenFile = useCallback(
    (path: string) => {
      setOpenPaths((current) => {
        const nextPaths = current.filter((openPath) => openPath !== path);
        if (activePath === path) {
          setActivePath(nextPaths[nextPaths.length - 1] || files.find((file) => file.path !== path)?.path);
        }

        return nextPaths;
      });
    },
    [activePath, files],
  );

  const createWorkspaceFile = (parentPath = LIGHT_EXTENSION_SOURCE_ROOT): string | undefined => {
    if (!canWrite || !getLightExtensionWorkspacePathAccess(workspaceScope, parentPath, 'folder').canCreate) {
      return undefined;
    }

    const nextPath = buildNewFilePath(files, parentPath);
    const nextFiles = mergeFiles(files, [
      {
        path: nextPath,
        content: getDefaultWorkspaceFileContent(nextPath),
        language: inferLightExtensionLanguageFromPath(nextPath),
      },
    ]);
    setFiles(nextFiles);
    setFolders((current) => mergeFolders(current, collectWorkspaceFolders(nextFiles)));
    openFilePath(nextPath);
    return nextPath;
  };

  const createWorkspaceFolder = (parentPath = LIGHT_EXTENSION_SOURCE_ROOT): string | undefined => {
    if (!canWrite || !getLightExtensionWorkspacePathAccess(workspaceScope, parentPath, 'folder').canCreate) {
      return undefined;
    }

    const nextFolder = buildNewFolderPath(files, folders, parentPath);
    setFolders((current) => mergeFolders(current, [nextFolder]));
    return nextFolder;
  };

  const updateActiveFile = (value: string) => {
    if (
      !activePath ||
      !canWrite ||
      !getLightExtensionWorkspacePathAccess(workspaceScope, activePath, 'file').canWrite
    ) {
      return;
    }

    setFiles((current) => current.map((file) => (file.path === activePath ? { ...file, content: value } : file)));
  };

  const updateTypeScriptProblems = useCallback(
    (path: string, diagnostics: CodeEditorDiagnostic[]) => {
      const createProblem = createLightExtensionProblemFactory({
        snapshotId: previewSnapshotKey,
        requestId: `typescript:${previewSnapshotKey}:${path}`,
        source: 'typescript',
        phase: 'typecheck',
      });
      problemStore.replaceProblems({
        producer: `typescript:${path}`,
        snapshotId: previewSnapshotKey,
        problems: diagnostics
          .filter((diagnostic) => diagnostic.severity === 'error' || diagnostic.severity === 'warning')
          .map((diagnostic) =>
            createProblem({
              code: typeof diagnostic.code === 'undefined' ? 'TYPESCRIPT_PROBLEM' : `TS${diagnostic.code}`,
              severity: diagnostic.severity === 'error' ? 'error' : 'warning',
              message: diagnostic.message,
              path,
              range: { start: diagnostic.start, end: diagnostic.end },
            }),
          ),
      });
    },
    [previewSnapshotKey, problemStore],
  );

  const removeFile = (path: string) => {
    if (!canWrite || !getLightExtensionWorkspacePathAccess(workspaceScope, path, 'file').canDelete) {
      return;
    }

    const nextFiles = files.filter((file) => file.path !== path);
    const nextActivePath = resolveActivePath(nextFiles, activePath === path ? undefined : activePath);
    setFiles(nextFiles);
    setFolders((current) => mergeFolders(current, collectWorkspaceFolders(nextFiles)));
    setActivePath(nextActivePath);
    setOpenPaths((current) => {
      const nextPaths = current.filter((openPath) => openPath !== path);
      return nextPaths.length ? nextPaths : nextActivePath ? [nextActivePath] : [];
    });
  };

  const renameFile = (path: string, nextPath: string): boolean => {
    if (!canWrite || !getLightExtensionWorkspacePathAccess(workspaceScope, path, 'file').canRename) {
      return false;
    }

    const normalizedNextPath = normalizeWorkspacePath(nextPath);
    if (!isValidWorkspaceFilePath(normalizedNextPath)) {
      message.error(t('Invalid file path'));
      return false;
    }
    if (!getLightExtensionWorkspacePathAccess(workspaceScope, normalizedNextPath, 'file').canWrite) {
      message.warning(pathRestrictionReason);
      return false;
    }
    if (path !== normalizedNextPath && files.some((file) => file.path === normalizedNextPath)) {
      message.error(t('File already exists'));
      return false;
    }
    if (path === normalizedNextPath) {
      return true;
    }

    const nextFiles = files.map((file) =>
      file.path === path
        ? { ...file, language: inferLightExtensionLanguageFromPath(normalizedNextPath), path: normalizedNextPath }
        : file,
    );
    setFiles(normalizeWorkspaceFiles(nextFiles));
    setFolders((current) => mergeFolders(current, collectWorkspaceFolders(nextFiles)));
    setActivePath((current) => (current === path ? normalizedNextPath : current));
    setOpenPaths((current) =>
      uniqueStrings(current.map((openPath) => (openPath === path ? normalizedNextPath : openPath))),
    );
    return true;
  };

  const renameFolder = (path: string, nextPath: string): boolean => {
    if (!canWrite || !getLightExtensionWorkspacePathAccess(workspaceScope, path, 'folder').canRename) {
      return false;
    }

    const normalizedNextPath = normalizeWorkspacePath(nextPath);
    if (!isValidWorkspaceFolderPath(normalizedNextPath)) {
      message.error(t('Invalid file path'));
      return false;
    }
    if (!getLightExtensionWorkspacePathAccess(workspaceScope, normalizedNextPath, 'folder').canWrite) {
      message.warning(pathRestrictionReason);
      return false;
    }
    if (path === normalizedNextPath) {
      return true;
    }
    if (folders.includes(normalizedNextPath)) {
      message.error(t('Folder already exists'));
      return false;
    }

    const managedEntryRoot = getManagedLightExtensionEntryRoot(path);
    if (managedEntryRoot) {
      const descriptorPath = `${managedEntryRoot.path}/${LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE}`;
      const descriptorFile = files.find((file) => file.path === descriptorPath);
      if (!descriptorFile) {
        message.error(t('Entry descriptor is missing'));
        return false;
      }
      try {
        const descriptor = JSON.parse(descriptorFile.content) as unknown;
        if (
          !isRecord(descriptor) ||
          descriptor.schemaVersion !== LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION ||
          typeof descriptor.key !== 'string' ||
          !LIGHT_EXTENSION_ENTRY_KEY_PATTERN.test(descriptor.key)
        ) {
          message.error(t('Entry descriptor key is invalid'));
          return false;
        }
      } catch {
        message.error(t('Entry descriptor key is invalid'));
        return false;
      }
    }

    const nextFiles = normalizeWorkspaceFiles(
      files.map((file) => ({
        ...file,
        language: inferLightExtensionLanguageFromPath(replacePathPrefix(file.path, path, normalizedNextPath)),
        path: replacePathPrefix(file.path, path, normalizedNextPath),
      })),
    );
    setFiles(nextFiles);
    setFolders((current) =>
      mergeFolders(
        current.map((folder) => replacePathPrefix(folder, path, normalizedNextPath)),
        collectWorkspaceFolders(nextFiles),
      ),
    );
    setActivePath((current) => (current ? replacePathPrefix(current, path, normalizedNextPath) : current));
    setOpenPaths((current) =>
      uniqueStrings(current.map((openPath) => replacePathPrefix(openPath, path, normalizedNextPath))),
    );
    return true;
  };

  const deleteFolder = (path: string): boolean => {
    if (!canWrite || !getLightExtensionWorkspacePathAccess(workspaceScope, path, 'folder').canDelete) {
      return false;
    }
    if (
      files.some((file) => isPathInsideFolder(file.path, path)) ||
      folders.some((folder) => folder !== path && isPathInsideFolder(folder, path))
    ) {
      message.error(t('Folder is not empty'));
      return false;
    }

    setFolders((current) => current.filter((folder) => folder !== path));
    return true;
  };

  const moveFileToFolder = (path: string, folderPath: string) => {
    const fileName = getBaseName(path);
    if (!fileName) {
      return;
    }
    renameFile(path, `${folderPath}/${fileName}`);
  };

  const moveFolderToFolder = (path: string, folderPath: string) => {
    const folderName = getBaseName(path);
    if (!folderName || path === folderPath || folderPath.startsWith(`${path}/`)) {
      return;
    }
    renameFolder(path, `${folderPath}/${folderName}`);
  };

  const refreshHistory = async () => {
    if (!repoId) {
      return;
    }

    const requestSeq = historyRequestSeqRef.current + 1;
    historyRequestSeqRef.current = requestSeq;
    setHistoryLoadingMore(false);
    setHistoryLoading(true);
    try {
      const commits = await listCommits({ repoId, limit: HISTORY_PAGE_SIZE });
      if (historyRequestSeqRef.current !== requestSeq) {
        return;
      }
      setHistoryItems(toRunJSHistoryItems(commits));
      setHistoryNextBeforeSeq(getNextHistoryCursor(commits, HISTORY_PAGE_SIZE));
    } catch (error) {
      if (historyRequestSeqRef.current === requestSeq) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load history') });
      }
    } finally {
      if (historyRequestSeqRef.current === requestSeq) {
        setHistoryLoading(false);
      }
    }
  };

  const loadMoreHistory = async () => {
    if (!repoId || historyNextBeforeSeq === null) {
      return;
    }

    const requestSeq = historyRequestSeqRef.current + 1;
    historyRequestSeqRef.current = requestSeq;
    const beforeSeq = historyNextBeforeSeq;
    setHistoryLoadingMore(true);
    try {
      const commits = await listCommits({
        repoId,
        limit: HISTORY_PAGE_SIZE,
        beforeSeq,
      });
      if (historyRequestSeqRef.current !== requestSeq) {
        return;
      }
      const nextItems = toRunJSHistoryItems(commits);
      setHistoryItems((current) => mergeHistoryItems(current, nextItems));
      setHistoryNextBeforeSeq(getNextHistoryCursor(commits, HISTORY_PAGE_SIZE));
    } catch (error) {
      if (historyRequestSeqRef.current === requestSeq) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load history') });
      }
    } finally {
      if (historyRequestSeqRef.current === requestSeq) {
        setHistoryLoadingMore(false);
      }
    }
  };

  const loadVersionIntoEditor = async (commit: RunJSSourceHistoryItem) => {
    if (!repoId || !canWrite) {
      return;
    }

    setRestoringVersion(true);
    try {
      const pullResult = await pullCommit({ repoId, commitId: commit.id, includeContent: 'all' });
      const restoredFiles = normalizeWorkspaceFiles(pullResult.files || []);
      const nextFiles = restoreWorkspaceFiles(files, restoredFiles, workspaceScope);
      const nextActivePath = resolveActivePath(nextFiles, activePath);
      setFiles(nextFiles);
      setFolders(collectWorkspaceFolders(nextFiles));
      setActivePath(nextActivePath);
      setOpenPaths(nextActivePath ? [nextActivePath] : []);
      setIsDiff(false);
      setNotice({ type: 'info', message: `${t('Restored from')} v${commit.seq}` });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to restore version') });
    } finally {
      setRestoringVersion(false);
    }
  };

  const confirmLoadVersion = async () => {
    if (!restoreCommit) {
      return;
    }

    const commit = restoreCommit;
    setRestoreCommit(null);
    await loadVersionIntoEditor(commit);
  };

  const closeActivePreviewSession = useCallback(
    async (state: 'completed' | 'stale'): Promise<RunJSHostPreviewSourceRef | undefined> => {
      const session = activePreviewSessionRef.current;
      activePreviewSessionRef.current = null;
      session?.close();
      await session?.closeRemote(state).catch(() => undefined);
      if (session) {
        setPreviewAgentSession((current) => ({
          ...current,
          status: state,
          token: state === 'completed' ? current.token : undefined,
        }));
      }
      return session?.sourceRef;
    },
    [],
  );

  const reportPreviewRestoreFailure = useCallback(
    (error: unknown, sourceRef?: RunJSHostPreviewSourceRef) => {
      const snapshotId = sourceRef?.snapshotId || previewSnapshotKey;
      const createProblem = createLightExtensionProblemFactory({
        snapshotId,
        requestId: sourceRef?.executionId || `host-preview-restore:${Date.now()}`,
        source: 'host-runtime',
        phase: 'infrastructure',
      });
      problemStore.appendProblems({
        producer: 'host-preview',
        snapshotId,
        problems: [
          createProblem({
            code: 'host_preview_restore_failed',
            severity: 'error',
            message: t('Failed to restore the saved host version.'),
            path: workspaceScope.mode === 'entry' ? workspaceScope.entryPath : undefined,
            kind: workspaceScope.mode === 'entry' ? workspaceScope.kind : undefined,
            fixHint: t('Keep the editor open, retry Cancel, or reload the page to restore the saved version.'),
            details: {
              previewSessionId: sourceRef?.previewSessionId,
              executionId: sourceRef?.executionId,
              artifactHash: sourceRef?.artifactHash,
              error: error instanceof Error ? error.message : String(error),
            },
          }),
        ],
      });
      setNotice({
        type: 'error',
        message: t('The saved host version could not be restored. Retry Cancel or reload the page.'),
      });
    },
    [previewSnapshotKey, problemStore, t, workspaceScope],
  );

  const saveChanges = useCallback(async () => {
    const commitMessage = versionMessage.trim();
    if (agentSaveBlocked) {
      setSaveOpen(false);
      const request = embeddedSaveRequestRef.current;
      embeddedSaveRequestRef.current = null;
      embeddedSavePromiseRef.current = null;
      request?.resolve('cancelled');
      setNotice({
        type: 'warning',
        message: t(
          'Run Host Preview, review the current Diff, and resolve Preview errors before saving this Agent-managed workspace.',
        ),
      });
      return;
    }
    if (!repoId || !commitMessage || dirtyChanges.length === 0 || hasBlockedDirtyChanges) {
      if (hasBlockedDirtyChanges) {
        setNotice({ type: 'warning', message: pathRestrictionReason });
      }
      return;
    }

    setSaveOpen(false);
    setSaving(true);
    setNotice(null);
    const requestSnapshotId = previewSnapshotKey;
    try {
      const result = await saveSource({
        repoId,
        expectedHeadCommitId: baseHeadCommitId,
        message: commitMessage,
        files: dirtyChanges,
      });
      problemStore.replaceProblems({ producer: 'canonical', snapshotId: requestSnapshotId, problems: result.problems });
      setBaseHeadCommitId(result.commit.id);
      setBaseFiles(filesForSave);
      await onSaved?.();
      await loadBindingContext();
      if (onRequestClose) {
        previewRequestSequenceRef.current += 1;
        const sourceRef = await closeActivePreviewSession('completed');
        try {
          await onRequestClose();
        } catch (error) {
          reportPreviewRestoreFailure(error, sourceRef);
          const request = embeddedSaveRequestRef.current;
          embeddedSaveRequestRef.current = null;
          embeddedSavePromiseRef.current = null;
          request?.reject(error);
          return;
        }
      } else {
        await loadWorkspace();
      }
      const request = embeddedSaveRequestRef.current;
      embeddedSaveRequestRef.current = null;
      embeddedSavePromiseRef.current = null;
      request?.resolve('saved');
    } catch (error) {
      const request = embeddedSaveRequestRef.current;
      embeddedSaveRequestRef.current = null;
      embeddedSavePromiseRef.current = null;
      request?.reject(error);
      problemStore.replaceProblems({
        producer: 'canonical',
        snapshotId: requestSnapshotId,
        problems: getLightExtensionErrorProblems(error) as LightExtensionProblem[],
      });
      setNotice({
        type: 'error',
        message:
          error instanceof LightExtensionHookError && error.code === 'LIGHT_EXTENSION_SOURCE_OUTDATED'
            ? t('Source changed remotely. Refresh the latest source and reapply your changes.')
            : error instanceof Error
              ? error.message
              : t('Failed to save source'),
      });
    } finally {
      setSaving(false);
    }
  }, [
    agentSaveBlocked,
    baseHeadCommitId,
    closeActivePreviewSession,
    dirtyChanges,
    filesForSave,
    hasBlockedDirtyChanges,
    loadWorkspace,
    loadBindingContext,
    onSaved,
    onRequestClose,
    pathRestrictionReason,
    previewSnapshotKey,
    problemStore,
    reportPreviewRestoreFailure,
    repoId,
    saveSource,
    t,
    versionMessage,
  ]);

  const openSaveModal = useCallback((): boolean => {
    if (agentSaveBlocked) {
      setNotice({
        type: 'warning',
        message: t(
          'Run Host Preview, review the current Diff, and resolve Preview errors before saving this Agent-managed workspace.',
        ),
      });
      return false;
    }
    if (!canWrite || !hasUnsavedLocalChanges || hasBlockedDirtyChanges) {
      return false;
    }

    setVersionMessage('');
    setSaveOpen(true);
    return true;
  }, [agentSaveBlocked, canWrite, hasBlockedDirtyChanges, hasUnsavedLocalChanges, t]);

  const requestSave = useCallback(async (): Promise<EmbeddedRunJSEditorSaveResult> => {
    if (!hasUnsavedLocalChanges) {
      return 'unchanged';
    }
    if (embeddedSavePromiseRef.current) {
      return embeddedSavePromiseRef.current;
    }

    const promise = new Promise<EmbeddedRunJSEditorSaveResult>((resolve, reject) => {
      embeddedSaveRequestRef.current = { resolve, reject };
    });
    embeddedSavePromiseRef.current = promise;
    if (!openSaveModal()) {
      embeddedSaveRequestRef.current = null;
      embeddedSavePromiseRef.current = null;
      return 'cancelled';
    }
    return promise;
  }, [hasUnsavedLocalChanges, openSaveModal]);

  const requestClose = useCallback(async () => {
    if (hasUnsavedLocalChanges) {
      setCloseConfirmOpen(true);
      return;
    }

    previewRequestSequenceRef.current += 1;
    const sourceRef = await closeActivePreviewSession('completed');
    try {
      await onRequestClose?.();
    } catch (error) {
      reportPreviewRestoreFailure(error, sourceRef);
    }
  }, [closeActivePreviewSession, hasUnsavedLocalChanges, onRequestClose, reportPreviewRestoreFailure]);

  const discardLocalAndClose = useCallback(async () => {
    setCloseConfirmOpen(false);
    previewRequestSequenceRef.current += 1;
    const sourceRef = await closeActivePreviewSession('completed');
    try {
      await onRequestClose?.();
    } catch (error) {
      reportPreviewRestoreFailure(error, sourceRef);
    }
  }, [closeActivePreviewSession, onRequestClose, reportPreviewRestoreFailure]);

  const footerActions = useMemo<LightExtensionWorkspaceFooterActions>(
    () => ({
      dirty: hasUnsavedLocalChanges,
      disabled: !canWrite || loading || !hasUnsavedLocalChanges || hasBlockedDirtyChanges || agentSaveBlocked,
      loading: saving,
      onCancel: requestClose,
      onSave: openSaveModal,
      requestSave,
    }),
    [
      agentSaveBlocked,
      canWrite,
      hasBlockedDirtyChanges,
      hasUnsavedLocalChanges,
      loading,
      openSaveModal,
      requestClose,
      requestSave,
      saving,
    ],
  );

  useEffect(() => {
    onFooterActionsChange?.(footerActions);
  }, [footerActions, onFooterActionsChange]);

  useEffect(() => {
    return () => {
      onFooterActionsChange?.(null);
      const request = embeddedSaveRequestRef.current;
      embeddedSaveRequestRef.current = null;
      embeddedSavePromiseRef.current = null;
      request?.resolve('cancelled');
    };
  }, [onFooterActionsChange]);

  const openProblemSource = useCallback(
    (problem: LightExtensionProblem) => {
      if (!problem.path || !problem.range?.start) {
        return;
      }
      const sourceFile = files.find((file) => file.path === problem.path);
      if (!sourceFile) {
        setNotice({ type: 'warning', message: t('Problem source is not loaded') });
        return;
      }
      if (!canChangeLightExtensionWorkspacePath(workspaceScope, problem.path)) {
        setNotice({ type: 'warning', message: t('Problem source is outside the current entry scope') });
        return;
      }
      if (isBinaryWorkspaceFile(sourceFile)) {
        setNotice({ type: 'warning', message: t('Problem source is a binary file') });
        return;
      }

      openFilePath(problem.path);
      revealRequestSequenceRef.current += 1;
      setRevealTarget({
        path: problem.path,
        line: problem.range.start.line,
        column: problem.range.start.column,
        requestId: `problem-reveal:${revealRequestSequenceRef.current}`,
      });
      setNotice({ type: 'info', message: t('Opened problem source') });
    },
    [files, openFilePath, t, workspaceScope],
  );

  const runPreview = useCallback(async () => {
    if (!canPreview || workspaceScope.mode !== 'entry' || !onPreview) {
      return;
    }

    const requestSnapshotKey = previewSnapshotKey;
    const previousSession = activePreviewSessionRef.current;
    activePreviewSessionRef.current = null;
    previousSession?.close();
    previousSession?.closeRemote('stale').catch(() => undefined);
    if (previousSession) {
      setPreviewAgentSession((current) => ({ ...current, status: 'stale', token: undefined }));
    }
    const requestSequence = previewRequestSequenceRef.current + 1;
    previewRequestSequenceRef.current = requestSequence;
    problemStore.replaceProblems({ producer: 'host-preview', snapshotId: requestSnapshotKey, problems: [] });
    setPreviewing(true);
    setNotice(null);
    let session: ActiveHostPreviewSession | null = null;
    let remoteSession: ActiveLightExtensionPreviewProblemSession | undefined;
    try {
      const result = await compileWorkspacePreview({
        repoId,
        expectedHeadCommitId: baseHeadCommitId,
        entryId,
        kind: workspaceScope.kind,
        entryPath: workspaceScope.entryPath,
        runtimeVersion: 'v2',
        files: sourceFiles.map((file) => ({
          path: file.path,
          content: file.content,
          language: file.language,
          mode: file.mode,
        })),
      });
      if (previewRequestSequenceRef.current !== requestSequence) {
        return;
      }
      if (latestPreviewSnapshotRef.current !== requestSnapshotKey) {
        setNotice({ type: 'info', message: t('Source changed while preview was compiling. Run again.') });
        return;
      }

      problemStore.replaceProblems({
        producer: 'canonical',
        snapshotId: requestSnapshotKey,
        problems: result.problems,
      });
      if (!result.accepted || !result.artifact) {
        setPreviewAgentSession({ status: 'idle', snapshotId: result.snapshotId });
        setNotice({ type: 'error', message: t('Preview failed') });
        return;
      }

      const artifact = result.artifact;
      const sourceMap = artifact.sourceMap;
      if (!sourceMap || !parseRunJSLineMapV1(sourceMap)) {
        throw new Error(t('Preview artifact is missing a valid source map.'));
      }

      remoteSession =
        previewProblemClient && ownerLocator
          ? await openLightExtensionPreviewProblemSession(previewProblemClient, {
              repoId,
              entryId: entryId || '',
              ownerLocator,
              snapshotId: result.snapshotId,
              artifactHash: artifact.artifactHash,
            })
          : undefined;
      if (
        previewRequestSequenceRef.current !== requestSequence ||
        latestPreviewSnapshotRef.current !== requestSnapshotKey
      ) {
        await remoteSession?.close('stale').catch(() => undefined);
        return;
      }
      const previewSessionToken =
        remoteSession && activeBindingContextPack
          ? encodeLightExtensionPreviewSessionDescriptor({
              schemaVersion: 1,
              sessionId: remoteSession.result.sessionId,
              repoId,
              entryId: entryId || '',
              ownerLocator: ownerLocator || {},
              snapshotId: remoteSession.result.snapshotId,
              contextHash: activeBindingContextPack.contextHash,
              artifactHash: remoteSession.result.artifactHash,
              executionId: remoteSession.result.executionId,
            })
          : undefined;
      setPreviewAgentSession({
        status: remoteSession ? 'active' : 'idle',
        snapshotId: result.snapshotId,
        sessionId: remoteSession?.result.sessionId,
        token: previewSessionToken,
      });
      const hostSession = createRunJSHostPreviewSession({
        ...(remoteSession
          ? {
              previewSessionId: remoteSession.result.sessionId,
              executionId: remoteSession.result.executionId,
            }
          : {}),
        artifactHash: artifact.artifactHash,
        snapshotId: requestSnapshotKey,
        sourceMap,
        metadata: {
          repoId,
          entryId: entryId || '',
          kind: workspaceScope.kind,
          entryPath: workspaceScope.entryPath,
          ...(ownerLocatorSignature !== 'null' ? { ownerLocator: ownerLocatorSignature } : {}),
        },
        reporter: {
          async report(event) {
            if (
              !session ||
              activePreviewSessionRef.current !== session ||
              latestPreviewSnapshotRef.current !== requestSnapshotKey ||
              event.identity.executionId !== session.sourceRef.executionId ||
              event.identity.artifactHash !== session.sourceRef.artifactHash ||
              event.identity.sourceURL !== session.sourceRef.sourceURL
            ) {
              return;
            }
            const problem = createHostPreviewRuntimeProblem(event, session.sourceRef, workspaceScope);
            problemStore.appendProblems({
              producer: 'host-preview',
              snapshotId: requestSnapshotKey,
              problems: [problem],
            });
            await session.remote?.append([problem]).catch(() => undefined);
          },
        },
        apiFailureReporter: {
          async report(event) {
            if (
              !session ||
              activePreviewSessionRef.current !== session ||
              latestPreviewSnapshotRef.current !== requestSnapshotKey ||
              event.identity.executionId !== session.sourceRef.executionId ||
              event.identity.artifactHash !== session.sourceRef.artifactHash ||
              event.identity.sourceURL !== session.sourceRef.sourceURL
            ) {
              return;
            }
            const problem = createHostPreviewApiProblem(event, session.sourceRef, workspaceScope, t);
            problemStore.appendProblems({
              producer: 'host-preview',
              snapshotId: requestSnapshotKey,
              problems: [problem],
            });
            await session.remote?.append([problem]).catch(() => undefined);
          },
        },
      });
      session = {
        ...hostSession,
        remote: remoteSession,
        async closeRemote(state) {
          await remoteSession?.close(state).then(() => undefined);
        },
      };
      activePreviewSessionRef.current = session;
      await onPreview({
        artifact,
        requestId: result.requestId,
        snapshotId: requestSnapshotKey,
        sourceRef: session.sourceRef,
      });
    } catch (error) {
      if (session) {
        if (activePreviewSessionRef.current === session) {
          activePreviewSessionRef.current = null;
        }
        session.close();
        await session.closeRemote('stale').catch(() => undefined);
      } else {
        await remoteSession?.close('stale').catch(() => undefined);
      }
      setPreviewAgentSession((current) => ({ ...current, status: 'stale', token: undefined }));
      if (
        previewRequestSequenceRef.current !== requestSequence ||
        latestPreviewSnapshotRef.current !== requestSnapshotKey
      ) {
        return;
      }
      problemStore.replaceProblems({
        producer: 'canonical',
        snapshotId: requestSnapshotKey,
        problems: getLightExtensionErrorProblems(error) as LightExtensionProblem[],
      });
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Preview failed') });
    } finally {
      if (previewRequestSequenceRef.current === requestSequence) {
        setPreviewing(false);
      }
    }
  }, [
    canPreview,
    baseHeadCommitId,
    compileWorkspacePreview,
    entryId,
    activeBindingContextPack,
    onPreview,
    ownerLocatorSignature,
    ownerLocator,
    previewProblemClient,
    previewSnapshotKey,
    problemStore,
    repoId,
    sourceFiles,
    t,
    workspaceScope,
  ]);

  const moveToInline = useCallback(async () => {
    if (!canMoveToInline || workspaceScope.mode !== 'entry' || !onMoveToInline) {
      return;
    }

    setMovingToInline(true);
    setNotice(null);
    try {
      await onMoveToInline({
        entryPath: workspaceScope.entryPath,
        files: sourceFiles.map((file) => ({ ...file })),
        version: 'v2',
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : t('Failed to move source to inline code'),
      });
      throw error;
    } finally {
      setMovingToInline(false);
    }
  }, [canMoveToInline, onMoveToInline, sourceFiles, t, workspaceScope]);

  const downloadBinaryFile = useCallback(
    (file: WorkspaceFile) => {
      try {
        const downloaded = downloadLightExtensionWorkspaceArchive(
          new Blob([decodeBase64(file.content)], { type: 'application/octet-stream' }),
          getBaseName(file.path),
        );
        if (!downloaded) {
          throw new Error(t('Failed to download file'));
        }
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to download file') });
      }
    },
    [t],
  );

  const confirmMoveToInline = useCallback(() => {
    Modal.confirm({
      title: t('Move to inline code?'),
      content: t(
        'The current working copy of this entry and its referenced files will be copied to inline code. The light extension will remain unchanged.',
      ),
      okText: t('Move to inline code'),
      cancelText: t('Cancel'),
      onOk: moveToInline,
    });
  }, [moveToInline, t]);

  const exportWorkspace = useCallback(async () => {
    if (!repo || exporting || importing) {
      return;
    }

    setExporting(true);
    setNotice(null);
    try {
      const archiveFiles =
        workspaceScope.mode === 'repository'
          ? files
          : files.filter((file) => canChangeLightExtensionWorkspacePath(workspaceScope, file.path));
      const archive = await createLightExtensionWorkspaceArchive(archiveFiles);
      const downloaded = downloadLightExtensionWorkspaceArchive(
        archive,
        buildLightExtensionWorkspaceArchiveFileName(repo.name || repo.title || repo.id),
      );
      if (!downloaded) {
        throw new Error(t('Failed to start ZIP download'));
      }
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to export ZIP') });
    } finally {
      setExporting(false);
    }
  }, [exporting, files, importing, repo, t, workspaceScope]);

  const requestImportWorkspace = useCallback(() => {
    if (!canWrite || importing || exporting) {
      return;
    }

    if (!hasUnsavedLocalChanges) {
      importInputRef.current?.click();
      return;
    }

    Modal.confirm({
      cancelText: t('Cancel'),
      content: (
        <Space direction="vertical" size={4}>
          <Typography.Text>{t('Importing will replace editable files in the current workspace.')}</Typography.Text>
          <Typography.Text>{t('Unsaved editor changes in this scope will be discarded.')}</Typography.Text>
        </Space>
      ),
      okText: t('Import'),
      onOk: () => importInputRef.current?.click(),
      title: t('Import workspace'),
    });
  }, [canWrite, exporting, hasUnsavedLocalChanges, importing, t]);

  const importWorkspaceFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const archive = event.target.files?.[0];
      event.target.value = '';
      if (!archive || !repoId || !canWrite || importing) {
        return;
      }

      setImporting(true);
      setNotice(null);
      try {
        const zipBase64 = await readLightExtensionWorkspaceArchive(archive, t('Failed to read source ZIP'));
        const result = await inspectSourceArchive({ repoId, zipBase64 });
        const importedFiles = normalizeWorkspaceFiles(result.files || []);
        if (workspaceScope.mode === 'entry') {
          const readOnlyPath = importedFiles.find(
            (file) => !canChangeLightExtensionWorkspacePath(workspaceScope, file.path),
          );
          if (readOnlyPath) {
            throw new Error(t('ZIP contains files that are read-only in this editor'));
          }
          if (!importedFiles.some((file) => file.path === workspaceScope.entryPath)) {
            throw new Error(t('ZIP does not contain the current entry file'));
          }
        }

        const nextFiles = restoreWorkspaceFiles(files, importedFiles, workspaceScope);
        const nextActivePath = resolveActivePath(
          nextFiles,
          workspaceScope.mode === 'entry' ? workspaceScope.entryPath : activePath,
        );
        setFiles(nextFiles);
        setFolders(collectWorkspaceFolders(nextFiles));
        setActivePath(nextActivePath);
        setOpenPaths(nextActivePath ? [nextActivePath] : []);
        problemStore.clear();
        setIsDiff(false);
        message.success(t('ZIP imported. Save to create a new version.'));
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to import ZIP') });
      } finally {
        setImporting(false);
      }
    },
    [activePath, canWrite, files, importing, inspectSourceArchive, problemStore, repoId, t, workspaceScope],
  );

  if (!repoId) {
    return (
      <Flex vertical gap={16} style={{ padding: embedded ? 0 : 24 }}>
        {!embedded ? (
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('Source workspace')}
          </Typography.Title>
        ) : null}
        <Empty description={t('Select a repository from the light extension list')} />
      </Flex>
    );
  }

  if (initializedRepoId !== repoId) {
    return (
      <Flex
        align="center"
        aria-live="polite"
        gap={12}
        justify="center"
        role="status"
        style={{
          flex: embedded ? '1 1 0' : undefined,
          height: embedded ? '100%' : 520,
          minHeight: embedded ? 320 : 520,
          padding: 24,
        }}
        vertical
      >
        <Spin size="large" />
        <Typography.Text>{t('Loading source')}</Typography.Text>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16} style={{ height: embedded ? '100%' : undefined, minHeight: 0, padding: embedded ? 0 : 24 }}>
      {!embedded ? (
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <Space direction="vertical" size={0}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {repo?.title || repo?.name || t('Source workspace')}
            </Typography.Title>
            <Typography.Text type="secondary">{repoId}</Typography.Text>
          </Space>
          <Space wrap>
            <Button
              disabled={footerActions.disabled}
              icon={<SaveOutlined />}
              loading={footerActions.loading}
              onClick={footerActions.onSave}
              type="primary"
            >
              {t('Save')}
            </Button>
          </Space>
        </Flex>
      ) : null}

      {notice ? (
        <Alert closable message={notice.message} onClose={() => setNotice(null)} showIcon type={notice.type} />
      ) : null}

      {loading ? (
        <div aria-live="polite" role="status" style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>{t('Loading source')}</Typography.Text>
        </div>
      ) : null}

      <div
        ref={workspaceFullscreen.placeholderRef}
        style={workspaceFullscreen.isFullscreen ? workspaceFullscreen.placeholderStyle : { display: 'contents' }}
      />
      {workspaceFullscreen.container
        ? createPortal(
            <div
              data-testid="light-extension-runjs-studio-workspace"
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                display: 'flex',
                flex: embedded || workspaceFullscreen.isFullscreen ? '1 1 0' : undefined,
                flexDirection: 'column',
                height: workspaceFullscreen.isFullscreen ? '100%' : undefined,
                minHeight: embedded || workspaceFullscreen.isFullscreen ? 0 : 520,
                minWidth: 0,
                overflow: 'hidden',
                width: workspaceFullscreen.isFullscreen ? '100%' : undefined,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  flex: '1 1 0',
                  gridTemplateColumns: filesCollapsed ? 'minmax(0, 1fr)' : 'minmax(220px, 260px) minmax(0, 1fr)',
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                {!filesCollapsed ? (
                  <div
                    style={{
                      background: token.colorFillAlter,
                      borderRight: `1px solid ${token.colorBorderSecondary}`,
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <FilesPanel
                      activePath={activePath}
                      collapsed={filesCollapsed}
                      defaultCreateParentPath={entryScoped ? entryRoot || LIGHT_EXTENSION_SOURCE_ROOT : undefined}
                      exporting={exporting}
                      files={files}
                      fillAvailableHeight={historyCollapsed}
                      folders={folders}
                      getPathAccess={resolveWorkspacePathAccess}
                      importing={importing}
                      onCollapseChange={setFilesCollapsed}
                      onCreate={createWorkspaceFile}
                      onCreateFolder={createWorkspaceFolder}
                      onDelete={removeFile}
                      onDeleteFolder={deleteFolder}
                      onExportWorkspace={exportWorkspace}
                      onImportWorkspace={requestImportWorkspace}
                      onMoveFile={moveFileToFolder}
                      onMoveFolder={moveFolderToFolder}
                      onOpen={openFilePath}
                      onRefresh={loadWorkspace}
                      onRename={renameFile}
                      onRenameFolder={renameFolder}
                      readOnly={!canWrite || importing}
                      savedFiles={baseFiles}
                      t={studioT}
                    />
                    <VersionHistoryDock
                      baseVersion={formatHistoryVersion(baseCommitSeq)}
                      collapsed={historyCollapsed}
                      emptyHistoryDescription={t('No source versions yet')}
                      hasMore={historyNextBeforeSeq !== null}
                      hasUnsavedLocalChanges={hasUnsavedLocalChanges}
                      historyItems={historyItems}
                      loading={historyLoading}
                      loadingMore={historyLoadingMore}
                      onCollapsedChange={setHistoryCollapsed}
                      onLoadMore={loadMoreHistory}
                      onRefresh={refreshHistory}
                      onSelect={setRestoreCommit}
                      onViewChanges={() => setIsDiff(true)}
                      t={studioT}
                    />
                  </div>
                ) : null}

                <main
                  style={{
                    display: 'flex',
                    flex: '1 1 0',
                    flexDirection: 'column',
                    minHeight: 0,
                    minWidth: 0,
                    overflow: 'hidden',
                    padding: 12,
                  }}
                >
                  {files.length === 0 ? (
                    <Empty description={t('Empty repository')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : null}
                  {files.length > 0 ? (
                    <>
                      {canPreview ? (
                        <Alert
                          message={t(
                            'Host Preview runs this code in the current application and may create side effects.',
                          )}
                          description={t('Use a test application or a restricted role before clicking Run.')}
                          showIcon
                          style={{ marginBottom: 8 }}
                          type="warning"
                        />
                      ) : null}
                      {canPreview ? (
                        <Alert
                          data-testid="light-extension-agent-loop-status"
                          description={
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Flex align="center" gap={8} wrap="wrap">
                                <Typography.Text>{t('Agent snapshot')}:</Typography.Text>
                                <Typography.Text code>
                                  {previewAgentSession.snapshotId || t('Awaiting authoritative Preview check')}
                                </Typography.Text>
                              </Flex>
                              <Flex align="center" gap={8} wrap="wrap">
                                <Typography.Text>{t('Preview session')}:</Typography.Text>
                                <Tag>{t(`Preview session status: ${previewAgentSession.status}`)}</Tag>
                                {previewAgentSession.sessionId ? (
                                  <Typography.Text code>{previewAgentSession.sessionId}</Typography.Text>
                                ) : null}
                              </Flex>
                              {previewAgentSession.token ? (
                                <Typography.Paragraph
                                  copyable={{ text: previewAgentSession.token }}
                                  ellipsis={{ rows: 1 }}
                                  style={{ margin: 0 }}
                                >
                                  {previewAgentSession.token}
                                </Typography.Paragraph>
                              ) : (
                                <Typography.Text type="secondary">
                                  {t('Run Host Preview to create a copyable Agent session token.')}
                                </Typography.Text>
                              )}
                              <Flex align="center" gap={8} wrap="wrap">
                                <Typography.Text>{t('Diff review')}:</Typography.Text>
                                <Tag color={previewDiffReviewed ? 'success' : 'default'}>
                                  {previewDiffReviewed ? t('Reviewed') : t('Review required')}
                                </Tag>
                                <Typography.Text>{t('Agent save gate')}:</Typography.Text>
                                <Tag color={previewSaveGateReady ? 'success' : 'warning'}>
                                  {previewSaveGateReady ? t('Ready') : t('Locked')}
                                </Tag>
                              </Flex>
                            </Space>
                          }
                          message={t('Agent loop status')}
                          showIcon
                          style={{ marginBottom: 8 }}
                          type={previewSaveGateReady ? 'success' : 'info'}
                        />
                      ) : null}
                      {activeFileReadOnly && entryScoped && !isBinaryWorkspaceFile(activeFile) ? (
                        <Alert message={pathRestrictionReason} showIcon style={{ marginBottom: 8 }} type="info" />
                      ) : null}
                      {showGenericContextHint ? (
                        <Alert
                          message={
                            bindingContextStatus === 'error'
                              ? t('Binding context types could not be loaded. Generic types are active.')
                              : t('No binding is selected. Generic context types are active.')
                          }
                          showIcon
                          style={{ marginBottom: 8 }}
                          type="info"
                        />
                      ) : null}
                      {provisionalPreview.enabled ? (
                        <Alert
                          aria-live="polite"
                          message={getProvisionalPreviewStatusMessage(provisionalPreview.status, t)}
                          showIcon
                          style={{ marginBottom: 8 }}
                          type={
                            provisionalPreview.status === 'degraded'
                              ? 'warning'
                              : provisionalPreview.status === 'problem'
                                ? 'info'
                                : provisionalPreview.status === 'ready'
                                  ? 'success'
                                  : 'info'
                          }
                        />
                      ) : null}
                      {activeFile && isBinaryWorkspaceFile(activeFile) ? (
                        <BinaryFileView file={activeFile} onDownload={downloadBinaryFile} t={t} />
                      ) : (
                        <CodeTab
                          activeFile={activeFile}
                          activePath={activePath}
                          diffRows={diffRows}
                          emptyDiffDescription={t('No changes between current editor and saved source')}
                          filesCollapsed={filesCollapsed}
                          fullscreenControl={{
                            isFullscreen: workspaceFullscreen.isFullscreen,
                            toggleFullscreen: workspaceFullscreen.toggleFullscreen,
                          }}
                          isDiff={isDiff}
                          jsonSchemaResolver={resolveLightExtensionWorkspaceJsonSchema}
                          onChange={updateActiveFile}
                          onCloseFile={closeOpenFile}
                          onDiffToggle={() =>
                            setIsDiff((current) => {
                              const next = !current;
                              if (next) {
                                setDiffReviewedSnapshotKey(previewSnapshotKey);
                              }
                              return next;
                            })
                          }
                          onFilesCollapsedChange={setFilesCollapsed}
                          onOpenFile={openFilePath}
                          onRunPreview={canPreview ? runPreview : undefined}
                          onDiagnosticsChange={updateTypeScriptProblems}
                          openPaths={openPaths}
                          previewing={previewing}
                          readOnly={activeFileReadOnly}
                          revealTarget={revealTarget}
                          runJSGlobalContextType={activeEntryContext.globalContextType}
                          savedFiles={baseFiles}
                          showRunButton={canPreview}
                          t={studioT}
                          toolbarActions={
                            canMoveToInline ? (
                              <Tooltip title={t('Move to inline code')}>
                                <Button
                                  aria-label={t('Move to inline code')}
                                  disabled={isDiff}
                                  icon={<ImportOutlined />}
                                  loading={movingToInline}
                                  onClick={confirmMoveToInline}
                                  size="small"
                                />
                              </Tooltip>
                            ) : null
                          }
                          version="v2"
                          workspaceFiles={authoringFiles}
                        />
                      )}
                    </>
                  ) : null}
                </main>
              </div>
              <div
                data-testid="light-extension-workspace-problems"
                style={{
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  flex: '0 0 auto',
                  maxHeight: workspaceFullscreen.isFullscreen ? '32%' : 160,
                  minHeight: 96,
                  overflowX: 'hidden',
                  overflowY:
                    problemState.problems.length > 0 || problemState.staleProblems.length > 0 ? 'auto' : 'hidden',
                  padding: 12,
                }}
              >
                <ProblemsPanel
                  problems={problemState.problems}
                  staleProblems={problemState.staleProblems}
                  onOpenProblem={openProblemSource}
                />
              </div>
            </div>,
            workspaceFullscreen.container,
          )
        : null}

      <RestoreVersionModal
        commit={restoreCommit}
        loading={restoringVersion}
        onCancel={() => setRestoreCommit(null)}
        onRestore={confirmLoadVersion}
        scopeDescription={
          entryScoped
            ? t('Only editable files in this workspace will be restored. Read-only files will remain unchanged.')
            : undefined
        }
        t={studioT}
      />

      <input
        accept=".zip,application/zip,application/x-zip-compressed"
        aria-label={t('Import workspace')}
        onChange={importWorkspaceFile}
        ref={importInputRef}
        style={{ display: 'none' }}
        type="file"
      />

      <SaveVersionModal
        loading={false}
        onAfterClose={() => undefined}
        onCancel={() => {
          setSaveOpen(false);
          const request = embeddedSaveRequestRef.current;
          embeddedSaveRequestRef.current = null;
          embeddedSavePromiseRef.current = null;
          request?.resolve('cancelled');
        }}
        onSave={saveChanges}
        onVersionMessageChange={setVersionMessage}
        open={saveOpen}
        readOnly={!canWrite || hasBlockedDirtyChanges}
        summary={saveSummary}
        t={studioT}
        versionMessage={versionMessage}
      />

      <Modal
        closable={false}
        footer={null}
        keyboard={false}
        maskClosable={false}
        open={saving}
        title={t('Saving changes')}
      >
        <Flex align="center" gap={12}>
          <Spin />
          <Space direction="vertical" size={0}>
            <Typography.Text>{t('Saving source files')}</Typography.Text>
            <Typography.Text type="secondary">{t('Compiling light extension')}</Typography.Text>
          </Space>
        </Flex>
      </Modal>

      <CloseConfirmModal
        intent="close"
        onCancel={() => setCloseConfirmOpen(false)}
        onCloseWithoutSaving={discardLocalAndClose}
        open={closeConfirmOpen}
        t={studioT}
      />
    </Flex>
  );
}

function getProvisionalPreviewStatusMessage(
  status: ReturnType<typeof useBrowserProvisionalPreview>['status'],
  t: (key: string) => string,
): string {
  if (status === 'degraded') {
    return t('Local provisional preview is unavailable. Save will continue on the server.');
  }
  if (status === 'problem') {
    return t('Local provisional preview reported problems. Server Save remains authoritative.');
  }
  if (status === 'ready') {
    return t('Local provisional preview is ready. Server Save remains authoritative.');
  }
  return t('Building local provisional preview');
}

function createHostPreviewRuntimeProblem(
  event: RunJSRuntimeEvent,
  sourceRef: RunJSHostPreviewSourceRef,
  workspaceScope: Extract<LightExtensionWorkspaceScope, { mode: 'entry' }>,
): LightExtensionProblem {
  const lineMap = parseRunJSLineMapV1(sourceRef.sourceMap);
  const generatedLocation = event.issue.generatedLocation;
  const mappedGeneratedLocation =
    lineMap && generatedLocation?.sourceURL === lineMap.sourceURL
      ? mapRunJSStackFrame(lineMap, {
          url: generatedLocation.sourceURL,
          line: generatedLocation.line,
          column: generatedLocation.column,
          raw: `${generatedLocation.sourceURL}:${generatedLocation.line}:${generatedLocation.column}`,
        })
      : undefined;
  const mappedStackLocation =
    lineMap && event.issue.stack ? getFirstMappedRunJSStackFrame(event.issue.stack, lineMap) : undefined;
  const mappedLocation = mappedGeneratedLocation || mappedStackLocation;
  const path = event.issue.sourcePath || mappedLocation?.source || workspaceScope.entryPath;
  const range = event.issue.location
    ? event.issue.location
    : mappedLocation
      ? {
          start: {
            line: mappedLocation.sourceLine,
            column: mappedLocation.sourceColumn || 1,
          },
        }
      : undefined;
  const source = event.issue.phase === 'react' ? 'react' : 'host-runtime';
  const createProblem = createLightExtensionProblemFactory({
    snapshotId: sourceRef.snapshotId,
    requestId: event.identity.executionId,
    source,
    phase: event.issue.phase,
  });
  return createProblem({
    code: `host_preview_${event.issue.ruleId.replace(/-/gu, '_')}`,
    severity: event.issue.severity,
    message: event.issue.message,
    path,
    range,
    kind: workspaceScope.kind,
    stack: event.issue.stack && lineMap ? mapRunJSStack(event.issue.stack, lineMap) : event.issue.stack,
    details: {
      previewSessionId: sourceRef.previewSessionId,
      executionId: event.identity.executionId,
      artifactHash: event.identity.artifactHash,
      sourceURL: event.identity.sourceURL,
      ruleId: event.issue.ruleId,
      executionMayContinue: event.issue.executionMayContinue,
      runtimeDetails: event.issue.details,
    },
  });
}

function createHostPreviewApiProblem(
  event: RunJSApiFailureEvent,
  sourceRef: RunJSHostPreviewSourceRef,
  workspaceScope: Extract<LightExtensionWorkspaceScope, { mode: 'entry' }>,
  t: (key: string) => string,
): LightExtensionProblem {
  const createProblem = createLightExtensionProblemFactory({
    snapshotId: sourceRef.snapshotId,
    requestId: event.identity.executionId,
    source: 'api',
    phase: event.issue.phase,
  });
  return createProblem({
    code: event.issue.phase === 'permission' ? 'host_preview_api_permission_denied' : 'host_preview_api_failed',
    severity: 'error',
    message: t(event.issue.phase === 'permission' ? 'Preview API permission denied' : 'Preview API request failed'),
    path: workspaceScope.entryPath,
    kind: workspaceScope.kind,
    details: {
      previewSessionId: sourceRef.previewSessionId,
      executionId: event.identity.executionId,
      artifactHash: event.identity.artifactHash,
      method: event.issue.method,
      resource: event.issue.resource,
      action: event.issue.action,
      status: event.issue.status,
      reasonCode: event.issue.reasonCode,
    },
  });
}

function normalizeWorkspaceFiles(files: LightExtensionTreeEntryInput[]): WorkspaceFile[] {
  return files
    .map((file) => ({
      ...file,
      path: normalizeWorkspacePath(file.path),
      content: file.content || '',
      language: file.language || inferLightExtensionLanguageFromPath(file.path),
      mode: file.mode,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function restoreWorkspaceFiles(
  currentFiles: WorkspaceFile[],
  restoredFiles: WorkspaceFile[],
  workspaceScope: LightExtensionWorkspaceScope,
): WorkspaceFile[] {
  if (workspaceScope.mode === 'repository') {
    return restoredFiles;
  }

  return normalizeWorkspaceFiles([
    ...currentFiles.filter((file) => !canChangeLightExtensionWorkspacePath(workspaceScope, file.path)),
    ...restoredFiles.filter((file) => canChangeLightExtensionWorkspacePath(workspaceScope, file.path)),
  ]);
}

function resolveActivePath(files: WorkspaceFile[], current: string | undefined): string | undefined {
  if (current && files.some((file) => file.path === current)) {
    return current;
  }

  return files[0]?.path;
}

function mergeFiles(current: WorkspaceFile[], nextFiles: WorkspaceFile[]): WorkspaceFile[] {
  const byPath = new Map(current.map((file) => [file.path, file]));
  for (const file of nextFiles) {
    const path = normalizeWorkspacePath(file.path);
    byPath.set(path, { ...file, language: file.language || inferLightExtensionLanguageFromPath(path), path });
  }

  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function collectWorkspaceFolders(files: WorkspaceFile[]): string[] {
  const folders = new Set<string>();
  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean);
    let current = '';
    for (let index = 0; index < segments.length - 1; index += 1) {
      current = current ? `${current}/${segments[index]}` : segments[index];
      folders.add(current);
    }
  }

  return [...folders].sort((left, right) => left.localeCompare(right));
}

function mergeFolders(current: string[], nextFolders: string[]): string[] {
  return uniqueStrings([...current, ...nextFolders].map(normalizeWorkspacePath).filter(isValidWorkspaceFolderPath));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function buildNewFilePath(files: WorkspaceFile[], parentPath: string): string {
  const normalizedParent = normalizeWorkspacePath(parentPath);
  const existing = new Set(files.map((file) => file.path));
  if (normalizedParent === 'src/client') {
    const missingRootFile = LIGHT_EXTENSION_REPO_ROOT_FILE_PATHS.find((path) => !existing.has(path));
    if (missingRootFile) {
      return missingRootFile;
    }
    const missingClientKindTemplate = LIGHT_EXTENSION_CLIENT_KIND_TEMPLATE_FILES.find((path) => !existing.has(path));
    if (missingClientKindTemplate) {
      return missingClientKindTemplate;
    }

    const sharedHelperPath = buildUniqueWorkspaceFilePath(files, LIGHT_EXTENSION_SHARED_ROOT);
    if (sharedHelperPath) {
      return sharedHelperPath;
    }
  }

  const folder = resolveCreateFolder(parentPath);
  return (
    buildUniqueWorkspaceFilePath(files, folder) ||
    `${folder}/${DEFAULT_NEW_FILE_NAME}${Date.now()}${DEFAULT_NEW_FILE_EXTENSION}`
  );
}

function buildUniqueWorkspaceFilePath(files: WorkspaceFile[], folder: string): string | null {
  const existing = new Set(files.map((file) => file.path));
  let index = 0;

  while (index < 1000) {
    const suffix = index === 0 ? '' : String(index + 1);
    const candidate = `${folder}/${DEFAULT_NEW_FILE_NAME}${suffix}${DEFAULT_NEW_FILE_EXTENSION}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
    index += 1;
  }

  return null;
}

function getDefaultWorkspaceFileContent(path: string): string {
  return DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.find((file) => file.path === path)?.content || '';
}

function buildNewFolderPath(files: WorkspaceFile[], folders: string[], parentPath: string): string {
  const normalizedParent = normalizeWorkspacePath(parentPath);
  if (normalizedParent === 'src/client') {
    const existingClientFolders = new Set([...folders, ...collectWorkspaceFolders(files)]);
    const missingClientKindRoot = LIGHT_EXTENSION_CLIENT_KIND_ROOTS.find((path) => !existingClientFolders.has(path));
    if (missingClientKindRoot) {
      return missingClientKindRoot;
    }
  }

  const folder = resolveCreateFolder(parentPath);
  const existing = new Set([...folders, ...collectWorkspaceFolders(files)]);
  let index = 0;

  while (index < 1000) {
    const suffix = index === 0 ? '' : String(index + 1);
    const candidate = `${folder}/folder${suffix}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
    index += 1;
  }

  return `${folder}/folder${Date.now()}`;
}

function resolveCreateFolder(parentPath: string): string {
  const normalized = normalizeWorkspacePath(parentPath);
  if (!normalized) {
    return LIGHT_EXTENSION_SOURCE_ROOT;
  }

  return normalized;
}

function isValidWorkspaceFilePath(path: string): boolean {
  if (!path || path.includes('/../') || path.includes('..')) {
    return false;
  }
  if (LIGHT_EXTENSION_REPO_ROOT_FILES.has(path)) {
    return true;
  }
  return isValidWorkspaceFolderPath(getDirectory(path)) && Boolean(getBaseName(path));
}

function isValidWorkspaceFolderPath(path: string): boolean {
  if (!path || path.includes('..')) {
    return false;
  }
  return path === 'src' || path.startsWith('src/');
}

function getDirectory(path: string): string {
  const index = path.lastIndexOf('/');
  return index >= 0 ? path.slice(0, index) : '';
}

function getBaseName(path: string): string {
  const index = path.lastIndexOf('/');
  return index >= 0 ? path.slice(index + 1) : path;
}

function getExtension(path: string): string {
  const baseName = getBaseName(path);
  const index = baseName.lastIndexOf('.');
  return index >= 0 ? baseName.slice(index) : '';
}

function replacePathPrefix(path: string, oldPrefix: string, nextPrefix: string): string {
  if (path === oldPrefix) {
    return nextPrefix;
  }

  if (path.startsWith(`${oldPrefix}/`)) {
    return `${nextPrefix}${path.slice(oldPrefix.length)}`;
  }

  return path;
}

function isPathInsideFolder(path: string, folderPath: string): boolean {
  return path === folderPath || path.startsWith(`${folderPath}/`);
}

function toRunJSHistoryItems(commits: LightExtensionCommitRecord[]): RunJSSourceHistoryItem[] {
  return commits.map((commit) => ({ ...commit }));
}

function getNextHistoryCursor(commits: LightExtensionCommitRecord[], pageSize: number): number | null {
  return commits.length === pageSize ? commits[commits.length - 1]?.seq || null : null;
}

function formatHistoryVersion(seq?: number): string {
  return seq ? `v${seq}` : 'v0';
}

function buildFileChanges(baseFiles: WorkspaceFile[], files: WorkspaceFile[]): LightExtensionFileChange[] {
  const baseByPath = new Map(baseFiles.map((file) => [file.path, file]));
  const currentByPath = new Map(files.map((file) => [file.path, file]));
  const changes: LightExtensionFileChange[] = [];

  for (const file of files) {
    const baseFile = baseByPath.get(file.path);
    if (!baseFile || baseFile.content !== file.content || baseFile.encoding !== file.encoding) {
      changes.push({
        path: file.path,
        content: file.content,
        language: file.language || inferLightExtensionLanguageFromPath(file.path),
        operation: 'upsert',
        ...(isPortalWorkspacePath(file.path)
          ? {
              encoding: file.encoding || 'utf8',
              ...(file.encoding === 'base64' && typeof file.size === 'number' ? { size: file.size } : {}),
            }
          : {}),
      });
    }
  }

  for (const file of baseFiles) {
    if (!currentByPath.has(file.path)) {
      changes.push({
        path: file.path,
        operation: 'delete',
      });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

function addGeneratedTypeFiles(
  files: WorkspaceFile[],
  settingsTypeFiles: LightExtensionSettingsTypegenResult['files'],
  activeContextFile?: LightExtensionSettingsTypegenResult['files'][number],
): WorkspaceFile[] {
  const sourceFiles = files.filter((file) => !file.path.startsWith('.light-extension/types/'));
  return mergeFiles(
    sourceFiles,
    [...settingsTypeFiles, ...(activeContextFile ? [activeContextFile] : [])].map((file) => ({
      path: file.path,
      content: file.content,
      language: 'typescript',
    })),
  );
}

function inferLightExtensionLanguageFromPath(path: string): string {
  return inferLanguageFromPath(path, { cssLanguage: 'text', jsxLanguage: 'language-family' });
}

function buildWorkspacePreviewSnapshot(
  files: WorkspaceFile[],
  workspaceScope: LightExtensionWorkspaceScope,
  repoId: string,
  entryId?: string,
): string {
  return JSON.stringify({
    repoId,
    entryId: entryId || null,
    workspaceScope,
    files: files.map((file) => [file.path, file.content, file.language || '', file.mode || '']),
  });
}

function BinaryFileView({
  file,
  onDownload,
  t,
}: {
  file: WorkspaceFile;
  onDownload: (file: WorkspaceFile) => void;
  t: (key: string) => string;
}) {
  return (
    <Flex
      align="center"
      data-testid="light-extension-binary-file"
      gap={16}
      justify="center"
      style={{ flex: 1 }}
      vertical
    >
      <Space direction="vertical" size={4} style={{ textAlign: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {getBaseName(file.path)}
        </Typography.Title>
        <Typography.Text code>{file.path}</Typography.Text>
        <Typography.Text type="secondary">
          {t('Binary file')} · {formatByteSize(file.size ?? getBase64ByteSize(file.content))}
        </Typography.Text>
      </Space>
      <Alert message={t('Binary files are read-only in the code editor.')} showIcon type="info" />
      <Button
        aria-label={t('Download file')}
        icon={<DownloadOutlined />}
        onClick={() => onDownload(file)}
        type="primary"
      >
        {t('Download file')}
      </Button>
    </Flex>
  );
}

function isBinaryWorkspaceFile(file?: WorkspaceFile): boolean {
  return file?.encoding === 'base64';
}

function isPortalWorkspacePath(path: string): boolean {
  return path === LIGHT_EXTENSION_PORTAL_ROOT || path.startsWith(`${LIGHT_EXTENSION_PORTAL_ROOT}/`);
}

function decodeBase64(value: string): ArrayBuffer {
  const decoded = window.atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
}

function getBase64ByteSize(value: string): number {
  const normalized = value.replace(/\s/g, '');
  if (!normalized) {
    return 0;
  }
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, (normalized.length * 3) / 4 - padding);
}

function formatByteSize(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return '-';
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export default LightExtensionWorkspacePage;
