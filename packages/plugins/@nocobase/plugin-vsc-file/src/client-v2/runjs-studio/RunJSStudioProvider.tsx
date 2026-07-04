/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  DiffOutlined,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  ImportOutlined,
  ReloadOutlined,
  RightOutlined,
  UploadOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  CodeEditor,
  diagnoseRunJS,
  type CodeEditorTypeScriptProject,
  type DiagnoseRunJSResult,
  type RunJSImportModuleCompletion,
  type RunJSEditorProvider,
  type RunJSEditorProviderRenderProps,
} from '@nocobase/client-v2';
import { useFlowContext, type FlowContext, type FlowEngineContext, type RunJSValue } from '@nocobase/flow-engine';
import {
  Alert,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { InputRef } from 'antd/es/input';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { RunJSCompileDiagnostic } from '../../shared/runjs-source-types';
import { formatVscComponentError } from '../components/utils';
import { useT } from '../locale';
import type {
  RunJSChangeSummary,
  RunJSConsoleEntry,
  RunJSLineDiffRow,
  RunJSSourceHistoryItem,
  RunJSSourceOpenWorkspaceResult,
  RunJSWorkspaceFile,
} from './types';
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
  compareRunJSPaths,
  defaultRunJSEntryPath,
  defaultRunJSSourceRoot,
  ensureManifestFolders,
  ensureManifestEntry,
  formatChangeSummary,
  formatVersion,
  hasWorkspaceChanges,
  inferLanguageFromPath,
  normalizeRunJSWorkspaceFolderPath,
  normalizeRunJSWorkspacePath,
  normalizeWorkspaceFiles,
  readRunJSManifestFolders,
  removeWorkspaceFile,
  replaceWorkspaceFilePath,
  resolveInitialEntryPath,
  resolveWorkspaceEntryPath,
  runJSManifestPath,
  summarizeWorkspaceChanges,
  updateWorkspaceFile,
  upsertWorkspaceFile,
  validateRunJSWorkspaceFolderPath,
  validateRunJSWorkspacePath,
} from './workspaceUtils';

const defaultEntryPath = defaultRunJSEntryPath;
const defaultStudioHeight = 'min(720px, calc(100vh - 112px))';
const defaultConsolePanelHeight = 180;
const minConsolePanelHeight = 80;
const importableRunJSFileExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const runJSDragKindDataType = 'application/x-nocobase-runjs-kind';
const runJSDragPathDataType = 'application/x-nocobase-runjs-path';
const runJSFileTypeIconConfigs: Record<
  string,
  {
    background: string;
    borderColor: string;
    color: string;
    label: string;
  }
> = {
  css: { background: '#e6f4ff', borderColor: '#91caff', color: '#0958d9', label: 'CSS' },
  html: { background: '#fff2e8', borderColor: '#ffbb96', color: '#d4380d', label: 'H5' },
  js: { background: '#fffbe6', borderColor: '#ffe58f', color: '#ad8b00', label: 'JS' },
  jsx: { background: '#f6ffed', borderColor: '#b7eb8f', color: '#389e0d', label: 'JSX' },
  ts: { background: '#e6f4ff', borderColor: '#91caff', color: '#0958d9', label: 'TS' },
  tsx: { background: '#f9f0ff', borderColor: '#d3adf7', color: '#722ed1', label: 'TSX' },
};

export const runJSStudioProvider: RunJSEditorProvider = {
  key: '@nocobase/plugin-vsc-file/runjs-studio',
  canHandle: (props) => Boolean(props.locator),
  renderEditor: (props) => <RunJSStudioEditorEntry {...props} />,
};

type WorkspaceLoadResult = {
  opened: RunJSSourceOpenWorkspaceResult;
  baseFiles: RunJSWorkspaceFile[];
  currentFiles: RunJSWorkspaceFile[];
  entryPath: string;
};

type OpenWorkspaceAction = 'open' | 'openLatest';

type ActionErrorState = {
  error: unknown;
  title: string;
  retry: () => unknown | Promise<unknown>;
};

type PendingDirtyAction = 'close' | 'refresh';

type ConflictState = {
  message: string;
  localFiles: RunJSWorkspaceFile[];
  staleBaseFiles: RunJSWorkspaceFile[];
  latestFiles: RunJSWorkspaceFile[];
  latestHistory: RunJSSourceOpenWorkspaceResult['history'];
  latestRepository: RunJSSourceOpenWorkspaceResult['repository'];
  canRebase: boolean;
  baseVersion: string;
  latestVersion: string;
  latestBaseCommitId: string | null;
  latestOwnerFingerprint: string;
};

type DiffViewState = {
  baseFiles: RunJSWorkspaceFile[];
  files: RunJSWorkspaceFile[];
};

type ExportDownloadState = {
  fileName: string;
  url: string;
};

type PreviewArtifactState = {
  code: string;
  version: string;
  snapshotKey: string;
};

type ClosableView = {
  close?: () => boolean | void | Promise<boolean | void>;
  beforeClose?: (options?: unknown) => boolean | void | Promise<boolean | void>;
  destroy?: () => void;
  setFooter?: (footer: React.ReactNode) => void;
};

function RunJSStudioEditorEntry(props: RunJSEditorProviderRenderProps) {
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

function buildWorkspaceLoadResult(opened: RunJSSourceOpenWorkspaceResult): WorkspaceLoadResult {
  const nextBaseFiles = normalizeWorkspaceFiles(opened.files || []);
  const nextCurrentFiles = normalizeWorkspaceFiles(nextBaseFiles);
  const nextEntryPath = normalizeRunJSWorkspacePath(
    resolveInitialEntryPath(nextCurrentFiles, opened.legacy.entryPath, opened.legacy.entry),
  );

  return {
    opened,
    baseFiles: nextBaseFiles,
    currentFiles: nextCurrentFiles,
    entryPath: nextEntryPath,
  };
}

function isViewportSizedValue(value: string | number | undefined): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return /(?:\b(?:vh|dvh|svh|lvh)\b|%|calc\()/i.test(value);
}

function isLegacyCompactHeight(value: string | number | undefined): boolean {
  if (typeof value === 'number') {
    return value > 0 && value <= 240;
  }

  const match = typeof value === 'string' ? value.trim().match(/^(\d+(?:\.\d+)?)px$/i) : null;
  return Boolean(match && Number(match[1]) > 0 && Number(match[1]) <= 240);
}

function resolveStudioSize(
  height: string | number | undefined,
  minHeight: string | number | undefined,
): { height: string | number; minHeight: string | number } {
  if (height === '100%') {
    return {
      height: 'calc(100vh - 42px)',
      minHeight: 0,
    };
  }

  if (isViewportSizedValue(minHeight)) {
    return {
      height: minHeight as string,
      minHeight: 0,
    };
  }

  if (height && !isLegacyCompactHeight(height)) {
    return {
      height,
      minHeight: minHeight ?? 0,
    };
  }

  return {
    height: defaultStudioHeight,
    minHeight: minHeight ?? 0,
  };
}

type FileTreeFolderRow = {
  key: string;
  type: 'folder';
  path: string;
  name: string;
  depth: number;
};

type FileTreeFileRow = {
  key: string;
  type: 'file';
  path: string;
  name: string;
  depth: number;
  file: RunJSWorkspaceFile;
};

type FileTreeRow = FileTreeFolderRow | FileTreeFileRow;

type InlineEditTarget = {
  isNew: boolean;
  path: string;
  type: 'file' | 'folder';
  value: string;
};

type RunJSTreeDragKind = 'file' | 'folder';

type RunJSTreeDragPayload = {
  kind: RunJSTreeDragKind;
  path: string;
};

function buildFileTreeRows(
  files: RunJSWorkspaceFile[],
  folders: string[],
  collapsedFolderPaths: Set<string>,
): FileTreeRow[] {
  const rows: FileTreeRow[] = [];
  const folderPaths = new Set<string>();
  const folderChildren = new Map<string, Set<string>>();
  const filesByParent = new Map<string, RunJSWorkspaceFile[]>();

  const addFolder = (path: string) => {
    const segments = path.split('/');
    let currentFolderPath = '';
    segments.forEach((segment) => {
      const parentPath = currentFolderPath;
      currentFolderPath = currentFolderPath ? `${currentFolderPath}/${segment}` : segment;
      folderPaths.add(currentFolderPath);
      const siblings = folderChildren.get(parentPath) || new Set<string>();
      siblings.add(currentFolderPath);
      folderChildren.set(parentPath, siblings);
    });
  };

  folders.forEach(addFolder);

  for (const file of files) {
    const folderPath = getRunJSDirectory(file.path);
    if (folderPath) {
      addFolder(folderPath);
    }
    const siblings = filesByParent.get(folderPath) || [];
    siblings.push(file);
    filesByParent.set(folderPath, siblings);
  }

  const appendChildren = (parentPath: string) => {
    const childFolders = Array.from(folderChildren.get(parentPath) || []).sort(compareRunJSPaths);
    for (const folderPath of childFolders) {
      if (!folderPaths.has(folderPath)) {
        continue;
      }
      const segments = folderPath.split('/');
      rows.push({
        key: `folder:${folderPath}`,
        type: 'folder',
        path: folderPath,
        name: segments[segments.length - 1] || folderPath,
        depth: Math.max(segments.length - 1, 0),
      });
      if (!collapsedFolderPaths.has(folderPath)) {
        appendChildren(folderPath);
      }
    }

    const childFiles = [...(filesByParent.get(parentPath) || [])].sort((left, right) =>
      compareRunJSPaths(left.path, right.path),
    );
    for (const file of childFiles) {
      const segments = file.path.split('/');
      rows.push({
        key: `file:${file.path}`,
        type: 'file',
        path: file.path,
        name: segments[segments.length - 1] || file.path,
        depth: Math.max(segments.length - 1, 0),
        file,
      });
    }
  };

  appendChildren('');
  return rows;
}

function isWorkspaceFileDirty(savedFiles: RunJSWorkspaceFile[], file: RunJSWorkspaceFile): boolean {
  return hasWorkspaceChanges(
    savedFiles.filter((item) => item.path === file.path),
    [file],
  );
}

function getImportableRunJSExtension(filePath: string): string {
  return importableRunJSFileExtensions.find((extension) => filePath.endsWith(extension)) || '';
}

function stripRunJSExtension(filePath: string): string {
  const extension = getImportableRunJSExtension(filePath);
  return extension ? filePath.slice(0, -extension.length) : filePath;
}

function getRunJSDirectory(filePath: string): string {
  const index = filePath.lastIndexOf('/');
  return index >= 0 ? filePath.slice(0, index) : '';
}

function getRunJSBaseName(path: string): string {
  const index = path.lastIndexOf('/');
  return index >= 0 ? path.slice(index + 1) : path;
}

function getRunJSFileExtension(path: string): string {
  const name = getRunJSBaseName(path).toLowerCase();
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index + 1) : '';
}

function RunJSFileTypeIcon(props: { path: string }) {
  const { path } = props;
  const config = runJSFileTypeIconConfigs[getRunJSFileExtension(path)];

  if (!config) {
    return <FileTextOutlined />;
  }

  return (
    <span
      aria-hidden="true"
      style={{
        alignItems: 'center',
        background: config.background,
        border: `1px solid ${config.borderColor}`,
        borderRadius: 3,
        color: config.color,
        display: 'inline-flex',
        flex: '0 0 26px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 9,
        fontWeight: 700,
        height: 16,
        justifyContent: 'center',
        lineHeight: '14px',
        minWidth: 26,
      }}
    >
      {config.label}
    </span>
  );
}

function joinRunJSPath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}/${name}` : name;
}

function isRunJSPathInsideFolder(path: string, folderPath: string): boolean {
  return path === folderPath || path.startsWith(`${folderPath}/`);
}

function setRunJSTreeDragPayload(dataTransfer: DataTransfer, kind: RunJSTreeDragKind, path: string) {
  dataTransfer.setData(runJSDragKindDataType, kind);
  dataTransfer.setData(runJSDragPathDataType, path);
  dataTransfer.setData('text/plain', path);
}

function getRunJSTreeDragPayload(dataTransfer: DataTransfer): RunJSTreeDragPayload | null {
  const path = dataTransfer.getData(runJSDragPathDataType) || dataTransfer.getData('text/plain');
  if (!path) {
    return null;
  }

  const kind = dataTransfer.getData(runJSDragKindDataType) === 'folder' ? 'folder' : 'file';
  return { kind, path };
}

function replaceRunJSPathPrefix(path: string, oldPrefix: string, nextPrefix: string): string {
  if (path === oldPrefix) {
    return nextPrefix;
  }

  if (path.startsWith(`${oldPrefix}/`)) {
    return `${nextPrefix}${path.slice(oldPrefix.length)}`;
  }

  return path;
}

function collectRunJSWorkspaceFolders(files: RunJSWorkspaceFile[]): string[] {
  const folders = new Set<string>();
  readRunJSManifestFolders(files).forEach((folder) => folders.add(folder));

  for (const file of files) {
    const directory = getRunJSDirectory(file.path);
    if (!directory) {
      continue;
    }

    const segments = directory.split('/');
    let current = '';
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      folders.add(current);
    }
  }

  return Array.from(folders).sort(compareRunJSPaths);
}

function validateRunJSWorkspaceForSave(
  files: RunJSWorkspaceFile[],
  entryPath: string,
  t: (key: string) => string,
): RunJSCompileDiagnostic[] {
  const diagnostics: RunJSCompileDiagnostic[] = [];

  for (const file of files) {
    const validation = validateRunJSWorkspacePath(file.path, t);
    if (!validation.valid) {
      diagnostics.push({
        code: 'RUNJS_WORKSPACE_PATH_INVALID',
        message: validation.message || t('Invalid file path'),
        path: file.path,
        severity: 'error',
      });
    }
  }

  if (!files.some((file) => file.path === entryPath)) {
    diagnostics.push({
      code: 'RUNJS_ENTRY_NOT_FOUND',
      message: t('RunJS entry file under src/client was not found'),
      path: entryPath,
      severity: 'error',
    });
  }

  return diagnostics;
}

function canCreateRunJSFileInFolder(folderPath: string): boolean {
  return folderPath === 'src' || folderPath.startsWith('src/');
}

function resolveRunJSCreateFolder(folderPath: string): string {
  return canCreateRunJSFileInFolder(folderPath) ? folderPath : defaultRunJSSourceRoot;
}

function buildUniqueRunJSPath(
  files: RunJSWorkspaceFile[],
  folderPath: string,
  baseName: string,
  extension: string,
): string {
  const targetFolder = resolveRunJSCreateFolder(folderPath);
  const existingPaths = new Set(files.map((file) => file.path));
  let index = 0;

  while (index < 1000) {
    const suffix = index === 0 ? '' : String(index + 1);
    const candidate = `${targetFolder}/${baseName}${suffix}${extension}`;
    if (!existingPaths.has(candidate)) {
      return candidate;
    }
    index += 1;
  }

  return `${targetFolder}/${baseName}${Date.now()}${extension}`;
}

function buildNewFilePath(files: RunJSWorkspaceFile[], parentPath: string): string {
  return buildUniqueRunJSPath(files, parentPath, 'helper', '.ts');
}

function buildNewFolderPath(files: RunJSWorkspaceFile[], parentPath: string): string {
  const targetFolder = resolveRunJSCreateFolder(parentPath);
  const existingFolders = new Set(collectRunJSWorkspaceFolders(files));
  let index = 0;

  while (index < 1000) {
    const suffix = index === 0 ? '' : String(index + 1);
    const candidate = `${targetFolder}/folder${suffix}`;
    if (!existingFolders.has(candidate)) {
      return candidate;
    }
    index += 1;
  }

  return `${targetFolder}/folder${Date.now()}`;
}

function buildRelativeRunJSImportSpecifier(fromPath: string, targetPath: string): string {
  const fromDirectory = getRunJSDirectory(fromPath);
  const targetWithoutExtension = stripRunJSExtension(targetPath);
  const fromParts = fromDirectory ? fromDirectory.split('/').filter(Boolean) : [];
  const targetParts = targetWithoutExtension.split('/').filter(Boolean);
  let common = 0;

  while (common < fromParts.length && common < targetParts.length && fromParts[common] === targetParts[common]) {
    common += 1;
  }

  const upSegments = fromParts.slice(common).map(() => '..');
  const downSegments = targetParts.slice(common);
  const relative = [...upSegments, ...downSegments].join('/');
  if (!relative) {
    return './';
  }

  return relative.startsWith('.') ? relative : `./${relative}`;
}

function collectRunJSNamedExports(content: string): string[] {
  const names = new Set<string>();
  const source = String(content || '');
  const identifierPattern = '[$_A-Za-z][$_A-Za-z0-9]*';
  const declarationPattern = new RegExp(
    `\\bexport\\s+(?:async\\s+)?(?:function|class|enum|interface|type)\\s+(${identifierPattern})`,
    'g',
  );
  const variablePattern = /\bexport\s+(?:const|let|var)\s+([^;\n]+)/g;
  const namedListPattern = /\bexport\s*\{([^}]+)\}/g;

  for (const match of source.matchAll(declarationPattern)) {
    if (match[1]) {
      names.add(match[1]);
    }
  }

  for (const match of source.matchAll(variablePattern)) {
    const declarationList = match[1] || '';
    for (const part of declarationList.split(',')) {
      const name = part.trim().match(/^([$_A-Za-z][$_A-Za-z0-9]*)/)?.[1];
      if (name) {
        names.add(name);
      }
    }
  }

  for (const match of source.matchAll(namedListPattern)) {
    const exportList = match[1] || '';
    for (const part of exportList.split(',')) {
      const cleaned = part.trim();
      if (!cleaned) {
        continue;
      }
      const alias = cleaned.match(/\bas\s+([$_A-Za-z][$_A-Za-z0-9]*)$/)?.[1];
      const direct = cleaned.match(/^([$_A-Za-z][$_A-Za-z0-9]*)/)?.[1];
      const name = alias || direct;
      if (name) {
        names.add(name);
      }
    }
  }

  return Array.from(names).sort();
}

function buildRunJSImportModuleCompletions(
  files: RunJSWorkspaceFile[],
  activePath?: string,
): RunJSImportModuleCompletion[] {
  if (!activePath) {
    return [];
  }

  return files
    .filter((file) => file.path !== activePath)
    .filter((file) => file.path !== runJSManifestPath)
    .filter((file) => Boolean(getImportableRunJSExtension(file.path)))
    .map((file) => ({
      specifier: buildRelativeRunJSImportSpecifier(activePath, file.path),
      detail: file.path,
      exports: collectRunJSNamedExports(file.content),
    }))
    .sort((a, b) => a.specifier.localeCompare(b.specifier));
}

function buildRunJSImportModuleCompletionSignature(files: RunJSWorkspaceFile[], activePath?: string): string {
  if (!activePath) {
    return '';
  }

  return files
    .filter((file) => file.path !== activePath)
    .filter((file) => file.path !== runJSManifestPath)
    .filter((file) => Boolean(getImportableRunJSExtension(file.path)))
    .map((file) => `${file.path}\u0000${file.content}`)
    .sort()
    .join('\u0001');
}

function useRunJSImportModuleCompletions(
  files: RunJSWorkspaceFile[],
  activePath?: string,
): RunJSImportModuleCompletion[] {
  const signature = buildRunJSImportModuleCompletionSignature(files, activePath);
  const cacheRef = useRef<{
    completions: RunJSImportModuleCompletion[];
    signature: string;
  }>();

  if (!cacheRef.current || cacheRef.current.signature !== signature) {
    cacheRef.current = {
      completions: buildRunJSImportModuleCompletions(files, activePath),
      signature,
    };
  }

  return cacheRef.current.completions;
}

function isRunJSTypeScriptProjectFile(path: string): boolean {
  return /\.(?:[cm]?[jt]sx?|d\.ts)$/i.test(path);
}

function buildRunJSTypeScriptProject(
  files: RunJSWorkspaceFile[],
  activeFile?: RunJSWorkspaceFile,
): CodeEditorTypeScriptProject | undefined {
  if (!activeFile || !isRunJSTypeScriptProjectFile(activeFile.path)) {
    return undefined;
  }

  return {
    currentFilePath: activeFile.path,
    files: files
      .filter((file) => file.path !== runJSManifestPath)
      .filter((file) => isRunJSTypeScriptProjectFile(file.path))
      .map((file) => ({
        content: file.content,
        path: file.path,
      })),
  };
}

function FilesPanel(props: {
  activePath?: string;
  collapsed: boolean;
  exporting: boolean;
  files: RunJSWorkspaceFile[];
  onCollapseChange: (collapsed: boolean) => void;
  onCreate: (parentPath?: string) => string | undefined;
  onCreateFolder: (parentPath?: string) => string | undefined;
  onDelete: (path: string) => void;
  onDeleteFolder: (path: string) => boolean;
  onExportWorkspace: () => void;
  onImportWorkspace: () => void;
  onMoveFile: (path: string, folderPath: string) => void;
  onMoveFolder: (path: string, folderPath: string) => void;
  onOpen: (path: string) => void;
  onRefresh: () => void;
  onRename: (path: string, nextPath: string) => boolean;
  onRenameFolder: (path: string, nextPath: string) => boolean;
  readOnly: boolean;
  savedFiles: RunJSWorkspaceFile[];
  t: (key: string) => string;
}) {
  const {
    activePath,
    collapsed,
    exporting,
    files,
    onCollapseChange,
    onCreate,
    onCreateFolder,
    onDelete,
    onDeleteFolder,
    onExportWorkspace,
    onImportWorkspace,
    onMoveFile,
    onMoveFolder,
    onOpen,
    onRefresh,
    onRename,
    onRenameFolder,
    readOnly,
    savedFiles,
    t,
  } = props;
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [actionFocusedPath, setActionFocusedPath] = useState<string | null>(null);
  const [inlineEdit, setInlineEdit] = useState<InlineEditTarget | null>(null);
  const [collapsedFolderPaths, setCollapsedFolderPaths] = useState<Set<string>>(() => new Set());
  const inlineEditInputRef = useRef<InputRef>(null);
  const inlineEditCancellingRef = useRef(false);
  const folderPaths = React.useMemo(() => collectRunJSWorkspaceFolders(files), [files]);
  const treeRows = React.useMemo(
    () => buildFileTreeRows(files, folderPaths, collapsedFolderPaths),
    [collapsedFolderPaths, files, folderPaths],
  );
  const inlineEditPath = inlineEdit?.path;
  const fileRows = React.useMemo(
    () => treeRows.filter((row): row is FileTreeFileRow => row.type === 'file'),
    [treeRows],
  );
  const fileButtonRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const registerFileButton = React.useCallback(
    (path: string) => (element: HTMLButtonElement | null) => {
      if (element) {
        fileButtonRefs.current.set(path, element);
      } else {
        fileButtonRefs.current.delete(path);
      }
    },
    [],
  );
  const focusFileButton = React.useCallback((path: string) => {
    const focus = () => {
      fileButtonRefs.current.get(path)?.focus();
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focus);
      return;
    }

    focus();
  }, []);
  const selectFileByIndex = React.useCallback(
    (index: number) => {
      const target = fileRows[index];
      if (!target) {
        return;
      }

      onOpen(target.path);
      focusFileButton(target.path);
    },
    [fileRows, focusFileButton, onOpen],
  );
  const handleFileKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>, path: string) => {
      const currentIndex = fileRows.findIndex((file) => file.path === path);
      if (currentIndex === -1) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectFileByIndex(Math.min(currentIndex + 1, fileRows.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectFileByIndex(Math.max(currentIndex - 1, 0));
      } else if (event.key === 'Home') {
        event.preventDefault();
        selectFileByIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        selectFileByIndex(fileRows.length - 1);
      }
    },
    [fileRows, selectFileByIndex],
  );
  const startInlineEdit = React.useCallback((type: InlineEditTarget['type'], path: string, isNew: boolean) => {
    setInlineEdit({
      isNew,
      path,
      type,
      value: getRunJSBaseName(path),
    });
  }, []);
  const expandFolderPath = React.useCallback((path: string) => {
    setCollapsedFolderPaths((current) => {
      const next = new Set(current);
      const segments = path.split('/').filter(Boolean);
      let currentPath = '';
      for (const segment of segments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        next.delete(currentPath);
      }
      return next;
    });
  }, []);
  const toggleFolderPath = React.useCallback((path: string) => {
    setCollapsedFolderPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);
  const createFileInline = React.useCallback(
    (parentPath: string) => {
      expandFolderPath(parentPath);
      const path = onCreate(parentPath);
      if (path) {
        startInlineEdit('file', path, true);
      }
    },
    [expandFolderPath, onCreate, startInlineEdit],
  );
  const createFolderInline = React.useCallback(
    (parentPath: string) => {
      expandFolderPath(parentPath);
      const path = onCreateFolder(parentPath);
      if (path) {
        startInlineEdit('folder', path, true);
      }
    },
    [expandFolderPath, onCreateFolder, startInlineEdit],
  );
  const commitInlineEdit = React.useCallback(() => {
    if (inlineEditCancellingRef.current) {
      inlineEditCancellingRef.current = false;
      return true;
    }

    if (!inlineEdit) {
      return true;
    }

    const parentPath = getRunJSDirectory(inlineEdit.path);
    const nextName = inlineEdit.value.trim();
    if (!nextName) {
      message.error(t('Invalid file path'));
      inlineEditInputRef.current?.focus();
      return false;
    }

    const nextPath = joinRunJSPath(parentPath, nextName);
    const renamed =
      inlineEdit.type === 'folder' ? onRenameFolder(inlineEdit.path, nextPath) : onRename(inlineEdit.path, nextPath);
    if (renamed) {
      setInlineEdit(null);
      return true;
    }

    inlineEditInputRef.current?.focus();
    return false;
  }, [inlineEdit, onRename, onRenameFolder, t]);
  const cancelInlineEdit = React.useCallback(() => {
    if (!inlineEdit) {
      return;
    }

    inlineEditCancellingRef.current = true;
    if (inlineEdit.isNew) {
      if (inlineEdit.type === 'folder') {
        onDeleteFolder(inlineEdit.path);
      } else {
        onDelete(inlineEdit.path);
      }
    }
    setInlineEdit(null);
  }, [inlineEdit, onDelete, onDeleteFolder]);

  useEffect(() => {
    if (!inlineEditPath) {
      return;
    }

    const focus = () => {
      inlineEditInputRef.current?.focus();
      inlineEditInputRef.current?.select();
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focus);
      return;
    }

    focus();
  }, [inlineEditPath]);

  if (collapsed) {
    return (
      <aside
        style={{
          alignItems: 'flex-start',
          background: '#fafafa',
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 8,
        }}
      >
        <Tooltip title={t('File resource manager')}>
          <Button
            aria-label={t('Expand files')}
            icon={<FolderOpenOutlined />}
            onClick={() => onCollapseChange(false)}
            size="small"
          />
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside
      aria-label={t('File resource manager')}
      style={{
        background: '#fafafa',
        display: 'flex',
        flex: '0 1 auto',
        flexDirection: 'column',
        gap: 8,
        maxHeight: '80%',
        minHeight: 140,
        overflow: 'hidden',
        padding: 12,
      }}
    >
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text strong style={{ whiteSpace: 'nowrap' }}>
          {t('Files')}
        </Typography.Text>
        <Space size={4}>
          <Tooltip title={t('Export workspace')}>
            <Button
              aria-label={t('Export workspace')}
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={onExportWorkspace}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('Import workspace')}>
            <Button
              aria-label={t('Import workspace')}
              disabled={readOnly}
              icon={<UploadOutlined />}
              onClick={onImportWorkspace}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('New folder')}>
            <Button
              aria-label={t('New folder')}
              disabled={readOnly}
              icon={<FolderAddOutlined />}
              onClick={() => createFolderInline(defaultRunJSSourceRoot)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('New file')}>
            <Button
              aria-label={t('New file')}
              disabled={readOnly}
              icon={<FileAddOutlined />}
              onClick={() => createFileInline(defaultRunJSSourceRoot)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('Collapse files')}>
            <Button aria-label={t('Collapse files')} onClick={() => onCollapseChange(true)} size="small">
              «
            </Button>
          </Tooltip>
        </Space>
      </Space>
      <List
        dataSource={treeRows}
        locale={{
          emptyText: (
            <Empty description={t('No files in this workspace')}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">
                  {t('Refresh workspace')}
                </Button>
                {!readOnly ? (
                  <Button
                    icon={<FileAddOutlined />}
                    onClick={() => createFileInline(defaultRunJSSourceRoot)}
                    size="small"
                    type="primary"
                  >
                    {t('New file')}
                  </Button>
                ) : null}
              </Space>
            </Empty>
          ),
        }}
        rowKey="key"
        size="small"
        style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}
        renderItem={(row) => {
          if (row.type === 'folder') {
            const actionsVisible = hoveredPath === row.path || actionFocusedPath === row.path;
            const canCreateInsideFolder = canCreateRunJSFileInFolder(row.path);
            const folderCollapsed = collapsedFolderPaths.has(row.path);
            return (
              <List.Item
                draggable={!readOnly}
                onDragStart={(event) => {
                  setRunJSTreeDragPayload(event.dataTransfer, 'folder', row.path);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const dragPayload = getRunJSTreeDragPayload(event.dataTransfer);
                  if (!dragPayload) {
                    return;
                  }

                  if (dragPayload.kind === 'folder') {
                    expandFolderPath(row.path);
                    onMoveFolder(dragPayload.path, row.path);
                    return;
                  }

                  expandFolderPath(row.path);
                  onMoveFile(dragPayload.path, row.path);
                }}
                onMouseEnter={() => setHoveredPath(row.path)}
                onMouseLeave={() => setHoveredPath((current) => (current === row.path ? null : current))}
                style={{
                  paddingInline: 0,
                  paddingLeft: row.depth * 14,
                  position: 'relative',
                }}
              >
                <div
                  aria-expanded={!folderCollapsed}
                  aria-label={row.path}
                  onClick={() => toggleFolderPath(row.path)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleFolderPath(row.path);
                    }
                  }}
                  role="button"
                  style={{
                    alignItems: 'center',
                    borderRadius: 6,
                    cursor: readOnly ? 'pointer' : 'grab',
                    display: 'flex',
                    minHeight: 28,
                    paddingInline: 8,
                    width: '100%',
                  }}
                  tabIndex={0}
                >
                  <Space size={6} style={{ flex: 1, minWidth: 0 }}>
                    {folderCollapsed ? <RightOutlined /> : <DownOutlined />}
                    {folderCollapsed ? <FolderOutlined /> : <FolderOpenOutlined />}
                    {inlineEdit?.type === 'folder' && inlineEdit.path === row.path ? (
                      <Input
                        aria-label={`${t('Rename')} ${row.path}`}
                        onBlur={commitInlineEdit}
                        onChange={(event) =>
                          setInlineEdit((current) =>
                            current && current.path === row.path ? { ...current, value: event.target.value } : current,
                          )
                        }
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            inlineEditInputRef.current?.blur();
                          } else if (event.key === 'Escape') {
                            event.preventDefault();
                            cancelInlineEdit();
                          }
                        }}
                        ref={inlineEditInputRef}
                        size="small"
                        style={{ flex: 1, minWidth: 0 }}
                        value={inlineEdit.value}
                      />
                    ) : (
                      <Typography.Text ellipsis type="secondary">
                        {row.name}
                      </Typography.Text>
                    )}
                  </Space>
                  {!readOnly && canCreateInsideFolder ? (
                    <Space
                      size={0}
                      style={{
                        opacity: actionsVisible ? 1 : 0,
                        pointerEvents: actionsVisible ? 'auto' : 'none',
                        transition: 'opacity 120ms ease',
                      }}
                    >
                      <Tooltip title={t('New file')} open={actionsVisible ? undefined : false}>
                        <Button
                          aria-label={`${t('New file')} ${row.path}`}
                          icon={<FileAddOutlined />}
                          onBlur={() => setActionFocusedPath((current) => (current === row.path ? null : current))}
                          onClick={(event) => {
                            event.stopPropagation();
                            createFileInline(row.path);
                          }}
                          onFocus={() => setActionFocusedPath(row.path)}
                          size="small"
                          style={{ height: 20, padding: 0, width: 20 }}
                          tabIndex={actionsVisible ? 0 : -1}
                          type="text"
                        />
                      </Tooltip>
                      <Tooltip title={t('New folder')} open={actionsVisible ? undefined : false}>
                        <Button
                          aria-label={`${t('New folder')} ${row.path}`}
                          icon={<FolderAddOutlined />}
                          onBlur={() => setActionFocusedPath((current) => (current === row.path ? null : current))}
                          onClick={(event) => {
                            event.stopPropagation();
                            createFolderInline(row.path);
                          }}
                          onFocus={() => setActionFocusedPath(row.path)}
                          size="small"
                          style={{ height: 20, padding: 0, width: 20 }}
                          tabIndex={actionsVisible ? 0 : -1}
                          type="text"
                        />
                      </Tooltip>
                    </Space>
                  ) : null}
                </div>
              </List.Item>
            );
          }

          const dirty = isWorkspaceFileDirty(savedFiles, row.file);
          const isActive = activePath === row.path;
          const actionsVisible = hoveredPath === row.path || actionFocusedPath === row.path;
          return (
            <List.Item
              draggable={!readOnly && row.path !== runJSManifestPath}
              onDragStart={(event) => {
                setRunJSTreeDragPayload(event.dataTransfer, 'file', row.path);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onMouseEnter={() => setHoveredPath(row.path)}
              onMouseLeave={() => setHoveredPath((current) => (current === row.path ? null : current))}
              style={{
                paddingInline: 0,
                paddingLeft: row.depth * 14,
                position: 'relative',
              }}
            >
              {inlineEdit?.type === 'file' && inlineEdit.path === row.path ? (
                <div
                  aria-label={row.path}
                  style={{
                    alignItems: 'center',
                    background: isActive ? '#e6f4ff' : undefined,
                    borderRadius: 6,
                    display: 'flex',
                    minHeight: 28,
                    minWidth: 0,
                    paddingInline: 12,
                    paddingInlineEnd: readOnly ? undefined : 76,
                    width: '100%',
                  }}
                >
                  <Space size={6} style={{ flex: 1, minWidth: 0 }}>
                    <RunJSFileTypeIcon path={row.path} />
                    <Input
                      aria-label={`${t('Rename')} ${row.path}`}
                      onBlur={commitInlineEdit}
                      onChange={(event) =>
                        setInlineEdit((current) =>
                          current && current.path === row.path ? { ...current, value: event.target.value } : current,
                        )
                      }
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          inlineEditInputRef.current?.blur();
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          cancelInlineEdit();
                        }
                      }}
                      ref={inlineEditInputRef}
                      size="small"
                      style={{ flex: 1, minWidth: 0 }}
                      value={inlineEdit.value}
                    />
                  </Space>
                </div>
              ) : (
                <Button
                  aria-label={row.path}
                  aria-pressed={isActive}
                  block
                  onKeyDown={(event) => handleFileKeyDown(event, row.path)}
                  onClick={() => onOpen(row.path)}
                  ref={registerFileButton(row.path)}
                  style={{
                    background: isActive ? '#e6f4ff' : undefined,
                    color: isActive ? '#1677ff' : undefined,
                    justifyContent: 'flex-start',
                    minWidth: 0,
                    paddingInlineEnd: readOnly ? undefined : 76,
                  }}
                  type="text"
                >
                  <Space size={6} style={{ minWidth: 0 }}>
                    <RunJSFileTypeIcon path={row.path} />
                    <Typography.Text ellipsis style={{ maxWidth: 152 }}>
                      {row.name}
                      {dirty ? ' *' : ''}
                    </Typography.Text>
                  </Space>
                </Button>
              )}
              {!readOnly ? (
                <Space
                  size={0}
                  style={{
                    background: isActive ? '#e6f4ff' : '#fafafa',
                    borderRadius: 4,
                    insetInlineEnd: 2,
                    opacity: actionsVisible ? 1 : 0,
                    pointerEvents: actionsVisible ? 'auto' : 'none',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    transition: 'opacity 120ms ease',
                  }}
                >
                  <Tooltip title={t('Rename')} open={actionsVisible ? undefined : false}>
                    <Button
                      aria-label={`${t('Rename')} ${row.path}`}
                      icon={<EditOutlined />}
                      onBlur={() => setActionFocusedPath((current) => (current === row.path ? null : current))}
                      onClick={(event) => {
                        event.stopPropagation();
                        startInlineEdit('file', row.path, false);
                      }}
                      onFocus={() => setActionFocusedPath(row.path)}
                      size="small"
                      style={{ height: 20, padding: 0, width: 20 }}
                      tabIndex={actionsVisible ? 0 : -1}
                      type="text"
                    />
                  </Tooltip>
                  <Popconfirm
                    cancelText={t('Cancel')}
                    okText={t('Delete')}
                    onConfirm={() => onDelete(row.path)}
                    title={t('Delete this file?')}
                  >
                    <Button
                      aria-label={`${t('Delete')} ${row.path}`}
                      danger
                      icon={<DeleteOutlined />}
                      onBlur={() => setActionFocusedPath((current) => (current === row.path ? null : current))}
                      onClick={(event) => event.stopPropagation()}
                      onFocus={() => setActionFocusedPath(row.path)}
                      size="small"
                      style={{ height: 20, padding: 0, width: 20 }}
                      tabIndex={actionsVisible ? 0 : -1}
                      type="text"
                    />
                  </Popconfirm>
                </Space>
              ) : null}
            </List.Item>
          );
        }}
      />
    </aside>
  );
}

function CodeTab(props: {
  activeFile?: RunJSWorkspaceFile;
  activePath?: string;
  diffRows: RunJSLineDiffRow[];
  filesCollapsed: boolean;
  isDiff: boolean;
  onChange: (content: string) => void;
  onCloseFile: (path: string) => void;
  onDiffToggle: () => void;
  onFilesCollapsedChange: (collapsed: boolean) => void;
  onOpenFile: (path: string) => void;
  onRunPreview: () => void;
  openPaths: string[];
  previewing: boolean;
  readOnly: boolean;
  savedFiles: RunJSWorkspaceFile[];
  scene: string;
  t: (key: string) => string;
  version: string;
  workspaceFiles: RunJSWorkspaceFile[];
}) {
  const {
    activeFile,
    activePath,
    diffRows,
    filesCollapsed,
    isDiff,
    onChange,
    onCloseFile,
    onDiffToggle,
    onFilesCollapsedChange,
    onOpenFile,
    onRunPreview,
    openPaths,
    previewing,
    readOnly,
    savedFiles,
    scene,
    t,
    version,
    workspaceFiles,
  } = props;
  const openFiles = openPaths
    .map((path) => workspaceFiles.find((file) => file.path === path))
    .filter((file): file is RunJSWorkspaceFile => Boolean(file));
  const moduleImportCompletions = useRunJSImportModuleCompletions(workspaceFiles, activeFile?.path);
  const typescriptProject = useMemo(
    () => buildRunJSTypeScriptProject(workspaceFiles, activeFile),
    [activeFile, workspaceFiles],
  );

  if (!activeFile) {
    return <Empty description={t('Select a file')} />;
  }

  const fileTabsContent = (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 8,
        minWidth: 0,
        width: '100%',
      }}
    >
      <Tooltip title={filesCollapsed ? t('Expand files') : t('Collapse files')}>
        <Button
          aria-label={filesCollapsed ? t('Expand files') : t('Collapse files')}
          icon={<FolderOpenOutlined />}
          onClick={() => onFilesCollapsedChange(!filesCollapsed)}
          size="small"
          type="default"
        />
      </Tooltip>
      <div style={{ flex: 1, minWidth: 0 }}>
        <OpenFileTabs
          activePath={activePath}
          files={openFiles.length ? openFiles : [activeFile]}
          onClose={onCloseFile}
          onOpen={onOpenFile}
          savedFiles={savedFiles}
          t={t}
        />
      </div>
    </div>
  );
  const runAndDiffActions = (
    <Space.Compact>
      <Button disabled={isDiff} loading={previewing} onClick={onRunPreview} size="small">
        {t('Run')}
      </Button>
      <Tooltip title={t('Diff')}>
        <Button
          aria-label={t('Diff')}
          icon={<DiffOutlined />}
          onClick={onDiffToggle}
          size="small"
          type={isDiff ? 'primary' : 'default'}
        />
      </Tooltip>
    </Space.Compact>
  );

  if (isDiff) {
    return (
      <section
        aria-label={t('Code')}
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            borderBottom: '1px solid #d9d9d9',
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
            minWidth: 0,
            padding: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>{fileTabsContent}</div>
          {runAndDiffActions}
        </div>
        <SideBySideDiffView rows={diffRows} t={t} />
      </section>
    );
  }

  return (
    <section
      aria-label={t('Code')}
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 8,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <CodeEditor
        enableLinter
        height="100%"
        language={isDiff ? 'diff' : activeFile.language || inferLanguageFromPath(activeFile.path)}
        minHeight={0}
        moduleImportCompletions={moduleImportCompletions}
        name={activeFile.path}
        onChange={isDiff ? undefined : onChange}
        placeholder={t('Edit file content')}
        readonly={readOnly || isDiff}
        runButton={runAndDiffActions}
        scene={scene}
        showLogs={false}
        toolbarLeftExtra={fileTabsContent}
        typescriptProject={typescriptProject}
        value={activeFile.content}
        version={version}
        wrapperStyle={{ flex: 1, height: '100%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}
      />
    </section>
  );
}

function OpenFileTabs(props: {
  activePath?: string;
  files: RunJSWorkspaceFile[];
  onClose: (path: string) => void;
  onOpen: (path: string) => void;
  savedFiles: RunJSWorkspaceFile[];
  t: (key: string) => string;
}) {
  const { activePath, files, onClose, onOpen, savedFiles, t } = props;
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [closeFocusedPath, setCloseFocusedPath] = useState<string | null>(null);
  const tabButtonRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const registerTabButton = React.useCallback(
    (path: string) => (element: HTMLButtonElement | null) => {
      if (element) {
        tabButtonRefs.current.set(path, element);
      } else {
        tabButtonRefs.current.delete(path);
      }
    },
    [],
  );
  const focusTab = React.useCallback((path: string) => {
    const focus = () => {
      tabButtonRefs.current.get(path)?.focus();
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focus);
      return;
    }

    focus();
  }, []);
  const openFileAtIndex = (index: number) => {
    const next = files[index];
    if (next) {
      onOpen(next.path);
      focusTab(next.path);
    }
  };
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      openFileAtIndex(Math.min(index + 1, files.length - 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      openFileAtIndex(Math.max(index - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      openFileAtIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      openFileAtIndex(files.length - 1);
    }
  };

  return (
    <div
      aria-label={t('Open files')}
      role="tablist"
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 4,
        height: 24,
        minWidth: 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        width: '100%',
      }}
    >
      {files.map((file, index) => {
        const active = file.path === activePath;
        const dirty = isWorkspaceFileDirty(savedFiles, file);
        const fileName = file.path.split('/').pop() || file.path;
        const closeVisible = hoveredPath === file.path || closeFocusedPath === file.path;

        return (
          <div
            key={file.path}
            onMouseEnter={() => setHoveredPath(file.path)}
            onMouseLeave={() => setHoveredPath((current) => (current === file.path ? null : current))}
            style={{
              alignItems: 'center',
              display: 'inline-flex',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <Tooltip title={file.path}>
              <Button
                aria-label={file.path}
                aria-selected={active}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                onClick={() => onOpen(file.path)}
                ref={registerTabButton(file.path)}
                role="tab"
                size="small"
                style={{
                  background: active ? '#fff' : '#f5f5f5',
                  borderColor: active ? '#91caff' : '#d9d9d9',
                  borderRadius: 4,
                  boxShadow: active ? 'inset 0 -2px 0 #1677ff' : 'none',
                  color: '#262626',
                  maxWidth: 180,
                  paddingInlineEnd: 22,
                }}
                tabIndex={active ? 0 : -1}
                type="default"
              >
                <Space size={4} style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      maxWidth: 112,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      verticalAlign: 'bottom',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fileName}
                    {dirty ? ' *' : ''}
                  </span>
                </Space>
              </Button>
            </Tooltip>
            <Tooltip title={t('Close file')} open={closeVisible ? undefined : false}>
              <Button
                aria-label={`${t('Close file')} ${file.path}`}
                icon={<CloseOutlined />}
                onBlur={() => setCloseFocusedPath((current) => (current === file.path ? null : current))}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(file.path);
                }}
                onFocus={() => setCloseFocusedPath(file.path)}
                size="small"
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  height: 18,
                  insetInlineEnd: 3,
                  opacity: closeVisible ? 1 : 0,
                  padding: 0,
                  pointerEvents: closeVisible ? 'auto' : 'none',
                  position: 'absolute',
                  top: 3,
                  transition: 'opacity 120ms ease',
                  width: 18,
                }}
                tabIndex={closeVisible ? 0 : -1}
                type="text"
              />
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}

type SideBySideDiffRow = {
  key: string;
  type: 'context' | 'delete' | 'insert' | 'change';
  oldLineNumber?: number;
  newLineNumber?: number;
  oldContent?: string;
  newContent?: string;
};

function buildSideBySideDiffRows(rows: RunJSLineDiffRow[]): SideBySideDiffRow[] {
  const result: SideBySideDiffRow[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const next = rows[index + 1];

    if (
      row.type === 'delete' &&
      next?.type === 'insert' &&
      row.oldLineNumber !== undefined &&
      row.oldLineNumber === next.newLineNumber
    ) {
      result.push({
        key: `${row.key}:${next.key}`,
        type: 'change',
        oldLineNumber: row.oldLineNumber,
        newLineNumber: next.newLineNumber,
        oldContent: row.content,
        newContent: next.content,
      });
      index += 1;
      continue;
    }

    if (row.type === 'context') {
      result.push({
        key: row.key,
        type: 'context',
        oldLineNumber: row.oldLineNumber,
        newLineNumber: row.newLineNumber,
        oldContent: row.content,
        newContent: row.content,
      });
      continue;
    }

    if (row.type === 'delete') {
      result.push({
        key: row.key,
        type: 'delete',
        oldLineNumber: row.oldLineNumber,
        oldContent: row.content,
      });
      continue;
    }

    result.push({
      key: row.key,
      type: 'insert',
      newLineNumber: row.newLineNumber,
      newContent: row.content,
    });
  }

  return result;
}

function DiffCodeLine(props: {
  content?: string;
  lineNumber?: number;
  tone: 'neutral' | 'delete' | 'insert' | 'blank';
}) {
  const { content = '', lineNumber, tone } = props;
  const background =
    tone === 'delete' ? '#fff1f0' : tone === 'insert' ? '#f6ffed' : tone === 'blank' ? '#fafafa' : '#fff';
  const borderColor = tone === 'delete' ? '#ffccc7' : tone === 'insert' ? '#b7eb8f' : 'transparent';

  return (
    <div
      style={{
        background,
        borderLeft: `3px solid ${borderColor}`,
        display: 'grid',
        gridTemplateColumns: '48px minmax(0, 1fr)',
        minHeight: 22,
      }}
    >
      <span
        style={{
          color: '#8c8c8c',
          padding: '2px 8px',
          textAlign: 'right',
          userSelect: 'none',
        }}
      >
        {lineNumber ?? ''}
      </span>
      <code
        style={{
          color: tone === 'blank' ? '#bfbfbf' : '#262626',
          display: 'block',
          fontFamily: '"Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
          padding: '2px 8px',
          whiteSpace: 'pre',
        }}
      >
        {content || ' '}
      </code>
    </div>
  );
}

function SideBySideDiffView(props: { rows: RunJSLineDiffRow[]; t: (key: string) => string }) {
  const { rows, t } = props;
  const sideBySideRows = buildSideBySideDiffRows(rows);
  const hasChanges = rows.some((row) => row.type !== 'context');

  return (
    <div
      aria-label={t('Diff output')}
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        }}
      >
        <div style={{ borderRight: '1px solid #f0f0f0', padding: '8px 12px' }}>
          <Space>
            <Typography.Text strong>{t('Saved')}</Typography.Text>
            <Tag>{t('Base')}</Tag>
          </Space>
        </div>
        <div style={{ padding: '8px 12px' }}>
          <Space>
            <Typography.Text strong>{t('Current editor')}</Typography.Text>
            <Tag color="gold">{t('Unsaved changes')}</Tag>
          </Space>
        </div>
      </div>
      {!hasChanges ? (
        <div style={{ padding: 24 }}>
          <Empty description={t('No changes between current editor and published version')} />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            flex: 1,
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            minHeight: 0,
            overflow: 'auto',
          }}
        >
          <div style={{ borderRight: '1px solid #f0f0f0', minWidth: 0 }}>
            {sideBySideRows.map((row) => (
              <DiffCodeLine
                content={row.oldContent}
                key={`${row.key}:old`}
                lineNumber={row.oldLineNumber}
                tone={row.type === 'insert' ? 'blank' : row.type === 'context' ? 'neutral' : 'delete'}
              />
            ))}
          </div>
          <div style={{ minWidth: 0 }}>
            {sideBySideRows.map((row) => (
              <DiffCodeLine
                content={row.newContent}
                key={`${row.key}:new`}
                lineNumber={row.newLineNumber}
                tone={row.type === 'delete' ? 'blank' : row.type === 'context' ? 'neutral' : 'insert'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VersionHistoryDock(props: {
  baseVersion: string;
  collapsed: boolean;
  hasUnsavedLocalChanges: boolean;
  historyItems: RunJSSourceHistoryItem[];
  loading: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onRefresh: () => void;
  onSelect: (commit: RunJSSourceHistoryItem) => void;
  onViewChanges: () => void;
  publishedCommitId?: string | null;
  t: (key: string) => string;
}) {
  const {
    baseVersion,
    collapsed,
    hasUnsavedLocalChanges,
    historyItems,
    loading,
    onCollapsedChange,
    onRefresh,
    onSelect,
    onViewChanges,
    publishedCommitId,
    t,
  } = props;

  return (
    <section
      aria-label={t('Commit history')}
      style={{
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        flex: collapsed ? '0 0 40px' : '1 1 220px',
        flexDirection: 'column',
        gap: collapsed ? 0 : 8,
        marginTop: collapsed ? 'auto' : 0,
        maxHeight: collapsed ? 40 : undefined,
        minHeight: collapsed ? 40 : 180,
        overflow: 'hidden',
        padding: '8px 12px',
        transition:
          'flex-basis 180ms ease, min-height 180ms ease, max-height 180ms ease, margin-top 180ms ease, gap 180ms ease',
      }}
    >
      <Space style={{ justifyContent: 'space-between' }}>
        <Typography.Text strong>{t('History')}</Typography.Text>
        <Space size={4}>
          {!collapsed ? (
            <Button aria-label={t('Refresh history')} icon={<ReloadOutlined />} loading={loading} onClick={onRefresh} />
          ) : null}
          <Tooltip title={collapsed ? t('Expand history') : t('Collapse history')}>
            <Button
              aria-label={collapsed ? t('Expand history') : t('Collapse history')}
              icon={collapsed ? <UpOutlined /> : <DownOutlined />}
              onClick={() => onCollapsedChange(!collapsed)}
              size="small"
            />
          </Tooltip>
        </Space>
      </Space>
      {!collapsed ? (
        <>
          {hasUnsavedLocalChanges ? (
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 8 }}>
              <Space direction="vertical" size={2}>
                <Typography.Text strong>{t('Current changes')}</Typography.Text>
                <Typography.Text type="secondary">
                  {t('Unsaved changes')} · {`${t('Based on')} ${baseVersion}`}
                </Typography.Text>
                <Button onClick={onViewChanges} size="small" type="link">
                  {t('View diff')}
                </Button>
              </Space>
            </div>
          ) : null}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {historyItems.length === 0 ? <Empty description={t('No published versions yet')} /> : null}
            {historyItems.map((commit) => (
              <button
                aria-label={`${t('Restore')} ${formatCommitTime(commit)} ${formatVersion(commit.seq)}`}
                key={commit.id}
                onClick={() => onSelect(commit)}
                style={{
                  background: 'transparent',
                  border: 0,
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'block',
                  padding: '6px 4px',
                  textAlign: 'left',
                  width: '100%',
                }}
                type="button"
              >
                <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
                    <Space size={6}>
                      <Typography.Text strong>{formatCommitTime(commit)}</Typography.Text>
                      <Typography.Text type="secondary">{formatVersion(commit.seq)}</Typography.Text>
                      {commit.isPublished || commit.id === publishedCommitId ? (
                        <Tag color="green">{t('Published')}</Tag>
                      ) : null}
                    </Space>
                    <Typography.Text ellipsis type="secondary">
                      {commit.message}
                    </Typography.Text>
                  </Space>
                  <ImportOutlined
                    aria-hidden="true"
                    style={{ color: '#8c8c8c', flex: '0 0 auto', fontSize: 13, marginTop: 3 }}
                  />
                </Space>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function formatCommitTime(commit: RunJSSourceHistoryItem): string {
  const createdAt = typeof commit.createdAt === 'string' ? commit.createdAt : null;
  if (!createdAt) {
    return formatVersion(commit.seq);
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return formatVersion(commit.seq);
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ConsolePanel(props: {
  entries: RunJSConsoleEntry[];
  height: number;
  maxHeight: string;
  minHeight: number;
  onClear: () => void;
  onCopy: () => void;
  onJump: (entry: RunJSConsoleEntry) => void;
  onResize: (height: number) => void;
  t: (key: string) => string;
}) {
  const { entries, height, maxHeight, minHeight, onClear, onCopy, onJump, onResize, t } = props;
  const clampHeight = React.useCallback(
    (value: number) => {
      const max =
        typeof window === 'undefined' || !window.innerHeight
          ? Math.max(height, minHeight)
          : Math.max(minHeight, Math.floor(window.innerHeight * 0.5));
      return Math.min(Math.max(Math.round(value), minHeight), max);
    },
    [height, minHeight],
  );
  const startResize = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        onResize(clampHeight(startHeight - (moveEvent.clientY - startY)));
      };
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [clampHeight, height, onResize],
  );
  const handleResizeKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        onResize(clampHeight(height + 20));
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        onResize(clampHeight(height - 20));
      }
    },
    [clampHeight, height, onResize],
  );

  return (
    <section
      aria-label={t('Console')}
      style={{
        borderTop: '1px solid #f0f0f0',
        background: '#fff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height,
        maxHeight,
        minHeight,
        overflow: 'hidden',
        paddingTop: 8,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        aria-label={t('Resize console')}
        aria-orientation="horizontal"
        aria-valuemin={minHeight}
        aria-valuenow={height}
        onKeyDown={handleResizeKeyDown}
        onMouseDown={startResize}
        role="separator"
        style={{
          alignSelf: 'stretch',
          background: 'transparent',
          borderTop: '2px solid transparent',
          cursor: 'row-resize',
          height: 8,
          marginTop: -8,
          outline: 'none',
        }}
        tabIndex={0}
      />
      <Space style={{ justifyContent: 'space-between', marginBottom: 8, padding: '0 12px' }}>
        <Typography.Text strong>{t('Console logs')}</Typography.Text>
        <Space>
          <Button onClick={onClear} size="small">
            {t('Clear')}
          </Button>
          <Button icon={<CopyOutlined />} onClick={onCopy} size="small">
            {t('Copy logs')}
          </Button>
        </Space>
      </Space>
      <div aria-live="polite" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 12px 12px' }}>
        {entries.length === 0 ? (
          <div
            style={{
              alignItems: 'center',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              color: '#8c8c8c',
              display: 'flex',
              fontFamily: 'monospace',
              justifyContent: 'center',
              minHeight: 48,
            }}
          >
            {t('No logs yet. Click Run to execute.')}
          </div>
        ) : null}
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onJump(entry)}
            style={{
              background: 'transparent',
              border: 0,
              color: entry.level === 'error' ? '#cf1322' : entry.level === 'warn' ? '#ad6800' : '#262626',
              cursor: entry.path ? 'pointer' : 'default',
              display: 'block',
              fontFamily: 'monospace',
              padding: '2px 0',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              width: '100%',
            }}
            type="button"
          >
            [{entry.level}] {entry.path ? `${entry.path}${entry.line ? `:${entry.line}` : ''} ` : ''}
            {entry.message}
          </button>
        ))}
      </div>
    </section>
  );
}

function PublishModal(props: {
  commitMessage: string;
  loading: boolean;
  onAfterClose: () => void;
  onCancel: () => void;
  onCommitMessageChange: (value: string) => void;
  onPublish: () => void;
  open: boolean;
  readOnly: boolean;
  summary: RunJSChangeSummary;
  t: (key: string) => string;
}) {
  const {
    commitMessage,
    loading,
    onAfterClose,
    onCancel,
    onCommitMessageChange,
    onPublish,
    open,
    readOnly,
    summary,
    t,
  } = props;
  const trimmed = commitMessage.trim();
  const messageInvalid = trimmed.length === 0 || trimmed.length > 200;
  const disabled = readOnly || summary.files === 0 || messageInvalid;
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  return (
    <Modal
      afterClose={onAfterClose}
      confirmLoading={loading}
      okButtonProps={{ disabled }}
      okText={t('Save')}
      onCancel={onCancel}
      onOk={onPublish}
      open={open}
      title={t('Commit message')}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text strong>{t('Changes')}</Typography.Text>
        <Typography.Text>{formatChangeSummary(summary, t)}</Typography.Text>
        {summary.files === 0 ? <Alert message={t('No changes to save')} showIcon type="info" /> : null}
        <Input
          aria-label={t('Commit message')}
          maxLength={200}
          onChange={(event) => onCommitMessageChange(event.target.value)}
          placeholder={t('Describe this change')}
          ref={inputRef}
          showCount
          status={commitMessage && messageInvalid ? 'error' : undefined}
          value={commitMessage}
        />
      </Space>
    </Modal>
  );
}

function SaveDiagnosticsModal(props: {
  diagnostics: RunJSCompileDiagnostic[];
  onCancel: () => void;
  open: boolean;
  t: (key: string) => string;
}) {
  const { diagnostics, onCancel, open, t } = props;
  const details = formatCompileDiagnostics(diagnostics) || t('No compile diagnostics');

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard?.writeText(details);
      message.success(t('Details copied'));
    } catch (_) {
      message.error(t('Copy details failed'));
    }
  };

  return (
    <Modal
      footer={[
        <Button aria-label={t('Copy technical details')} key="copy" icon={<CopyOutlined />} onClick={copyDiagnostics}>
          {t('Copy technical details')}
        </Button>,
        <Button key="dismiss" onClick={onCancel} type="primary">
          {t('Dismiss')}
        </Button>,
      ]}
      onCancel={onCancel}
      open={open}
      title={t('Save failed')}
      width={720}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert message={t('Compile failed')} role="alert" showIcon type="error" />
        <Typography.Text>{t('Fix compile errors before saving.')}</Typography.Text>
        <pre
          aria-label={t('Compile diagnostics')}
          data-testid="runjs-save-diagnostics"
          style={{
            background: '#141414',
            borderRadius: 6,
            color: '#f5f5f5',
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 1.6,
            margin: 0,
            maxHeight: 'min(520px, calc(100vh - 260px))',
            overflow: 'auto',
            padding: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {details}
        </pre>
      </Space>
    </Modal>
  );
}

function CloseConfirmModal(props: {
  intent: PendingDirtyAction;
  onCancel: () => void;
  onCloseWithoutSaving: () => void;
  open: boolean;
  t: (key: string) => string;
}) {
  const { intent, onCancel, onCloseWithoutSaving, open, t } = props;
  const discardLabel = intent === 'refresh' ? t('Discard changes and refresh') : t('Discard changes');
  const message =
    intent === 'refresh' ? t('Discard your changes before refreshing?') : t('Discard your changes before closing?');

  return (
    <Modal
      footer={[
        <Button danger key="discard" onClick={onCloseWithoutSaving} type="primary">
          {discardLabel}
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
      ]}
      onCancel={onCancel}
      open={open}
      title={t('Unsaved changes')}
    >
      <Typography.Text>{message}</Typography.Text>
    </Modal>
  );
}

function RestoreVersionModal(props: {
  commit: RunJSSourceHistoryItem | null;
  loading: boolean;
  onCancel: () => void;
  onRestore: () => void;
  t: (key: string) => string;
}) {
  const { commit, loading, onCancel, onRestore, t } = props;
  const version = commit ? formatVersion(commit.seq) : '';

  return (
    <Modal
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
        <Button key="restore" loading={loading} onClick={onRestore} type="primary">
          {t('Restore')}
        </Button>,
      ]}
      onCancel={onCancel}
      open={Boolean(commit)}
      title={formatRestoreTitle(version, t)}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text>{t('This will copy files from this version into the editor.')}</Typography.Text>
        <Typography.Text>{t('It will not change the published version.')}</Typography.Text>
        <Typography.Text>{t('You can review and save after restoring.')}</Typography.Text>
      </Space>
    </Modal>
  );
}

function formatRestoreTitle(version: string, t: (key: string) => string): string {
  return t('Restore {{version}}?').replace('{{version}}', version);
}

function ConflictDialog(props: {
  conflict: ConflictState | null;
  onCancel: () => void;
  onDiscard: () => void;
  onRebase: () => void;
  onViewChanges: () => void;
  t: (key: string) => string;
}) {
  const { conflict, onCancel, onDiscard, onRebase, onViewChanges, t } = props;

  return (
    <Modal footer={null} onCancel={onCancel} open={Boolean(conflict)} title={t('Conflict')}>
      {conflict ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message={t('This JavaScript source changed while you were editing.')}
            role="alert"
            showIcon
            type="warning"
          />
          {!conflict.canRebase ? (
            <Alert
              message={t('The source owner changed outside this workspace. Load latest version before saving.')}
              role="alert"
              showIcon
              type="error"
            />
          ) : null}
          <Typography.Text>{`${t('Your changes are based on')} ${conflict.baseVersion}.`}</Typography.Text>
          <Typography.Text>{`${t('Latest published version is')} ${conflict.latestVersion}.`}</Typography.Text>
          <Space wrap>
            {conflict.canRebase ? <Button onClick={onViewChanges}>{t('View changes')}</Button> : null}
            {conflict.canRebase ? (
              <Button onClick={onRebase} type="primary">
                {t('Keep my changes on latest version')}
              </Button>
            ) : null}
            <Button danger onClick={onDiscard}>
              {t('Load latest version')}
            </Button>
          </Space>
        </Space>
      ) : null}
    </Modal>
  );
}

function appendDiagnostics(
  diagnostics: RunJSCompileDiagnostic[],
  appendConsole: (entry: Omit<RunJSConsoleEntry, 'id'>) => void,
) {
  for (const diagnostic of diagnostics) {
    appendConsole({
      level: diagnostic.severity === 'error' ? 'error' : diagnostic.severity === 'warning' ? 'warn' : 'info',
      message: diagnostic.message,
      path: diagnostic.path,
      line: diagnostic.line,
      column: diagnostic.column,
    });
  }
}

function appendRunDiagnostics(
  result: DiagnoseRunJSResult,
  appendConsole: (entry: Omit<RunJSConsoleEntry, 'id'>) => void,
) {
  for (const log of result.logs || []) {
    appendConsole({
      level: log.level,
      message: log.message,
    });
  }

  for (const issue of result.issues || []) {
    const start = issue.location?.start;
    appendConsole({
      column: start?.column,
      level: issue.type === 'runtime' ? 'error' : 'warn',
      line: start?.line,
      message: issue.message,
      path: issue.sourcePath,
    });
  }
}

function formatCompileDiagnostics(diagnostics: RunJSCompileDiagnostic[]): string {
  return diagnostics
    .map((diagnostic) => {
      const location = diagnostic.path
        ? `${diagnostic.path}${diagnostic.line ? `:${diagnostic.line}` : ''}${
            diagnostic.column ? `:${diagnostic.column}` : ''
          }`
        : '';
      const code = diagnostic.code || diagnostic.ruleId ? ` (${diagnostic.code || diagnostic.ruleId})` : '';
      const prefix = `[${diagnostic.severity || 'error'}]${location ? ` ${location}` : ''}${code}`;
      const details = diagnostic.details ? `\n${JSON.stringify(diagnostic.details, null, 2)}` : '';

      return `${prefix} ${diagnostic.message}${details}`;
    })
    .join('\n\n');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

function buildRunJSExportFileName(label: string | undefined): string {
  const baseName = (label || 'runjs-workspace').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${baseName || 'runjs-workspace'}.zip`;
}

function normalizeRunJSWorkspaceBlob(value: Blob): Blob {
  const blob = value instanceof Blob ? value : new Blob([String(value)], { type: 'application/zip' });
  return blob.type === 'application/zip' ? blob : new Blob([blob], { type: 'application/zip' });
}

function createRunJSWorkspaceObjectUrl(value: Blob): string | null {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }

  return URL.createObjectURL(normalizeRunJSWorkspaceBlob(value));
}

function revokeRunJSWorkspaceObjectUrl(url: string): void {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

function canStartRunJSWorkspaceDownload(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  const activation = (navigator as Navigator & { userActivation?: { isActive?: boolean } }).userActivation;
  return activation?.isActive !== false;
}

function downloadRunJSWorkspaceBlob(value: Blob, fileName: string): boolean {
  if (typeof document === 'undefined' || !canStartRunJSWorkspaceDownload()) {
    return false;
  }

  const url = createRunJSWorkspaceObjectUrl(value);
  if (!url) {
    return false;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => revokeRunJSWorkspaceObjectUrl(url), 0);
  return true;
}

function findCommit(items: RunJSSourceHistoryItem[], commitId?: string | null): RunJSSourceHistoryItem | undefined {
  if (!commitId) {
    return undefined;
  }

  return items.find((item) => item.id === commitId);
}

function canPublish(
  commitMessage: string,
  summary: RunJSChangeSummary,
  diagnostics: RunJSCompileDiagnostic[],
  readOnly: boolean,
): boolean {
  const length = commitMessage.trim().length;
  return (
    !readOnly &&
    summary.files > 0 &&
    length > 0 &&
    length <= 200 &&
    diagnostics.every((item) => item.severity !== 'error')
  );
}

function hasCompileErrorDiagnostics(diagnostics: RunJSCompileDiagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === 'error');
}

function isConflictError(error: unknown): error is RunJSSourceRequestError {
  return (
    error instanceof RunJSSourceRequestError &&
    (error.code === 'BASE_COMMIT_OUTDATED' || error.code === 'RUNJS_SOURCE_OWNER_OUTDATED')
  );
}

function isOwnerOutdatedError(error: unknown): error is RunJSSourceRequestError {
  return error instanceof RunJSSourceRequestError && error.code === 'RUNJS_SOURCE_OWNER_OUTDATED';
}
