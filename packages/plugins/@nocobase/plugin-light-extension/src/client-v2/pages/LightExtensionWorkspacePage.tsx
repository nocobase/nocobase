/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ImportOutlined, SaveOutlined } from '@ant-design/icons';
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
} from '@nocobase/plugin-vsc-file/client-v2';
import { type EmbeddedRunJSEditorSaveResult, useFullscreenOverlay } from '@nocobase/client-v2';
import { Alert, Button, Empty, Flex, Modal, Space, Spin, Tooltip, Typography, message, theme } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { LIGHT_EXTENSION_ENTRY_KEY_PATTERN, NAMESPACE } from '../../constants';
import { generateClientSettingsTypes, type LightExtensionSettingsTypegenResult } from '../../sdk/settings-typegen';
import {
  DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES,
  LIGHT_EXTENSION_SDK_SHIM_CONTENT,
  LIGHT_EXTENSION_SDK_SHIM_PATH,
} from '../../shared/default-template';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryRuntimeArtifact,
  LightExtensionFileChange,
  LightExtensionRepoRecord,
  LightExtensionCommitRecord,
  LightExtensionTreeEntryInput,
} from '../../shared/types';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import { getLightExtensionErrorDiagnostics, useLightExtensionRepo } from '../hooks/useLightExtensionRepo';
import {
  canChangeLightExtensionWorkspacePath,
  getLightExtensionEntryRoot,
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

type WorkspaceFile = RunJSWorkspaceFile;

interface LightExtensionWorkspacePageProps {
  embedded?: boolean;
  defaultFilesCollapsed?: boolean;
  repoId?: string;
  initialPath?: string;
  workspaceScope?: LightExtensionWorkspaceScope;
  entryId?: string | null;
  onPreview?: (artifact: LightExtensionEntryRuntimeArtifact) => void | Promise<void>;
  onMoveToInline?: (input: LightExtensionMoveToInlineRequest) => void | Promise<void>;
  onFooterActionsChange?: (actions: LightExtensionWorkspaceFooterActions | null) => void;
  onRequestClose?: () => void | Promise<void>;
  onSaved?: () => void;
}

export interface LightExtensionMoveToInlineRequest {
  entryPath: string;
  files: RunJSWorkspaceFile[];
  version: string;
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
const LIGHT_EXTENSION_SHARED_ROOT = 'src/shared';
const LIGHT_EXTENSION_REPO_ROOT_FILE_PATHS = ['README.md', 'tsconfig.json'] as const;
const LIGHT_EXTENSION_REPO_ROOT_FILES = new Set<string>(LIGHT_EXTENSION_REPO_ROOT_FILE_PATHS);
const LIGHT_EXTENSION_CLIENT_KIND_TEMPLATE_FILES = [
  'src/client/js-fields/example/index.tsx',
  'src/client/js-actions/example/index.ts',
  'src/client/js-items/example/index.tsx',
  'src/client/runjs/example/index.ts',
] as const;
const LIGHT_EXTENSION_CLIENT_KIND_ROOTS = [
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
  embedded = false,
  defaultFilesCollapsed = false,
  repoId: repoIdProp,
  initialPath,
  workspaceScope = REPOSITORY_WORKSPACE_SCOPE,
  entryId,
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
  const { compileWorkspacePreview, getRepo, inspectSourceArchive, listCommits, pull, pullCommit, saveSource } =
    useLightExtensionRepo();
  const [repo, setRepo] = useState<LightExtensionRepoRecord | null>(null);
  const [baseCommitSeq, setBaseCommitSeq] = useState<number>();
  const [baseFiles, setBaseFiles] = useState<WorkspaceFile[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | undefined>();
  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [filesCollapsed, setFilesCollapsed] = useState(defaultFilesCollapsed);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  const [historyItems, setHistoryItems] = useState<RunJSSourceHistoryItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<LightExtensionDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializedRepoId, setInitializedRepoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
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
  const workspaceFullscreen = useFullscreenOverlay();
  const embeddedSaveRequestRef = useRef<{
    resolve: (result: EmbeddedRunJSEditorSaveResult) => void;
    reject: (error: unknown) => void;
  } | null>(null);
  const embeddedSavePromiseRef = useRef<Promise<EmbeddedRunJSEditorSaveResult> | null>(null);
  const historyRequestSeqRef = useRef(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const latestPreviewSnapshotRef = useRef('');
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
        setIsDiff(false);
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load source') });
      } finally {
        setLoading(false);
        setInitializedRepoId(repoId);
      }
    },
    [getRepo, initialPath, listCommits, pull, repoId, t],
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const activeFile = files.find((file) => file.path === activePath);
  const settingsTypegen = useMemo(() => generateClientSettingsTypes({ files }), [files]);
  const authoringFiles = useMemo(
    () => addLightExtensionSdkShim(addSettingsTypeFiles(files, settingsTypegen.files)),
    [files, settingsTypegen.files],
  );
  const filesForSave = useMemo(() => ensurePersistedLightExtensionSdkShim(files), [files]);
  const dirtyChanges = useMemo(() => buildFileChanges(baseFiles, filesForSave), [baseFiles, filesForSave]);
  const saveSummary = useMemo(() => summarizeWorkspaceChanges(baseFiles, filesForSave), [baseFiles, filesForSave]);
  const diffRows = useMemo(
    () => buildLineDiff(baseFiles, filesForSave, activePath, false),
    [activePath, baseFiles, filesForSave],
  );
  const hasUnsavedLocalChanges = dirtyChanges.length > 0;
  const canWrite = Boolean(repo && repo.lifecycleStatus !== 'archived');
  const hasBlockedDirtyChanges = dirtyChanges.some(
    (change) => !canChangeLightExtensionWorkspacePath(workspaceScope, change.path),
  );
  const activeFileReadOnly =
    !canWrite || !activePath || !getLightExtensionWorkspacePathAccess(workspaceScope, activePath, 'file').canWrite;
  const previewSnapshotKey = useMemo(
    () => buildWorkspacePreviewSnapshot(files, workspaceScope),
    [files, workspaceScope],
  );
  latestPreviewSnapshotRef.current = previewSnapshotKey;
  const canPreview = entryScoped && Boolean(onPreview);
  const canMoveToInline = entryScoped && Boolean(onMoveToInline);

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
      ...getCompanionWorkspaceFiles(nextPath, files),
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

    const filesWithEntryKey = ensureEntryKeyBeforeRootFolderRename(files, path);
    const nextFiles = normalizeWorkspaceFiles(
      filesWithEntryKey.map((file) => ({
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

  const saveChanges = useCallback(async () => {
    const commitMessage = versionMessage.trim();
    if (!repoId || !commitMessage || dirtyChanges.length === 0 || hasBlockedDirtyChanges) {
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
        repoId,
        message: commitMessage,
        files: dirtyChanges,
      });
      setDiagnostics(result.diagnostics);
      setBaseFiles(filesForSave);
      if (onRequestClose) {
        await onRequestClose();
      } else {
        await loadWorkspace();
      }
      onSaved?.();
      const request = embeddedSaveRequestRef.current;
      embeddedSaveRequestRef.current = null;
      embeddedSavePromiseRef.current = null;
      request?.resolve('saved');
    } catch (error) {
      const request = embeddedSaveRequestRef.current;
      embeddedSaveRequestRef.current = null;
      embeddedSavePromiseRef.current = null;
      request?.reject(error);
      setDiagnostics(getLightExtensionErrorDiagnostics(error) as LightExtensionDiagnostic[]);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to save source') });
    } finally {
      setSaving(false);
    }
  }, [
    dirtyChanges,
    filesForSave,
    hasBlockedDirtyChanges,
    loadWorkspace,
    onSaved,
    onRequestClose,
    pathRestrictionReason,
    repoId,
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

  const footerActions = useMemo<LightExtensionWorkspaceFooterActions>(
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
    (diagnostic: LightExtensionDiagnostic) => {
      if (!diagnostic.path) {
        return;
      }
      if (!files.some((file) => file.path === diagnostic.path)) {
        setNotice({ type: 'warning', message: t('Diagnostic source is not loaded') });
        return;
      }

      openFilePath(diagnostic.path);
      setNotice({ type: 'info', message: t('Opened diagnostic source') });
    },
    [files, openFilePath, t],
  );

  const runPreview = useCallback(async () => {
    if (!canPreview || workspaceScope.mode !== 'entry' || !onPreview) {
      return;
    }

    const requestSnapshotKey = previewSnapshotKey;
    setPreviewing(true);
    setNotice(null);
    try {
      const result = await compileWorkspacePreview({
        repoId,
        entryId,
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
      if (latestPreviewSnapshotRef.current !== requestSnapshotKey) {
        setNotice({ type: 'info', message: t('Source changed while preview was compiling. Run again.') });
        return;
      }

      setDiagnostics(result.diagnostics);
      if (!result.accepted || !result.artifact) {
        setNotice({ type: 'error', message: t('Preview failed') });
        return;
      }

      await onPreview(result.artifact);
    } catch (error) {
      setDiagnostics(getLightExtensionErrorDiagnostics(error) as LightExtensionDiagnostic[]);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Preview failed') });
    } finally {
      setPreviewing(false);
    }
  }, [canPreview, compileWorkspacePreview, entryId, files, onPreview, previewSnapshotKey, repoId, t, workspaceScope]);

  const moveToInline = useCallback(async () => {
    if (!canMoveToInline || workspaceScope.mode !== 'entry' || !onMoveToInline) {
      return;
    }

    setMovingToInline(true);
    setNotice(null);
    try {
      await onMoveToInline({
        entryPath: workspaceScope.entryPath,
        files: files.map((file) => ({ ...file })),
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
  }, [canMoveToInline, files, onMoveToInline, t, workspaceScope]);

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
        setDiagnostics([]);
        setIsDiff(false);
        message.success(t('ZIP imported. Save to create a new version.'));
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to import ZIP') });
      } finally {
        setImporting(false);
      }
    },
    [activePath, canWrite, files, importing, inspectSourceArchive, repoId, t, workspaceScope],
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
                      {activeFileReadOnly && entryScoped ? (
                        <Alert message={pathRestrictionReason} showIcon style={{ marginBottom: 8 }} type="info" />
                      ) : null}
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
                        onChange={updateActiveFile}
                        onCloseFile={closeOpenFile}
                        onDiffToggle={() => setIsDiff((current) => !current)}
                        onFilesCollapsedChange={setFilesCollapsed}
                        onOpenFile={openFilePath}
                        onRunPreview={canPreview ? runPreview : undefined}
                        openPaths={openPaths}
                        previewing={previewing}
                        readOnly={activeFileReadOnly}
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
                    </>
                  ) : null}
                </main>
              </div>
              <div
                data-testid="light-extension-workspace-diagnostics"
                style={{
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  flex: '0 0 auto',
                  maxHeight: workspaceFullscreen.isFullscreen ? '32%' : 160,
                  minHeight: 96,
                  overflowX: 'hidden',
                  overflowY: diagnostics.length > 0 ? 'auto' : 'hidden',
                  padding: 12,
                }}
              >
                <DiagnosticsPanel diagnostics={diagnostics} onOpenDiagnostic={openDiagnosticSource} />
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

function normalizeWorkspaceFiles(files: LightExtensionTreeEntryInput[]): WorkspaceFile[] {
  return files
    .map((file) => ({
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
    if (!existing.has(LIGHT_EXTENSION_SDK_SHIM_PATH)) {
      return LIGHT_EXTENSION_SDK_SHIM_PATH;
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

function getCompanionWorkspaceFiles(path: string, files: WorkspaceFile[]): WorkspaceFile[] {
  if (path !== 'tsconfig.json' || files.some((file) => file.path === LIGHT_EXTENSION_SDK_SHIM_PATH)) {
    return [];
  }

  return [
    {
      path: LIGHT_EXTENSION_SDK_SHIM_PATH,
      content: LIGHT_EXTENSION_SDK_SHIM_CONTENT,
      language: 'typescript',
    },
  ];
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
    if (!baseFile || baseFile.content !== file.content) {
      changes.push({
        path: file.path,
        content: file.content,
        language: file.language || inferLightExtensionLanguageFromPath(file.path),
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

function addLightExtensionSdkShim(files: WorkspaceFile[]): WorkspaceFile[] {
  return upsertWorkspaceSdkShim(files);
}

function addSettingsTypeFiles(
  files: WorkspaceFile[],
  settingsTypeFiles: LightExtensionSettingsTypegenResult['files'],
): WorkspaceFile[] {
  const sourceFiles = files.filter((file) => !file.path.startsWith('.light-extension/types/'));
  return mergeFiles(
    sourceFiles,
    settingsTypeFiles.map((file) => ({
      path: file.path,
      content: file.content,
      language: 'typescript',
    })),
  );
}

function ensureEntryKeyBeforeRootFolderRename(files: WorkspaceFile[], folderPath: string): WorkspaceFile[] {
  const match = folderPath.match(/^src\/client\/(?:js-blocks|js-fields|js-actions|js-items|runjs)\/([^/]+)$/);
  const entryKey = match?.[1];
  if (!entryKey || !LIGHT_EXTENSION_ENTRY_KEY_PATTERN.test(entryKey)) {
    return files;
  }

  const metaPath = `${folderPath}/meta.json`;
  const metaFile = files.find((file) => file.path === metaPath);
  if (!metaFile) {
    return mergeFiles(files, [
      {
        path: metaPath,
        content: `${JSON.stringify({ key: entryKey }, null, 2)}\n`,
        language: 'json',
      },
    ]);
  }

  try {
    const meta = JSON.parse(metaFile.content) as unknown;
    if (!meta || typeof meta !== 'object' || Array.isArray(meta) || Object.prototype.hasOwnProperty.call(meta, 'key')) {
      return files;
    }

    return files.map((file) =>
      file.path === metaPath
        ? {
            ...file,
            content: `${JSON.stringify({ key: entryKey, ...(meta as Record<string, unknown>) }, null, 2)}\n`,
            language: 'json',
          }
        : file,
    );
  } catch {
    return files;
  }
}

function ensurePersistedLightExtensionSdkShim(files: WorkspaceFile[]): WorkspaceFile[] {
  return shouldPersistLightExtensionSdkShim(files) ? upsertWorkspaceSdkShim(files) : files;
}

function shouldPersistLightExtensionSdkShim(files: WorkspaceFile[]): boolean {
  const existingShim = files.find((file) => file.path === LIGHT_EXTENSION_SDK_SHIM_PATH);
  if (existingShim?.content === LIGHT_EXTENSION_SDK_SHIM_CONTENT) {
    return false;
  }

  return files.some(
    (file) =>
      (file.path === 'tsconfig.json' && file.content.includes('@nocobase/light-extension-sdk/')) ||
      isClientSettingsFilePath(file.path) ||
      (isCodeFilePath(file.path) && file.content.includes('@nocobase/light-extension-sdk/')),
  );
}

function upsertWorkspaceSdkShim(files: WorkspaceFile[]): WorkspaceFile[] {
  return mergeFiles(files, [
    {
      path: LIGHT_EXTENSION_SDK_SHIM_PATH,
      content: LIGHT_EXTENSION_SDK_SHIM_CONTENT,
      language: 'typescript',
    },
  ]);
}

function isCodeFilePath(path: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx'].includes(getExtension(path));
}

function isClientSettingsFilePath(path: string): boolean {
  return /^src\/client\/(?:js-blocks|js-fields|js-actions|js-items|runjs)\/[^/]+\/settings\.json$/.test(path);
}

function inferLightExtensionLanguageFromPath(path: string): string {
  return inferLanguageFromPath(path, { cssLanguage: 'text', jsxLanguage: 'language-family' });
}

function buildWorkspacePreviewSnapshot(files: WorkspaceFile[], workspaceScope: LightExtensionWorkspaceScope): string {
  return JSON.stringify({
    workspaceScope,
    files: files.map((file) => [file.path, file.content, file.language || '', file.mode || '']),
  });
}

export default LightExtensionWorkspacePage;
