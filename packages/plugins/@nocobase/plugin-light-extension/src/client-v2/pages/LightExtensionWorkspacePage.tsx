/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SaveOutlined } from '@ant-design/icons';
import {
  CodeTab,
  CloseConfirmModal,
  FilesPanel,
  PublishModal,
  RestoreVersionModal,
  VersionHistoryDock,
  type RunJSChangeSummary,
  type RunJSLineDiffRow,
  type RunJSSourceHistoryItem,
  type RunJSWorkspaceFile,
  useVscFileT,
} from '@nocobase/plugin-vsc-file/client-v2';
import { useFullscreenOverlay } from '@nocobase/client-v2';
import { Alert, Button, Empty, Flex, Space, Spin, Typography, message } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryRecord,
  LightExtensionFileChange,
  LightExtensionPulledFile,
  LightExtensionRepoRecord,
  LightExtensionCommitRecord,
  LightExtensionPublishResult,
  LightExtensionScanResult,
} from '../../shared/types';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import { getLightExtensionErrorDiagnostics, useLightExtensionRepo } from '../hooks/useLightExtensionRepo';
import { useLightExtensionPublications } from '../hooks/useLightExtensionPublications';

type WorkspaceFile = RunJSWorkspaceFile;

export interface LightExtensionTemplateFile {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}

interface LightExtensionWorkspacePageProps {
  embedded?: boolean;
  onFooterActionsChange?: (actions: LightExtensionWorkspaceFooterActions | null) => void;
  onRequestClose?: () => void;
}

export interface LightExtensionWorkspaceFooterActions {
  disabled: boolean;
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
}

const LIGHT_EXTENSION_SOURCE_ROOT = 'src/client/js-blocks';
const DEFAULT_NEW_FILE_NAME = 'helper';
const DEFAULT_NEW_FILE_EXTENSION = '.ts';
const noop = () => undefined;

function LightExtensionWorkspacePage({
  embedded = false,
  onFooterActionsChange,
  onRequestClose,
}: LightExtensionWorkspacePageProps) {
  const { t } = useTranslation(NAMESPACE);
  const studioT = useVscFileT();
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repoId') || '';
  const { getRepo, listCommits, pull, pullCommit, push, scanEntries } = useLightExtensionRepo();
  const { publish } = useLightExtensionPublications();
  const [repo, setRepo] = useState<LightExtensionRepoRecord | null>(null);
  const [baseCommitId, setBaseCommitId] = useState<string | null>(null);
  const [baseFiles, setBaseFiles] = useState<WorkspaceFile[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | undefined>();
  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [filesCollapsed, setFilesCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  const [historyItems, setHistoryItems] = useState<RunJSSourceHistoryItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<LightExtensionDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isDiff, setIsDiff] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [restoreCommit, setRestoreCommit] = useState<RunJSSourceHistoryItem | null>(null);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(
    null,
  );
  const workspaceFullscreen = useFullscreenOverlay();

  const loadWorkspace = useCallback(
    async (options: { resetNotice?: boolean } = {}) => {
      if (!repoId) {
        return;
      }

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
          setBaseCommitId(nextRepo.headCommitId);
          setHistoryItems([]);
          setNotice({ type: 'warning', message: t('Archived repositories are read-only') });
          return;
        }

        const pullResult = await pull({ repoId, includeContent: 'all' });
        const pulledFiles = normalizeWorkspaceFiles(pullResult.files || []);
        const nextFiles = pulledFiles.length > 0 ? pulledFiles : buildJsBlockTemplate([]);
        const nextActivePath = resolveActivePath(nextFiles, undefined);
        const commits = await listCommits({ repoId, limit: 20 }).catch(() => []);
        setBaseCommitId(pullResult.commit?.id || null);
        setBaseFiles(pulledFiles);
        setFiles(nextFiles);
        setFolders(collectWorkspaceFolders(nextFiles));
        setActivePath(nextActivePath);
        setOpenPaths(nextActivePath ? [nextActivePath] : []);
        setHistoryItems(toRunJSHistoryItems(commits, nextRepo.headCommitId));
        setDiagnostics([]);
        setIsDiff(false);
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load source') });
      } finally {
        setLoading(false);
      }
    },
    [getRepo, listCommits, pull, repoId, t],
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const activeFile = files.find((file) => file.path === activePath);
  const dirtyChanges = useMemo(() => buildFileChanges(baseFiles, files), [baseFiles, files]);
  const diffRows = useMemo(() => buildLineDiffRows(baseFiles, files, activePath), [activePath, baseFiles, files]);
  const changeSummary = useMemo(() => summarizeWorkspaceChanges(baseFiles, files), [baseFiles, files]);
  const hasUnsavedLocalChanges = dirtyChanges.length > 0;
  const canWrite = Boolean(repo && repo.lifecycleStatus !== 'archived');

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
    if (!canWrite) {
      return undefined;
    }

    const nextPath = buildNewFilePath(files, parentPath);
    const nextFiles = mergeFiles(files, [
      {
        path: nextPath,
        content: '',
        language: languageFromPath(nextPath),
      },
    ]);
    setFiles(nextFiles);
    setFolders((current) => mergeFolders(current, collectWorkspaceFolders(nextFiles)));
    openFilePath(nextPath);
    return nextPath;
  };

  const createWorkspaceFolder = (parentPath = LIGHT_EXTENSION_SOURCE_ROOT): string | undefined => {
    if (!canWrite) {
      return undefined;
    }

    const nextFolder = buildNewFolderPath(files, folders, parentPath);
    setFolders((current) => mergeFolders(current, [nextFolder]));
    return nextFolder;
  };

  const updateActiveFile = (value: string) => {
    if (!activePath || !canWrite) {
      return;
    }

    setFiles((current) => current.map((file) => (file.path === activePath ? { ...file, content: value } : file)));
  };

  const removeFile = (path: string) => {
    if (!canWrite) {
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
    if (!canWrite) {
      return false;
    }

    const normalizedNextPath = normalizeWorkspacePath(nextPath);
    if (!isValidWorkspaceFilePath(normalizedNextPath)) {
      message.error(t('Invalid file path'));
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
      file.path === path ? { ...file, language: languageFromPath(normalizedNextPath), path: normalizedNextPath } : file,
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
    if (!canWrite) {
      return false;
    }

    const normalizedNextPath = normalizeWorkspacePath(nextPath);
    if (!isValidWorkspaceFolderPath(normalizedNextPath)) {
      message.error(t('Invalid file path'));
      return false;
    }
    if (path === normalizedNextPath) {
      return true;
    }
    if (folders.includes(normalizedNextPath)) {
      message.error(t('Folder already exists'));
      return false;
    }

    const nextFiles = normalizeWorkspaceFiles(
      files.map((file) => ({
        ...file,
        language: languageFromPath(replacePathPrefix(file.path, path, normalizedNextPath)),
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
    if (!canWrite) {
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

    setHistoryLoading(true);
    try {
      const commits = await listCommits({ repoId, limit: 20 });
      setHistoryItems(toRunJSHistoryItems(commits, repo?.headCommitId));
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load history') });
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadVersionIntoEditor = async (commit: RunJSSourceHistoryItem) => {
    if (!repoId || !canWrite) {
      return;
    }

    setRestoringVersion(true);
    try {
      const pullResult = await pullCommit({ repoId, commitId: commit.id, includeContent: 'all' });
      const nextFiles = normalizeWorkspaceFiles(pullResult.files || []);
      const nextActivePath = resolveActivePath(nextFiles, activePath);
      setFiles(nextFiles);
      setFolders((current) => mergeFolders(current, collectWorkspaceFolders(nextFiles)));
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

  const exportWorkspace = () => {
    const content = JSON.stringify({ files }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${repo?.normalizedName || repo?.name || repoId || 'light-extension'}-source.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openSaveModal = useCallback(() => {
    if (!canWrite) {
      return;
    }

    if (dirtyChanges.length === 0) {
      message.info(studioT('No changes to save'));
      return;
    }

    setCommitMessage('');
    setSaveModalOpen(true);
  }, [canWrite, dirtyChanges.length, studioT]);

  const saveChanges = useCallback(async () => {
    if (!repoId || dirtyChanges.length === 0) {
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const result = await push({
        repoId,
        baseCommitId,
        message: commitMessage.trim() || t('Update light extension source'),
        files: dirtyChanges,
      });
      const publishOutcome = await publishCurrentHead({
        commitId: result.commit.id,
        publish,
        repoId,
        scanEntries,
      });
      setDiagnostics(publishOutcome.diagnostics);
      setBaseCommitId(result.commit.id);
      setBaseFiles(files);
      setSaveModalOpen(false);
      setCommitMessage('');
      setNotice({
        type: publishOutcome.published ? 'success' : 'warning',
        message: publishOutcome.published
          ? t('Source saved and published')
          : t('Source saved, but no publishable JS block was found'),
      });
      await loadWorkspace({ resetNotice: false });
    } catch (error) {
      setDiagnostics(getLightExtensionErrorDiagnostics(error) as LightExtensionDiagnostic[]);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to save source') });
    } finally {
      setSaving(false);
    }
  }, [baseCommitId, commitMessage, dirtyChanges, files, loadWorkspace, publish, push, repoId, scanEntries, t]);

  const requestClose = useCallback(() => {
    if (hasUnsavedLocalChanges) {
      setCloseConfirmOpen(true);
      return;
    }

    onRequestClose?.();
  }, [hasUnsavedLocalChanges, onRequestClose]);

  const discardLocalAndClose = useCallback(() => {
    setCloseConfirmOpen(false);
    onRequestClose?.();
  }, [onRequestClose]);

  const footerActions = useMemo<LightExtensionWorkspaceFooterActions>(
    () => ({
      disabled: !canWrite || loading,
      loading: saving,
      onCancel: requestClose,
      onSave: openSaveModal,
    }),
    [canWrite, loading, openSaveModal, requestClose, saving],
  );

  useEffect(() => {
    onFooterActionsChange?.(footerActions);
  }, [footerActions, onFooterActionsChange]);

  useEffect(() => {
    return () => {
      onFooterActionsChange?.(null);
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
                background: '#fff',
                display: 'grid',
                flex: embedded || workspaceFullscreen.isFullscreen ? '1 1 0' : undefined,
                gridTemplateColumns: filesCollapsed ? 'minmax(0, 1fr)' : 'minmax(220px, 260px) minmax(0, 1fr)',
                height: workspaceFullscreen.isFullscreen ? '100%' : undefined,
                minHeight: embedded || workspaceFullscreen.isFullscreen ? 0 : 520,
                minWidth: 0,
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
                    minHeight: 0,
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <FilesPanel
                    activePath={activePath}
                    collapsed={filesCollapsed}
                    exporting={false}
                    files={files}
                    folders={folders}
                    onCollapseChange={setFilesCollapsed}
                    onCreate={createWorkspaceFile}
                    onCreateFolder={createWorkspaceFolder}
                    onDelete={removeFile}
                    onDeleteFolder={deleteFolder}
                    onExportWorkspace={exportWorkspace}
                    onImportWorkspace={() => message.info(t('Import workspace is not supported here'))}
                    onMoveFile={moveFileToFolder}
                    onMoveFolder={moveFolderToFolder}
                    onOpen={openFilePath}
                    onRefresh={loadWorkspace}
                    onRename={renameFile}
                    onRenameFolder={renameFolder}
                    readOnly={!canWrite}
                    savedFiles={baseFiles}
                    t={studioT}
                  />
                  <VersionHistoryDock
                    baseVersion={formatHistoryVersion(historyItems.find((item) => item.id === baseCommitId)?.seq)}
                    collapsed={historyCollapsed}
                    hasUnsavedLocalChanges={hasUnsavedLocalChanges}
                    historyItems={historyItems}
                    loading={historyLoading}
                    onCollapsedChange={setHistoryCollapsed}
                    onRefresh={refreshHistory}
                    onSelect={setRestoreCommit}
                    onViewChanges={() => setIsDiff(true)}
                    publishedCommitId={repo?.headCommitId}
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
                  <CodeTab
                    activeFile={activeFile}
                    activePath={activePath}
                    diffRows={diffRows}
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
                    onRunPreview={() => {}}
                    openPaths={openPaths}
                    previewing={false}
                    readOnly={!canWrite}
                    savedFiles={baseFiles}
                    scene="render"
                    showRunButton={false}
                    t={studioT}
                    version="v2"
                    workspaceFiles={files}
                  />
                ) : null}
              </main>
            </div>,
            workspaceFullscreen.container,
          )
        : null}

      <DiagnosticsPanel diagnostics={diagnostics} onOpenDiagnostic={openDiagnosticSource} />

      <PublishModal
        commitMessage={commitMessage}
        loading={saving}
        onAfterClose={noop}
        onCancel={() => setSaveModalOpen(false)}
        onCommitMessageChange={setCommitMessage}
        onPublish={saveChanges}
        open={saveModalOpen}
        readOnly={!canWrite}
        summary={changeSummary}
        t={studioT}
      />

      <RestoreVersionModal
        commit={restoreCommit}
        loading={restoringVersion}
        onCancel={() => setRestoreCommit(null)}
        onRestore={confirmLoadVersion}
        t={studioT}
      />

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

function normalizeWorkspaceFiles(files: Array<LightExtensionPulledFile | WorkspaceFile>): WorkspaceFile[] {
  return files
    .map((file) => ({
      path: normalizeWorkspacePath(file.path),
      content: file.content || '',
      language: file.language || languageFromPath(file.path),
      mode: file.mode,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
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
    byPath.set(path, { ...file, language: file.language || languageFromPath(path), path });
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
  const folder = resolveCreateFolder(parentPath);
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

  return `${folder}/${DEFAULT_NEW_FILE_NAME}${Date.now()}${DEFAULT_NEW_FILE_EXTENSION}`;
}

function buildNewFolderPath(files: WorkspaceFile[], folders: string[], parentPath: string): string {
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
  if (!normalized || normalized === 'src/client') {
    return LIGHT_EXTENSION_SOURCE_ROOT;
  }

  return normalized;
}

function normalizeWorkspacePath(path: string): string {
  return path
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

function isValidWorkspaceFilePath(path: string): boolean {
  return isValidWorkspaceFolderPath(getDirectory(path)) && Boolean(getBaseName(path)) && !path.includes('/../');
}

function isValidWorkspaceFolderPath(path: string): boolean {
  return Boolean(path) && (path === 'src' || path.startsWith('src/')) && !path.includes('..');
}

function getDirectory(path: string): string {
  const index = path.lastIndexOf('/');
  return index >= 0 ? path.slice(0, index) : '';
}

function getBaseName(path: string): string {
  const index = path.lastIndexOf('/');
  return index >= 0 ? path.slice(index + 1) : path;
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

function buildLineDiffRows(baseFiles: WorkspaceFile[], files: WorkspaceFile[], path?: string): RunJSLineDiffRow[] {
  if (!path) {
    return [];
  }

  const baseLines = splitLines(baseFiles.find((file) => file.path === path)?.content || '');
  const nextLines = splitLines(files.find((file) => file.path === path)?.content || '');
  const maxLength = Math.max(baseLines.length, nextLines.length);
  const rows: RunJSLineDiffRow[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const oldLine = baseLines[index];
    const newLine = nextLines[index];
    if (oldLine === undefined && newLine !== undefined) {
      rows.push({ key: `insert:${index}`, type: 'insert', content: newLine, newLineNumber: index + 1 });
      continue;
    }
    if (oldLine !== undefined && newLine === undefined) {
      rows.push({ key: `delete:${index}`, type: 'delete', content: oldLine, oldLineNumber: index + 1 });
      continue;
    }
    if (oldLine !== newLine && oldLine !== undefined && newLine !== undefined) {
      rows.push({ key: `delete:${index}`, type: 'delete', content: oldLine, oldLineNumber: index + 1 });
      rows.push({ key: `insert:${index}`, type: 'insert', content: newLine, newLineNumber: index + 1 });
      continue;
    }
    if (oldLine !== undefined) {
      rows.push({
        key: `context:${index}`,
        type: 'context',
        content: oldLine,
        oldLineNumber: index + 1,
        newLineNumber: index + 1,
      });
    }
  }

  return rows;
}

function splitLines(content: string): string[] {
  return content.replace(/\r\n/g, '\n').split('\n');
}

function toRunJSHistoryItems(
  commits: LightExtensionCommitRecord[],
  publishedCommitId?: string | null,
): RunJSSourceHistoryItem[] {
  return commits.map((commit) => ({
    ...commit,
    isPublished: commit.id === publishedCommitId,
  }));
}

function formatHistoryVersion(seq?: number): string {
  return seq ? `v${seq}` : 'v0';
}

function summarizeWorkspaceChanges(baseFiles: WorkspaceFile[], files: WorkspaceFile[]): RunJSChangeSummary {
  const baseByPath = new Map(baseFiles.map((file) => [file.path, file]));
  const currentByPath = new Map(files.map((file) => [file.path, file]));
  const paths = uniqueStrings([...baseByPath.keys(), ...currentByPath.keys()]);
  let changedFiles = 0;
  let additions = 0;
  let deletions = 0;

  for (const path of paths) {
    const baseFile = baseByPath.get(path);
    const currentFile = currentByPath.get(path);
    if (
      baseFile &&
      currentFile &&
      baseFile.content === currentFile.content &&
      baseFile.language === currentFile.language &&
      baseFile.mode === currentFile.mode
    ) {
      continue;
    }

    changedFiles += 1;
    const lineCounts = countChangedLines(baseFile?.content || '', currentFile?.content || '');
    additions += lineCounts.additions;
    deletions += lineCounts.deletions;
  }

  return {
    additions,
    deletions,
    files: changedFiles,
  };
}

function countChangedLines(before: string, after: string): { additions: number; deletions: number } {
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  const maxLength = Math.max(beforeLines.length, afterLines.length);
  let additions = 0;
  let deletions = 0;

  for (let index = 0; index < maxLength; index += 1) {
    const beforeLine = beforeLines[index];
    const afterLine = afterLines[index];
    if (beforeLine === afterLine) {
      continue;
    }
    if (beforeLine !== undefined) {
      deletions += 1;
    }
    if (afterLine !== undefined) {
      additions += 1;
    }
  }

  return { additions, deletions };
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
        language: file.language || languageFromPath(file.path),
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

export function buildJsBlockTemplate(files: Array<{ path: string }>): LightExtensionTemplateFile[] {
  const existing = new Set(files.map((file) => file.path));
  const entryName = nextEntryName(existing);
  const root = `src/client/js-blocks/${entryName}`;

  return [
    {
      path: `${root}/index.tsx`,
      content: 'ctx.render(<div>Sales KPI</div>);\n',
      language: 'typescript',
    },
    {
      path: `${root}/meta.json`,
      content:
        '{\n  "title": "Sales KPI",\n  "description": "Sales KPI block",\n  "category": "sales",\n  "tags": ["sales", "kpi"],\n  "sort": 10\n}\n',
      language: 'json',
    },
    {
      path: `${root}/settings.json`,
      content:
        '{\n  "type": "object",\n  "properties": {\n    "region": {\n      "type": "string",\n      "title": "Region",\n      "x-component": "Input"\n    }\n  }\n}\n',
      language: 'json',
    },
  ];
}

function nextEntryName(existing: Set<string>): string {
  let index = 1;
  let name = 'sales-kpi';
  while (existing.has(`src/client/js-blocks/${name}/index.tsx`)) {
    index += 1;
    name = `sales-kpi-${index}`;
  }

  return name;
}

function languageFromPath(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) {
    return 'typescript';
  }
  if (path.endsWith('.jsx') || path.endsWith('.js')) {
    return 'javascript';
  }
  if (path.endsWith('.json')) {
    return 'json';
  }
  if (path.endsWith('.md')) {
    return 'markdown';
  }

  return 'text';
}

type PublishCurrentHeadInput = {
  repoId: string;
  commitId: string;
  scanEntries: (repoId: string) => Promise<LightExtensionScanResult>;
  publish: (input: {
    repoId: string;
    entryIds: string[];
    commitId: string;
    clientRequestId: string;
    activate: boolean;
    expectedCurrentPublicationIdByEntry: Record<string, string | null>;
  }) => Promise<LightExtensionPublishResult>;
};

async function publishCurrentHead(input: PublishCurrentHeadInput): Promise<{
  published: boolean;
  diagnostics: LightExtensionDiagnostic[];
}> {
  const scanResult = await input.scanEntries(input.repoId);
  const publishableEntries = getReadyJsBlockEntries(scanResult);
  const diagnostics = [...scanResult.diagnostics];

  if (!publishableEntries.length) {
    return {
      published: false,
      diagnostics,
    };
  }

  const publishResult = await input.publish({
    repoId: input.repoId,
    entryIds: publishableEntries.map((entry) => entry.id),
    commitId: input.commitId,
    clientRequestId: buildClientRequestId('light_extension_source_save'),
    activate: true,
    expectedCurrentPublicationIdByEntry: Object.fromEntries(
      publishableEntries.map((entry) => [entry.id, entry.activePublicationId]),
    ),
  });

  return {
    published: publishResult.status !== 'failed',
    diagnostics: [
      ...diagnostics,
      ...publishResult.diagnostics,
      ...publishResult.entryResults.flatMap((entry) => entry.diagnostics || []),
    ],
  };
}

function getReadyJsBlockEntries(scanResult: LightExtensionScanResult): LightExtensionEntryRecord[] {
  return scanResult.entries
    .map((item) => item.entry)
    .filter((entry) => entry.kind === 'js-block' && entry.healthStatus === 'ready');
}

function buildClientRequestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default LightExtensionWorkspacePage;
