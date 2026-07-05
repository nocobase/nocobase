/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CopyOutlined, DownloadOutlined, FolderOpenOutlined, ReloadOutlined } from '@ant-design/icons';
import { diagnoseRunJS, type RunJSEditorProviderRenderProps } from '@nocobase/client-v2';
import { useFlowContext, type FlowContext, type FlowEngineContext, type RunJSValue } from '@nocobase/flow-engine';
import { Alert, Button, Modal, Space, Spin, Typography, message } from 'antd';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { RunJSCompileDiagnostic } from './types';
import { formatVscComponentError } from '../components/utils';
import { useT } from '../locale';
import {
  CloseConfirmModal,
  CodeTab,
  ConflictDialog,
  ConsolePanel,
  FilesPanel,
  PublishModal,
  RestoreVersionModal,
  SaveDiagnosticsModal,
  VersionHistoryDock,
} from './RunJSStudioComponents';
import type {
  RunJSConsoleEntry,
  RunJSSourceHistoryItem,
  RunJSSourceOpenWorkspaceResult,
  RunJSWorkspaceFile,
} from './types';
import type {
  ActionErrorState,
  ClosableView,
  ConflictState,
  DiffViewState,
  ExportDownloadState,
  OpenWorkspaceAction,
  PendingDirtyAction,
  PreviewArtifactState,
  WorkspaceLoadResult,
} from './studioInternalTypes';
import {
  appendDiagnostics,
  appendRunDiagnostics,
  buildNewFilePath,
  buildNewFolderPath,
  buildRunJSExportFileName,
  buildWorkspaceLoadResult,
  canPublish,
  collectRunJSWorkspaceFolders,
  createRunJSWorkspaceObjectUrl,
  defaultConsolePanelHeight,
  defaultEntryPath,
  downloadRunJSWorkspaceBlob,
  findCommit,
  getRunJSBaseName,
  getRunJSDirectory,
  hasCompileErrorDiagnostics,
  isConflictError,
  isOwnerOutdatedError,
  isRunJSPathInsideFolder,
  minConsolePanelHeight,
  readFileAsDataUrl,
  replaceRunJSPathPrefix,
  resolveStudioSize,
  revokeRunJSWorkspaceObjectUrl,
  validateRunJSWorkspaceForSave,
} from './studioUtils';
import {
  RunJSSourceRequestError,
  formatRunJSSourceRequestTechnicalDetails,
  useRunJSSourceResource,
} from './useRunJSSourceResource';
import {
  applyWorkspaceChanges,
  buildChangedWorkspaceFileList,
  buildLineDiff,
  buildWorkspaceChanges,
  buildWorkspaceSnapshotKey,
  ensureManifestFolders,
  ensureManifestEntry,
  formatVersion,
  hasWorkspaceChanges,
  inferLanguageFromPath,
  normalizeRunJSWorkspaceFolderPath,
  normalizeRunJSWorkspacePath,
  normalizeWorkspaceFiles,
  removeWorkspaceFile,
  replaceWorkspaceFilePath,
  resolveWorkspaceEntryPath,
  runJSManifestPath,
  summarizeWorkspaceChanges,
  updateWorkspaceFile,
  upsertWorkspaceFile,
  validateRunJSWorkspaceFolderPath,
  validateRunJSWorkspacePath,
} from './workspaceUtils';

export function useRunJSStudioController(props: RunJSEditorProviderRenderProps) {
  const { t: hostT, value, onChange, scene = 'formValue', readOnly, disabled, containerStyle } = props;
  const pluginT = useT();
  const t = hostT || pluginT;
  const resource = useRunJSSourceResource();
  const flowCtx = useFlowContext<FlowEngineContext | null>();
  const runJSSourceRequest = resource.request;
  const locatorKey = useMemo(() => JSON.stringify(props.locator || null), [props.locator]);
  const previousLocatorKeyRef = useRef(locatorKey);
  const requestSeqRef = useRef(0);
  const consoleSeqRef = useRef(0);
  const latestWorkspaceSnapshotRef = useRef('');
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [workspace, setWorkspace] = useState<RunJSSourceOpenWorkspaceResult | null>(null);
  const [workspaceError, setWorkspaceError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<ActionErrorState | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [baseFiles, setBaseFiles] = useState<RunJSWorkspaceFile[]>([]);
  const [savedFiles, setSavedFiles] = useState<RunJSWorkspaceFile[]>([]);
  const [files, setFiles] = useState<RunJSWorkspaceFile[]>([]);
  const [entryPath, setEntryPath] = useState(defaultEntryPath);
  const [activePath, setActivePath] = useState<string | undefined>();
  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('code');
  const [filesCollapsed, setFilesCollapsed] = useState(true);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<RunJSConsoleEntry[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewDiagnostics, setPreviewDiagnostics] = useState<RunJSCompileDiagnostic[]>([]);
  const [saveDiagnostics, setSaveDiagnostics] = useState<RunJSCompileDiagnostic[]>([]);
  const [saveDiagnosticsOpen, setSaveDiagnosticsOpen] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<PreviewArtifactState | null>(null);
  const [diffView, setDiffView] = useState<DiffViewState | null>(null);
  const [selectedDiffPath, setSelectedDiffPath] = useState<string | undefined>();
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoreCommit, setRestoreCommit] = useState<RunJSSourceHistoryItem | null>(null);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [pendingDirtyAction, setPendingDirtyAction] = useState<PendingDirtyAction>('close');
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [consoleHeight, setConsoleHeight] = useState(defaultConsolePanelHeight);
  const [exportDownload, setExportDownload] = useState<ExportDownloadState | null>(null);

  const workspaceReadOnly = Boolean(readOnly || disabled || (workspace && !workspace.permissions.canWrite));
  const workspaceEditingDisabled = workspaceReadOnly || publishing;
  const hasUnsavedLocalChanges = hasWorkspaceChanges(savedFiles, files);
  const publishSummary = summarizeWorkspaceChanges(baseFiles, files);
  const currentPreviewSnapshotKey = buildWorkspaceSnapshotKey(files, entryPath, value.version);
  const showDiff = activeTab === 'diff';
  const effectiveDiffBaseFiles = diffView?.baseFiles || baseFiles;
  const effectiveDiffFiles = diffView?.files || files;
  const activeFile = activePath ? files.find((file) => file.path === activePath) : undefined;
  const historyItems = workspace?.history?.items || [];
  const baseCommitId = workspace?.repository?.headCommitId ?? workspace?.repository?.publishedCommitId ?? null;
  const baseCommit = findCommit(historyItems, baseCommitId);
  const lineDiffRows = useMemo(
    () => buildLineDiff(effectiveDiffBaseFiles, effectiveDiffFiles, selectedDiffPath, false),
    [effectiveDiffBaseFiles, effectiveDiffFiles, selectedDiffPath],
  );

  useLayoutEffect(() => {
    const view = flowCtx?.view as ClosableView | undefined;
    view?.setFooter?.(null);
    const timer = window.setTimeout(() => {
      view?.setFooter?.(null);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [flowCtx?.view]);

  useEffect(() => {
    return () => {
      if (exportDownload?.url) {
        revokeRunJSWorkspaceObjectUrl(exportDownload.url);
      }
    };
  }, [exportDownload?.url]);

  useEffect(() => {
    if (showDiff && activePath) {
      setSelectedDiffPath(activePath);
    }
  }, [activePath, showDiff]);

  const appendConsole = useCallback((entry: Omit<RunJSConsoleEntry, 'id'>) => {
    consoleSeqRef.current += 1;
    const id = consoleSeqRef.current;
    setConsoleEntries((current) => [...current, { ...entry, id }]);
  }, []);

  const syncWorkspaceSnapshotRef = useCallback(
    (nextFiles: RunJSWorkspaceFile[], nextEntryPath: string) => {
      latestWorkspaceSnapshotRef.current = buildWorkspaceSnapshotKey(nextFiles, nextEntryPath, value.version);
    },
    [value.version],
  );

  const clearConsole = useCallback(() => {
    setConsoleEntries([]);
  }, []);

  const invalidatePreview = useCallback(() => {
    setPreviewArtifact(null);
    setPreviewDiagnostics([]);
    setSaveDiagnostics([]);
    setSaveDiagnosticsOpen(false);
  }, []);

  const rememberDialogTrigger = useCallback(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      dialogTriggerRef.current = document.activeElement;
    }
  }, []);

  const restoreDialogFocus = useCallback(() => {
    const target = dialogTriggerRef.current;
    const focus = () => target?.focus();

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.setTimeout(focus, 0);
      });
      return;
    }

    setTimeout(focus, 0);
  }, []);

  const reportActionError = useCallback((error: unknown, title: string, retry: () => unknown | Promise<unknown>) => {
    if (isConflictError(error)) {
      return;
    }

    setActionError({ error, title, retry });
  }, []);

  const retryActionError = async () => {
    const retry = actionError?.retry;
    if (!retry) {
      return;
    }

    setActionError(null);
    await retry();
  };

  const copyActionErrorDetails = async () => {
    if (!actionError) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(
        formatRunJSSourceRequestTechnicalDetails(actionError.error, actionError.title),
      );
      message.success(t('Details copied'));
    } catch (_) {
      message.error(t('Copy details failed'));
    }
  };

  const resetWorkspaceState = useCallback(() => {
    requestSeqRef.current += 1;
    latestWorkspaceSnapshotRef.current = '';
    setWorkspace(null);
    setWorkspaceError(null);
    setActionError(null);
    setLoadingWorkspace(false);
    setBaseFiles([]);
    setSavedFiles([]);
    setFiles([]);
    setEntryPath(defaultEntryPath);
    setActivePath(undefined);
    setOpenPaths([]);
    setActiveTab('code');
    setConsoleEntries([]);
    setPublishOpen(false);
    setCommitMessage('');
    setPreviewing(false);
    setPublishing(false);
    setPreviewDiagnostics([]);
    setSaveDiagnostics([]);
    setSaveDiagnosticsOpen(false);
    setPreviewArtifact(null);
    setDiffView(null);
    setSelectedDiffPath(undefined);
    setHistoryLoading(false);
    setRestoreCommit(null);
    setRestoringVersion(false);
    setCloseConfirmOpen(false);
    setPendingDirtyAction('close');
    setConflict(null);
  }, []);

  useEffect(() => {
    if (previousLocatorKeyRef.current === locatorKey) {
      return;
    }

    previousLocatorKeyRef.current = locatorKey;
    resetWorkspaceState();
  }, [locatorKey, resetWorkspaceState]);

  useEffect(() => {
    latestWorkspaceSnapshotRef.current = currentPreviewSnapshotKey;
  }, [currentPreviewSnapshotKey]);

  const openFilePath = useCallback((path: string | undefined) => {
    if (!path) {
      return;
    }

    setActivePath(path);
    setOpenPaths((current) => (current.includes(path) ? current : [...current, path]));
  }, []);

  const closeOpenFile = useCallback(
    (path: string) => {
      setOpenPaths((current) => {
        const next = current.filter((item) => item !== path);
        if (activePath === path) {
          setActivePath(next[next.length - 1] || files.find((file) => file.path !== path)?.path);
        }

        return next;
      });
    },
    [activePath, files],
  );

  const replaceOpenFilePath = useCallback((fromPath: string, toPath: string) => {
    setActivePath((current) => (current === fromPath ? toPath : current));
    setOpenPaths((current) => {
      const next = current.map((path) => (path === fromPath ? toPath : path));
      return next.includes(toPath) ? Array.from(new Set(next)) : next;
    });
  }, []);

  const applyWorkspaceLoadResult = useCallback(
    (loaded: WorkspaceLoadResult) => {
      const nextActivePath =
        loaded.currentFiles.find((file) => file.path === loaded.entryPath)?.path ||
        loaded.currentFiles[0]?.path ||
        loaded.entryPath;

      setWorkspace(loaded.opened);
      setBaseFiles(loaded.baseFiles);
      setSavedFiles(loaded.currentFiles);
      setFiles(loaded.currentFiles);
      setEntryPath(loaded.entryPath);
      latestWorkspaceSnapshotRef.current = buildWorkspaceSnapshotKey(
        loaded.currentFiles,
        loaded.entryPath,
        value.version,
      );
      setActivePath(nextActivePath);
      setOpenPaths([nextActivePath]);
      setDiffView(null);
      setSelectedDiffPath(undefined);
      setPreviewDiagnostics([]);
      setPreviewArtifact(null);
      setRestoreCommit(null);
      setRestoringVersion(false);
      setActionError(null);
    },
    [value.version],
  );

  const openWorkspaceSnapshot = useCallback(
    async (action: OpenWorkspaceAction = 'open'): Promise<WorkspaceLoadResult | null> => {
      if (!props.locator) {
        return null;
      }

      const opened = await runJSSourceRequest(action, { locator: props.locator });
      return buildWorkspaceLoadResult(opened);
    },
    [props.locator, runJSSourceRequest],
  );

  const loadWorkspaceByAction = useCallback(
    async (action: OpenWorkspaceAction): Promise<WorkspaceLoadResult | null> => {
      if (!props.locator) {
        return null;
      }

      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;
      setLoadingWorkspace(true);
      setWorkspaceError(null);

      try {
        const loaded = await openWorkspaceSnapshot(action);
        if (requestSeqRef.current !== requestSeq) {
          return null;
        }
        if (!loaded) {
          return null;
        }

        applyWorkspaceLoadResult(loaded);

        return loaded;
      } catch (error) {
        if (requestSeqRef.current === requestSeq) {
          setWorkspaceError(error);
        }
        return null;
      } finally {
        if (requestSeqRef.current === requestSeq) {
          setLoadingWorkspace(false);
        }
      }
    },
    [applyWorkspaceLoadResult, openWorkspaceSnapshot, props.locator],
  );

  const loadWorkspace = useCallback(async (): Promise<WorkspaceLoadResult | null> => {
    return loadWorkspaceByAction('open');
  }, [loadWorkspaceByAction]);

  const editLatestSavedVersion = useCallback(async (): Promise<void> => {
    await loadWorkspaceByAction('openLatest');
  }, [loadWorkspaceByAction]);

  const restoreLatestVersionFromCurrentCode = useCallback(async (): Promise<void> => {
    if (!props.locator) {
      return;
    }

    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setLoadingWorkspace(true);
    setWorkspaceError(null);

    try {
      const opened = await runJSSourceRequest('restoreFromCode', { locator: props.locator });
      const loaded = buildWorkspaceLoadResult(opened);
      if (requestSeqRef.current !== requestSeq) {
        return;
      }
      applyWorkspaceLoadResult(loaded);
      message.success(t('Recovered latest version from current code'));
    } catch (error) {
      if (requestSeqRef.current === requestSeq) {
        setWorkspaceError(error);
      }
    } finally {
      if (requestSeqRef.current === requestSeq) {
        setLoadingWorkspace(false);
      }
    }
  }, [applyWorkspaceLoadResult, props.locator, runJSSourceRequest, t]);

  useEffect(() => {
    if (!workspace && !loadingWorkspace && !workspaceError) {
      loadWorkspace();
    }
  }, [loadWorkspace, loadingWorkspace, workspace, workspaceError]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const primary = event.metaKey || event.ctrlKey;
      if (!primary) {
        return;
      }

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        openPublishModal();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        runPreview();
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        formatActiveFile();
        return;
      }

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setFilesCollapsed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  useEffect(() => {
    if (!hasUnsavedLocalChanges || typeof window === 'undefined') {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedLocalChanges]);

  const runPreview = async () => {
    const currentWorkspace = workspace
      ? { opened: workspace, baseFiles, currentFiles: files, entryPath }
      : await loadWorkspace();
    if (!currentWorkspace || !props.locator) {
      return;
    }

    clearConsole();
    setActionError(null);
    setActiveTab('code');
    setPreviewing(true);
    setPreviewDiagnostics([]);
    const requestSnapshotKey = buildWorkspaceSnapshotKey(
      currentWorkspace.currentFiles,
      currentWorkspace.entryPath,
      value.version,
    );
    try {
      const result = await runJSSourceRequest('compilePreview', {
        locator: props.locator,
        repoId: currentWorkspace.opened.repository.repoId,
        baseCommitId:
          currentWorkspace.opened.repository.headCommitId ?? currentWorkspace.opened.repository.publishedCommitId,
        files: buildWorkspaceChanges([], currentWorkspace.currentFiles),
        entryPath: currentWorkspace.entryPath,
        version: value.version,
      });
      if (latestWorkspaceSnapshotRef.current !== requestSnapshotKey) {
        return;
      }
      setPreviewDiagnostics(result.artifact.diagnostics);
      setPreviewArtifact({
        code: result.artifact.code,
        version: result.artifact.version,
        snapshotKey: requestSnapshotKey,
      });
      appendDiagnostics(result.artifact.diagnostics, appendConsole);
      const hasCompileError = result.artifact.diagnostics.some((diagnostic) => diagnostic.severity === 'error');
      if (!hasCompileError) {
        if (flowCtx) {
          const runDiagnostics = await diagnoseRunJS(result.artifact.code, flowCtx as unknown as FlowContext, {
            sourceMap: result.artifact.sourceMap,
            version: result.artifact.version,
          });
          if (latestWorkspaceSnapshotRef.current !== requestSnapshotKey) {
            return;
          }
          appendRunDiagnostics(runDiagnostics, appendConsole);
        }
        await props.onPreview?.({
          ...value,
          code: result.artifact.code,
          version: result.artifact.version,
        } as RunJSValue);
      }
      appendConsole({
        level: hasCompileError ? 'error' : 'info',
        message: hasCompileError ? t('Compile failed') : t('Run completed'),
      });
    } catch (error) {
      await handleWorkspaceError(error);
      reportActionError(error, t('Run failed'), runPreview);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Run failed')),
      });
    } finally {
      setPreviewing(false);
    }
  };

  const openPublishModal = async () => {
    if (workspaceEditingDisabled || !workspace?.permissions.canPublish) {
      return;
    }

    rememberDialogTrigger();
    setCommitMessage('');
    setActionError(null);

    if (publishSummary.files === 0) {
      message.info(t('No changes to save'));
      return;
    }

    const requestFiles = normalizeWorkspaceFiles(files);
    const requestEntryPath = entryPath;
    const requestSnapshotKey = currentPreviewSnapshotKey;
    try {
      const compiled = await compileForPublish(requestFiles, requestEntryPath, requestSnapshotKey);
      if (!compiled) {
        return;
      }

      setPublishOpen(true);
    } catch (error) {
      await handleWorkspaceError(error);
      reportActionError(error, t('Save failed'), openPublishModal);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Save failed')),
      });
    }
  };

  const showSaveDiagnostics = useCallback((diagnostics: RunJSCompileDiagnostic[]) => {
    setSaveDiagnostics(diagnostics);
    setSaveDiagnosticsOpen(true);
    setPublishOpen(false);
  }, []);

  const publish = async () => {
    if (!workspace || !props.locator || workspaceEditingDisabled) {
      return;
    }

    if (hasCompileErrorDiagnostics(previewDiagnostics)) {
      showSaveDiagnostics(previewDiagnostics);
      return;
    }

    if (!canPublish(commitMessage, publishSummary, previewDiagnostics, workspaceEditingDisabled)) {
      return;
    }

    setPublishing(true);
    setActionError(null);
    const requestSnapshotKey = currentPreviewSnapshotKey;
    const requestFiles = normalizeWorkspaceFiles(files);
    const requestEntryPath = entryPath;
    try {
      const compiled =
        previewArtifact &&
        previewArtifact.snapshotKey === requestSnapshotKey &&
        previewDiagnostics.every((diagnostic) => diagnostic.severity !== 'error')
          ? previewArtifact
          : await compileForPublish(requestFiles, requestEntryPath, requestSnapshotKey);
      if (!compiled) {
        return;
      }

      const result = await runJSSourceRequest('publish', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        baseCommitId,
        basePublishedCommitId: workspace.repository.publishedCommitId,
        baseOwnerFingerprint: workspace.ownerFingerprint,
        basePublishedOwnerFingerprint: workspace.publishedOwnerFingerprint || workspace.ownerFingerprint,
        message: commitMessage.trim(),
        files: buildWorkspaceChanges(baseFiles, requestFiles),
        entryPath: requestEntryPath,
        version: compiled.version,
      });
      if (latestWorkspaceSnapshotRef.current !== requestSnapshotKey) {
        appendConsole({
          level: 'info',
          message: t('Saved successfully'),
        });
        return;
      }
      setPublishOpen(false);
      appendConsole({
        level: 'info',
        message: t('Saved successfully'),
      });
      onChange?.({
        ...value,
        code: compiled.code,
        version: compiled.version,
      } as RunJSValue);
      await loadWorkspace();
      setPreviewDiagnostics(result.artifact.diagnostics);
      await closeEditorView();
    } catch (error) {
      await handleWorkspaceError(error);
      reportActionError(error, t('Save failed'), publish);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Save failed')),
      });
    } finally {
      setPublishing(false);
    }
  };

  const compileForPublish = async (
    requestFiles = files,
    requestEntryPath = entryPath,
    requestSnapshotKey = currentPreviewSnapshotKey,
  ): Promise<PreviewArtifactState | null> => {
    if (!workspace || !props.locator) {
      return null;
    }

    const workspaceDiagnostics = validateRunJSWorkspaceForSave(requestFiles, requestEntryPath, t);
    if (hasCompileErrorDiagnostics(workspaceDiagnostics)) {
      setPreviewDiagnostics(workspaceDiagnostics);
      appendDiagnostics(workspaceDiagnostics, appendConsole);
      showSaveDiagnostics(workspaceDiagnostics);
      return null;
    }

    setPreviewing(true);
    try {
      const result = await runJSSourceRequest('compilePreview', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        baseCommitId,
        files: buildWorkspaceChanges([], requestFiles),
        entryPath: requestEntryPath,
        version: value.version,
      });
      if (latestWorkspaceSnapshotRef.current !== requestSnapshotKey) {
        return null;
      }
      setPreviewDiagnostics(result.artifact.diagnostics);
      appendDiagnostics(result.artifact.diagnostics, appendConsole);

      if (hasCompileErrorDiagnostics(result.artifact.diagnostics)) {
        showSaveDiagnostics(result.artifact.diagnostics);
        return null;
      }

      const compiled = {
        code: result.artifact.code,
        version: result.artifact.version,
        snapshotKey: requestSnapshotKey,
      };
      setPreviewArtifact(compiled);
      return compiled;
    } finally {
      setPreviewing(false);
    }
  };

  const refreshHistory = async () => {
    if (!workspace || !props.locator) {
      return;
    }

    setHistoryLoading(true);
    setActionError(null);
    try {
      const result = await runJSSourceRequest('listHistory', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
      });
      setWorkspace((current) =>
        current
          ? {
              ...current,
              repository: result.repository,
              history: {
                commits: result.commits,
                items: result.items,
              },
            }
          : current,
      );
    } catch (error) {
      reportActionError(error, t('Failed to load history'), refreshHistory);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Failed to load history')),
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadVersionIntoEditor = async (commit: RunJSSourceHistoryItem) => {
    if (!workspace || !props.locator || workspaceEditingDisabled || hasUnsavedLocalChanges) {
      return;
    }
    const restoreSnapshotKey = latestWorkspaceSnapshotRef.current;

    setRestoringVersion(true);
    setActionError(null);
    try {
      const result = await runJSSourceRequest('getVersion', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        commitId: commit.id,
        includeFiles: true,
      });
      if (latestWorkspaceSnapshotRef.current !== restoreSnapshotKey) {
        appendConsole({
          level: 'warn',
          message: t('Restore skipped because local edits changed'),
        });
        return;
      }
      const nextFiles = normalizeWorkspaceFiles(result.files);
      const nextEntryPath = resolveWorkspaceEntryPath(nextFiles, entryPath);
      const nextActivePath = nextFiles.find((file) => file.path === nextEntryPath)?.path || nextFiles[0]?.path;
      setFiles(nextFiles);
      setEntryPath(nextEntryPath);
      syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);
      setActivePath(nextActivePath);
      setOpenPaths(nextActivePath ? [nextActivePath] : []);
      setActiveTab('code');
      setDiffView(null);
      invalidatePreview();
      appendConsole({
        level: 'info',
        message: `${t('Restored from')} ${formatVersion(commit.seq)}`,
      });
    } catch (error) {
      await handleWorkspaceError(error);
      reportActionError(error, t('Failed to restore version'), () => loadVersionIntoEditor(commit));
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Failed to restore version')),
      });
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

  const createFile = (parentPath = defaultRunJSSourceRoot): string | undefined => {
    if (workspaceEditingDisabled) {
      return undefined;
    }

    const nextPath = buildNewFilePath(files, parentPath);
    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const nextFiles = upsertWorkspaceFile(current, {
        path: nextPath,
        content: '',
        language: inferLanguageFromPath(nextPath),
      });
      const nextEntryPath = resolveWorkspaceEntryPath(nextFiles, entryPath);
      const syncedFiles = ensureManifestEntry(nextFiles, nextEntryPath, true);
      syncWorkspaceSnapshotRef(syncedFiles, nextEntryPath);
      setEntryPath(nextEntryPath);
      return syncedFiles;
    });
    openFilePath(nextPath);
    return nextPath;
  };

  const createFolder = (parentPath = defaultRunJSSourceRoot): string | undefined => {
    if (workspaceEditingDisabled) {
      return undefined;
    }

    const nextPath = buildNewFolderPath(files, parentPath);
    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const nextEntryPath = resolveWorkspaceEntryPath(current, entryPath);
      const nextFiles = ensureManifestFolders(
        current,
        [...collectRunJSWorkspaceFolders(current), nextPath],
        nextEntryPath,
        true,
      );
      syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);
      setEntryPath(nextEntryPath);
      return nextFiles;
    });
    return nextPath;
  };

  const renameFile = (path: string, nextPath: string): boolean => {
    if (!path || workspaceEditingDisabled) {
      return false;
    }

    const validation = validateRunJSWorkspacePath(nextPath, t);
    if (!validation.valid) {
      message.error(validation.message || t('Invalid file path'));
      return false;
    }

    const normalizedNextPath = normalizeRunJSWorkspacePath(nextPath);
    if (path !== normalizedNextPath && files.some((file) => file.path === normalizedNextPath)) {
      message.error(t('File already exists'));
      return false;
    }

    if (path === normalizedNextPath) {
      return true;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const renamed = replaceWorkspaceFilePath(current, path, normalizedNextPath);
      const nextEntryPath = resolveWorkspaceEntryPath(renamed, entryPath);
      const nextFiles = ensureManifestEntry(renamed, nextEntryPath, true);
      syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);
      setEntryPath(nextEntryPath);
      return nextFiles;
    });
    replaceOpenFilePath(path, normalizedNextPath);
    openFilePath(normalizedNextPath);
    return true;
  };

  const renameFolder = (path: string, nextPath: string): boolean => {
    if (!path || workspaceEditingDisabled) {
      return false;
    }

    const validation = validateRunJSWorkspaceFolderPath(nextPath, t);
    if (!validation.valid) {
      message.error(validation.message || t('Invalid file path'));
      return false;
    }

    const normalizedNextPath = normalizeRunJSWorkspaceFolderPath(nextPath);
    if (path === normalizedNextPath) {
      return true;
    }

    const currentFolders = collectRunJSWorkspaceFolders(files);
    if (currentFolders.includes(normalizedNextPath)) {
      message.error(t('Folder already exists'));
      return false;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const renamed = current.map((file) => ({
        ...file,
        path: replaceRunJSPathPrefix(file.path, path, normalizedNextPath),
      }));
      const nextFolders = collectRunJSWorkspaceFolders(current).map((folder) =>
        replaceRunJSPathPrefix(folder, path, normalizedNextPath),
      );
      const nextEntryPath = resolveWorkspaceEntryPath(renamed, entryPath);
      const nextFiles = ensureManifestFolders(
        ensureManifestEntry(renamed, nextEntryPath, true),
        nextFolders,
        nextEntryPath,
        true,
      );
      syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);
      setEntryPath(nextEntryPath);
      return nextFiles;
    });
    setOpenPaths((current) => current.map((openPath) => replaceRunJSPathPrefix(openPath, path, normalizedNextPath)));
    setActivePath((current) => (current ? replaceRunJSPathPrefix(current, path, normalizedNextPath) : current));
    return true;
  };

  const deleteFolder = (path: string): boolean => {
    if (!path || workspaceEditingDisabled) {
      return false;
    }

    if (files.some((file) => isRunJSPathInsideFolder(file.path, path))) {
      message.error(t('Folder is not empty'));
      return false;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const nextFolders = collectRunJSWorkspaceFolders(current).filter((folder) => folder !== path);
      const nextEntryPath = resolveWorkspaceEntryPath(current, entryPath);
      const nextFiles = ensureManifestFolders(current, nextFolders, nextEntryPath, true);
      syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);
      setEntryPath(nextEntryPath);
      return nextFiles;
    });
    return true;
  };

  const moveFileToFolder = (path: string, folderPath: string) => {
    if (!path || workspaceEditingDisabled || path === runJSManifestPath) {
      return;
    }

    const fileName = path.split('/').pop();
    if (!fileName) {
      return;
    }

    const nextPath = normalizeRunJSWorkspacePath(`${folderPath}/${fileName}`);
    if (nextPath === path) {
      return;
    }

    if (files.some((file) => file.path === nextPath)) {
      message.error(t('File already exists'));
      return;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const renamed = replaceWorkspaceFilePath(current, path, nextPath);
      const nextEntryPath = resolveWorkspaceEntryPath(renamed, entryPath);
      const nextFiles = ensureManifestEntry(renamed, nextEntryPath, true);
      syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);
      setEntryPath(nextEntryPath);
      return nextFiles;
    });
    replaceOpenFilePath(path, nextPath);
    openFilePath(nextPath);
  };

  const moveFolderToFolder = (path: string, folderPath: string) => {
    if (!path || workspaceEditingDisabled) {
      return;
    }

    if (path === folderPath || folderPath.startsWith(`${path}/`)) {
      return;
    }

    const folderName = getRunJSBaseName(path);
    if (!folderName) {
      return;
    }

    const currentParentPath = getRunJSDirectory(path);
    if (currentParentPath === folderPath) {
      return;
    }

    const nextPath = normalizeRunJSWorkspaceFolderPath(`${folderPath}/${folderName}`);
    const currentFolders = collectRunJSWorkspaceFolders(files);
    if (currentFolders.includes(nextPath)) {
      message.error(t('Folder already exists'));
      return;
    }

    const existingFilePaths = new Set(
      files.filter((file) => !isRunJSPathInsideFolder(file.path, path)).map((file) => file.path),
    );
    const movedFilePaths = files
      .filter((file) => isRunJSPathInsideFolder(file.path, path))
      .map((file) => replaceRunJSPathPrefix(file.path, path, nextPath));
    if (movedFilePaths.some((movedPath) => existingFilePaths.has(movedPath))) {
      message.error(t('File already exists'));
      return;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const renamed = normalizeWorkspaceFiles(
        current.map((file) => {
          if (!isRunJSPathInsideFolder(file.path, path)) {
            return file;
          }

          const nextFilePath = replaceRunJSPathPrefix(file.path, path, nextPath);
          return {
            ...file,
            language: inferLanguageFromPath(nextFilePath),
            path: nextFilePath,
          };
        }),
      );
      const nextFolders = collectRunJSWorkspaceFolders(current).map((folder) =>
        isRunJSPathInsideFolder(folder, path) ? replaceRunJSPathPrefix(folder, path, nextPath) : folder,
      );
      const nextEntryPath = resolveWorkspaceEntryPath(renamed, entryPath);
      const nextFiles = isRunJSPathInsideFolder(runJSManifestPath, path)
        ? renamed
        : ensureManifestFolders(ensureManifestEntry(renamed, nextEntryPath, true), nextFolders, nextEntryPath, true);
      syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);
      setEntryPath(nextEntryPath);
      return nextFiles;
    });
    setOpenPaths((current) => current.map((openPath) => replaceRunJSPathPrefix(openPath, path, nextPath)));
    setActivePath((current) => (current ? replaceRunJSPathPrefix(current, path, nextPath) : current));
  };

  const deleteFile = (path: string | undefined = activePath) => {
    if (!path || workspaceEditingDisabled) {
      return;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const nextFiles = removeWorkspaceFile(current, path);
      const nextEntryPath = resolveWorkspaceEntryPath(nextFiles, entryPath);
      const syncedFiles = ensureManifestEntry(nextFiles, nextEntryPath, true);
      const nextActivePath = syncedFiles.find((file) => file.path === nextEntryPath)?.path || syncedFiles[0]?.path;
      syncWorkspaceSnapshotRef(syncedFiles, nextEntryPath);
      setEntryPath(nextEntryPath);
      setActivePath((currentPath) => (currentPath === path ? nextActivePath : currentPath));
      setOpenPaths((paths) => {
        const nextPaths = paths.filter((openPath) => openPath !== path);
        return nextPaths.length ? nextPaths : nextActivePath ? [nextActivePath] : [];
      });
      return syncedFiles;
    });
  };

  const updateActiveFileContent = (content: string) => {
    if (!activePath || workspaceEditingDisabled) {
      return;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const nextFiles = updateWorkspaceFile(current, activePath, (file) => ({
        ...file,
        content,
      }));
      const nextEntryPath = resolveWorkspaceEntryPath(nextFiles, entryPath);
      if (nextEntryPath !== entryPath) {
        setEntryPath(nextEntryPath);
      }
      syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);

      return nextFiles;
    });
  };

  const formatActiveFile = () => {
    if (!activeFile || workspaceEditingDisabled) {
      return;
    }

    let content = activeFile.content;
    if (activeFile.path.endsWith('.json')) {
      try {
        content = `${JSON.stringify(JSON.parse(content), null, 2)}\n`;
      } catch (_) {
        appendConsole({
          level: 'warn',
          message: t('Current JSON file could not be formatted'),
          path: activeFile.path,
        });
        return;
      }
    } else {
      content = `${content.trimEnd()}\n`;
    }

    updateActiveFileContent(content);
  };

  const copyLogs = async () => {
    const text = consoleEntries.map((entry) => `[${entry.level}] ${entry.message}`).join('\n');
    try {
      await navigator.clipboard?.writeText(text);
      message.success(t('Logs copied'));
    } catch (_) {
      appendConsole({
        level: 'warn',
        message: t('Copy logs failed'),
      });
    }
  };

  const exportWorkspace = async () => {
    if (!workspace || !props.locator) {
      return;
    }

    setActionError(null);
    setExportDownload(null);
    try {
      const exported = await runJSSourceRequest('exportZip', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
      });
      const fileName = buildRunJSExportFileName(workspace.source.label);
      const downloaded = downloadRunJSWorkspaceBlob(exported, fileName);
      if (!downloaded) {
        const url = createRunJSWorkspaceObjectUrl(exported);
        if (url) {
          setExportDownload({ fileName, url });
        }
      }
      appendConsole({
        level: 'info',
        message: t('Workspace exported'),
      });
    } catch (error) {
      reportActionError(error, t('Export failed'), exportWorkspace);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Export failed')),
      });
    }
  };

  const requestImportWorkspace = () => {
    if (!workspace || !workspace.permissions.canPublish || workspaceEditingDisabled) {
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
          <Typography.Text>
            {t('Importing will replace the current workspace and publish it immediately.')}
          </Typography.Text>
          <Typography.Text>{t('Unsaved editor changes will be discarded.')}</Typography.Text>
        </Space>
      ),
      okText: t('Import'),
      onOk: () => {
        importInputRef.current?.click();
      },
      title: t('Import workspace'),
    });
  };

  const importWorkspaceFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !workspace || !props.locator) {
      return;
    }

    setActionError(null);
    try {
      const zipBase64 = await readFileAsDataUrl(file);
      const result = await runJSSourceRequest('importZip', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        baseCommitId,
        basePublishedCommitId: workspace.repository.publishedCommitId,
        baseOwnerFingerprint: workspace.ownerFingerprint,
        basePublishedOwnerFingerprint: workspace.publishedOwnerFingerprint || workspace.ownerFingerprint,
        message: 'Import RunJS workspace',
        zipBase64,
      });
      appendConsole({
        level: 'info',
        message: t('Workspace imported'),
      });
      setPreviewDiagnostics(result.artifact.diagnostics);
      const loaded = await loadWorkspace();
      onChange?.({
        ...value,
        code: loaded?.opened.legacy.code || value.code,
        version: loaded?.opened.legacy.version || value.version,
      } as RunJSValue);
    } catch (error) {
      await handleWorkspaceError(error);
      reportActionError(error, t('Import failed'), requestImportWorkspace);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Import failed')),
      });
    }
  };

  const closeEditorView = useCallback(async () => {
    const view = flowCtx?.view as ClosableView | undefined;
    if (!view) {
      return;
    }

    if (typeof view.close === 'function') {
      await view.close();
      return;
    }

    const allowed = await view.beforeClose?.({});
    if (allowed === false) {
      return;
    }

    view.destroy?.();
  }, [flowCtx?.view]);

  const requestClose = async () => {
    if (hasUnsavedLocalChanges) {
      setPendingDirtyAction('close');
      setCloseConfirmOpen(true);
      return;
    }

    await closeEditorView();
  };

  const requestRefreshWorkspace = () => {
    if (hasUnsavedLocalChanges) {
      setPendingDirtyAction('refresh');
      setCloseConfirmOpen(true);
      return;
    }

    loadWorkspace();
  };

  const discardLocalAndContinue = async () => {
    setFiles(savedFiles);
    setCloseConfirmOpen(false);
    if (pendingDirtyAction === 'refresh') {
      await loadWorkspace();
      return;
    }

    await closeEditorView();
  };

  const keepChangesAndRebase = async () => {
    if (!conflict || !workspace || !conflict.canRebase) {
      return;
    }

    const userPatch = buildChangedWorkspaceFileList(conflict.staleBaseFiles, conflict.localFiles);
    const rebasedFiles = applyWorkspaceChanges(conflict.latestFiles, userPatch);
    const rebasePatch = buildChangedWorkspaceFileList(conflict.latestFiles, rebasedFiles);

    setActionError(null);
    const nextFiles = rebasePatch.length ? rebasedFiles : normalizeWorkspaceFiles(conflict.latestFiles);
    const nextEntryPath = resolveWorkspaceEntryPath(nextFiles, entryPath);
    const nextActivePath = nextFiles.find((file) => file.path === nextEntryPath)?.path || nextFiles[0]?.path;

    setSavedFiles(conflict.latestFiles);
    setFiles(nextFiles);
    setBaseFiles(conflict.latestFiles);
    setEntryPath(nextEntryPath);
    setActivePath(nextActivePath);
    setOpenPaths(nextActivePath ? [nextActivePath] : []);
    setWorkspace((current) =>
      current
        ? {
            ...current,
            repository: conflict.latestRepository,
            ownerFingerprint: conflict.latestOwnerFingerprint,
            history: conflict.latestHistory,
          }
        : current,
    );
    setConflict(null);
    setDiffView(null);
    invalidatePreview();
    appendConsole({
      level: 'info',
      message: rebasePatch.length ? t('Local changes were reapplied to the latest version') : t('Already up to date'),
    });
  };

  const loadLatestAfterConflict = async () => {
    setConflict(null);
    await loadWorkspaceByAction('openLatest');
  };

  const handleWorkspaceError = async (error: unknown) => {
    if (isConflictError(error)) {
      if (!workspace) {
        return;
      }
      let latest: WorkspaceLoadResult | null = null;
      try {
        latest = await openWorkspaceSnapshot(error.code === 'RUNJS_SOURCE_OWNER_OUTDATED' ? 'openLatest' : 'open');
      } catch (_) {
        latest = null;
      }
      const latestBaseFiles = latest?.baseFiles || baseFiles;
      const latestBaseCommitId = latest?.opened.repository.publishedCommitId ?? baseCommitId;
      const latestPublishedCommit = findCommit(latest?.opened.history.items || historyItems, latestBaseCommitId);
      const canRebase = error.code !== 'RUNJS_SOURCE_OWNER_OUTDATED';
      setConflict({
        message: error.message,
        localFiles: files,
        staleBaseFiles: baseFiles,
        latestFiles: latestBaseFiles,
        latestHistory: latest?.opened.history || workspace.history,
        latestRepository: latest?.opened.repository || workspace.repository,
        canRebase,
        baseVersion: formatVersion(baseCommit?.seq),
        latestVersion: formatVersion(latestPublishedCommit?.seq),
        latestBaseCommitId,
        latestOwnerFingerprint: latest?.opened.ownerFingerprint || workspace?.ownerFingerprint || '',
      });
    }
  };

  const copyWorkspaceErrorDetails = async () => {
    if (!workspaceError) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(
        formatRunJSSourceRequestTechnicalDetails(workspaceError, t('Failed to open RunJS source')),
      );
      message.success(t('Details copied'));
    } catch (_) {
      message.error(t('Copy details failed'));
    }
  };

  const toggleDiff = () => {
    if (showDiff) {
      setActiveTab('code');
      return;
    }

    setSelectedDiffPath(activePath || entryPath);
    setActiveTab('diff');
  };

  const studioSize = resolveStudioSize(props.height, props.minHeight);
  const editorStyle: React.CSSProperties = {
    background: '#fff',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    letterSpacing: 0,
    minWidth: 0,
    overflow: 'hidden',
    textAlign: 'left',
    wordSpacing: 'normal',
    ...(containerStyle || {}),
    ...(props.wrapperStyle || {}),
    height: studioSize.height,
    maxHeight: studioSize.height,
    minHeight: studioSize.minHeight,
  };
  const workspaceGridColumns = filesCollapsed ? 'minmax(0, 1fr)' : 'minmax(220px, 260px) minmax(0, 1fr)';
  const ownerOutdatedWorkspaceError = isOwnerOutdatedError(workspaceError);

  return (
    <div data-testid="runjs-studio-editor" style={editorStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: workspaceError || actionError ? 12 : 0,
        }}
      >
        {workspaceError && ownerOutdatedWorkspaceError ? (
          <Alert
            description={
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text>
                  {t(
                    'The code stored in this block differs from the latest saved RunJS source. Choose which version to continue with.',
                  )}
                </Typography.Text>
                <Space wrap>
                  <Button
                    aria-label={t('Recover latest version from current code')}
                    icon={<ReloadOutlined />}
                    loading={resource.isLoading('restoreFromCode')}
                    onClick={restoreLatestVersionFromCurrentCode}
                    size="small"
                    type="primary"
                  >
                    {t('Recover latest version from current code')}
                  </Button>
                  <Button
                    aria-label={t('Edit latest saved version')}
                    icon={<FolderOpenOutlined />}
                    loading={resource.isLoading('openLatest')}
                    onClick={editLatestSavedVersion}
                    size="small"
                  >
                    {t('Edit latest saved version')}
                  </Button>
                  <Button
                    aria-label={t('Copy technical details')}
                    icon={<CopyOutlined />}
                    onClick={copyWorkspaceErrorDetails}
                    size="small"
                  >
                    {t('Copy technical details')}
                  </Button>
                </Space>
              </Space>
            }
            message={t('RunJS source version is out of sync')}
            role="alert"
            showIcon
            type="warning"
          />
        ) : workspaceError ? (
          <Alert
            action={
              <Space>
                <Button aria-label={t('Retry')} icon={<ReloadOutlined />} onClick={loadWorkspace} size="small">
                  {t('Retry')}
                </Button>
                <Button
                  aria-label={t('Copy technical details')}
                  icon={<CopyOutlined />}
                  onClick={copyWorkspaceErrorDetails}
                  size="small"
                >
                  {t('Copy technical details')}
                </Button>
              </Space>
            }
            message={formatVscComponentError(workspaceError, t('Failed to open RunJS source'))}
            role="alert"
            showIcon
            type="error"
          />
        ) : null}

        {actionError ? (
          <Alert
            action={
              <Space>
                <Button aria-label={t('Retry')} icon={<ReloadOutlined />} onClick={retryActionError} size="small">
                  {t('Retry')}
                </Button>
                <Button
                  aria-label={t('Copy technical details')}
                  icon={<CopyOutlined />}
                  onClick={copyActionErrorDetails}
                  size="small"
                >
                  {t('Copy technical details')}
                </Button>
              </Space>
            }
            description={formatVscComponentError(actionError.error, actionError.title)}
            message={actionError.title}
            role="alert"
            showIcon
            type="error"
          />
        ) : null}

        {exportDownload ? (
          <Alert
            action={
              <Space>
                <Button
                  aria-label={t('Download workspace')}
                  download={exportDownload.fileName}
                  href={exportDownload.url}
                  icon={<DownloadOutlined />}
                  size="small"
                  type="primary"
                >
                  {t('Download workspace')}
                </Button>
                <Button onClick={() => setExportDownload(null)} size="small">
                  {t('Dismiss')}
                </Button>
              </Space>
            }
            description={t('If the download did not start automatically, click Download workspace.')}
            message={t('Workspace export is ready')}
            role="status"
            showIcon
            type="success"
          />
        ) : null}
      </div>

      {loadingWorkspace && !workspace ? (
        <div aria-live="polite" role="status" style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
          <Typography.Text style={{ display: 'block', marginTop: 12 }}>{t('Loading workspace')}</Typography.Text>
        </div>
      ) : null}

      {workspace ? (
        <>
          {!workspace.permissions.canWrite ? (
            <Alert
              action={
                <Button icon={<ReloadOutlined />} onClick={requestRefreshWorkspace} size="small">
                  {t('Refresh workspace')}
                </Button>
              }
              message={t('You can view this JavaScript source, but you do not have permission to edit it')}
              showIcon
              style={{ marginBottom: 8 }}
              type="info"
            />
          ) : null}
          <div
            data-testid="runjs-studio-workspace"
            style={{
              background: '#fff',
              display: 'grid',
              flex: '1 1 0',
              gridTemplateColumns: workspaceGridColumns,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {!filesCollapsed ? (
              <div
                style={{
                  background: '#fafafa',
                  borderRight: '1px solid #f0f0f0',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <FilesPanel
                  activePath={activePath}
                  collapsed={filesCollapsed}
                  exporting={resource.isLoading('exportZip')}
                  files={files}
                  onCollapseChange={setFilesCollapsed}
                  onCreate={createFile}
                  onCreateFolder={createFolder}
                  onDelete={deleteFile}
                  onDeleteFolder={deleteFolder}
                  onExportWorkspace={exportWorkspace}
                  onImportWorkspace={requestImportWorkspace}
                  onMoveFile={moveFileToFolder}
                  onMoveFolder={moveFolderToFolder}
                  onOpen={openFilePath}
                  onRefresh={requestRefreshWorkspace}
                  onRename={renameFile}
                  onRenameFolder={renameFolder}
                  readOnly={workspaceEditingDisabled}
                  savedFiles={savedFiles}
                  t={t}
                />
                <VersionHistoryDock
                  baseVersion={formatVersion(baseCommit?.seq)}
                  collapsed={historyCollapsed}
                  hasUnsavedLocalChanges={hasUnsavedLocalChanges}
                  historyItems={historyItems}
                  loading={historyLoading}
                  onCollapsedChange={setHistoryCollapsed}
                  onRefresh={refreshHistory}
                  onSelect={setRestoreCommit}
                  onViewChanges={toggleDiff}
                  publishedCommitId={workspace.repository.publishedCommitId}
                  t={t}
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
              }}
            >
              <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden', padding: 12 }}>
                <CodeTab
                  activeFile={activeFile}
                  activePath={activePath}
                  diffRows={lineDiffRows}
                  isDiff={showDiff}
                  filesCollapsed={filesCollapsed}
                  onChange={updateActiveFileContent}
                  onCloseFile={closeOpenFile}
                  onDiffToggle={toggleDiff}
                  onFilesCollapsedChange={setFilesCollapsed}
                  onOpenFile={openFilePath}
                  onRunPreview={runPreview}
                  openPaths={openPaths}
                  previewing={previewing}
                  readOnly={workspaceEditingDisabled}
                  savedFiles={savedFiles}
                  scene={scene}
                  t={t}
                  version={value.version}
                  workspaceFiles={files}
                />
              </div>

              <ConsolePanel
                entries={consoleEntries}
                height={consoleHeight}
                maxHeight="40%"
                minHeight={minConsolePanelHeight}
                onClear={clearConsole}
                onCopy={copyLogs}
                onJump={(entry) => {
                  if (entry.path) {
                    openFilePath(entry.path);
                    setActiveTab('code');
                  }
                }}
                onResize={setConsoleHeight}
                t={t}
              />
            </main>
          </div>

          <footer
            style={{
              alignItems: 'center',
              background: '#fff',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              flexShrink: 0,
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'flex-end',
              padding: '10px 16px',
            }}
          >
            <Space wrap>
              <Button style={{ whiteSpace: 'nowrap' }} onClick={requestClose}>
                {t('Cancel')}
              </Button>
              <Button
                aria-label={t('Save')}
                disabled={
                  !workspace || loadingWorkspace || workspaceEditingDisabled || !workspace.permissions.canPublish
                }
                loading={publishing || previewing}
                onClick={openPublishModal}
                style={{ whiteSpace: 'nowrap' }}
                type="primary"
              >
                {t('Save')}
              </Button>
            </Space>
          </footer>
          <input
            accept=".zip,application/zip,application/x-zip-compressed"
            aria-label={t('Import workspace')}
            onChange={importWorkspaceFile}
            ref={importInputRef}
            style={{ display: 'none' }}
            type="file"
          />
        </>
      ) : null}

      <PublishModal
        commitMessage={commitMessage}
        loading={previewing || publishing}
        onAfterClose={restoreDialogFocus}
        onCancel={() => setPublishOpen(false)}
        onCommitMessageChange={setCommitMessage}
        onPublish={publish}
        open={publishOpen}
        readOnly={workspaceEditingDisabled || !workspace?.permissions.canPublish}
        summary={publishSummary}
        t={t}
      />

      <SaveDiagnosticsModal
        diagnostics={saveDiagnostics.length > 0 ? saveDiagnostics : previewDiagnostics}
        onCancel={() => setSaveDiagnosticsOpen(false)}
        open={saveDiagnosticsOpen}
        t={t}
      />

      <CloseConfirmModal
        onCancel={() => setCloseConfirmOpen(false)}
        intent={pendingDirtyAction}
        onCloseWithoutSaving={discardLocalAndContinue}
        open={closeConfirmOpen}
        t={t}
      />

      <RestoreVersionModal
        commit={restoreCommit}
        loading={restoringVersion}
        onCancel={() => setRestoreCommit(null)}
        onRestore={confirmLoadVersion}
        t={t}
      />

      <ConflictDialog
        conflict={conflict}
        onCancel={() => setConflict(null)}
        onDiscard={loadLatestAfterConflict}
        onRebase={keepChangesAndRebase}
        onViewChanges={() => {
          if (conflict) {
            if (!conflict.canRebase) {
              return;
            }
            const userPatch = buildChangedWorkspaceFileList(conflict.staleBaseFiles, conflict.localFiles);
            const rebasedFiles = applyWorkspaceChanges(conflict.latestFiles, userPatch);
            const conflictDiffFiles = buildChangedWorkspaceFileList(conflict.latestFiles, rebasedFiles);
            setDiffView({
              baseFiles: conflict.latestFiles,
              files: rebasedFiles,
            });
            setSelectedDiffPath(conflictDiffFiles[0]?.path);
            setActiveTab('diff');
            setConflict(null);
          }
        }}
        t={t}
      />
    </div>
  );
}
