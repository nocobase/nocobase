/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createActiveTemplateContextType,
  generateClientSettingsTypes,
  type JsTemplateSettingsTypegenResult,
} from '@nocobase/runjs/js-template/typegen';
import {
  type CodeAuthoringDiagnostic,
  type EmbeddedRunJSEditorSaveResult,
  useApp,
  useFullscreenOverlay,
} from '@nocobase/client-v2';
import {
  inferLanguageFromPath,
  mergeHistoryItems,
  summarizeWorkspaceChanges,
  type RunJSSourceHistoryItem,
  type VscCommitDiffResult,
  type RunJSWorkspacePathAccess,
  type RunJSWorkspacePathType,
  type RunJSWorkspaceFile,
  useRunJSWorkspaceT,
} from '@nocobase/runjs/workspace/client-v2';
import { Flex, Modal, Space, Typography, message } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  JS_TEMPLATE_DESCRIPTOR_FILE,
  JS_TEMPLATE_KEY_PATTERN,
  JS_TEMPLATE_SCHEMA_VERSION,
  NAMESPACE,
} from '../../constants';
import { DEFAULT_JS_TEMPLATE_TEMPLATE_FILES } from '../../shared/default-template';
import type {
  JsTemplateDiagnostic,
  CompiledJsTemplateArtifact,
  JsTemplateFileChange,
  JsTemplateProjectDetails,
  JsTemplateCommitRecord,
  JsTemplateTreeEntryInput,
} from '../../shared/types';
import {
  getJsTemplateErrorDiagnostics,
  JsTemplateHookError,
  useJsTemplateProject,
} from '../hooks/useJsTemplateProject';
import {
  canReadJsTemplateWorkspacePathForAI,
  canChangeJsTemplateWorkspacePath,
  getJsTemplateRoot,
  getManagedJsTemplateRoot,
  getJsTemplateWorkspaceAuthoringPathAccess,
  getJsTemplateWorkspacePathAccess,
  normalizeWorkspacePath,
  type JsTemplateWorkspaceScope,
} from '../workspace/jsTemplateWorkspaceAccess';
import { createWorkspaceAuthoringSurface, type WorkspaceAuthoringFile } from '@nocobase/runjs/workspace/client-v2';
import {
  buildJsTemplateWorkspaceArchiveFileName,
  createJsTemplateWorkspaceArchive,
  downloadJsTemplateWorkspaceArchive,
  readJsTemplateWorkspaceArchive,
} from '../workspace/jsTemplateWorkspaceArchive';
import { resolveJsTemplateWorkspaceJsonSchema } from '../workspace/jsTemplateWorkspaceJsonSchema';
import {
  InitialProjectLoadingState,
  MissingProjectState,
  WorkspaceLoadingStrip,
  WorkspaceNotice,
  WorkspacePageHeader,
} from './source-project-workspace/WorkspacePageChrome';
import { WorkspaceOverlays } from './source-project-workspace/WorkspaceOverlays';
import { WorkspaceStudio } from './source-project-workspace/WorkspaceStudio';

type WorkspaceFile = RunJSWorkspaceFile;

interface JsTemplateSourceProjectWorkspacePageProps {
  embedded?: boolean;
  defaultFilesCollapsed?: boolean;
  projectId?: string;
  initialPath?: string;
  workspaceScope?: JsTemplateWorkspaceScope;
  templateId?: string | null;
  onDetachJsTemplateToInline?: (input: DetachJsTemplateToInlineRequest) => void | Promise<void>;
  onPreview?: (artifact: CompiledJsTemplateArtifact) => void | Promise<void>;
  onFooterActionsChange?: (actions: JsTemplateSourceProjectWorkspaceFooterActions | null) => void;
  onRequestClose?: () => void | Promise<void>;
  onSaved?: () => void | Promise<void>;
}

export interface DetachJsTemplateToInlineRequest {
  expectedProjectHeadCommitId: string;
}

export interface JsTemplateSourceProjectWorkspaceFooterActions {
  dirty: boolean;
  disabled: boolean;
  loading: boolean;
  onCancel: () => void | Promise<void>;
  onSave: () => void;
  requestSave: () => Promise<EmbeddedRunJSEditorSaveResult>;
}

const JS_TEMPLATE_SOURCE_ROOT = 'src/client/js-blocks';
const JS_TEMPLATE_SHARED_ROOT = 'src/shared';
const JS_TEMPLATE_PROJECT_ROOT_FILE_PATHS = ['README.md', 'tsconfig.json'] as const;
const JS_TEMPLATE_PROJECT_ROOT_FILES = new Set<string>(JS_TEMPLATE_PROJECT_ROOT_FILE_PATHS);
const JS_TEMPLATE_CLIENT_KIND_TEMPLATE_FILES = [
  'src/client/js-fields/status-tag/index.tsx',
  'src/client/js-actions/refresh-data/index.ts',
  'src/client/js-items/form-total-preview/index.tsx',
] as const;
const JS_TEMPLATE_CLIENT_KIND_ROOTS = ['src/client/js-fields', 'src/client/js-actions', 'src/client/js-items'] as const;
const DEFAULT_NEW_FILE_NAME = 'helper';
const DEFAULT_NEW_FILE_EXTENSION = '.ts';
const HISTORY_PAGE_SIZE = 20;
const PROJECT_WORKSPACE_SCOPE: JsTemplateWorkspaceScope = { mode: 'project' };

function JsTemplateSourceProjectWorkspacePage({
  embedded = false,
  defaultFilesCollapsed = false,
  projectId: projectIdProp,
  initialPath,
  workspaceScope = PROJECT_WORKSPACE_SCOPE,
  templateId,
  onDetachJsTemplateToInline,
  onPreview,
  onFooterActionsChange,
  onRequestClose,
  onSaved,
}: JsTemplateSourceProjectWorkspacePageProps) {
  const { t } = useTranslation(NAMESPACE);
  const app = useApp();
  const studioT = useRunJSWorkspaceT();
  const [searchParams] = useSearchParams();
  const projectId = projectIdProp || searchParams.get('projectId') || '';
  const {
    compileWorkspacePreview,
    diffCommits,
    getProject,
    inspectSourceArchive,
    listCommits,
    pull,
    pullCommit,
    saveSource,
  } = useJsTemplateProject();
  const [project, setProject] = useState<JsTemplateProjectDetails | null>(null);
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
  const [diagnostics, setDiagnostics] = useState<JsTemplateDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializedProjectId, setInitializedProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [detachingToInline, setDetachingToInline] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyNextBeforeSeq, setHistoryNextBeforeSeq] = useState<number | null>(null);
  const [commitDiffCommit, setCommitDiffCommit] = useState<RunJSSourceHistoryItem | null>(null);
  const [commitDiff, setCommitDiff] = useState<VscCommitDiffResult | null>(null);
  const [diffLoadingCommitId, setDiffLoadingCommitId] = useState<string | null>(null);
  const [restoreCommit, setRestoreCommit] = useState<RunJSSourceHistoryItem | null>(null);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(
    null,
  );
  const workspaceFullscreen = useFullscreenOverlay();
  const embeddedSaveRequestRef = useRef<{
    resolve: (result: EmbeddedRunJSEditorSaveResult) => void;
    reject: (error: unknown) => void;
  } | null>(null);
  const embeddedSavePromiseRef = useRef<Promise<EmbeddedRunJSEditorSaveResult> | null>(null);
  const workspaceRequestSeqRef = useRef(0);
  const historyRequestSeqRef = useRef(0);
  const commitDiffRequestSeqRef = useRef(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const latestCheckSnapshotRef = useRef('');
  const authoringSourceFilesRef = useRef<WorkspaceFile[]>([]);
  const authoringVirtualFilesRef = useRef<WorkspaceFile[]>([]);
  const authoringActivePathRef = useRef<string | undefined>();
  const authoringDiagnosticsRef = useRef<JsTemplateDiagnostic[]>([]);
  const authoringBlockedDirtyPathsRef = useRef<Set<string>>(new Set());
  const authoringWorkspaceWritableRef = useRef(false);
  const authoringWorkspaceScopeRef = useRef(workspaceScope);
  const hasUnsavedLocalChangesRef = useRef(false);
  const templateRoot = getJsTemplateRoot(workspaceScope);
  const templateScoped = workspaceScope.mode === 'template';
  const pathRestrictionReason = t('Other JS Templates are read-only here');
  const resolveWorkspacePathAccess = useCallback(
    (path: string, pathType: RunJSWorkspacePathType): RunJSWorkspacePathAccess => {
      const access = getJsTemplateWorkspacePathAccess(workspaceScope, path, pathType);
      return {
        ...access,
        reason: access.canWrite ? undefined : pathRestrictionReason,
      };
    },
    [pathRestrictionReason, workspaceScope],
  );

  const loadWorkspace = useCallback(
    async (options: { resetNotice?: boolean } = {}) => {
      if (!projectId) {
        return;
      }

      const workspaceRequestSeq = workspaceRequestSeqRef.current + 1;
      workspaceRequestSeqRef.current = workspaceRequestSeq;
      const historyRequestSeq = historyRequestSeqRef.current + 1;
      historyRequestSeqRef.current = historyRequestSeq;
      commitDiffRequestSeqRef.current += 1;
      setHistoryLoading(false);
      setHistoryLoadingMore(false);
      setCommitDiffCommit(null);
      setCommitDiff(null);
      setDiffLoadingCommitId(null);
      setLoading(true);
      if (options.resetNotice !== false) {
        setNotice(null);
      }
      try {
        const nextProject = await getProject(projectId);
        if (workspaceRequestSeqRef.current !== workspaceRequestSeq) {
          return;
        }
        setProject(nextProject);
        const pullResult = await pull({ projectId, includeContent: 'all' });
        if (workspaceRequestSeqRef.current !== workspaceRequestSeq) {
          return;
        }
        const pulledFiles = normalizeWorkspaceFiles(pullResult.files || []);
        const nextFiles = pulledFiles;
        const nextActivePath = resolveActivePath(nextFiles, initialPath);
        const commits = await listCommits({ projectId, limit: HISTORY_PAGE_SIZE }).catch(() => []);
        if (workspaceRequestSeqRef.current !== workspaceRequestSeq) {
          return;
        }
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
        setDiagnostics([]);
      } catch (error) {
        if (workspaceRequestSeqRef.current === workspaceRequestSeq) {
          setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load source') });
        }
      } finally {
        if (workspaceRequestSeqRef.current === workspaceRequestSeq) {
          setLoading(false);
          setInitializedProjectId(projectId);
        }
      }
    },
    [getProject, initialPath, listCommits, pull, projectId, setFiles, t],
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const activeFile = files.find((file) => file.path === activePath);
  const settingsTypegen = useMemo(() => generateClientSettingsTypes({ files }), [files]);
  const activeEntryContext = useMemo(
    () => createActiveTemplateContextType({ activePath, templates: settingsTypegen.templates }),
    [activePath, settingsTypegen.templates],
  );
  const authoringFiles = useMemo(
    () => addSettingsTypeFiles(files, settingsTypegen.files, activeEntryContext.file),
    [activeEntryContext.file, files, settingsTypegen.files],
  );
  const filesForSave = files;
  const dirtyChanges = useMemo(() => buildFileChanges(baseFiles, filesForSave), [baseFiles, filesForSave]);
  const saveSummary = useMemo(() => summarizeWorkspaceChanges(baseFiles, filesForSave), [baseFiles, filesForSave]);
  const hasUnsavedLocalChanges = dirtyChanges.length > 0;
  hasUnsavedLocalChangesRef.current = hasUnsavedLocalChanges;
  const canWrite = project?.permissions.canWriteSource === true;
  const hasBlockedDirtyChanges = dirtyChanges.some(
    (change) => !canChangeJsTemplateWorkspacePath(workspaceScope, change.path),
  );
  const activeFileReadOnly =
    !canWrite || !activePath || !getJsTemplateWorkspacePathAccess(workspaceScope, activePath, 'file').canWrite;
  const checkSnapshotKey = useMemo(() => buildWorkspacePreviewSnapshot(files, workspaceScope), [files, workspaceScope]);
  latestCheckSnapshotRef.current = checkSnapshotKey;
  const canPreview = templateScoped && Boolean(onPreview);
  const canDetachJsTemplateToInline =
    templateScoped && canWrite && Boolean(onDetachJsTemplateToInline) && Boolean(baseHeadCommitId);
  const authoringSurfaceId =
    workspaceScope.mode === 'template' && canWrite
      ? buildJsTemplateAuthoringSurfaceId(projectId, workspaceScope, templateId)
      : undefined;
  const sourcePathSet = useMemo(() => new Set(files.map((file) => file.path)), [files]);
  const virtualAuthoringFiles = useMemo(
    () => authoringFiles.filter((file) => !sourcePathSet.has(file.path)),
    [authoringFiles, sourcePathSet],
  );
  authoringSourceFilesRef.current = files;
  authoringVirtualFilesRef.current = virtualAuthoringFiles;
  authoringActivePathRef.current = activePath;
  authoringDiagnosticsRef.current = diagnostics;
  authoringBlockedDirtyPathsRef.current = new Set(
    dirtyChanges
      .filter((change) => !canChangeJsTemplateWorkspacePath(workspaceScope, change.path))
      .map((change) => change.path),
  );
  authoringWorkspaceWritableRef.current = canWrite;
  authoringWorkspaceScopeRef.current = workspaceScope;

  const openFilePath = useCallback((path?: string) => {
    if (!path) {
      return;
    }

    setActivePath(path);
    setOpenPaths((current) => (current.includes(path) ? current : [...current, path]));
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

  const createWorkspaceFile = (parentPath = JS_TEMPLATE_SOURCE_ROOT): string | undefined => {
    if (!canWrite || !getJsTemplateWorkspacePathAccess(workspaceScope, parentPath, 'folder').canCreate) {
      return undefined;
    }

    const nextPath = buildNewFilePath(files, parentPath);
    const nextFiles = mergeFiles(files, [
      {
        path: nextPath,
        content: getDefaultWorkspaceFileContent(nextPath),
        language: inferJsTemplateLanguageFromPath(nextPath),
      },
    ]);
    setFiles(nextFiles);
    setFolders((current) => mergeFolders(current, collectWorkspaceFolders(nextFiles)));
    openFilePath(nextPath);
    return nextPath;
  };

  const createWorkspaceFolder = (parentPath = JS_TEMPLATE_SOURCE_ROOT): string | undefined => {
    if (!canWrite || !getJsTemplateWorkspacePathAccess(workspaceScope, parentPath, 'folder').canCreate) {
      return undefined;
    }

    const nextFolder = buildNewFolderPath(files, folders, parentPath);
    setFolders((current) => mergeFolders(current, [nextFolder]));
    return nextFolder;
  };

  const updateActiveFile = (value: string) => {
    if (!activePath || !canWrite || !getJsTemplateWorkspacePathAccess(workspaceScope, activePath, 'file').canWrite) {
      return;
    }

    setFiles((current) => current.map((file) => (file.path === activePath ? { ...file, content: value } : file)));
  };

  const removeFile = (path: string) => {
    if (!canWrite || !getJsTemplateWorkspacePathAccess(workspaceScope, path, 'file').canDelete) {
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
    if (!canWrite || !getJsTemplateWorkspacePathAccess(workspaceScope, path, 'file').canRename) {
      return false;
    }

    const normalizedNextPath = normalizeWorkspacePath(nextPath);
    if (!isValidWorkspaceFilePath(normalizedNextPath)) {
      message.error(t('Invalid file path'));
      return false;
    }
    if (!getJsTemplateWorkspacePathAccess(workspaceScope, normalizedNextPath, 'file').canWrite) {
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
        ? { ...file, language: inferJsTemplateLanguageFromPath(normalizedNextPath), path: normalizedNextPath }
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
    if (!canWrite || !getJsTemplateWorkspacePathAccess(workspaceScope, path, 'folder').canRename) {
      return false;
    }

    const normalizedNextPath = normalizeWorkspacePath(nextPath);
    if (!isValidWorkspaceFolderPath(normalizedNextPath)) {
      message.error(t('Invalid file path'));
      return false;
    }
    if (!getJsTemplateWorkspacePathAccess(workspaceScope, normalizedNextPath, 'folder').canWrite) {
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

    const managedEntryRoot = getManagedJsTemplateRoot(path);
    const managedEntryHasContents =
      files.some((file) => isPathInsideFolder(file.path, path)) ||
      folders.some((folder) => folder !== path && isPathInsideFolder(folder, path));
    if (managedEntryRoot && managedEntryHasContents) {
      const descriptorPath = `${managedEntryRoot.path}/${JS_TEMPLATE_DESCRIPTOR_FILE}`;
      const descriptorFile = files.find((file) => file.path === descriptorPath);
      if (!descriptorFile) {
        message.error(t('Entry descriptor is missing'));
        return false;
      }
      try {
        const descriptor = JSON.parse(descriptorFile.content) as unknown;
        if (
          !isRecord(descriptor) ||
          descriptor.schemaVersion !== JS_TEMPLATE_SCHEMA_VERSION ||
          typeof descriptor.key !== 'string' ||
          !JS_TEMPLATE_KEY_PATTERN.test(descriptor.key)
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
        language: inferJsTemplateLanguageFromPath(replacePathPrefix(file.path, path, normalizedNextPath)),
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
    if (!canWrite || !getJsTemplateWorkspacePathAccess(workspaceScope, path, 'folder').canDelete) {
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
    if (!projectId) {
      return;
    }

    const requestSeq = historyRequestSeqRef.current + 1;
    historyRequestSeqRef.current = requestSeq;
    setHistoryLoadingMore(false);
    setHistoryLoading(true);
    try {
      const commits = await listCommits({ projectId, limit: HISTORY_PAGE_SIZE });
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
    if (!projectId || historyNextBeforeSeq === null) {
      return;
    }

    const requestSeq = historyRequestSeqRef.current + 1;
    historyRequestSeqRef.current = requestSeq;
    const beforeSeq = historyNextBeforeSeq;
    setHistoryLoadingMore(true);
    try {
      const commits = await listCommits({
        projectId,
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

  const viewCommitDiff = async (commit: RunJSSourceHistoryItem) => {
    if (!projectId || !commit.parentCommitId) {
      return;
    }

    const requestSeq = commitDiffRequestSeqRef.current + 1;
    commitDiffRequestSeqRef.current = requestSeq;
    setCommitDiffCommit(commit);
    setCommitDiff(null);
    setDiffLoadingCommitId(commit.id);
    try {
      const result = await diffCommits({
        projectId,
        fromCommitId: commit.parentCommitId,
        toCommitId: commit.id,
      });
      if (commitDiffRequestSeqRef.current !== requestSeq) {
        return;
      }
      setCommitDiff(result);
    } catch (error) {
      if (commitDiffRequestSeqRef.current === requestSeq) {
        setCommitDiffCommit(null);
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to load commit changes'),
        });
      }
    } finally {
      if (commitDiffRequestSeqRef.current === requestSeq) {
        setDiffLoadingCommitId(null);
      }
    }
  };

  const closeCommitDiff = () => {
    commitDiffRequestSeqRef.current += 1;
    setCommitDiffCommit(null);
    setCommitDiff(null);
    setDiffLoadingCommitId(null);
  };

  const loadVersionIntoEditor = async (commit: RunJSSourceHistoryItem) => {
    if (!projectId || !canWrite) {
      return;
    }

    setRestoringVersion(true);
    try {
      const pullResult = await pullCommit({ projectId, commitId: commit.id, includeContent: 'all' });
      const restoredFiles = normalizeWorkspaceFiles(pullResult.files || []);
      const nextFiles = restoreWorkspaceFiles(files, restoredFiles, workspaceScope);
      const nextActivePath = resolveActivePath(nextFiles, activePath);
      setFiles(nextFiles);
      setFolders(collectWorkspaceFolders(nextFiles));
      setActivePath(nextActivePath);
      setOpenPaths(nextActivePath ? [nextActivePath] : []);
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

  const saveChanges = useCallback(async () => {
    const commitMessage = versionMessage.trim();
    if (!projectId || !commitMessage || dirtyChanges.length === 0 || hasBlockedDirtyChanges) {
      if (hasBlockedDirtyChanges) {
        setNotice({ type: 'warning', message: pathRestrictionReason });
      }
      return;
    }

    setSaveOpen(false);
    setSaving(true);
    setNotice(null);
    try {
      const result = await saveSource({
        projectId,
        expectedHeadCommitId: baseHeadCommitId,
        message: commitMessage,
        files: dirtyChanges,
      });
      setDiagnostics(result.diagnostics);
      setBaseHeadCommitId(result.commit.id);
      setBaseFiles(filesForSave);
      await onSaved?.();
      if (onRequestClose) {
        await onRequestClose();
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
      setDiagnostics(getJsTemplateErrorDiagnostics(error) as JsTemplateDiagnostic[]);
      setNotice({
        type: 'error',
        message:
          error instanceof JsTemplateHookError && error.code === 'JS_TEMPLATE_SOURCE_OUTDATED'
            ? t('Source changed remotely. Refresh the latest source and reapply your changes.')
            : error instanceof Error
              ? error.message
              : t('Failed to save source'),
      });
    } finally {
      setSaving(false);
    }
  }, [
    baseHeadCommitId,
    dirtyChanges,
    filesForSave,
    hasBlockedDirtyChanges,
    loadWorkspace,
    onSaved,
    onRequestClose,
    pathRestrictionReason,
    projectId,
    saveSource,
    t,
    versionMessage,
  ]);

  const openSaveModal = useCallback((): boolean => {
    if (!canWrite || !hasUnsavedLocalChanges || hasBlockedDirtyChanges) {
      return false;
    }

    setVersionMessage('');
    setSaveOpen(true);
    return true;
  }, [canWrite, hasBlockedDirtyChanges, hasUnsavedLocalChanges]);

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

    await onRequestClose?.();
  }, [hasUnsavedLocalChanges, onRequestClose]);

  const discardLocalAndClose = useCallback(async () => {
    setCloseConfirmOpen(false);
    await onRequestClose?.();
  }, [onRequestClose]);

  const footerActions = useMemo<JsTemplateSourceProjectWorkspaceFooterActions>(
    () => ({
      dirty: hasUnsavedLocalChanges,
      disabled: !canWrite || loading || !hasUnsavedLocalChanges || hasBlockedDirtyChanges,
      loading: saving,
      onCancel: requestClose,
      onSave: openSaveModal,
      requestSave,
    }),
    [
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

  const openDiagnosticSource = useCallback(
    (diagnostic: JsTemplateDiagnostic) => {
      if (!diagnostic.path) {
        return;
      }
      if (!authoringSourceFilesRef.current.some((file) => file.path === diagnostic.path)) {
        setNotice({ type: 'warning', message: t('Diagnostic source is not loaded') });
        return;
      }

      openFilePath(diagnostic.path);
      setNotice({ type: 'info', message: t('Opened diagnostic source') });
    },
    [openFilePath, t],
  );

  useEffect(() => {
    if (!app?.aiManager?.authoringSurfaces || !authoringSurfaceId || !projectId || !project || !canWrite) {
      return;
    }

    const registeredWorkspaceScope = authoringWorkspaceScopeRef.current;
    if (registeredWorkspaceScope.mode !== 'template') {
      return;
    }
    const surface = createWorkspaceAuthoringSurface({
      id: authoringSurfaceId,
      kind: 'source-project-workspace',
      title: project.title || project.name || t('Source workspace'),
      getSourceFiles: () =>
        toJsTemplateAuthoringFiles(
          authoringSourceFilesRef.current,
          registeredWorkspaceScope,
          authoringWorkspaceWritableRef.current,
          authoringBlockedDirtyPathsRef.current,
          false,
        ),
      getVirtualFiles: () =>
        toJsTemplateAuthoringFiles(
          authoringVirtualFilesRef.current,
          registeredWorkspaceScope,
          false,
          authoringBlockedDirtyPathsRef.current,
          true,
        ),
      commitSourceFiles: (nextSourceFiles) => {
        const nextFiles = normalizeWorkspaceFiles(
          nextSourceFiles.map((file) => ({
            path: file.path,
            content: file.content,
            language: file.language,
            mode: getWorkspaceAuthoringFileMode(file),
          })),
        );
        const nextActivePath = resolveActivePath(nextFiles, authoringActivePathRef.current);
        const nextSourcePaths = new Set(nextFiles.map((file) => file.path));
        authoringSourceFilesRef.current = nextFiles;
        authoringVirtualFilesRef.current = authoringVirtualFilesRef.current.filter(
          (file) => !nextSourcePaths.has(file.path),
        );
        authoringActivePathRef.current = nextActivePath;
        setFiles(nextFiles);
        setFolders(collectWorkspaceFolders(nextFiles));
        setActivePath(nextActivePath);
        setOpenPaths((current) => {
          const nextOpenPaths = current.filter((path) => nextSourcePaths.has(path));
          if (nextActivePath && !nextOpenPaths.includes(nextActivePath)) {
            nextOpenPaths.push(nextActivePath);
          }
          return nextOpenPaths;
        });
      },
      getActivePath: () => authoringActivePathRef.current,
      getPathAccess: (path) => {
        const access = getJsTemplateWorkspaceAuthoringPathAccess(registeredWorkspaceScope, path, {
          blockedDirtyChange: authoringBlockedDirtyPathsRef.current.has(path),
          workspaceWritable: authoringWorkspaceWritableRef.current,
        });
        return {
          canCreate: access.canCreate,
          canUpdate: access.canUpdate,
          canDelete: access.canDelete,
          reason: access.reason,
        };
      },
      canReadForAI: (file) =>
        canReadJsTemplateWorkspacePathForAI(registeredWorkspaceScope, file.path, {
          virtual: authoringVirtualFilesRef.current.some((virtualFile) => virtualFile.path === file.path),
        }),
      getDiagnostics: () => toCodeAuthoringDiagnostics(authoringDiagnosticsRef.current, registeredWorkspaceScope),
      sanitizeDiagnostic: (diagnostic) => diagnostic,
      validateDraft: async () => {
        const currentFiles = authoringSourceFilesRef.current;
        const result = await compileWorkspacePreview({
          projectId,
          templateId,
          kind: registeredWorkspaceScope.kind,
          entryPath: registeredWorkspaceScope.entryPath,
          runtimeVersion: 'v2',
          files: currentFiles.map((file) => ({
            path: file.path,
            content: file.content,
            language: file.language,
            mode: file.mode,
          })),
        });
        return toCodeAuthoringDiagnostics(result.diagnostics, registeredWorkspaceScope);
      },
      supportedLanguages: ['css', 'javascript', 'javascriptreact', 'json', 'typescript', 'typescriptreact'],
    });
    const unregister = app.aiManager.authoringSurfaces.register(surface);
    return unregister;
  }, [app, authoringSurfaceId, canWrite, compileWorkspacePreview, templateId, project, projectId, setFiles, t]);

  const runPreview = useCallback(async () => {
    if (!canPreview || workspaceScope.mode !== 'template' || !onPreview) {
      return;
    }

    const requestSnapshotKey = checkSnapshotKey;
    setPreviewing(true);
    setNotice(null);
    try {
      const result = await compileWorkspacePreview({
        projectId,
        templateId,
        kind: workspaceScope.kind,
        entryPath: workspaceScope.entryPath,
        runtimeVersion: 'v2',
        files: files.map((file) => ({
          path: file.path,
          content: file.content,
          language: file.language,
          mode: file.mode,
        })),
      });
      if (latestCheckSnapshotRef.current !== requestSnapshotKey) {
        setNotice({ type: 'error', message: t('Run failed') });
        return;
      }

      setDiagnostics(result.diagnostics);
      if (!result.accepted || !result.artifact) {
        setNotice({ type: 'error', message: t('Run failed') });
        return;
      }
      await onPreview(result.artifact);
    } catch (error) {
      setDiagnostics(getJsTemplateErrorDiagnostics(error) as JsTemplateDiagnostic[]);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Run failed') });
    } finally {
      setPreviewing(false);
    }
  }, [
    canPreview,
    checkSnapshotKey,
    compileWorkspacePreview,
    templateId,
    files,
    onPreview,
    projectId,
    t,
    workspaceScope,
  ]);

  const detachToInline = useCallback(async () => {
    if (
      !canDetachJsTemplateToInline ||
      !baseHeadCommitId ||
      workspaceScope.mode !== 'template' ||
      !onDetachJsTemplateToInline
    ) {
      return;
    }
    if (hasUnsavedLocalChangesRef.current) {
      setNotice({
        type: 'warning',
        message: t(
          'This workspace has unsaved changes. Save them first, or close and discard them before detaching to Inline.',
        ),
      });
      return;
    }

    setDetachingToInline(true);
    setNotice(null);
    try {
      await onDetachJsTemplateToInline({
        expectedProjectHeadCommitId: baseHeadCommitId,
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : t('Failed to detach to Inline'),
      });
      throw error;
    } finally {
      setDetachingToInline(false);
    }
  }, [baseHeadCommitId, canDetachJsTemplateToInline, onDetachJsTemplateToInline, t, workspaceScope.mode]);

  const confirmDetachJsTemplateToInline = useCallback(() => {
    if (hasUnsavedLocalChanges) {
      setNotice({
        type: 'warning',
        message: t(
          'This workspace has unsaved changes. Save them first, or close and discard them before detaching to Inline.',
        ),
      });
      return;
    }
    Modal.confirm({
      title: t('Detach to Inline?'),
      content: t(
        'The committed Project Head for this template and its referenced files will be copied to inline code. The JS Template will remain unchanged.',
      ),
      okText: t('Detach to Inline'),
      cancelText: t('Cancel'),
      transitionName: '',
      maskTransitionName: '',
      onOk: detachToInline,
    });
  }, [detachToInline, hasUnsavedLocalChanges, t]);

  const exportWorkspace = useCallback(async () => {
    if (!project || exporting || importing) {
      return;
    }

    setExporting(true);
    setNotice(null);
    try {
      const archiveFiles =
        workspaceScope.mode === 'project'
          ? files
          : files.filter((file) => canChangeJsTemplateWorkspacePath(workspaceScope, file.path));
      const archive = await createJsTemplateWorkspaceArchive(archiveFiles);
      const downloaded = downloadJsTemplateWorkspaceArchive(
        archive,
        buildJsTemplateWorkspaceArchiveFileName(project.name || project.title || project.id),
      );
      if (!downloaded) {
        throw new Error(t('Failed to start ZIP download'));
      }
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to export ZIP') });
    } finally {
      setExporting(false);
    }
  }, [exporting, files, importing, project, t, workspaceScope]);

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
      if (!archive || !projectId || !canWrite || importing) {
        return;
      }

      setImporting(true);
      setNotice(null);
      try {
        const zipBase64 = await readJsTemplateWorkspaceArchive(archive, t('Failed to read source ZIP'));
        const result = await inspectSourceArchive({ projectId, zipBase64 });
        const importedFiles = normalizeWorkspaceFiles(result.files || []);
        if (workspaceScope.mode === 'template') {
          const readOnlyPath = importedFiles.find(
            (file) => !canChangeJsTemplateWorkspacePath(workspaceScope, file.path),
          );
          if (readOnlyPath) {
            throw new Error(t('ZIP contains files that are read-only in this editor'));
          }
          if (!importedFiles.some((file) => file.path === workspaceScope.entryPath)) {
            throw new Error(t('ZIP does not contain the current template source file'));
          }
        }

        const nextFiles = restoreWorkspaceFiles(files, importedFiles, workspaceScope);
        const nextActivePath = resolveActivePath(
          nextFiles,
          workspaceScope.mode === 'template' ? workspaceScope.entryPath : activePath,
        );
        setFiles(nextFiles);
        setFolders(collectWorkspaceFolders(nextFiles));
        setActivePath(nextActivePath);
        setOpenPaths(nextActivePath ? [nextActivePath] : []);
        setDiagnostics([]);
        message.success(t('ZIP imported. Save to create a new version.'));
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to import ZIP') });
      } finally {
        setImporting(false);
      }
    },
    [activePath, canWrite, files, importing, inspectSourceArchive, projectId, setFiles, t, workspaceScope],
  );

  if (!projectId) {
    return (
      <MissingProjectState
        description={t('Select a Source Project from Source Projects')}
        embedded={embedded}
        title={t('Source workspace')}
      />
    );
  }

  if (initializedProjectId !== projectId) {
    return <InitialProjectLoadingState embedded={embedded} label={t('Loading source')} />;
  }

  return (
    <Flex vertical gap={16} style={{ height: embedded ? '100%' : undefined, minHeight: 0, padding: embedded ? 0 : 24 }}>
      <WorkspacePageHeader
        disabled={footerActions.disabled}
        embedded={embedded}
        loading={footerActions.loading}
        onSave={footerActions.onSave}
        projectId={projectId}
        saveLabel={t('Save')}
        title={project?.title || project?.name || t('Source workspace')}
      />

      <WorkspaceNotice notice={notice} onClose={() => setNotice(null)} />
      <WorkspaceLoadingStrip label={t('Loading source')} loading={loading} />

      <WorkspaceStudio
        activeFileReadOnlyNotice={activeFileReadOnly && templateScoped ? pathRestrictionReason : undefined}
        codeTabProps={{
          activeFile,
          activePath,
          authoringSurfaceId,
          busy: previewing,
          filesCollapsed,
          jsonSchemaResolver: resolveJsTemplateWorkspaceJsonSchema,
          onChange: updateActiveFile,
          onCloseFile: closeOpenFile,
          onFilesCollapsedChange: setFilesCollapsed,
          onOpenFile: openFilePath,
          onRunPreview: canPreview ? runPreview : undefined,
          openPaths,
          previewing,
          readOnly: activeFileReadOnly,
          savedFiles: baseFiles,
          showRunButton: canPreview,
          t: studioT,
          version: 'v2',
          workspaceFiles: authoringFiles,
        }}
        diagnostics={diagnostics}
        embedded={embedded}
        emptyProjectLabel={t('Empty Source Project')}
        filesCollapsed={filesCollapsed}
        filesPanelProps={{
          activePath,
          collapsed: filesCollapsed,
          defaultCreateParentPath: templateScoped ? templateRoot || JS_TEMPLATE_SOURCE_ROOT : undefined,
          exporting,
          files,
          fillAvailableHeight: historyCollapsed,
          folders,
          getPathAccess: resolveWorkspacePathAccess,
          importing,
          onCollapseChange: setFilesCollapsed,
          onCreate: createWorkspaceFile,
          onCreateFolder: createWorkspaceFolder,
          onDelete: removeFile,
          onDeleteFolder: deleteFolder,
          onExportWorkspace: exportWorkspace,
          onImportWorkspace: requestImportWorkspace,
          onMoveFile: moveFileToFolder,
          onMoveFolder: moveFolderToFolder,
          onOpen: openFilePath,
          onRefresh: loadWorkspace,
          onRename: renameFile,
          onRenameFolder: renameFolder,
          readOnly: !canWrite || importing,
          savedFiles: baseFiles,
          t: studioT,
        }}
        fullscreen={{
          container: workspaceFullscreen.container,
          isFullscreen: workspaceFullscreen.isFullscreen,
          placeholderRef: workspaceFullscreen.placeholderRef,
          placeholderStyle: workspaceFullscreen.placeholderStyle,
          toggleFullscreen: workspaceFullscreen.toggleFullscreen,
        }}
        hasFiles={files.length > 0}
        detachToInline={
          canDetachJsTemplateToInline
            ? {
                label: t('Detach to Inline'),
                loading: detachingToInline,
                onClick: confirmDetachJsTemplateToInline,
              }
            : undefined
        }
        onOpenDiagnostic={openDiagnosticSource}
        versionHistoryProps={{
          baseVersion: formatHistoryVersion(baseCommitSeq),
          collapsed: historyCollapsed,
          diffLoadingCommitId,
          emptyHistoryDescription: t('No source versions yet'),
          hasMore: historyNextBeforeSeq !== null,
          hasUnsavedLocalChanges,
          historyItems,
          loading: historyLoading,
          loadingMore: historyLoadingMore,
          onCollapsedChange: setHistoryCollapsed,
          onLoadMore: loadMoreHistory,
          onRefresh: refreshHistory,
          onSelect: setRestoreCommit,
          onViewDiff: viewCommitDiff,
          t: studioT,
        }}
      />

      <WorkspaceOverlays
        closeConfirmProps={{
          intent: 'close',
          onCancel: () => setCloseConfirmOpen(false),
          onCloseWithoutSaving: discardLocalAndClose,
          open: closeConfirmOpen,
          t: studioT,
        }}
        commitDiffProps={{
          commit: commitDiffCommit,
          diff: commitDiff,
          loading: Boolean(diffLoadingCommitId),
          onCancel: closeCommitDiff,
          t: studioT,
        }}
        importInput={{
          ariaLabel: t('Import workspace'),
          onChange: importWorkspaceFile,
          ref: importInputRef,
        }}
        restoreVersionProps={{
          commit: restoreCommit,
          loading: restoringVersion,
          onCancel: () => setRestoreCommit(null),
          onRestore: confirmLoadVersion,
          scopeDescription: templateScoped
            ? t('Only editable files in this workspace will be restored. Read-only files will remain unchanged.')
            : undefined,
          t: studioT,
        }}
        saveVersionProps={{
          loading: false,
          onAfterClose: () => undefined,
          onCancel: () => {
            setSaveOpen(false);
            const request = embeddedSaveRequestRef.current;
            embeddedSaveRequestRef.current = null;
            embeddedSavePromiseRef.current = null;
            request?.resolve('cancelled');
          },
          onSave: saveChanges,
          onVersionMessageChange: setVersionMessage,
          open: saveOpen,
          readOnly: !canWrite || hasBlockedDirtyChanges,
          summary: saveSummary,
          t: studioT,
          versionMessage,
        }}
        saving={{
          compilingLabel: t('Compiling JS Template'),
          open: saving,
          savingLabel: t('Saving source files'),
          title: t('Saving changes'),
        }}
      />
    </Flex>
  );
}

function buildJsTemplateAuthoringSurfaceId(
  projectId: string,
  workspaceScope: Extract<JsTemplateWorkspaceScope, { mode: 'template' }>,
  templateId?: string | null,
): string {
  const projectSegment = encodeURIComponent(projectId || 'unknown');
  return [
    'js-template',
    projectSegment,
    'template',
    encodeURIComponent(templateId || 'unresolved'),
    encodeURIComponent(workspaceScope.kind),
    encodeURIComponent(normalizeWorkspacePath(workspaceScope.entryPath)),
  ].join(':');
}

function toJsTemplateAuthoringFiles(
  files: WorkspaceFile[],
  workspaceScope: JsTemplateWorkspaceScope,
  workspaceWritable: boolean,
  blockedDirtyPaths: Set<string>,
  virtual: boolean,
): WorkspaceAuthoringFile[] {
  return files.map((file) => {
    const access = getJsTemplateWorkspaceAuthoringPathAccess(workspaceScope, file.path, {
      blockedDirtyChange: blockedDirtyPaths.has(file.path),
      virtual,
      workspaceWritable,
    });
    const authoringFile: WorkspaceAuthoringFile = {
      path: file.path,
      content: file.content,
      language: file.language,
      readOnly: !access.canUpdate,
      writable: access.canUpdate,
      mode: file.mode,
    };
    return authoringFile;
  });
}

function getWorkspaceAuthoringFileMode(file: WorkspaceAuthoringFile): string | undefined {
  return file.mode;
}

function toCodeAuthoringDiagnostics(
  diagnostics: JsTemplateDiagnostic[],
  workspaceScope: JsTemplateWorkspaceScope,
): CodeAuthoringDiagnostic[] {
  if (workspaceScope.mode !== 'template') {
    return [];
  }
  const templateName = getTemplateName(workspaceScope);
  return diagnostics
    .filter((diagnostic) => {
      if (diagnostic.path) {
        return canReadJsTemplateWorkspacePathForAI(workspaceScope, diagnostic.path);
      }
      return diagnostic.kind === workspaceScope.kind && diagnostic.templateName === templateName;
    })
    .map((diagnostic) => ({
      message: redactJsTemplateDiagnosticMessage(diagnostic.message, workspaceScope),
      severity: diagnostic.severity,
      ...(diagnostic.path ? { path: normalizeWorkspacePath(diagnostic.path) } : {}),
      ...(diagnostic.line
        ? {
            range: {
              start: {
                line: diagnostic.line,
                column: diagnostic.column || 1,
              },
            },
          }
        : {}),
      ...(diagnostic.code ? { code: diagnostic.code } : {}),
      source: diagnostic.kind || 'js-template',
    }));
}

function redactJsTemplateDiagnosticMessage(
  message: string,
  workspaceScope: Extract<JsTemplateWorkspaceScope, { mode: 'template' }>,
): string {
  return message.replace(
    /src[\\/]client[\\/](?:js-actions|js-blocks|js-fields|js-items)[\\/][^\s"'`()[\]{}:,;]+/g,
    (path) => (canReadJsTemplateWorkspacePathForAI(workspaceScope, path) ? path : '[redacted JS Template path]'),
  );
}

function getTemplateName(workspaceScope: Extract<JsTemplateWorkspaceScope, { mode: 'template' }>): string {
  const templateRoot = getJsTemplateRoot(workspaceScope);
  return templateRoot?.split('/').pop() || '';
}
function normalizeWorkspaceFiles(files: JsTemplateTreeEntryInput[]): WorkspaceFile[] {
  return files
    .map((file) => ({
      path: normalizeWorkspacePath(file.path),
      content: file.content || '',
      language: file.language || inferJsTemplateLanguageFromPath(file.path),
      mode: file.mode,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function restoreWorkspaceFiles(
  currentFiles: WorkspaceFile[],
  restoredFiles: WorkspaceFile[],
  workspaceScope: JsTemplateWorkspaceScope,
): WorkspaceFile[] {
  if (workspaceScope.mode === 'project') {
    return restoredFiles;
  }

  return normalizeWorkspaceFiles([
    ...currentFiles.filter((file) => !canChangeJsTemplateWorkspacePath(workspaceScope, file.path)),
    ...restoredFiles.filter((file) => canChangeJsTemplateWorkspacePath(workspaceScope, file.path)),
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
    byPath.set(path, { ...file, language: file.language || inferJsTemplateLanguageFromPath(path), path });
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
    const missingRootFile = JS_TEMPLATE_PROJECT_ROOT_FILE_PATHS.find((path) => !existing.has(path));
    if (missingRootFile) {
      return missingRootFile;
    }
    const missingClientKindTemplate = JS_TEMPLATE_CLIENT_KIND_TEMPLATE_FILES.find((path) => !existing.has(path));
    if (missingClientKindTemplate) {
      return missingClientKindTemplate;
    }

    const sharedHelperPath = buildUniqueWorkspaceFilePath(files, JS_TEMPLATE_SHARED_ROOT);
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
  return DEFAULT_JS_TEMPLATE_TEMPLATE_FILES.find((file) => file.path === path)?.content || '';
}

function buildNewFolderPath(files: WorkspaceFile[], folders: string[], parentPath: string): string {
  const normalizedParent = normalizeWorkspacePath(parentPath);
  if (normalizedParent === 'src/client') {
    const existingClientFolders = new Set([...folders, ...collectWorkspaceFolders(files)]);
    const missingClientKindRoot = JS_TEMPLATE_CLIENT_KIND_ROOTS.find((path) => !existingClientFolders.has(path));
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
    return JS_TEMPLATE_SOURCE_ROOT;
  }

  return normalized;
}

function isValidWorkspaceFilePath(path: string): boolean {
  if (!path || path.includes('/../') || path.includes('..')) {
    return false;
  }
  if (JS_TEMPLATE_PROJECT_ROOT_FILES.has(path)) {
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

function toRunJSHistoryItems(commits: JsTemplateCommitRecord[]): RunJSSourceHistoryItem[] {
  return commits.map(({ projectId, ...commit }) => ({ ...commit, repoId: projectId }));
}

function getNextHistoryCursor(commits: JsTemplateCommitRecord[], pageSize: number): number | null {
  return commits.length === pageSize ? commits[commits.length - 1]?.seq || null : null;
}

function formatHistoryVersion(seq?: number): string {
  return seq ? `v${seq}` : 'v0';
}

function buildFileChanges(baseFiles: WorkspaceFile[], files: WorkspaceFile[]): JsTemplateFileChange[] {
  const baseByPath = new Map(baseFiles.map((file) => [file.path, file]));
  const currentByPath = new Map(files.map((file) => [file.path, file]));
  const changes: JsTemplateFileChange[] = [];

  for (const file of files) {
    const baseFile = baseByPath.get(file.path);
    if (!baseFile || baseFile.content !== file.content) {
      changes.push({
        path: file.path,
        content: file.content,
        language: file.language || inferJsTemplateLanguageFromPath(file.path),
        operation: 'upsert',
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

function addSettingsTypeFiles(
  files: WorkspaceFile[],
  settingsTypeFiles: JsTemplateSettingsTypegenResult['files'],
  activeContextFile?: JsTemplateSettingsTypegenResult['files'][number],
): WorkspaceFile[] {
  const sourceFiles = files.filter((file) => !file.path.startsWith('.js-template/types/'));
  return mergeFiles(
    sourceFiles,
    [...settingsTypeFiles, ...(activeContextFile ? [activeContextFile] : [])].map((file) => ({
      path: file.path,
      content: file.content,
      language: 'typescript',
    })),
  );
}

function inferJsTemplateLanguageFromPath(path: string): string {
  return inferLanguageFromPath(path, { cssLanguage: 'text', jsxLanguage: 'language-family' });
}

function buildWorkspacePreviewSnapshot(files: WorkspaceFile[], workspaceScope: JsTemplateWorkspaceScope): string {
  return JSON.stringify({
    workspaceScope,
    files: files.map((file) => [file.path, file.content, file.language || '', file.mode || '']),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export default JsTemplateSourceProjectWorkspacePage;
