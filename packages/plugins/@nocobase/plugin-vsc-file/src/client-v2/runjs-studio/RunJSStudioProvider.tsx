/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CodeOutlined,
  CloseOutlined,
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
  DiffOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RollbackOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { CodeEditor, type RunJSEditorProvider, type RunJSEditorProviderRenderProps } from '@nocobase/client-v2';
import type { RunJSValue } from '@nocobase/flow-engine';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { RunJSCompileDiagnostic } from '../../shared/runjs-source-types';
import type { VscFileChange } from '../../shared/types';
import { formatVscComponentError } from '../components/utils';
import { useT } from '../locale';
import type {
  RunJSChangeSummary,
  RunJSConsoleEntry,
  RunJSLineDiffRow,
  RunJSSourceHistoryItem,
  RunJSSourceDiffVersionResult,
  RunJSSourceOpenWorkspaceResult,
  RunJSSourceVersionResult,
  RunJSWorkspaceFile,
} from './types';
import { RunJSSourceRequestError, useRunJSSourceResource } from './useRunJSSourceResource';
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

const drawerWidth = 'min(1440px, 86vw)';
const defaultEntryPath = 'src/main.tsx';
const defaultConsolePanelHeight = 180;
const maxConsolePanelHeight = '50%';
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
  diffFiles: VscFileChange[];
  summary: RunJSChangeSummary;
};

type VersionDetailView = 'diff' | 'files';

type PreviewArtifactState = {
  code: string;
  version: string;
  snapshotKey: string;
};

function RunJSStudioEditorEntry(props: RunJSEditorProviderRenderProps) {
  const { t: hostT, value, onChange, scene = 'formValue', readOnly, disabled, containerStyle } = props;
  const pluginT = useT();
  const t = hostT || pluginT;
  const resource = useRunJSSourceResource();
  const runJSSourceRequest = resource.request;
  const locatorKey = useMemo(() => JSON.stringify(props.locator || null), [props.locator]);
  const previousLocatorKeyRef = useRef(locatorKey);
  const requestSeqRef = useRef(0);
  const consoleSeqRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const latestWorkspaceSnapshotRef = useRef('');
  const latestDiffRequestKeyRef = useRef('');
  const versionRequestSeqRef = useRef(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [workspace, setWorkspace] = useState<RunJSSourceOpenWorkspaceResult | null>(null);
  const [workspaceError, setWorkspaceError] = useState<unknown>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [baseFiles, setBaseFiles] = useState<RunJSWorkspaceFile[]>([]);
  const [savedFiles, setSavedFiles] = useState<RunJSWorkspaceFile[]>([]);
  const [files, setFiles] = useState<RunJSWorkspaceFile[]>([]);
  const [entryPath, setEntryPath] = useState(defaultEntryPath);
  const [activePath, setActivePath] = useState<string | undefined>();
  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('code');
  const [filesCollapsed, setFilesCollapsed] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<RunJSConsoleEntry[]>([]);
  const [fileDialog, setFileDialog] = useState<FileDialogState | null>(null);
  const [fileDialogPath, setFileDialogPath] = useState('');
  const [fileDialogError, setFileDialogError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewDiagnostics, setPreviewDiagnostics] = useState<RunJSCompileDiagnostic[]>([]);
  const [previewArtifact, setPreviewArtifact] = useState<PreviewArtifactState | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<unknown>(null);
  const [diffFiles, setDiffFiles] = useState<VscFileChange[]>([]);
  const [diffView, setDiffView] = useState<DiffViewState | null>(null);
  const [loadedDiffKey, setLoadedDiffKey] = useState<string | null>(null);
  const [selectedDiffPath, setSelectedDiffPath] = useState<string | undefined>();
  const [diffMode, setDiffMode] = useState<'split' | 'unified'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [wrapDiffLines, setWrapDiffLines] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<RunJSSourceVersionResult | null>(null);
  const [selectedVersionDiff, setSelectedVersionDiff] = useState<RunJSSourceDiffVersionResult | null>(null);
  const [selectedVersionView, setSelectedVersionView] = useState<VersionDetailView>('diff');
  const [versionLoading, setVersionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoreCommit, setRestoreCommit] = useState<RunJSSourceHistoryItem | null>(null);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [restoredDraftVersion, setRestoredDraftVersion] = useState<string | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [pendingDirtyAction, setPendingDirtyAction] = useState<PendingDirtyAction>('close');
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [consoleHeight, setConsoleHeight] = useState(defaultConsolePanelHeight);

  const workspaceReadOnly = Boolean(readOnly || disabled || (workspace && !workspace.permissions.canWrite));
  const workspaceEditingDisabled = workspaceReadOnly || publishing;
  const hasUnsavedLocalChanges = hasWorkspaceChanges(savedFiles, files);
  const publishSummary = summarizeWorkspaceChanges(baseFiles, files);
  const currentPreviewSnapshotKey = buildWorkspaceSnapshotKey(files, entryPath, value.version);
  const effectiveDiffBaseFiles = diffView?.baseFiles || baseFiles;
  const effectiveDiffFiles = diffView?.files || files;
  const effectiveDiffSummary = diffView?.summary || publishSummary;
  const effectiveDiffFileList = diffView?.diffFiles || diffFiles;
  const activeFile = activePath ? files.find((file) => file.path === activePath) : undefined;
  const historyItems = workspace?.history?.items || [];
  const baseCommitId = workspace?.draft?.baseCommitId ?? workspace?.repository?.publishedCommitId ?? null;
  const diffRequestKey = JSON.stringify({
    baseCommitId,
    draftId: workspace?.draft?.id || null,
    current: currentPreviewSnapshotKey,
    saved: buildWorkspaceSnapshotKey(savedFiles, entryPath, value.version),
  });
  const publishedCommit = findCommit(historyItems, workspace?.repository.publishedCommitId);
  const baseCommit = findCommit(historyItems, baseCommitId);
  const sourceLabel = workspace?.source.label || props.label || t('JavaScript');
  const compactTitle = props.label || t('JavaScript');
  const compactStatus = formatCompactStatus({
    t,
    publishedSeq: publishedCommit?.seq,
    hasDraft: Boolean(workspace?.draft),
    hasUnsavedLocalChanges,
    entryPath,
  });
  const compactDescription =
    props.sourceLabel && props.sourceLabel !== compactTitle ? `${props.sourceLabel} · ${compactStatus}` : compactStatus;
  const statusBadges = buildStatusBadges({
    t,
    hasUnsavedLocalChanges,
    hasDraft: Boolean(workspace?.draft),
    previewing,
    publishedSeq: publishedCommit?.seq,
    restoredDraftVersion,
    conflict: Boolean(conflict),
    compileFailed: previewDiagnostics.some((diagnostic) => diagnostic.severity === 'error'),
  });
  const lineDiffRows = useMemo(
    () => buildLineDiff(effectiveDiffBaseFiles, effectiveDiffFiles, selectedDiffPath, ignoreWhitespace),
    [effectiveDiffBaseFiles, effectiveDiffFiles, ignoreWhitespace, selectedDiffPath],
  );

  const appendConsole = useCallback((entry: Omit<RunJSConsoleEntry, 'id'>) => {
    consoleSeqRef.current += 1;
    setConsoleEntries((current) => [...current, { ...entry, id: consoleSeqRef.current }]);
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

  const resetWorkspaceState = useCallback(() => {
    requestSeqRef.current += 1;
    saveInFlightRef.current = false;
    latestWorkspaceSnapshotRef.current = '';
    latestDiffRequestKeyRef.current = '';
    versionRequestSeqRef.current += 1;
    setWorkspace(null);
    setWorkspaceError(null);
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
    setSavingDraft(false);
    setPreviewing(false);
    setPublishing(false);
    setPreviewDiagnostics([]);
    setPreviewArtifact(null);
    setDiffLoading(false);
    setDiffError(null);
    setDiffFiles([]);
    setDiffView(null);
    setLoadedDiffKey(null);
    setSelectedDiffPath(undefined);
    setSelectedVersion(null);
    setSelectedVersionDiff(null);
    setSelectedVersionView('diff');
    setVersionLoading(false);
    setHistoryLoading(false);
    setRestoreCommit(null);
    setRestoringVersion(false);
    setRestoredDraftVersion(null);
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

  useEffect(() => {
    latestDiffRequestKeyRef.current = diffRequestKey;
  }, [diffRequestKey]);

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
      setLoadedDiffKey(null);
      setSelectedDiffPath(undefined);
      setPreviewDiagnostics([]);
      setPreviewArtifact(null);
      setSelectedVersion(null);
      setSelectedVersionDiff(null);
      versionRequestSeqRef.current += 1;
      setSelectedVersionView('diff');
      setVersionLoading(false);
      setRestoreCommit(null);
      setRestoringVersion(false);
      setRestoredDraftVersion(null);

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
    if (drawerOpen && !workspace && !loadingWorkspace) {
      loadWorkspace();
    }
  }, [drawerOpen, loadWorkspace, loadingWorkspace, workspace]);

  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const primary = event.metaKey || event.ctrlKey;
      if (!primary) {
        return;
      }

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveDraft();
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
    if (drawerOpen && typeof window !== 'undefined' && window.innerWidth < 1120) {
      setFullscreen(true);
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen || !hasUnsavedLocalChanges || typeof window === 'undefined') {
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
  }, [drawerOpen, hasUnsavedLocalChanges]);

  const openStudio = async () => {
    setDrawerOpen(true);
    if (!workspace) {
      await loadWorkspace();
    }
  };

  const runPreview = async () => {
    const currentWorkspace = workspace
      ? { opened: workspace, baseFiles, currentFiles: files, entryPath }
      : await loadWorkspace();
    if (!currentWorkspace || !props.locator) {
      return;
    }

    clearConsole();
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
          : t('Run Preview completed'),
      });
    } catch (error) {
      await handleWorkspaceError(error);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Run Preview failed')),
      });
    } finally {
      setPreviewing(false);
    }
  };

  const saveDraft = async (): Promise<boolean> => {
    if (
      !workspace ||
      !props.locator ||
      workspaceReadOnly ||
      publishing ||
      !hasUnsavedLocalChanges ||
      saveInFlightRef.current
    ) {
      return false;
    }

    const requestSnapshotKey = currentPreviewSnapshotKey;
    const requestFiles = normalizeWorkspaceFiles(files);
    const draftFiles = buildChangedWorkspaceFileList(baseFiles, requestFiles);
    saveInFlightRef.current = true;
    setSavingDraft(true);
    try {
      if (!draftFiles.length) {
        await runJSSourceRequest('discardDraft', {
          locator: props.locator,
          repoId: workspace.repository.repoId,
        });
        setWorkspace((current) =>
          current
            ? {
                ...current,
                draft: null,
              }
            : current,
        );
        setSavedFiles(requestFiles);
        if (latestWorkspaceSnapshotRef.current === requestSnapshotKey) {
          setFiles(requestFiles);
          latestWorkspaceSnapshotRef.current = buildWorkspaceSnapshotKey(requestFiles, entryPath, value.version);
        }
        appendConsole({
          level: 'info',
          message: t('Draft cleared'),
        });
        return true;
      }

      const result = await runJSSourceRequest('saveDraft', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        baseCommitId,
        files: draftFiles,
      });
      const nextSavedFiles = applyDraftFiles(baseFiles, result.files);
      setWorkspace((current) =>
        current
          ? {
              ...current,
              draft: result.draft,
            }
          : current,
      );
      setSavedFiles(nextSavedFiles);
      if (latestWorkspaceSnapshotRef.current === requestSnapshotKey) {
        setFiles(nextSavedFiles);
        latestWorkspaceSnapshotRef.current = buildWorkspaceSnapshotKey(nextSavedFiles, entryPath, value.version);
      }
      appendConsole({
        level: 'info',
        message: t('Draft saved'),
      });
      return true;
    } catch (error) {
      await handleWorkspaceError(error);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Failed to save draft')),
      });
      return false;
    } finally {
      saveInFlightRef.current = false;
      setSavingDraft(false);
    }
  };

  const discardDraft = async () => {
    if (!workspace || !props.locator || workspaceEditingDisabled) {
      return;
    }

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
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Failed to discard draft')),
      });
    }
  };

  const loadDiff = useCallback(
    async (options?: { force?: boolean }) => {
      if (!workspace || !props.locator) {
        return;
      }
      if (!options?.force && (diffLoading || loadedDiffKey === diffRequestKey)) {
        return;
      }

      setDiffLoading(true);
      setDiffError(null);
      setDiffView(null);
      setLoadedDiffKey(diffRequestKey);
      const requestKey = diffRequestKey;
      try {
        const hasLocal = hasWorkspaceChanges(savedFiles, files);
        const result = await runJSSourceRequest('diffDraft', {
          locator: props.locator,
          repoId: workspace.repository.repoId,
          baseCommitId,
          files: hasLocal || !workspace.draft ? buildWorkspaceChanges(baseFiles, files) : undefined,
        });
        if (latestDiffRequestKeyRef.current !== requestKey) {
          return;
        }
        const changes = result.diff.files.map((file) => ({
          path: file.path,
          operation: file.status === 'deleted' ? ('delete' as const) : ('upsert' as const),
        }));
        setDiffFiles(changes);
        setSelectedDiffPath((current) => current || changes[0]?.path);
      } catch (error) {
        if (latestDiffRequestKeyRef.current !== requestKey) {
          return;
        }
        setDiffFiles([]);
        setSelectedDiffPath(undefined);
        setDiffError(error);
      } finally {
        setDiffLoading(false);
      }
    },
    [
      baseCommitId,
      baseFiles,
      diffLoading,
      diffRequestKey,
      files,
      loadedDiffKey,
      props.locator,
      runJSSourceRequest,
      savedFiles,
      workspace,
    ],
  );

  useEffect(() => {
    if (activeTab === 'diff' && workspace && !diffView) {
      loadDiff();
    }
  }, [activeTab, diffView, loadDiff, workspace]);

  const openPublishModal = async () => {
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
          message: t('Published successfully'),
        });
        return;
      }
      setPublishOpen(false);
      appendConsole({
        level: 'info',
        message: t('Published successfully'),
      });
      onChange?.({
        ...value,
        code: compiled.code,
        version: compiled.version,
      } as RunJSValue);
      await loadWorkspace();
      setPreviewDiagnostics(result.artifact.diagnostics);
    } catch (error) {
      await handleWorkspaceError(error);
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Publish failed')),
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
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Failed to load history')),
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadVersion = async (commit: RunJSSourceHistoryItem) => {
    if (!workspace || !props.locator) {
      return;
    }

    const requestSeq = versionRequestSeqRef.current + 1;
    versionRequestSeqRef.current = requestSeq;
    setVersionLoading(true);
    setSelectedVersion(null);
    setSelectedVersionDiff(null);
    setSelectedVersionView('diff');
    try {
      const version = await runJSSourceRequest('getVersion', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        commitId: commit.id,
        includeFiles: true,
      });
      if (versionRequestSeqRef.current !== requestSeq) {
        return;
      }
      const versionDiff = await runJSSourceRequest('diffVersion', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        commitId: commit.id,
      });
      if (versionRequestSeqRef.current !== requestSeq) {
        return;
      }
      setSelectedVersion(version);
      setSelectedVersionDiff(versionDiff);
    } catch (error) {
      if (versionRequestSeqRef.current === requestSeq) {
        appendConsole({
          level: 'error',
          message: formatVscComponentError(error, t('Failed to load version')),
        });
      }
    } finally {
      if (versionRequestSeqRef.current === requestSeq) {
        setVersionLoading(false);
      }
    }
  };

  const restoreAsDraft = async (commit: RunJSSourceHistoryItem) => {
    if (!workspace || !props.locator || workspaceEditingDisabled || hasUnsavedLocalChanges) {
      return;
    }
    const restoreSnapshotKey = latestWorkspaceSnapshotRef.current;

    setRestoringVersion(true);
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
      setRestoredDraftVersion(formatVersion(commit.seq));
      invalidatePreview();
      appendConsole({
        level: 'info',
        message: `${t('Draft restored from')} ${formatVersion(commit.seq)}`,
      });
    } catch (error) {
      await handleWorkspaceError(error);
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

  const viewRestoreDiff = async () => {
    if (!restoreCommit) {
      return;
    }

    const commit = restoreCommit;
    setRestoreCommit(null);
    setActiveTab('history');
    await loadVersion(commit);
  };

  const clearSelectedVersion = () => {
    versionRequestSeqRef.current += 1;
    setSelectedVersion(null);
    setSelectedVersionDiff(null);
    setSelectedVersionView('diff');
    setVersionLoading(false);
  };

  const copyVersionFile = async (file: RunJSWorkspaceFile) => {
    try {
      await navigator.clipboard?.writeText(file.content);
      message.success(t('File copied'));
    } catch (_) {
      appendConsole({
        level: 'warn',
        message: t('Copy file failed'),
      });
    }
  };

  const createFile = () => {
    if (workspaceEditingDisabled) {
      return;
    }

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

  const copyActiveFile = async () => {
    if (!activeFile) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(activeFile.content);
      message.success(t('File copied'));
    } catch (_) {
      appendConsole({
        level: 'warn',
        message: t('Copy file failed'),
      });
    }
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

  const requestClose = () => {
    if (hasUnsavedLocalChanges) {
      setPendingDirtyAction('close');
      setCloseConfirmOpen(true);
      return;
    }

    setDrawerOpen(false);
  };

  const requestRefreshWorkspace = () => {
    if (hasUnsavedLocalChanges) {
      setPendingDirtyAction('refresh');
      setCloseConfirmOpen(true);
      return;
    }

    loadWorkspace();
  };

  const saveDraftAndContinue = async () => {
    const saved = await saveDraft();
    if (!saved) {
      return;
    }

    setCloseConfirmOpen(false);
    if (pendingDirtyAction === 'refresh') {
      await loadWorkspace();
      return;
    }

    setDrawerOpen(false);
  };

  const discardLocalAndContinue = async () => {
    setFiles(savedFiles);
    setCloseConfirmOpen(false);
    if (pendingDirtyAction === 'refresh') {
      await loadWorkspace();
      return;
    }

    setDrawerOpen(false);
  };

  const keepChangesAndRebase = async () => {
    if (!conflict || !workspace || !props.locator || !conflict.canRebase) {
      return;
    }

    const userPatch = buildChangedWorkspaceFileList(conflict.staleBaseFiles, conflict.localFiles);
    const rebasedFiles = applyWorkspaceChanges(conflict.latestFiles, userPatch);
    const rebasePatch = buildChangedWorkspaceFileList(conflict.latestFiles, rebasedFiles);

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

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'format',
      label: t('Format file'),
      disabled: workspaceEditingDisabled || !activeFile,
    },
    {
      key: 'copy',
      label: t('Copy file'),
      disabled: !activeFile,
    },
    {
      key: 'discard',
      label: t('Discard draft'),
      disabled: workspaceEditingDisabled || (!workspace?.draft && !hasUnsavedLocalChanges),
    },
    {
      key: 'history',
      label: t('Restore from history'),
    },
    {
      key: 'fullscreen',
      label: fullscreen ? t('Exit fullscreen') : t('Open fullscreen'),
    },
  ];

  const handleMoreMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'format') {
      formatActiveFile();
    } else if (key === 'copy') {
      copyActiveFile();
    } else if (key === 'discard') {
      discardDraft();
    } else if (key === 'history') {
      setActiveTab('history');
    } else if (key === 'fullscreen') {
      setFullscreen((current) => !current);
    }
  };

  return (
    <div style={containerStyle || { flex: 1, minWidth: 0 }}>
      <section
        aria-label={t('JavaScript')}
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#fff',
        }}
      >
        <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space direction="vertical" size={2}>
            <Space wrap>
              <CodeOutlined />
              <Typography.Text strong>{compactTitle}</Typography.Text>
              <Tag>{sourceLabel}</Tag>
            </Space>
            <Typography.Text type="secondary">{compactDescription}</Typography.Text>
          </Space>
          <Space wrap>
            <Button aria-label={t('Open Studio')} icon={<FolderOpenOutlined />} onClick={openStudio}>
              {t('Open Studio')}
            </Button>
            <Button
              aria-label={t('Run Preview')}
              icon={<PlayCircleOutlined />}
              loading={previewing}
              onClick={runPreview}
            >
              {t('Run Preview')}
            </Button>
          </Space>
        </Space>
      </section>

      <Drawer
        destroyOnClose={false}
        getContainer={false}
        onClose={requestClose}
        open={drawerOpen}
        placement="right"
        rootStyle={{ position: 'fixed' }}
        title={null}
        width={fullscreen ? '100vw' : drawerWidth}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: fullscreen ? 0 : 960,
            height: 'calc(100vh - 48px)',
            gap: 12,
          }}
        >
          <WorkspaceHeader
            activePath={activePath || entryPath}
            baseVersion={formatVersion(baseCommit?.seq)}
            disabled={!workspace || loadingWorkspace}
            entryPath={entryPath}
            lastSavedAt={workspace?.draft ? t('Draft saved') : t('Not saved')}
            onMoreMenuClick={handleMoreMenuClick}
            onPublish={openPublishModal}
            onRefresh={requestRefreshWorkspace}
            onRunPreview={runPreview}
            onSaveDraft={saveDraft}
            publishedVersion={formatVersion(publishedCommit?.seq)}
            publishing={publishing}
            readOnly={workspaceEditingDisabled}
            saving={savingDraft}
            sourceLabel={sourceLabel}
            statusBadges={statusBadges}
            t={t}
            moreMenuItems={moreMenuItems}
          />

          {workspaceError ? (
            <Alert
              action={
                <Button icon={<ReloadOutlined />} onClick={loadWorkspace} size="small">
                  {t('Retry')}
                </Button>
              }
              message={formatVscComponentError(workspaceError, t('Failed to open RunJS source'))}
              showIcon
              type="error"
            />
          ) : null}

          {loadingWorkspace && !workspace ? (
            <div aria-live="polite" role="status" style={{ padding: 48, textAlign: 'center' }}>
              <Spin />
              <Typography.Text style={{ display: 'block', marginTop: 12 }}>{t('Loading workspace')}</Typography.Text>
            </div>
          ) : null}

          {workspace ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `${filesCollapsed ? '44px' : '220px'} minmax(0, 1fr) ${
                    contextCollapsed ? '44px' : '280px'
                  }`,
                  gap: 12,
                  minHeight: 0,
                  flex: 1,
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
                  onRename={renameActiveFile}
                  onSetEntry={setActiveFileAsEntry}
                  readOnly={workspaceEditingDisabled}
                  savedFiles={savedFiles}
                  t={t}
                />

                <main style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <Tabs
                    activeKey={activeTab}
                    items={[
                      {
                        key: 'code',
                        label: t('Code'),
                        children: (
                          <CodeTab
                            activeFile={activeFile}
                            activePath={activePath}
                            entryPath={entryPath}
                            onChange={updateActiveFileContent}
                            onCloseFile={closeOpenFile}
                            onOpenFile={openFilePath}
                            openPaths={openPaths}
                            readOnly={workspaceEditingDisabled}
                            savedFiles={savedFiles}
                            scene={scene}
                            t={t}
                            version={value.version}
                            workspaceFiles={files}
                          />
                        ),
                      },
                      {
                        key: 'diff',
                        label: t('Diff'),
                        children: (
                          <DiffTab
                            diffError={diffError}
                            diffFiles={effectiveDiffFileList}
                            diffLoading={diffLoading}
                            diffMode={diffMode}
                            ignoreWhitespace={ignoreWhitespace}
                            lineDiffRows={lineDiffRows}
                            onDiffModeChange={setDiffMode}
                            onIgnoreWhitespaceChange={setIgnoreWhitespace}
                            onRefresh={() => loadDiff({ force: true })}
                            onSelectedPathChange={setSelectedDiffPath}
                            onWrapLinesChange={setWrapDiffLines}
                            selectedPath={selectedDiffPath}
                            summary={effectiveDiffSummary}
                            t={t}
                            wrapLines={wrapDiffLines}
                          />
                        ),
                      },
                      {
                        key: 'history',
                        label: t('History'),
                        children: (
                          <HistoryTab
                            baseVersion={formatVersion(baseCommit?.seq)}
                            hasDraft={Boolean(workspace.draft)}
                            hasUnsavedLocalChanges={hasUnsavedLocalChanges}
                            historyItems={historyItems}
                            loading={historyLoading}
                            onBack={clearSelectedVersion}
                            onCopyCode={async (commit) => copyVersionCode(commit)}
                            onCopyFile={copyVersionFile}
                            onDiscardDraft={discardDraft}
                            onRefresh={refreshHistory}
                            onRestore={setRestoreCommit}
                            onSelect={loadVersion}
                            onSelectedVersionViewChange={setSelectedVersionView}
                            onViewDraftDiff={() => setActiveTab('diff')}
                            publishedCommitId={workspace.repository.publishedCommitId}
                            readOnly={workspaceEditingDisabled}
                            restoringVersion={restoringVersion}
                            selectedVersion={selectedVersion}
                            selectedVersionDiff={selectedVersionDiff}
                            selectedVersionView={selectedVersionView}
                            t={t}
                            versionLoading={versionLoading}
                          />
                        ),
                      },
                    ]}
                    onChange={setActiveTab}
                  />
                </main>

                <ContextPanel collapsed={contextCollapsed} onCollapseChange={setContextCollapsed} t={t} />
              </div>

              <ConsolePanel
                entries={consoleEntries}
                height={consoleHeight}
                maxHeight={maxConsolePanelHeight}
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
            </>
          ) : null}
        </div>
      </Drawer>

      <FileDialog
        error={fileDialogError}
        mode={fileDialog?.mode}
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
        onCancel={() => setPublishOpen(false)}
        onCommitMessageChange={setCommitMessage}
        onPublish={publish}
        onViewDiff={() => {
          setPublishOpen(false);
          setActiveTab('diff');
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
        onSaveAndClose={saveDraftAndContinue}
        open={closeConfirmOpen}
        saving={savingDraft}
        t={t}
      />

      <RestoreAsDraftModal
        commit={restoreCommit}
        loading={restoringVersion}
        onCancel={() => setRestoreCommit(null)}
        onRestore={confirmRestoreAsDraft}
        onViewDiff={viewRestoreDiff}
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
              diffFiles: conflictDiffFiles,
              summary: summarizeWorkspaceChanges(conflict.latestFiles, rebasedFiles),
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

  async function copyVersionCode(commit: RunJSSourceHistoryItem) {
    if (!workspace || !props.locator) {
      return;
    }

    try {
      const version = await runJSSourceRequest('getVersion', {
        locator: props.locator,
        repoId: workspace.repository.repoId,
        commitId: commit.id,
        includeFiles: true,
      });
      const file = version.files.find((item) => item.path === entryPath) || version.files[0];
      if (!file) {
        return;
      }
      await navigator.clipboard?.writeText(file.content);
      message.success(t('Code copied'));
    } catch (error) {
      appendConsole({
        level: 'error',
        message: formatVscComponentError(error, t('Copy code failed')),
      });
    }
  }
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

function WorkspaceHeader(props: {
  activePath: string;
  baseVersion: string;
  disabled: boolean;
  entryPath: string;
  lastSavedAt: string;
  moreMenuItems: MenuProps['items'];
  onMoreMenuClick: MenuProps['onClick'];
  onPublish: () => void;
  onRefresh: () => void;
  onRunPreview: () => void;
  onSaveDraft: () => void;
  publishedVersion: string;
  publishing: boolean;
  readOnly: boolean;
  saving: boolean;
  sourceLabel: string;
  statusBadges: React.ReactNode[];
  t: (key: string) => string;
}) {
  const {
    activePath,
    baseVersion,
    disabled,
    entryPath,
    lastSavedAt,
    moreMenuItems,
    onMoreMenuClick,
    onPublish,
    onRefresh,
    onRunPreview,
    onSaveDraft,
    publishedVersion,
    publishing,
    readOnly,
    saving,
    sourceLabel,
    statusBadges,
    t,
  } = props;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: 12,
      }}
    >
      <Space direction="vertical" size={4} style={{ minWidth: 0 }}>
        <Space wrap>
          <Typography.Text strong>{sourceLabel}</Typography.Text>
          <Typography.Text type="secondary">{activePath || entryPath}</Typography.Text>
        </Space>
        <Space wrap>
          {statusBadges}
          <Tag>{`${t('Based on')} ${baseVersion}`}</Tag>
          <Tag>{`${t('Published')} ${publishedVersion}`}</Tag>
          <Typography.Text type="secondary">{lastSavedAt}</Typography.Text>
        </Space>
      </Space>
      <Space wrap>
        <Tooltip title={t('Cmd/Ctrl + Enter')}>
          <Button
            aria-label={t('Run Preview')}
            disabled={disabled}
            icon={<PlayCircleOutlined />}
            onClick={onRunPreview}
          >
            {t('Run Preview')}
          </Button>
        </Tooltip>
        <Tooltip title={t('Cmd/Ctrl + S')}>
          <Button
            aria-label={t('Save Draft')}
            disabled={disabled || readOnly || saving}
            icon={<SaveOutlined />}
            loading={saving}
            onClick={onSaveDraft}
          >
            {t('Save Draft')}
          </Button>
        </Tooltip>
        <Button
          aria-label={t('Publish')}
          disabled={disabled || readOnly}
          icon={<UploadOutlined />}
          loading={publishing}
          onClick={onPublish}
          type="primary"
        >
          {t('Publish')}
        </Button>
        <Button aria-label={t('Refresh workspace')} icon={<ReloadOutlined />} onClick={onRefresh} />
        <Dropdown menu={{ items: moreMenuItems, onClick: onMoreMenuClick }} trigger={['click']}>
          <Button aria-label={t('More actions')}>{t('More')}</Button>
        </Dropdown>
      </Space>
    </header>
  );
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
      <aside style={{ borderRight: '1px solid #f0f0f0' }}>
        <Tooltip title={t('Files')}>
          <Button
            aria-label={t('Expand files')}
            icon={<FolderOpenOutlined />}
            onClick={() => onCollapseChange(false)}
          />
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside
      aria-label={t('Files')}
      style={{
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 0,
        paddingRight: 8,
      }}
    >
      <Space style={{ justifyContent: 'space-between' }}>
        <Typography.Text strong>{t('Files')}</Typography.Text>
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
            <Button
              aria-label={t('Collapse files')}
              icon={<CompressOutlined />}
              onClick={() => onCollapseChange(true)}
              size="small"
            />
          </Tooltip>
        </Space>
      </Space>
      <List
        dataSource={treeRows}
        locale={{ emptyText: <Empty description={t('No files')} /> }}
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
                style={{ justifyContent: 'flex-start', minWidth: 0 }}
                type={isActive ? 'primary' : 'text'}
              >
                <Space size={6} style={{ minWidth: 0 }}>
                  <Typography.Text ellipsis style={{ maxWidth: 128 }}>
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
  entryPath: string;
  onChange: (content: string) => void;
  onCloseFile: (path: string) => void;
  onOpenFile: (path: string) => void;
  openPaths: string[];
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
    entryPath,
    onChange,
    onCloseFile,
    onOpenFile,
    openPaths,
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

  return (
    <section aria-label={t('Code')} style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
      <OpenFileTabs
        activePath={activePath}
        entryPath={entryPath}
        files={openFiles.length ? openFiles : [activeFile]}
        onClose={onCloseFile}
        onOpen={onOpenFile}
        savedFiles={savedFiles}
        t={t}
      />
      <CodeEditor
        enableLinter
        height="calc(100vh - 360px)"
        language={activeFile.language || inferLanguageFromPath(activeFile.path)}
        name={activeFile.path}
        onChange={onChange}
        placeholder={t('Edit file content')}
        readonly={readOnly}
        scene={scene}
        showLogs={false}
        value={activeFile.content}
        version={version}
      />
    </section>
  );
}

function OpenFileTabs(props: {
  activePath?: string;
  entryPath: string;
  files: RunJSWorkspaceFile[];
  onClose: (path: string) => void;
  onOpen: (path: string) => void;
  savedFiles: RunJSWorkspaceFile[];
  t: (key: string) => string;
}) {
  const { activePath, entryPath, files, onClose, onOpen, savedFiles, t } = props;

  return (
    <div aria-label={t('Open files')} role="tablist" style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
      {files.map((file) => {
        const active = file.path === activePath;
        const dirty = isWorkspaceFileDirty(savedFiles, file);

        return (
          <Space.Compact key={file.path}>
            <Button
              aria-selected={active}
              onClick={() => onOpen(file.path)}
              role="tab"
              size="small"
              type={active ? 'primary' : 'default'}
            >
              <Space size={4}>
                <Typography.Text style={{ color: active ? 'inherit' : undefined }}>
                  {file.path}
                  {dirty ? ' *' : ''}
                </Typography.Text>
                {file.path === entryPath ? <Badge count={t('Entry')} size="small" /> : null}
              </Space>
            </Button>
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

function DiffTab(props: {
  diffError: unknown;
  diffFiles: VscFileChange[];
  diffLoading: boolean;
  diffMode: 'split' | 'unified';
  ignoreWhitespace: boolean;
  lineDiffRows: RunJSLineDiffRow[];
  onDiffModeChange: (mode: 'split' | 'unified') => void;
  onIgnoreWhitespaceChange: (value: boolean) => void;
  onRefresh: () => void;
  onSelectedPathChange: (path: string) => void;
  onWrapLinesChange: (value: boolean) => void;
  selectedPath?: string;
  summary: RunJSChangeSummary;
  t: (key: string) => string;
  wrapLines: boolean;
}) {
  const {
    diffError,
    diffFiles,
    diffLoading,
    diffMode,
    ignoreWhitespace,
    lineDiffRows,
    onDiffModeChange,
    onIgnoreWhitespaceChange,
    onRefresh,
    onSelectedPathChange,
    onWrapLinesChange,
    selectedPath,
    summary,
    t,
    wrapLines,
  } = props;
  const [selectedChangeKey, setSelectedChangeKey] = useState<string | null>(null);
  const selectedChangeRef = useRef<HTMLDivElement | null>(null);
  const changeRows = useMemo(
    () =>
      lineDiffRows.filter(
        (row, index) => row.type !== 'context' && (index === 0 || lineDiffRows[index - 1]?.type === 'context'),
      ),
    [lineDiffRows],
  );
  const selectedChangeIndex = selectedChangeKey
    ? changeRows.findIndex((row) => row.key === selectedChangeKey)
    : changeRows.length
      ? 0
      : -1;
  const activeChangeKey = selectedChangeIndex >= 0 ? changeRows[selectedChangeIndex]?.key : null;
  const hasPreviousChange = selectedChangeIndex > 0;
  const hasNextChange = selectedChangeIndex >= 0 && selectedChangeIndex < changeRows.length - 1;

  useEffect(() => {
    if (!changeRows.length) {
      if (selectedChangeKey) {
        setSelectedChangeKey(null);
      }
      return;
    }
    if (!activeChangeKey) {
      setSelectedChangeKey(changeRows[0].key);
    }
  }, [activeChangeKey, changeRows, selectedChangeKey]);

  useEffect(() => {
    selectedChangeRef.current?.scrollIntoView?.({ block: 'center' });
  }, [activeChangeKey]);

  const copyDiffErrorDetails = async () => {
    if (!diffError) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(formatVscComponentError(diffError, t('Failed to load diff')));
      message.success(t('Details copied'));
    } catch (_) {
      message.error(t('Copy details failed'));
    }
  };
  const selectRelativeChange = (offset: number) => {
    const next = changeRows[selectedChangeIndex + offset]?.key;
    if (next) {
      setSelectedChangeKey(next);
    }
  };

  return (
    <section aria-label={t('Diff')} style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 12 }}>
      <aside style={{ borderRight: '1px solid #f0f0f0', paddingRight: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Typography.Text strong>{formatChangeSummary(summary, t)}</Typography.Text>
            <Button
              aria-label={t('Refresh diff')}
              icon={<ReloadOutlined />}
              loading={diffLoading}
              onClick={onRefresh}
            />
          </Space>
          <List
            dataSource={diffFiles}
            locale={{ emptyText: <Empty description={t('No changes')} /> }}
            rowKey="path"
            size="small"
            renderItem={(file) => (
              <List.Item style={{ paddingInline: 0 }}>
                <Button
                  block
                  icon={<DiffOutlined />}
                  onClick={() => onSelectedPathChange(file.path)}
                  style={{ justifyContent: 'flex-start' }}
                  type={selectedPath === file.path ? 'primary' : 'text'}
                >
                  {file.path}
                </Button>
              </List.Item>
            )}
          />
        </Space>
      </aside>
      <div style={{ minWidth: 0 }}>
        <Space wrap style={{ marginBottom: 8 }}>
          <Segmented
            onChange={(value) => onDiffModeChange(value as 'split' | 'unified')}
            options={[
              { label: t('Split'), value: 'split' },
              { label: t('Unified'), value: 'unified' },
            ]}
            value={diffMode}
          />
          <Checkbox checked={ignoreWhitespace} onChange={(event) => onIgnoreWhitespaceChange(event.target.checked)}>
            {t('Ignore whitespace')}
          </Checkbox>
          <Checkbox checked={wrapLines} onChange={(event) => onWrapLinesChange(event.target.checked)}>
            {t('Wrap lines')}
          </Checkbox>
          <Button
            disabled={!hasPreviousChange}
            icon={<ArrowUpOutlined />}
            onClick={() => selectRelativeChange(-1)}
            size="small"
          >
            {t('Previous change')}
          </Button>
          <Button
            disabled={!hasNextChange}
            icon={<ArrowDownOutlined />}
            onClick={() => selectRelativeChange(1)}
            size="small"
          >
            {t('Next change')}
          </Button>
        </Space>
        {diffError ? (
          <Alert
            action={
              <Space>
                <Button onClick={onRefresh} size="small">
                  {t('Retry')}
                </Button>
                <Button icon={<CopyOutlined />} onClick={copyDiffErrorDetails} size="small">
                  {t('Copy details')}
                </Button>
              </Space>
            }
            message={formatVscComponentError(diffError, t('Failed to load diff'))}
            showIcon
            type="error"
          />
        ) : null}
        {diffLoading ? (
          <div aria-live="polite" role="status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spin size="small" />
            <Typography.Text type="secondary">{t('Generating diff...')}</Typography.Text>
          </div>
        ) : null}
        {!diffError && !diffLoading && lineDiffRows.length === 0 ? (
          <Empty description={t('No changes between draft and published')} />
        ) : null}
        {!diffError && lineDiffRows.length > 0 ? (
          <div
            aria-label={t('Diff output')}
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              fontFamily: 'monospace',
              maxHeight: 'calc(100vh - 380px)',
              overflow: 'auto',
            }}
          >
            {lineDiffRows.map((row) => (
              <div
                key={row.key}
                ref={row.key === activeChangeKey ? selectedChangeRef : undefined}
                style={{
                  background: row.type === 'insert' ? '#f6ffed' : row.type === 'delete' ? '#fff1f0' : undefined,
                  display: diffMode === 'split' ? 'grid' : 'flex',
                  gridTemplateColumns: diffMode === 'split' ? '72px 72px minmax(0, 1fr)' : undefined,
                  gap: 8,
                  outline: row.key === activeChangeKey ? '1px solid #1677ff' : undefined,
                  padding: '2px 8px',
                  whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
                }}
              >
                {diffMode === 'split' ? (
                  <>
                    <Typography.Text type="secondary">{row.oldLineNumber || ''}</Typography.Text>
                    <Typography.Text type="secondary">{row.newLineNumber || ''}</Typography.Text>
                  </>
                ) : null}
                <span>{`${row.type === 'insert' ? '+' : row.type === 'delete' ? '-' : ' '} ${row.content}`}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HistoryTab(props: {
  baseVersion: string;
  hasDraft: boolean;
  hasUnsavedLocalChanges: boolean;
  historyItems: RunJSSourceHistoryItem[];
  loading: boolean;
  onBack: () => void;
  onCopyCode: (commit: RunJSSourceHistoryItem) => Promise<void>;
  onCopyFile: (file: RunJSWorkspaceFile) => Promise<void>;
  onDiscardDraft: () => void;
  onRefresh: () => void;
  onRestore: (commit: RunJSSourceHistoryItem) => void;
  onSelect: (commit: RunJSSourceHistoryItem) => void;
  onSelectedVersionViewChange: (view: VersionDetailView) => void;
  onViewDraftDiff: () => void;
  publishedCommitId?: string | null;
  readOnly: boolean;
  restoringVersion: boolean;
  selectedVersion: RunJSSourceVersionResult | null;
  selectedVersionDiff: RunJSSourceDiffVersionResult | null;
  selectedVersionView: VersionDetailView;
  t: (key: string) => string;
  versionLoading: boolean;
}) {
  const {
    baseVersion,
    hasDraft,
    hasUnsavedLocalChanges,
    historyItems,
    loading,
    onBack,
    onCopyCode,
    onCopyFile,
    onDiscardDraft,
    onRefresh,
    onRestore,
    onSelect,
    onSelectedVersionViewChange,
    onViewDraftDiff,
    publishedCommitId,
    readOnly,
    restoringVersion,
    selectedVersion,
    selectedVersionDiff,
    selectedVersionView,
    t,
    versionLoading,
  } = props;
  const selectedParent = selectedVersion?.commit.parentCommitId
    ? historyItems.find((item) => item.id === selectedVersion.commit.parentCommitId)
    : undefined;

  return (
    <section
      aria-label={t('History')}
      style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 12 }}
    >
      <div>
        <Space style={{ justifyContent: 'space-between', marginBottom: 8, width: '100%' }}>
          <Typography.Text strong>{t('History')}</Typography.Text>
          <Button aria-label={t('Refresh history')} icon={<ReloadOutlined />} loading={loading} onClick={onRefresh} />
        </Space>
        {hasDraft || hasUnsavedLocalChanges ? (
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, marginBottom: 8, padding: 8 }}>
            <Space direction="vertical">
              <Typography.Text strong>{t('Current draft')}</Typography.Text>
              <Typography.Text type="secondary">
                {hasUnsavedLocalChanges ? t('Unsaved changes') : t('Draft saved')} · {`${t('Based on')} ${baseVersion}`}
              </Typography.Text>
              <Space>
                <Button onClick={onViewDraftDiff} size="small" type="link">
                  {t('View diff')}
                </Button>
                <Button disabled={readOnly} onClick={onDiscardDraft} size="small" type="link">
                  {t('Discard draft')}
                </Button>
              </Space>
            </Space>
          </div>
        ) : null}
        <List
          dataSource={historyItems}
          loading={loading}
          locale={{ emptyText: <Empty description={t('No published versions yet')} /> }}
          rowKey="id"
          renderItem={(commit) => (
            <List.Item
              actions={[
                <Button key="diff" onClick={() => onSelect(commit)} size="small" type="link">
                  {t('View diff')}
                </Button>,
                <Button
                  disabled={readOnly || hasUnsavedLocalChanges}
                  key="restore"
                  onClick={() => onRestore(commit)}
                  size="small"
                  type="link"
                >
                  {t('Restore as draft')}
                </Button>,
                <Button key="copy" onClick={() => onCopyCode(commit)} size="small" type="link">
                  {t('Copy code')}
                </Button>,
              ]}
              onClick={() => onSelect(commit)}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                description={
                  <Space wrap>
                    {commit.isPublished || commit.id === publishedCommitId ? (
                      <Tag color="green">{t('Published')}</Tag>
                    ) : null}
                    <Typography.Text type="secondary">{commit.authorId || t('Unknown author')}</Typography.Text>
                  </Space>
                }
                title={`${formatVersion(commit.seq)} ${commit.message}`}
              />
            </List.Item>
          )}
        />
      </div>
      <aside style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 12 }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Text strong>
            {selectedVersion ? `${t('Commit')} ${formatVersion(selectedVersion.commit.seq)}` : t('Version detail')}
          </Typography.Text>
          {selectedVersion ? (
            <Button onClick={onBack} size="small" type="link">
              {t('Back to history')}
            </Button>
          ) : null}
        </Space>
        {versionLoading ? <Spin style={{ display: 'block', marginTop: 12 }} /> : null}
        {!versionLoading && !selectedVersion ? <Empty description={t('Select a version')} /> : null}
        {selectedVersion ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Text type="secondary">{t('Message')}</Typography.Text>
            <Typography.Text>{selectedVersion.commit.message}</Typography.Text>
            <Typography.Text type="secondary">{t('Metadata')}</Typography.Text>
            <Space wrap>
              <Tag>{`${t('Author')}: ${selectedVersion.commit.authorId || t('Unknown author')}`}</Tag>
              <Tag>{`${t('Parent')}: ${
                selectedParent ? formatVersion(selectedParent.seq) : selectedVersion.commit.parentCommitId || '-'
              }`}</Tag>
              {selectedVersionDiff ? (
                <Tag>{formatChangeSummary(summarizeDiffVersion(selectedVersionDiff), t)}</Tag>
              ) : null}
            </Space>
            <Space wrap>
              <Button
                icon={<DiffOutlined />}
                onClick={() => onSelectedVersionViewChange('diff')}
                size="small"
                type={selectedVersionView === 'diff' ? 'primary' : 'default'}
              >
                {t('View diff')}
              </Button>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => onSelectedVersionViewChange('files')}
                size="small"
                type={selectedVersionView === 'files' ? 'primary' : 'default'}
              >
                {t('View files')}
              </Button>
              <Button
                disabled={readOnly || hasUnsavedLocalChanges}
                icon={<RollbackOutlined />}
                loading={restoringVersion}
                onClick={() => onRestore(selectedVersion.commit)}
                size="small"
              >
                {t('Restore as draft')}
              </Button>
            </Space>
            {selectedVersionDiff ? (
              selectedVersionView === 'diff' ? (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Typography.Text type="secondary">
                    {formatChangeSummary(summarizeDiffVersion(selectedVersionDiff), t)}
                  </Typography.Text>
                  {selectedVersionDiff.diff.files.map((file) => (
                    <Typography.Text code ellipsis key={`diff:${file.path}`}>
                      {`${file.path} +${file.additions} -${file.deletions}`}
                    </Typography.Text>
                  ))}
                </>
              ) : null
            ) : null}
            {selectedVersionView === 'files' ? (
              <>
                <Divider style={{ margin: '8px 0' }} />
                {selectedVersion.files.map((file) => (
                  <Space key={`version:${file.path}`} style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Typography.Text code ellipsis>
                      {file.path}
                    </Typography.Text>
                    <Button icon={<CopyOutlined />} onClick={() => onCopyFile(file)} size="small" type="link">
                      {t('Copy file')}
                    </Button>
                  </Space>
                ))}
              </>
            ) : null}
          </Space>
        ) : null}
      </aside>
    </section>
  );
}

function ContextPanel(props: {
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  t: (key: string) => string;
}) {
  const { collapsed, onCollapseChange, t } = props;

  if (collapsed) {
    return (
      <aside style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 8 }}>
        <Tooltip title={t('Context')}>
          <Button aria-label={t('Expand context')} icon={<PlusOutlined />} onClick={() => onCollapseChange(false)} />
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside
      aria-label={t('Context')}
      style={{
        borderLeft: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingLeft: 12,
      }}
    >
      <Space style={{ justifyContent: 'space-between' }}>
        <Typography.Text strong>{t('Context')}</Typography.Text>
        <Button
          aria-label={t('Collapse context')}
          icon={<CompressOutlined />}
          onClick={() => onCollapseChange(true)}
          size="small"
        />
      </Space>
      <section>
        <Typography.Text strong>{t('Snippets')}</Typography.Text>
        <Typography.Paragraph type="secondary">
          {t('Use the editor snippets menu for scene-aware examples.')}
        </Typography.Paragraph>
      </section>
      <section>
        <Typography.Text strong>{t('Help')}</Typography.Text>
        <Typography.Paragraph type="secondary">
          {t('Preview compiles the current workspace before publish.')}
        </Typography.Paragraph>
      </section>
    </aside>
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
        display: 'flex',
        flexDirection: 'column',
        height,
        maxHeight,
        minHeight,
        paddingTop: 8,
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
      <Space style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <Typography.Text strong>{t('Console')}</Typography.Text>
        <Space>
          <Button onClick={onClear} size="small">
            {t('Clear')}
          </Button>
          <Button icon={<CopyOutlined />} onClick={onCopy} size="small">
            {t('Copy logs')}
          </Button>
        </Space>
      </Space>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {entries.length === 0 ? <Empty description={t('No logs')} /> : null}
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
  onCancel: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  open: boolean;
  t: (key: string) => string;
  value: string;
}) {
  const { error, mode, onCancel, onChange, onSubmit, open, t, value } = props;

  return (
    <Modal
      getContainer={false}
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
  onCancel: () => void;
  onCommitMessageChange: (value: string) => void;
  onPublish: () => void;
  onViewDiff: () => void;
  open: boolean;
  readOnly: boolean;
  summary: RunJSChangeSummary;
  t: (key: string) => string;
}) {
  const {
    commitMessage,
    diagnostics,
    loading,
    onCancel,
    onCommitMessageChange,
    onPublish,
    onViewDiff,
    open,
    readOnly,
    summary,
    t,
  } = props;
  const trimmed = commitMessage.trim();
  const hasCompileErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const messageInvalid = trimmed.length < 3 || trimmed.length > 200;
  const disabled = readOnly || summary.files === 0 || hasCompileErrors || messageInvalid;

  return (
    <Modal
      confirmLoading={loading}
      getContainer={false}
      okButtonProps={{ disabled }}
      okText={t('Publish')}
      onCancel={onCancel}
      onOk={onPublish}
      open={open}
      title={t('Publish JavaScript')}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text strong>{t('Changes')}</Typography.Text>
        <Typography.Text>{formatChangeSummary(summary, t)}</Typography.Text>
        {summary.files === 0 ? <Alert message={t('No changes to publish')} showIcon type="info" /> : null}
        {hasCompileErrors ? <Alert message={t('Compile failed')} showIcon type="error" /> : null}
        <Input
          aria-label={t('Commit message')}
          maxLength={200}
          onChange={(event) => onCommitMessageChange(event.target.value)}
          placeholder={t('Update chart event handling')}
          showCount
          status={commitMessage && messageInvalid ? 'error' : undefined}
          value={commitMessage}
        />
        <Button icon={<DiffOutlined />} onClick={onViewDiff}>
          {t('View diff')}
        </Button>
      </Space>
    </Modal>
  );
}

function CloseConfirmModal(props: {
  intent: PendingDirtyAction;
  onCancel: () => void;
  onCloseWithoutSaving: () => void;
  onSaveAndClose: () => void;
  open: boolean;
  saving: boolean;
  t: (key: string) => string;
}) {
  const { intent, onCancel, onCloseWithoutSaving, onSaveAndClose, open, saving, t } = props;
  const saveLabel = intent === 'refresh' ? t('Save draft and refresh') : t('Save draft and close');
  const discardLabel = intent === 'refresh' ? t('Refresh without saving') : t('Close without saving');
  const message = intent === 'refresh' ? t('Save your draft before refreshing?') : t('Save your draft before closing?');

  return (
    <Modal
      footer={[
        <Button disabled={saving} key="save" loading={saving} onClick={onSaveAndClose} type="primary">
          {saveLabel}
        </Button>,
        <Button key="discard" onClick={onCloseWithoutSaving}>
          {discardLabel}
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
      ]}
      getContainer={false}
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
  onViewDiff: () => void;
  t: (key: string) => string;
}) {
  const { commit, loading, onCancel, onRestore, onViewDiff, t } = props;
  const version = commit ? formatVersion(commit.seq) : '';

  return (
    <Modal
      footer={[
        <Button icon={<DiffOutlined />} key="diff" onClick={onViewDiff}>
          {t('View diff')}
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
        <Button key="restore" loading={loading} onClick={onRestore} type="primary">
          {t('Restore as draft')}
        </Button>,
      ]}
      getContainer={false}
      onCancel={onCancel}
      open={Boolean(commit)}
      title={formatRestoreAsDraftTitle(version, t)}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text>{t('This will copy files from this version into your current draft.')}</Typography.Text>
        <Typography.Text>{t('It will not change the published version.')}</Typography.Text>
        <Typography.Text>{t('You can review and publish after restoring.')}</Typography.Text>
      </Space>
    </Modal>
  );
}

function formatRestoreAsDraftTitle(version: string, t: (key: string) => string): string {
  return t('Restore {{version}} as draft?').replace('{{version}}', version);
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
    <Modal footer={null} getContainer={false} onCancel={onCancel} open={Boolean(conflict)} title={t('Conflict')}>
      {conflict ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert message={t('This JavaScript source changed while you were editing.')} showIcon type="warning" />
          {!conflict.canRebase ? (
            <Alert
              message={t('The source owner changed outside this workspace. Refresh before rebasing.')}
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

function buildStatusBadges(input: {
  t: (key: string) => string;
  hasUnsavedLocalChanges: boolean;
  hasDraft: boolean;
  previewing: boolean;
  publishedSeq?: number;
  restoredDraftVersion?: string | null;
  conflict: boolean;
  compileFailed: boolean;
}): React.ReactNode[] {
  const badges: React.ReactNode[] = [];
  const {
    t,
    hasUnsavedLocalChanges,
    hasDraft,
    previewing,
    publishedSeq,
    restoredDraftVersion,
    conflict,
    compileFailed,
  } = input;

  if (hasUnsavedLocalChanges) {
    badges.push(
      <Tag color="orange" key="unsaved">
        {t('Unsaved changes')}
      </Tag>,
    );
  } else if (hasDraft) {
    badges.push(
      <Tag color="blue" key="draft">
        {t('Draft saved')}
      </Tag>,
    );
  }
  if (restoredDraftVersion) {
    badges.push(
      <Tag color="blue" key="restored">
        {`${t('Draft restored from')} ${restoredDraftVersion}`}
      </Tag>,
    );
  }
  if (previewing) {
    badges.push(
      <Tag color="processing" key="preview">
        {t('Running preview')}
      </Tag>,
    );
  }
  if (publishedSeq) {
    badges.push(<Tag color="green" key="published">{`${t('Published as')} v${publishedSeq}`}</Tag>);
  }
  if (conflict) {
    badges.push(
      <Tag color="red" key="conflict">
        {t('Conflict')}
      </Tag>,
    );
  }
  if (compileFailed) {
    badges.push(
      <Tag color="red" key="compile">
        {t('Compile failed')}
      </Tag>,
    );
  }

  return badges;
}

function formatCompactStatus(input: {
  t: (key: string) => string;
  publishedSeq?: number;
  hasDraft: boolean;
  hasUnsavedLocalChanges: boolean;
  entryPath: string;
}): string {
  const { t, publishedSeq, hasDraft, hasUnsavedLocalChanges, entryPath } = input;
  const version = publishedSeq ? `${t('Published')} v${publishedSeq}` : t('No published versions yet');
  const draft = hasUnsavedLocalChanges ? t('Unsaved changes') : hasDraft ? t('Draft saved') : t('No draft');
  return `${version} · ${draft} · ${entryPath}`;
}

function findCommit(items: RunJSSourceHistoryItem[], commitId?: string | null): RunJSSourceHistoryItem | undefined {
  if (!commitId) {
    return undefined;
  }

  return items.find((item) => item.id === commitId);
}

function summarizeDiffVersion(diffVersion: RunJSSourceDiffVersionResult): RunJSChangeSummary {
  return diffVersion.diff.files.reduce(
    (summary, file) => ({
      files: summary.files + 1,
      additions: summary.additions + file.additions,
      deletions: summary.deletions + file.deletions,
    }),
    {
      files: 0,
      additions: 0,
      deletions: 0,
    },
  );
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
    length >= 3 &&
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
