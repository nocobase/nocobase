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
  FileAddOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { CodeEditor, type RunJSEditorProvider, type RunJSEditorProviderRenderProps } from '@nocobase/client-v2';
import { useFlowContext, type FlowEngineContext, type RunJSValue } from '@nocobase/flow-engine';
import {
  Alert,
  Badge,
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  applyDraftFiles,
  applyWorkspaceChanges,
  buildChangedWorkspaceFileList,
  buildLineDiff,
  buildWorkspaceChanges,
  buildWorkspaceSnapshotKey,
  compareRunJSPaths,
  ensureManifestEntry,
  formatChangeSummary,
  formatVersion,
  hasWorkspaceChanges,
  inferLanguageFromPath,
  normalizeRunJSWorkspacePath,
  normalizeWorkspaceFiles,
  removeWorkspaceFile,
  replaceWorkspaceFilePath,
  resolveInitialEntryPath,
  resolveWorkspaceEntryPath,
  runJSManifestPath,
  summarizeWorkspaceChanges,
  updateWorkspaceFile,
  upsertWorkspaceFile,
  validateRunJSWorkspacePath,
} from './workspaceUtils';

const defaultEntryPath = 'src/main.tsx';
const defaultConsolePanelHeight = 180;
const minConsolePanelHeight = 80;

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

type FileDialogMode = 'create' | 'rename';

type FileDialogState = {
  mode: FileDialogMode;
  sourcePath?: string;
};

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

type PreviewArtifactState = {
  code: string;
  version: string;
  snapshotKey: string;
};

type ClosableView = {
  close?: () => boolean | void | Promise<boolean | void>;
  beforeClose?: (options?: unknown) => boolean | void | Promise<boolean | void>;
  destroy?: () => void;
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
  const [consoleEntries, setConsoleEntries] = useState<RunJSConsoleEntry[]>([]);
  const [fileDialog, setFileDialog] = useState<FileDialogState | null>(null);
  const [fileDialogPath, setFileDialogPath] = useState('');
  const [fileDialogError, setFileDialogError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewDiagnostics, setPreviewDiagnostics] = useState<RunJSCompileDiagnostic[]>([]);
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
  const baseCommitId = workspace?.draft?.baseCommitId ?? workspace?.repository?.publishedCommitId ?? null;
  const baseCommit = findCommit(historyItems, baseCommitId);
  const lineDiffRows = useMemo(
    () => buildLineDiff(effectiveDiffBaseFiles, effectiveDiffFiles, selectedDiffPath, false),
    [effectiveDiffBaseFiles, effectiveDiffFiles, selectedDiffPath],
  );

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
    setFileDialog(null);
    setFileDialogPath('');
    setFileDialogError(null);
    setPublishOpen(false);
    setCommitMessage('');
    setPreviewing(false);
    setPublishing(false);
    setPreviewDiagnostics([]);
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

  const openWorkspaceSnapshot = useCallback(async (): Promise<WorkspaceLoadResult | null> => {
    if (!props.locator) {
      return null;
    }

    const opened = await runJSSourceRequest('open', { locator: props.locator });
    return buildWorkspaceLoadResult(opened);
  }, [props.locator, runJSSourceRequest]);

  const loadWorkspace = useCallback(async (): Promise<WorkspaceLoadResult | null> => {
    if (!props.locator) {
      return null;
    }

    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setLoadingWorkspace(true);
    setWorkspaceError(null);

    try {
      const loaded = await openWorkspaceSnapshot();
      if (requestSeqRef.current !== requestSeq) {
        return null;
      }
      if (!loaded) {
        return null;
      }
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
  }, [openWorkspaceSnapshot, props.locator, value.version]);

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
          currentWorkspace.opened.draft?.baseCommitId ?? currentWorkspace.opened.repository.publishedCommitId,
        draftId: currentWorkspace.opened.draft?.id,
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
      if (!result.artifact.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
        await props.onPreview?.({
          ...value,
          code: result.artifact.code,
          version: result.artifact.version,
        } as RunJSValue);
      }
      appendConsole({
        level: result.artifact.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'error' : 'info',
        message: result.artifact.diagnostics.some((diagnostic) => diagnostic.severity === 'error')
          ? t('Compile failed')
          : t('Run completed'),
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

  const discardDraft = async () => {
    if (!workspace || !props.locator || workspaceEditingDisabled) {
      return;
    }

    setActionError(null);
    try {
      await runJSSourceRequest('discardDraft', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
      });
      appendConsole({
        level: 'info',
        message: t('Draft discarded'),
      });
      await loadWorkspace();
    } catch (error) {
      await handleWorkspaceError(error);
      reportActionError(error, t('Failed to discard draft'), discardDraft);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Failed to discard draft')),
      });
    }
  };

  const openPublishModal = async () => {
    if (workspaceEditingDisabled || !workspace?.permissions.canPublish) {
      return;
    }

    rememberDialogTrigger();
    setCommitMessage('');
    setPublishOpen(true);
    await runPreview();
  };

  const publish = async () => {
    if (
      !workspace ||
      !props.locator ||
      !canPublish(commitMessage, publishSummary, previewDiagnostics, workspaceEditingDisabled)
    ) {
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
        message: commitMessage.trim(),
        files: buildWorkspaceChanges(baseFiles, requestFiles),
        draftId: workspace.draft?.id,
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

    setPreviewing(true);
    try {
      const result = await runJSSourceRequest('compilePreview', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        baseCommitId,
        draftId: workspace.draft?.id,
        files: buildWorkspaceChanges([], requestFiles),
        entryPath: requestEntryPath,
        version: value.version,
      });
      if (latestWorkspaceSnapshotRef.current !== requestSnapshotKey) {
        return null;
      }
      setPreviewDiagnostics(result.artifact.diagnostics);
      appendDiagnostics(result.artifact.diagnostics, appendConsole);

      if (result.artifact.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
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

  const restoreAsDraft = async (commit: RunJSSourceHistoryItem) => {
    if (!workspace || !props.locator || workspaceEditingDisabled || hasUnsavedLocalChanges) {
      return;
    }
    const restoreSnapshotKey = latestWorkspaceSnapshotRef.current;

    setRestoringVersion(true);
    setActionError(null);
    try {
      const result = await runJSSourceRequest('restoreAsDraft', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        sourceCommitId: commit.id,
        baseCommitId,
      });
      if (latestWorkspaceSnapshotRef.current !== restoreSnapshotKey) {
        appendConsole({
          level: 'warn',
          message: t('Restore skipped because local edits changed'),
        });
        return;
      }
      const nextFiles = applyDraftFiles(baseFiles, result.files);
      const nextEntryPath = resolveWorkspaceEntryPath(nextFiles, entryPath);
      const nextActivePath = nextFiles.find((file) => file.path === nextEntryPath)?.path || nextFiles[0]?.path;
      setWorkspace((current) =>
        current
          ? {
              ...current,
              draft: result.draft,
            }
          : current,
      );
      setSavedFiles(nextFiles);
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
      reportActionError(error, t('Failed to restore version'), () => restoreAsDraft(commit));
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Failed to restore version')),
      });
    } finally {
      setRestoringVersion(false);
    }
  };

  const confirmRestoreAsDraft = async () => {
    if (!restoreCommit) {
      return;
    }

    const commit = restoreCommit;
    setRestoreCommit(null);
    await restoreAsDraft(commit);
  };

  const createFile = () => {
    if (workspaceEditingDisabled) {
      return;
    }

    rememberDialogTrigger();
    setFileDialog({
      mode: 'create',
    });
    setFileDialogPath('src/helper.ts');
    setFileDialogError(null);
  };

  const renameActiveFile = () => {
    if (!activePath || workspaceEditingDisabled) {
      return;
    }
    rememberDialogTrigger();
    setFileDialog({
      mode: 'rename',
      sourcePath: activePath,
    });
    setFileDialogPath(activePath);
    setFileDialogError(null);
  };

  const submitFileDialog = () => {
    if (!fileDialog) {
      return;
    }

    const validation = validateRunJSWorkspacePath(fileDialogPath, t);
    if (!validation.valid) {
      setFileDialogError(validation.message || t('Invalid file path'));
      return;
    }

    const nextPath = normalizeRunJSWorkspacePath(fileDialogPath);
    if (fileDialog.mode === 'create') {
      if (files.some((file) => file.path === nextPath)) {
        setFileDialogError(t('File already exists'));
        return;
      }

      invalidatePreview();
      setDiffView(null);
      setFiles((current) => {
        const nextFiles = upsertWorkspaceFile(current, {
          path: nextPath,
          content: '',
          language: inferLanguageFromPath(nextPath),
        });
        syncWorkspaceSnapshotRef(nextFiles, entryPath);
        return nextFiles;
      });
      openFilePath(nextPath);
    } else if (fileDialog.sourcePath) {
      if (fileDialog.sourcePath !== nextPath && files.some((file) => file.path === nextPath)) {
        setFileDialogError(t('File already exists'));
        return;
      }

      invalidatePreview();
      setDiffView(null);
      setFiles((current) => {
        const renamed = replaceWorkspaceFilePath(current, fileDialog.sourcePath as string, nextPath);
        const nextEntryPath = fileDialog.sourcePath === entryPath ? nextPath : entryPath;
        const nextFiles = fileDialog.sourcePath === entryPath ? ensureManifestEntry(renamed, nextPath, true) : renamed;
        syncWorkspaceSnapshotRef(nextFiles, nextEntryPath);
        return nextFiles;
      });
      if (fileDialog.sourcePath === entryPath) {
        setEntryPath(nextPath);
      }
      replaceOpenFilePath(fileDialog.sourcePath, nextPath);
      openFilePath(nextPath);
    }

    setFileDialog(null);
  };

  const deleteActiveFile = () => {
    if (!activePath || activePath === entryPath || workspaceEditingDisabled) {
      if (activePath === entryPath) {
        message.error(t('Entry file cannot be deleted'));
      }
      return;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const nextFiles = removeWorkspaceFile(current, activePath);
      const nextActivePath = nextFiles[0]?.path;
      syncWorkspaceSnapshotRef(nextFiles, entryPath);
      setActivePath(nextActivePath);
      setOpenPaths((paths) => {
        const nextPaths = paths.filter((path) => path !== activePath);
        return nextPaths.length ? nextPaths : nextActivePath ? [nextActivePath] : [];
      });
      return nextFiles;
    });
  };

  const setActiveFileAsEntry = () => {
    if (!activePath || workspaceEditingDisabled || activePath === entryPath) {
      return;
    }

    invalidatePreview();
    setDiffView(null);
    setFiles((current) => {
      const nextFiles = ensureManifestEntry(current, activePath, true);
      syncWorkspaceSnapshotRef(nextFiles, activePath);
      return nextFiles;
    });
    setEntryPath(activePath);
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
      const nextEntryPath =
        activePath === runJSManifestPath ? resolveWorkspaceEntryPath(nextFiles, entryPath) : entryPath;
      if (activePath === runJSManifestPath) {
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
    if (!conflict || !workspace || !props.locator || !conflict.canRebase) {
      return;
    }

    const userPatch = buildChangedWorkspaceFileList(conflict.staleBaseFiles, conflict.localFiles);
    const rebasedFiles = applyWorkspaceChanges(conflict.latestFiles, userPatch);
    const rebasePatch = buildChangedWorkspaceFileList(conflict.latestFiles, rebasedFiles);

    setActionError(null);
    try {
      if (!rebasePatch.length) {
        await runJSSourceRequest('discardDraft', {
          locator: props.locator,
          repoId: workspace.repository.repoId,
        });
        const nextFiles = normalizeWorkspaceFiles(conflict.latestFiles);
        const nextEntryPath = resolveWorkspaceEntryPath(nextFiles, entryPath);
        const nextActivePath = nextFiles.find((file) => file.path === nextEntryPath)?.path || nextFiles[0]?.path;
        setSavedFiles(nextFiles);
        setFiles(nextFiles);
        setBaseFiles(nextFiles);
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
                draft: null,
              }
            : current,
        );
        setConflict(null);
        setDiffView(null);
        invalidatePreview();
        appendConsole({
          level: 'info',
          message: t('Draft already matches latest version'),
        });
        return;
      }

      const result = await runJSSourceRequest('rebaseDraft', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        baseCommitId: conflict.latestBaseCommitId,
        files: rebasePatch,
      });
      const nextSavedFiles = applyDraftFiles(conflict.latestFiles, result.files);
      const nextEntryPath = resolveWorkspaceEntryPath(nextSavedFiles, entryPath);
      const nextActivePath =
        nextSavedFiles.find((file) => file.path === nextEntryPath)?.path || nextSavedFiles[0]?.path;
      setSavedFiles(nextSavedFiles);
      setFiles(nextSavedFiles);
      setBaseFiles(conflict.latestFiles);
      setEntryPath(nextEntryPath);
      setActivePath(nextActivePath);
      setOpenPaths(nextActivePath ? [nextActivePath] : []);
      setWorkspace((current) =>
        current
          ? {
              ...current,
              repository: result.repository,
              ownerFingerprint: conflict.latestOwnerFingerprint,
              history: conflict.latestHistory,
              draft: result.draft,
            }
          : current,
      );
      setConflict(null);
      setDiffView(null);
      invalidatePreview();
    } catch (error) {
      reportActionError(error, t('Failed to rebase draft'), keepChangesAndRebase);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Failed to rebase draft')),
      });
    }
  };

  const discardConflictDraft = async () => {
    await discardDraft();
    setConflict(null);
  };

  const handleWorkspaceError = async (error: unknown) => {
    if (isConflictError(error)) {
      if (!workspace) {
        return;
      }
      let latest: WorkspaceLoadResult | null = null;
      try {
        latest = await openWorkspaceSnapshot();
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

  const editorMinHeight = props.minHeight || 'min(720px, calc(100vh - 112px))';
  const editorStyle: React.CSSProperties = {
    background: '#fff',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    letterSpacing: 0,
    minWidth: 0,
    textAlign: 'left',
    wordSpacing: 'normal',
    ...(containerStyle || {}),
    ...(props.wrapperStyle || {}),
    minHeight: editorMinHeight,
  };
  const workspaceGridColumns = filesCollapsed ? 'minmax(0, 1fr)' : 'minmax(220px, 260px) minmax(0, 1fr)';

  return (
    <div style={editorStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: workspaceError || actionError ? 12 : 0,
        }}
      >
        {workspaceError ? (
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
            style={{
              background: '#fff',
              display: 'grid',
              flex: 1,
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
                  entryPath={entryPath}
                  files={files}
                  onCollapseChange={setFilesCollapsed}
                  onCreate={createFile}
                  onDelete={deleteActiveFile}
                  onOpen={openFilePath}
                  onRefresh={requestRefreshWorkspace}
                  onRename={renameActiveFile}
                  onSetEntry={setActiveFileAsEntry}
                  readOnly={workspaceEditingDisabled}
                  savedFiles={savedFiles}
                  t={t}
                />
                <VersionHistoryDock
                  baseVersion={formatVersion(baseCommit?.seq)}
                  hasDraft={Boolean(workspace.draft)}
                  hasUnsavedLocalChanges={hasUnsavedLocalChanges}
                  height={220}
                  historyItems={historyItems}
                  loading={historyLoading}
                  onRefresh={refreshHistory}
                  onSelect={setRestoreCommit}
                  onViewDraftDiff={toggleDiff}
                  publishedCommitId={workspace.repository.publishedCommitId}
                  t={t}
                />
              </div>
            ) : null}

            <main
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
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
        </>
      ) : null}

      <FileDialog
        error={fileDialogError}
        mode={fileDialog?.mode}
        onAfterClose={restoreDialogFocus}
        onCancel={() => setFileDialog(null)}
        onChange={setFileDialogPath}
        onSubmit={submitFileDialog}
        open={Boolean(fileDialog)}
        t={t}
        value={fileDialogPath}
      />

      <PublishModal
        commitMessage={commitMessage}
        diagnostics={previewDiagnostics}
        loading={previewing || publishing}
        onAfterClose={restoreDialogFocus}
        onCancel={() => setPublishOpen(false)}
        onCommitMessageChange={setCommitMessage}
        onPublish={publish}
        onViewDiagnostics={() => {
          setPublishOpen(false);
          setActiveTab('code');
        }}
        open={publishOpen}
        readOnly={workspaceEditingDisabled || !workspace?.permissions.canPublish}
        summary={publishSummary}
        t={t}
      />

      <CloseConfirmModal
        onCancel={() => setCloseConfirmOpen(false)}
        intent={pendingDirtyAction}
        onCloseWithoutSaving={discardLocalAndContinue}
        open={closeConfirmOpen}
        t={t}
      />

      <RestoreAsDraftModal
        commit={restoreCommit}
        loading={restoringVersion}
        onCancel={() => setRestoreCommit(null)}
        onRestore={confirmRestoreAsDraft}
        t={t}
      />

      <ConflictDialog
        conflict={conflict}
        onCancel={() => setConflict(null)}
        onDiscard={discardConflictDraft}
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
  const nextCurrentFiles = applyDraftFiles(nextBaseFiles, opened.draft?.files);
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

function buildFileTreeRows(files: RunJSWorkspaceFile[]): FileTreeRow[] {
  const rows: FileTreeRow[] = [];
  const seenFolders = new Set<string>();

  for (const file of [...files].sort((left, right) => compareRunJSPaths(left.path, right.path))) {
    const segments = file.path.split('/');
    let folderPath = '';

    segments.slice(0, -1).forEach((segment, index) => {
      folderPath = folderPath ? `${folderPath}/${segment}` : segment;
      if (seenFolders.has(folderPath)) {
        return;
      }
      seenFolders.add(folderPath);
      rows.push({
        key: `folder:${folderPath}`,
        type: 'folder',
        path: folderPath,
        name: segment,
        depth: index,
      });
    });

    rows.push({
      key: `file:${file.path}`,
      type: 'file',
      path: file.path,
      name: segments[segments.length - 1] || file.path,
      depth: Math.max(segments.length - 1, 0),
      file,
    });
  }

  return rows;
}

function isWorkspaceFileDirty(savedFiles: RunJSWorkspaceFile[], file: RunJSWorkspaceFile): boolean {
  return hasWorkspaceChanges(
    savedFiles.filter((item) => item.path === file.path),
    [file],
  );
}

function FilesPanel(props: {
  activePath?: string;
  collapsed: boolean;
  entryPath: string;
  files: RunJSWorkspaceFile[];
  onCollapseChange: (collapsed: boolean) => void;
  onCreate: () => void;
  onDelete: () => void;
  onOpen: (path: string) => void;
  onRefresh: () => void;
  onRename: () => void;
  onSetEntry: () => void;
  readOnly: boolean;
  savedFiles: RunJSWorkspaceFile[];
  t: (key: string) => string;
}) {
  const {
    activePath,
    collapsed,
    entryPath,
    files,
    onCollapseChange,
    onCreate,
    onDelete,
    onOpen,
    onRefresh,
    onRename,
    onSetEntry,
    readOnly,
    savedFiles,
    t,
  } = props;
  const treeRows = React.useMemo(() => buildFileTreeRows(files), [files]);
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
        flexDirection: 'column',
        gap: 8,
        minHeight: 0,
        padding: 12,
      }}
    >
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text strong style={{ whiteSpace: 'nowrap' }}>
          {t('File resource manager')}
        </Typography.Text>
        <Space size={4}>
          <Tooltip title={t('New file')}>
            <Button
              aria-label={t('New file')}
              disabled={readOnly}
              icon={<FileAddOutlined />}
              onClick={onCreate}
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
                  <Button icon={<FileAddOutlined />} onClick={onCreate} size="small" type="primary">
                    {t('New file')}
                  </Button>
                ) : null}
              </Space>
            </Empty>
          ),
        }}
        rowKey="key"
        size="small"
        style={{ overflow: 'auto' }}
        renderItem={(row) => {
          if (row.type === 'folder') {
            return (
              <List.Item style={{ paddingInline: 0, paddingLeft: row.depth * 14 }}>
                <Space size={6}>
                  <FolderOpenOutlined />
                  <Typography.Text type="secondary">{row.name}</Typography.Text>
                </Space>
              </List.Item>
            );
          }

          const dirty = isWorkspaceFileDirty(savedFiles, row.file);
          const isActive = activePath === row.path;
          return (
            <List.Item style={{ paddingInline: 0, paddingLeft: row.depth * 14 }}>
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
                }}
                type="text"
              >
                <Space size={6} style={{ minWidth: 0 }}>
                  <FileTextOutlined />
                  <Typography.Text ellipsis style={{ maxWidth: 152 }}>
                    {row.name}
                    {dirty ? ' *' : ''}
                  </Typography.Text>
                  {row.path === entryPath ? <Badge count={t('Entry')} size="small" /> : null}
                </Space>
              </Button>
            </List.Item>
          );
        }}
      />
      <Space wrap>
        <Button disabled={readOnly || !activePath} onClick={onRename} size="small">
          {t('Rename')}
        </Button>
        <Button disabled={readOnly || !activePath || activePath === entryPath} onClick={onSetEntry} size="small">
          {t('Set as entry')}
        </Button>
        <Popconfirm
          cancelText={t('Cancel')}
          disabled={readOnly || !activePath || activePath === entryPath}
          okText={t('Delete')}
          onConfirm={onDelete}
          title={t('Delete this file?')}
        >
          <Button
            danger
            disabled={readOnly || !activePath || activePath === entryPath}
            icon={<DeleteOutlined />}
            size="small"
          >
            {t('Delete')}
          </Button>
        </Popconfirm>
      </Space>
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
          type={filesCollapsed ? 'default' : 'primary'}
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
        name={activeFile.path}
        onChange={isDiff ? undefined : onChange}
        placeholder={t('Edit file content')}
        readonly={readOnly || isDiff}
        runButton={runAndDiffActions}
        scene={scene}
        showLogs={false}
        toolbarLeftExtra={fileTabsContent}
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

        return (
          <Space.Compact key={file.path}>
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
                  boxShadow: active ? 'inset 0 -2px 0 #1677ff' : 'none',
                  color: '#262626',
                  maxWidth: 180,
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
            <Button
              aria-label={`${t('Close file')} ${file.path}`}
              icon={<CloseOutlined />}
              onClick={() => onClose(file.path)}
              size="small"
            />
          </Space.Compact>
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
            <Typography.Text strong>{t('Current draft')}</Typography.Text>
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
  hasDraft: boolean;
  hasUnsavedLocalChanges: boolean;
  height: number;
  historyItems: RunJSSourceHistoryItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelect: (commit: RunJSSourceHistoryItem) => void;
  onViewDraftDiff: () => void;
  publishedCommitId?: string | null;
  t: (key: string) => string;
}) {
  const {
    baseVersion,
    hasDraft,
    hasUnsavedLocalChanges,
    height,
    historyItems,
    loading,
    onRefresh,
    onSelect,
    onViewDraftDiff,
    publishedCommitId,
    t,
  } = props;

  return (
    <section
      aria-label={t('Commit history')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height,
        marginTop: 'auto',
        minHeight: minConsolePanelHeight,
        overflow: 'hidden',
        padding: 12,
      }}
    >
      <Space style={{ justifyContent: 'space-between' }}>
        <Typography.Text strong>{t('History')}</Typography.Text>
        <Button aria-label={t('Refresh history')} icon={<ReloadOutlined />} loading={loading} onClick={onRefresh} />
      </Space>
      {hasDraft || hasUnsavedLocalChanges ? (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 8 }}>
          <Space direction="vertical" size={2}>
            <Typography.Text strong>{t('Current changes')}</Typography.Text>
            <Typography.Text type="secondary">
              {hasUnsavedLocalChanges ? t('Unsaved changes') : t('Saved changes')} · {`${t('Based on')} ${baseVersion}`}
            </Typography.Text>
            <Button onClick={onViewDraftDiff} size="small" type="link">
              {t('View diff')}
            </Button>
          </Space>
        </div>
      ) : null}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {historyItems.length === 0 ? <Empty description={t('No published versions yet')} /> : null}
        {historyItems.slice(0, 5).map((commit) => (
          <button
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
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Space size={6}>
                <Typography.Text strong>{formatVersion(commit.seq)}</Typography.Text>
                {commit.isPublished || commit.id === publishedCommitId ? (
                  <Tag color="green">{t('Published')}</Tag>
                ) : null}
              </Space>
              <Typography.Text ellipsis type="secondary">
                {commit.message}
              </Typography.Text>
              <Typography.Text type="secondary">{t('Click to restore')}</Typography.Text>
            </Space>
          </button>
        ))}
      </div>
    </section>
  );
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

function FileDialog(props: {
  error: string | null;
  mode?: FileDialogMode;
  onAfterClose: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  open: boolean;
  t: (key: string) => string;
  value: string;
}) {
  const { error, mode, onAfterClose, onCancel, onChange, onSubmit, open, t, value } = props;
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
      okText={mode === 'rename' ? t('Rename') : t('Create')}
      onCancel={onCancel}
      onOk={onSubmit}
      open={open}
      title={mode === 'rename' ? t('Rename file') : t('New file')}
    >
      <Input
        aria-label={t('File path')}
        onChange={(event) => onChange(event.target.value)}
        onPressEnter={onSubmit}
        ref={inputRef}
        status={error ? 'error' : undefined}
        value={value}
      />
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
    </Modal>
  );
}

function PublishModal(props: {
  commitMessage: string;
  diagnostics: RunJSCompileDiagnostic[];
  loading: boolean;
  onAfterClose: () => void;
  onCancel: () => void;
  onCommitMessageChange: (value: string) => void;
  onPublish: () => void;
  onViewDiagnostics: () => void;
  open: boolean;
  readOnly: boolean;
  summary: RunJSChangeSummary;
  t: (key: string) => string;
}) {
  const {
    commitMessage,
    diagnostics,
    loading,
    onAfterClose,
    onCancel,
    onCommitMessageChange,
    onPublish,
    onViewDiagnostics,
    open,
    readOnly,
    summary,
    t,
  } = props;
  const trimmed = commitMessage.trim();
  const hasCompileErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const messageInvalid = trimmed.length === 0 || trimmed.length > 200;
  const disabled = readOnly || summary.files === 0 || hasCompileErrors || messageInvalid;
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard?.writeText(formatCompileDiagnostics(diagnostics));
      message.success(t('Details copied'));
    } catch (_) {
      message.error(t('Copy details failed'));
    }
  };

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
        {hasCompileErrors ? (
          <Alert
            action={
              <Space>
                <Button onClick={onViewDiagnostics} size="small">
                  {t('View diagnostics')}
                </Button>
                <Button
                  aria-label={t('Copy technical details')}
                  icon={<CopyOutlined />}
                  onClick={copyDiagnostics}
                  size="small"
                >
                  {t('Copy technical details')}
                </Button>
              </Space>
            }
            message={t('Compile failed')}
            role="alert"
            showIcon
            type="error"
          />
        ) : null}
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

function RestoreAsDraftModal(props: {
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
              message={t('The source owner changed outside this workspace. Refresh before rebasing.')}
              role="alert"
              showIcon
              type="error"
            />
          ) : null}
          <Typography.Text>{`${t('Your draft is based on')} ${conflict.baseVersion}.`}</Typography.Text>
          <Typography.Text>{`${t('Latest published version is')} ${conflict.latestVersion}.`}</Typography.Text>
          <Space wrap>
            {conflict.canRebase ? <Button onClick={onViewChanges}>{t('View changes')}</Button> : null}
            {conflict.canRebase ? (
              <Button onClick={onRebase} type="primary">
                {t('Keep my changes and rebase')}
              </Button>
            ) : null}
            <Button danger onClick={onDiscard}>
              {t('Discard my draft')}
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

function isConflictError(error: unknown): error is RunJSSourceRequestError {
  return (
    error instanceof RunJSSourceRequestError &&
    (error.code === 'DRAFT_BASE_OUTDATED' ||
      error.code === 'BASE_COMMIT_OUTDATED' ||
      error.code === 'RUNJS_SOURCE_OWNER_OUTDATED')
  );
}
