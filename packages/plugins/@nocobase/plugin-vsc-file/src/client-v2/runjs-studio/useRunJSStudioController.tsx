/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CopyOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  diagnoseRunJS,
  useFullscreenOverlay,
  type EmbeddedRunJSEditorSaveResult,
  type RunJSEditorProviderRenderProps,
} from '@nocobase/client-v2';
import { useFlowContext, type FlowContext, type FlowEngineContext, type RunJSValue } from '@nocobase/flow-engine';
import { Alert, Button, Modal, Space, Spin, Typography, message } from 'antd';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { commitHistoryDefaultLimit } from '../../shared/constants';
import type { RunJSCompileDiagnostic } from './types';
import { useT } from '../locale';
import {
  CloseConfirmModal,
  CodeTab,
  ConsolePanel,
  FilesPanel,
  RestoreVersionModal,
  SaveDiagnosticsModal,
  SaveVersionModal,
  VersionHistoryDock,
} from './RunJSStudioComponents';
import { runJSStudioToolbarRegistry, type RunJSStudioToolbarContext } from './RunJSStudioToolbarRegistry';
import type {
  RunJSConsoleEntry,
  RunJSSourceHistoryItem,
  RunJSSourceLocator,
  RunJSSourceOpenWorkspaceResult,
  RunJSWorkspaceFile,
} from './types';
import type {
  ActionErrorState,
  ClosableView,
  ExportDownloadState,
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
  canSaveVersion,
  collectRunJSWorkspaceFolders,
  createRunJSWorkspaceObjectUrl,
  defaultConsolePanelHeight,
  defaultEntryPath,
  defaultRunJSSourceRoot,
  downloadRunJSWorkspaceBlob,
  formatVscComponentError,
  getRunJSBaseName,
  getRunJSDirectory,
  hasCompileErrorDiagnostics,
  isOwnerOutdatedError,
  isRunJSPathInsideFolder,
  minConsolePanelHeight,
  readFileAsDataUrl,
  replaceRunJSPathPrefix,
  resolveStudioSize,
  revokeRunJSWorkspaceObjectUrl,
  validateRunJSWorkspaceForSave,
} from './studioUtils';
import { formatRunJSSourceRequestTechnicalDetails, useRunJSSourceResource } from './useRunJSSourceResource';
import {
  buildLineDiff,
  buildWorkspaceChanges,
  buildWorkspaceSnapshotKey,
  ensureManifestFolders,
  ensureManifestEntry,
  formatVersion,
  hasWorkspaceChanges,
  inferLanguageFromPath,
  mergeHistoryItems,
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

type SavedRunJSValue = RunJSValue & {
  sourceRef?: {
    type: 'vsc-file';
    repoId: string;
    commitId: string;
    entry: string;
  };
};

function withSavedSourceRef(
  value: RunJSValue,
  result: { repository: { id: string }; commit: { id: string }; artifact: { entryPath: string | null } },
  locator: RunJSSourceLocator,
): SavedRunJSValue {
  if (locator.kind !== 'flowModel.step') {
    return value;
  }

  return {
    ...value,
    sourceRef: {
      type: 'vsc-file',
      repoId: result.repository.id,
      commitId: result.commit.id,
      entry: result.artifact.entryPath || defaultEntryPath,
    },
  };
}

function getNextHistoryCursor(
  items: RunJSSourceHistoryItem[],
  pageSize: number,
  nextBeforeSeq?: number | null,
): number | null {
  return items.length === pageSize ? nextBeforeSeq ?? items[items.length - 1]?.seq ?? null : null;
}

type RunJSStudioControllerProps = Omit<RunJSEditorProviderRenderProps, 'locator'> & {
  locator?: RunJSSourceLocator;
};

export function useRunJSStudioController(props: RunJSStudioControllerProps) {
  const {
    t: hostT,
    value,
    onChange,
    onPersistedChange,
    scene = 'formValue',
    readOnly,
    disabled,
    containerStyle,
    editorChrome = 'standalone',
    onEmbeddedEditorControllerChange,
  } = props;
  const pluginT = useT();
  const t = hostT || pluginT;
  const resource = useRunJSSourceResource();
  const flowCtx = useFlowContext<FlowEngineContext | null>();
  const runJSSourceRequest = resource.request;
  const locatorKey = useMemo(() => JSON.stringify(props.locator || null), [props.locator]);
  const previousLocatorKeyRef = useRef(locatorKey);
  const requestSeqRef = useRef(0);
  const historyRequestSeqRef = useRef(0);
  const consoleSeqRef = useRef(0);
  const latestWorkspaceSnapshotRef = useRef('');
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const studioRootRef = useRef<HTMLDivElement>(null);
  const hasUnsavedLocalChangesRef = useRef(false);
  const embeddedSaveRequestRef = useRef<{
    resolve: (result: EmbeddedRunJSEditorSaveResult) => void;
    reject: (error: unknown) => void;
  } | null>(null);
  const embeddedSavePromiseRef = useRef<Promise<EmbeddedRunJSEditorSaveResult> | null>(null);
  const confirmedCloseRef = useRef(false);
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
  const [saveOpen, setSaveOpen] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewDiagnostics, setPreviewDiagnostics] = useState<RunJSCompileDiagnostic[]>([]);
  const [saveDiagnostics, setSaveDiagnostics] = useState<RunJSCompileDiagnostic[]>([]);
  const [saveDiagnosticsOpen, setSaveDiagnosticsOpen] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<PreviewArtifactState | null>(null);
  const [selectedDiffPath, setSelectedDiffPath] = useState<string | undefined>();
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(
    null,
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyNextBeforeSeq, setHistoryNextBeforeSeq] = useState<number | null>(null);
  const [restoreCommit, setRestoreCommit] = useState<RunJSSourceHistoryItem | null>(null);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [pendingDirtyAction, setPendingDirtyAction] = useState<PendingDirtyAction>('close');
  const [consoleHeight, setConsoleHeight] = useState(defaultConsolePanelHeight);
  const [exportDownload, setExportDownload] = useState<ExportDownloadState | null>(null);
  const workspaceFullscreen = useFullscreenOverlay();
  const studioView = flowCtx?.view as ClosableView | undefined;
  const embedded = editorChrome === 'embedded';

  const workspaceReadOnly = Boolean(readOnly || disabled || (workspace && !workspace.permissions.canWrite));
  const workspaceEditingDisabled = workspaceReadOnly || saving;
  const hasUnsavedLocalChanges = hasWorkspaceChanges(savedFiles, files);
  const saveSummary = summarizeWorkspaceChanges(baseFiles, files);
  const currentPreviewSnapshotKey = buildWorkspaceSnapshotKey(files, entryPath, value.version);
  const showDiff = activeTab === 'diff';
  const activeFile = activePath ? files.find((file) => file.path === activePath) : undefined;
  const runJSModelUse =
    typeof workspace?.source.metadata?.modelUse === 'string' ? workspace.source.metadata.modelUse : undefined;
  const historyItems = workspace?.history?.items || [];
  const baseVersion = formatVersion(workspace?.repository?.headSeq);
  const lineDiffRows = useMemo(
    () => buildLineDiff(baseFiles, files, selectedDiffPath, false),
    [baseFiles, files, selectedDiffPath],
  );

  useLayoutEffect(() => {
    if (embedded) {
      return;
    }
    const view = studioView;
    view?.setFooter?.(null);
    if (props.label) {
      view?.setHeader?.({ title: props.label });
    }
    const timer = window.setTimeout(() => {
      view?.setFooter?.(null);
      if (props.label) {
        view?.setHeader?.({ title: props.label });
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [embedded, props.label, studioView]);

  useEffect(() => {
    hasUnsavedLocalChangesRef.current = hasUnsavedLocalChanges;
  }, [hasUnsavedLocalChanges]);

  useEffect(() => {
    if (!studioView) {
      return;
    }

    const previousBeforeClose = studioView.beforeClose;
    const beforeClose = async (payload?: unknown) => {
      if (!confirmedCloseRef.current && hasUnsavedLocalChangesRef.current) {
        setPendingDirtyAction('close');
        setCloseConfirmOpen(true);
        return false;
      }

      const result = await previousBeforeClose?.(payload);
      return result !== false;
    };

    studioView.beforeClose = beforeClose;

    return () => {
      if (studioView.beforeClose === beforeClose) {
        studioView.beforeClose = previousBeforeClose;
      }
    };
  }, [studioView]);

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
    historyRequestSeqRef.current += 1;
    latestWorkspaceSnapshotRef.current = '';
    hasUnsavedLocalChangesRef.current = false;
    confirmedCloseRef.current = false;
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
    setSaveOpen(false);
    setVersionMessage('');
    setPreviewing(false);
    setSaving(false);
    setPreviewDiagnostics([]);
    setSaveDiagnostics([]);
    setSaveDiagnosticsOpen(false);
    setPreviewArtifact(null);
    setSelectedDiffPath(undefined);
    setNotice(null);
    setHistoryLoading(false);
    setHistoryLoadingMore(false);
    setHistoryNextBeforeSeq(null);
    setRestoreCommit(null);
    setRestoringVersion(false);
    setCloseConfirmOpen(false);
    setPendingDirtyAction('close');
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

      historyRequestSeqRef.current += 1;
      hasUnsavedLocalChangesRef.current = false;
      setWorkspace(loaded.opened);
      setHistoryLoading(false);
      setHistoryLoadingMore(false);
      setHistoryNextBeforeSeq(getNextHistoryCursor(loaded.opened.history.items, commitHistoryDefaultLimit));
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
      setSelectedDiffPath(undefined);
      setPreviewDiagnostics([]);
      setPreviewArtifact(null);
      setRestoreCommit(null);
      setRestoringVersion(false);
      setActionError(null);
    },
    [value.version],
  );

  const loadWorkspace = useCallback(async (): Promise<WorkspaceLoadResult | null> => {
    if (!props.locator) {
      return null;
    }

    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setLoadingWorkspace(true);
    setWorkspaceError(null);

    try {
      const opened = await runJSSourceRequest('open', {
        locator: props.locator,
        initialSource: {
          code: value.code,
          version: value.version,
        },
      });
      const loaded = buildWorkspaceLoadResult(opened);
      if (requestSeqRef.current !== requestSeq) {
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
  }, [applyWorkspaceLoadResult, props.locator, runJSSourceRequest, value.code, value.version]);

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
      const target = event.target instanceof HTMLElement ? event.target : null;
      const insideStudio = Boolean(
        target &&
          (studioRootRef.current?.contains(target) ||
            (workspaceFullscreen.container instanceof HTMLElement && workspaceFullscreen.container.contains(target))),
      );
      const insideCodeEditor = Boolean(target?.closest('[data-runjs-code-editor="true"]'));
      if (
        !insideStudio ||
        (!insideCodeEditor && target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))
      ) {
        return;
      }

      const primary = event.metaKey || event.ctrlKey;
      if (!primary) {
        return;
      }

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        openSaveModal();
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
      reportActionError(error, t('Run failed'), runPreview);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Run failed')),
      });
    } finally {
      setPreviewing(false);
    }
  };

  const finishEmbeddedSaveRequest = (result: EmbeddedRunJSEditorSaveResult) => {
    const request = embeddedSaveRequestRef.current;
    embeddedSaveRequestRef.current = null;
    embeddedSavePromiseRef.current = null;
    request?.resolve(result);
  };

  const failEmbeddedSaveRequest = (error: unknown) => {
    const request = embeddedSaveRequestRef.current;
    embeddedSaveRequestRef.current = null;
    embeddedSavePromiseRef.current = null;
    request?.reject(error);
  };

  const openSaveModal = async (): Promise<boolean> => {
    if (workspaceEditingDisabled || !workspace?.permissions.canSave) {
      return false;
    }

    rememberDialogTrigger();
    setVersionMessage('');
    setActionError(null);

    if (saveSummary.files === 0) {
      message.info(t('No changes to save'));
      return false;
    }

    const requestFiles = normalizeWorkspaceFiles(files);
    const requestEntryPath = entryPath;
    const requestSnapshotKey = currentPreviewSnapshotKey;
    try {
      const compiled = await compileForSave(requestFiles, requestEntryPath, requestSnapshotKey);
      if (!compiled) {
        return false;
      }

      setSaveOpen(true);
      return true;
    } catch (error) {
      reportActionError(error, t('Save failed'), openSaveModal);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Save failed')),
      });
      return false;
    }
  };

  const showSaveDiagnostics = useCallback((diagnostics: RunJSCompileDiagnostic[]) => {
    setSaveDiagnostics(diagnostics);
    setSaveDiagnosticsOpen(true);
    setSaveOpen(false);
  }, []);

  const save = async () => {
    if (!workspace || !props.locator || workspaceEditingDisabled) {
      return;
    }

    if (hasCompileErrorDiagnostics(previewDiagnostics)) {
      showSaveDiagnostics(previewDiagnostics);
      return;
    }

    if (!canSaveVersion(versionMessage, saveSummary, previewDiagnostics, workspaceEditingDisabled)) {
      return;
    }

    setSaving(true);
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
          : await compileForSave(requestFiles, requestEntryPath, requestSnapshotKey);
      if (!compiled) {
        finishEmbeddedSaveRequest('cancelled');
        return;
      }

      const result = await runJSSourceRequest('save', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        message: versionMessage.trim(),
        files: buildWorkspaceChanges([], requestFiles),
        entryPath: requestEntryPath,
        version: compiled.version,
      });
      if (latestWorkspaceSnapshotRef.current !== requestSnapshotKey) {
        appendConsole({
          level: 'info',
          message: t('Saved successfully'),
        });
        finishEmbeddedSaveRequest('saved');
        return;
      }
      setSaveOpen(false);
      appendConsole({
        level: 'info',
        message: t('Saved successfully'),
      });
      (onPersistedChange || onChange)?.(
        withSavedSourceRef(
          {
            ...value,
            code: compiled.code,
            version: compiled.version,
          },
          result,
          props.locator,
        ),
      );
      await loadWorkspace();
      setPreviewDiagnostics(result.artifact.diagnostics);
      finishEmbeddedSaveRequest('saved');
      if (!embedded) {
        confirmedCloseRef.current = true;
        try {
          await closeEditorView();
        } finally {
          confirmedCloseRef.current = false;
        }
      }
    } catch (error) {
      failEmbeddedSaveRequest(error);
      reportActionError(error, t('Save failed'), save);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Save failed')),
      });
    } finally {
      setSaving(false);
    }
  };

  const compileForSave = async (
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

  const requestEmbeddedSave = async (): Promise<EmbeddedRunJSEditorSaveResult> => {
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
    const opened = await openSaveModal();
    if (!opened && embeddedSavePromiseRef.current === promise) {
      finishEmbeddedSaveRequest('cancelled');
    }
    return promise;
  };
  const requestEmbeddedSaveRef = useRef(requestEmbeddedSave);
  requestEmbeddedSaveRef.current = requestEmbeddedSave;

  const refreshHistory = async () => {
    if (!workspace || !props.locator) {
      return;
    }

    const requestSeq = historyRequestSeqRef.current + 1;
    historyRequestSeqRef.current = requestSeq;
    const repoId = workspace.repository.repoId;
    setHistoryLoadingMore(false);
    setHistoryLoading(true);
    setActionError(null);
    try {
      const result = await runJSSourceRequest('listHistory', {
        locator: props.locator,
        repoId,
        limit: commitHistoryDefaultLimit,
      });
      if (historyRequestSeqRef.current !== requestSeq) {
        return;
      }
      setWorkspace((current) =>
        current?.repository.repoId === repoId
          ? {
              ...current,
              history: {
                items: result.items,
              },
            }
          : current,
      );
      setHistoryNextBeforeSeq(getNextHistoryCursor(result.items, commitHistoryDefaultLimit, result.nextBeforeSeq));
    } catch (error) {
      if (historyRequestSeqRef.current === requestSeq) {
        reportActionError(error, t('Failed to load history'), refreshHistory);
        appendConsole({
          level: 'error',
          message: formatVscComponentError(error, t('Failed to load history')),
        });
      }
    } finally {
      if (historyRequestSeqRef.current === requestSeq) {
        setHistoryLoading(false);
      }
    }
  };

  const loadMoreHistory = async () => {
    if (!workspace || !props.locator || historyNextBeforeSeq === null) {
      return;
    }

    const requestSeq = historyRequestSeqRef.current + 1;
    historyRequestSeqRef.current = requestSeq;
    const repoId = workspace.repository.repoId;
    const beforeSeq = historyNextBeforeSeq;
    setHistoryLoadingMore(true);
    setActionError(null);
    try {
      const result = await runJSSourceRequest('listHistory', {
        locator: props.locator,
        repoId,
        limit: commitHistoryDefaultLimit,
        beforeSeq,
      });
      if (historyRequestSeqRef.current !== requestSeq) {
        return;
      }
      setWorkspace((current) =>
        current?.repository.repoId === repoId
          ? {
              ...current,
              history: {
                items: mergeHistoryItems(current.history.items, result.items),
              },
            }
          : current,
      );
      setHistoryNextBeforeSeq(getNextHistoryCursor(result.items, commitHistoryDefaultLimit, result.nextBeforeSeq));
    } catch (error) {
      if (historyRequestSeqRef.current === requestSeq) {
        reportActionError(error, t('Failed to load history'), loadMoreHistory);
        appendConsole({
          level: 'error',
          message: formatVscComponentError(error, t('Failed to load history')),
        });
      }
    } finally {
      if (historyRequestSeqRef.current === requestSeq) {
        setHistoryLoadingMore(false);
      }
    }
  };

  const loadVersionIntoEditor = async (commit: RunJSSourceHistoryItem) => {
    if (!workspace || !props.locator || workspaceEditingDisabled) {
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
      invalidatePreview();
      setNotice({ type: 'info', message: `${t('Restored from')} ${formatVersion(commit.seq)}` });
      appendConsole({
        level: 'info',
        message: `${t('Restored from')} ${formatVersion(commit.seq)}`,
      });
    } catch (error) {
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
    if (!workspace || !workspace.permissions.canSave || workspaceEditingDisabled) {
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
            {t('Importing will replace the current workspace and save it as a new version immediately.')}
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
        message: 'Import RunJS workspace',
        zipBase64,
      });
      appendConsole({
        level: 'info',
        message: t('Workspace imported'),
      });
      setPreviewDiagnostics(result.artifact.diagnostics);
      const loaded = await loadWorkspace();
      (onPersistedChange || onChange)?.(
        withSavedSourceRef(
          {
            ...value,
            code: loaded?.opened.legacy.code || value.code,
            version: loaded?.opened.legacy.version || value.version,
          },
          result,
          props.locator,
        ),
      );
    } catch (error) {
      reportActionError(error, t('Import failed'), requestImportWorkspace);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Import failed')),
      });
    }
  };

  const closeEditorView = useCallback(async () => {
    const view = studioView;
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
  }, [studioView]);

  const handleExternalBindingPersisted = useCallback(
    async (nextSource: Pick<RunJSValue, 'sourceMode' | 'sourceBinding'>) => {
      (onPersistedChange || onChange)?.({
        ...value,
        ...nextSource,
      });
      confirmedCloseRef.current = true;
      try {
        await closeEditorView();
      } finally {
        confirmedCloseRef.current = false;
      }
    },
    [closeEditorView, onChange, onPersistedChange, value],
  );

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
    hasUnsavedLocalChangesRef.current = false;
    setFiles(savedFiles);
    setCloseConfirmOpen(false);
    if (pendingDirtyAction === 'refresh') {
      await loadWorkspace();
      return;
    }

    confirmedCloseRef.current = true;
    try {
      await closeEditorView();
    } finally {
      confirmedCloseRef.current = false;
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
  const toolbarContext: RunJSStudioToolbarContext | null =
    workspace && props.locator
      ? {
          locator: props.locator,
          workspace,
          files,
          entryPath,
          version: value.version || 'v2',
          readOnly: workspaceEditingDisabled || !workspace.permissions.canSave,
          onExternalBindingPersisted: handleExternalBindingPersisted,
        }
      : null;
  const toolbarActions = toolbarContext
    ? runJSStudioToolbarRegistry.list(toolbarContext).map((contribution) => {
        const Contribution = contribution.component;
        return <Contribution context={toolbarContext} key={contribution.key} />;
      })
    : null;

  useEffect(() => {
    if (!embedded || !onEmbeddedEditorControllerChange) {
      return;
    }
    onEmbeddedEditorControllerChange({
      dirty: hasUnsavedLocalChanges,
      saving: saving || previewing,
      requestSave: () => requestEmbeddedSaveRef.current(),
    });
    return () => {
      onEmbeddedEditorControllerChange(null);
    };
  }, [embedded, hasUnsavedLocalChanges, onEmbeddedEditorControllerChange, previewing, saving]);

  useEffect(() => {
    return () => {
      const request = embeddedSaveRequestRef.current;
      embeddedSaveRequestRef.current = null;
      embeddedSavePromiseRef.current = null;
      request?.resolve('cancelled');
    };
  }, []);

  return (
    <div data-testid="runjs-studio-editor" ref={studioRootRef} style={editorStyle}>
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
                    'The code stored in this block differs from the latest saved RunJS source. Recover the versioned source from the current code before continuing.',
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
        {notice ? (
          <Alert closable message={notice.message} onClose={() => setNotice(null)} showIcon type={notice.type} />
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
            ref={workspaceFullscreen.placeholderRef}
            style={workspaceFullscreen.isFullscreen ? workspaceFullscreen.placeholderStyle : { display: 'contents' }}
          />
          {workspaceFullscreen.container
            ? createPortal(
                <div
                  data-testid="runjs-studio-workspace"
                  style={{
                    background: '#fff',
                    display: 'grid',
                    flex: '1 1 0',
                    gridTemplateColumns: workspaceGridColumns,
                    height: workspaceFullscreen.isFullscreen ? '100%' : undefined,
                    minHeight: 0,
                    overflow: 'hidden',
                    width: workspaceFullscreen.isFullscreen ? '100%' : undefined,
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
                        fillAvailableHeight={historyCollapsed}
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
                        baseVersion={baseVersion}
                        collapsed={historyCollapsed}
                        hasMore={historyNextBeforeSeq !== null}
                        hasUnsavedLocalChanges={hasUnsavedLocalChanges}
                        historyItems={historyItems}
                        loading={historyLoading}
                        loadingMore={historyLoadingMore}
                        onCollapsedChange={setHistoryCollapsed}
                        onLoadMore={loadMoreHistory}
                        onRefresh={refreshHistory}
                        onSelect={setRestoreCommit}
                        onViewChanges={toggleDiff}
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
                        fullscreenControl={{
                          isFullscreen: workspaceFullscreen.isFullscreen,
                          toggleFullscreen: workspaceFullscreen.toggleFullscreen,
                        }}
                        onChange={updateActiveFileContent}
                        onCloseFile={closeOpenFile}
                        onDiffToggle={toggleDiff}
                        onFilesCollapsedChange={setFilesCollapsed}
                        onOpenFile={openFilePath}
                        onRunPreview={runPreview}
                        openPaths={openPaths}
                        previewing={previewing}
                        readOnly={workspaceEditingDisabled}
                        runJSModelUse={runJSModelUse}
                        savedFiles={savedFiles}
                        scene={scene}
                        t={t}
                        toolbarActions={toolbarActions}
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
                </div>,
                workspaceFullscreen.container,
              )
            : null}

          {!embedded ? (
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
                    !workspace || loadingWorkspace || workspaceEditingDisabled || !workspace.permissions.canSave
                  }
                  loading={saving || previewing}
                  onClick={openSaveModal}
                  style={{ whiteSpace: 'nowrap' }}
                  type="primary"
                >
                  {t('Save')}
                </Button>
              </Space>
            </footer>
          ) : null}
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

      <SaveVersionModal
        loading={previewing || saving}
        onAfterClose={restoreDialogFocus}
        onCancel={() => {
          setSaveOpen(false);
          finishEmbeddedSaveRequest('cancelled');
        }}
        onSave={save}
        onVersionMessageChange={setVersionMessage}
        open={saveOpen}
        readOnly={workspaceEditingDisabled || !workspace?.permissions.canSave}
        summary={saveSummary}
        t={t}
        versionMessage={versionMessage}
      />

      <SaveDiagnosticsModal
        diagnostics={saveDiagnostics.length > 0 ? saveDiagnostics : previewDiagnostics}
        onCancel={() => setSaveDiagnosticsOpen(false)}
        onJump={(diagnostic) => {
          if (!diagnostic.path) {
            return;
          }
          openFilePath(diagnostic.path);
          setActiveTab('code');
          setSaveDiagnosticsOpen(false);
        }}
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
    </div>
  );
}
