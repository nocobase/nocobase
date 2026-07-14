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
  DeleteOutlined,
  DiffOutlined,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  ImportOutlined,
  LockOutlined,
  ReloadOutlined,
  RightOutlined,
  UpOutlined,
  UploadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { CodeEditor, type CodeEditorFullscreenControl, type CodeEditorJsonSchema } from '@nocobase/client-v2';
import {
  Alert,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import type { InputRef } from 'antd/es/input';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { RunJSCompileDiagnostic } from './types';
import type {
  RunJSChangeSummary,
  RunJSConsoleEntry,
  RunJSLineDiffRow,
  RunJSSourceHistoryItem,
  RunJSWorkspaceFile,
} from './types';
import type { PendingDirtyAction } from './studioInternalTypes';
import {
  buildFileTreeRows,
  buildRunJSTypeScriptProject,
  canCreateRunJSFileInFolder,
  collectRunJSWorkspaceFolders,
  defaultRunJSSourceRoot,
  type FileTreeFileRow,
  formatCompileDiagnostics,
  getRunJSBaseName,
  getRunJSDirectory,
  getRunJSTreeDragPayload,
  type InlineEditTarget,
  isRunJSTypeScriptProjectFile,
  isWorkspaceFileDirty,
  joinRunJSPath,
  RunJSFileTypeIcon,
  setRunJSTreeDragPayload,
  useRunJSImportModuleCompletions,
} from './studioUtils';
import { formatChangeSummary, formatVersion, inferLanguageFromPath, runJSManifestPath } from './workspaceUtils';

export type RunJSWorkspacePathType = 'file' | 'folder';
export type RunJSWorkspaceJsonSchemaResolver = (
  path: string,
  files: RunJSWorkspaceFile[],
) => CodeEditorJsonSchema | undefined;

export interface RunJSWorkspacePathAccess {
  canCreate?: boolean;
  canDelete?: boolean;
  canMove?: boolean;
  canRename?: boolean;
  canWrite?: boolean;
  reason?: string;
}

export function FilesPanel(props: {
  activePath?: string;
  collapsed: boolean;
  exporting: boolean;
  importing?: boolean;
  files: RunJSWorkspaceFile[];
  fillAvailableHeight?: boolean;
  folders?: string[];
  defaultCreateParentPath?: string;
  getPathAccess?: (path: string, pathType: RunJSWorkspacePathType) => RunJSWorkspacePathAccess;
  onCollapseChange: (collapsed: boolean) => void;
  onCreate: (parentPath?: string) => string | undefined;
  onCreateFolder: (parentPath?: string) => string | undefined;
  onDelete: (path: string) => void;
  onDeleteFolder: (path: string) => boolean;
  onExportWorkspace?: () => void;
  onImportWorkspace?: () => void;
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
    importing = false,
    files,
    fillAvailableHeight = false,
    folders,
    defaultCreateParentPath = defaultRunJSSourceRoot,
    getPathAccess,
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
  const { token } = theme.useToken();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [actionFocusedPath, setActionFocusedPath] = useState<string | null>(null);
  const [inlineEdit, setInlineEdit] = useState<InlineEditTarget | null>(null);
  const [collapsedFolderPaths, setCollapsedFolderPaths] = useState<Set<string>>(() => new Set());
  const inlineEditInputRef = useRef<InputRef>(null);
  const inlineEditCancellingRef = useRef(false);
  const resolvePathAccess = React.useCallback(
    (
      path: string,
      pathType: RunJSWorkspacePathType,
    ): Required<Omit<RunJSWorkspacePathAccess, 'reason'>> & {
      reason?: string;
    } => {
      const access = getPathAccess?.(path, pathType);
      const enabled = !readOnly;
      return {
        canCreate: enabled && access?.canCreate !== false,
        canDelete: enabled && access?.canDelete !== false,
        canMove: enabled && access?.canMove !== false,
        canRename: enabled && access?.canRename !== false,
        canWrite: enabled && access?.canWrite !== false,
        reason: access?.reason,
      };
    },
    [getPathAccess, readOnly],
  );
  const defaultCreateAccess = resolvePathAccess(defaultCreateParentPath, 'folder');
  const visibleFiles = React.useMemo(() => files.filter((file) => file.path !== runJSManifestPath), [files]);
  const folderPaths = React.useMemo(
    () => (folders || collectRunJSWorkspaceFolders(files)).filter((path) => path !== '.nocobase'),
    [files, folders],
  );
  const treeRows = React.useMemo(
    () => buildFileTreeRows(visibleFiles, folderPaths, collapsedFolderPaths),
    [collapsedFolderPaths, folderPaths, visibleFiles],
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
        flex: fillAvailableHeight ? '1 1 0' : '0 1 auto',
        flexDirection: 'column',
        gap: 8,
        maxHeight: fillAvailableHeight ? undefined : '80%',
        minHeight: fillAvailableHeight ? 0 : 140,
        overflow: 'hidden',
        padding: 12,
      }}
    >
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text strong style={{ whiteSpace: 'nowrap' }}>
          {t('Files')}
        </Typography.Text>
        <Space size={4}>
          {onExportWorkspace ? (
            <Tooltip title={t('Export workspace')}>
              <Button
                aria-label={t('Export workspace')}
                icon={<DownloadOutlined />}
                loading={exporting}
                onClick={onExportWorkspace}
                size="small"
              />
            </Tooltip>
          ) : null}
          {onImportWorkspace ? (
            <Tooltip title={t('Import workspace')}>
              <Button
                aria-label={t('Import workspace')}
                disabled={readOnly}
                icon={<UploadOutlined />}
                loading={importing}
                onClick={onImportWorkspace}
                size="small"
              />
            </Tooltip>
          ) : null}
          <Tooltip title={t('New folder')}>
            <Button
              aria-label={t('New folder')}
              disabled={!defaultCreateAccess.canCreate}
              icon={<FolderAddOutlined />}
              onClick={() => createFolderInline(defaultCreateParentPath)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('New file')}>
            <Button
              aria-label={t('New file')}
              disabled={!defaultCreateAccess.canCreate}
              icon={<FileAddOutlined />}
              onClick={() => createFileInline(defaultCreateParentPath)}
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
                {defaultCreateAccess.canCreate ? (
                  <Button
                    icon={<FileAddOutlined />}
                    onClick={() => createFileInline(defaultCreateParentPath)}
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
            const pathAccess = resolvePathAccess(row.path, 'folder');
            const canCreateInsideFolder = pathAccess.canCreate && canCreateRunJSFileInFolder(row.path);
            const folderCollapsed = collapsedFolderPaths.has(row.path);
            return (
              <List.Item
                draggable={pathAccess.canMove}
                onDragStart={(event) => {
                  if (!pathAccess.canMove) {
                    event.preventDefault();
                    return;
                  }
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
                  if (!dragPayload || !pathAccess.canCreate) {
                    return;
                  }

                  const sourceAccess = resolvePathAccess(dragPayload.path, dragPayload.kind);
                  if (!sourceAccess.canMove) {
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
                    color: pathAccess.reason ? token.colorTextDisabled : undefined,
                    cursor: pathAccess.canMove ? 'grab' : 'pointer',
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
                    {pathAccess.reason ? (
                      <Tooltip title={pathAccess.reason}>
                        <LockOutlined aria-label={pathAccess.reason} style={{ color: token.colorTextDisabled }} />
                      </Tooltip>
                    ) : null}
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
                      <Typography.Text
                        ellipsis
                        style={{ color: pathAccess.reason ? token.colorTextDisabled : undefined }}
                        type={pathAccess.reason ? undefined : 'secondary'}
                      >
                        {row.name}
                      </Typography.Text>
                    )}
                  </Space>
                  {!readOnly && (canCreateInsideFolder || pathAccess.canRename) ? (
                    <Space
                      size={0}
                      style={{
                        opacity: actionsVisible ? 1 : 0,
                        pointerEvents: actionsVisible ? 'auto' : 'none',
                        transition: 'opacity 120ms ease',
                      }}
                    >
                      {canCreateInsideFolder ? (
                        <>
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
                        </>
                      ) : null}
                      {pathAccess.canRename ? (
                        <Tooltip title={t('Rename')} open={actionsVisible ? undefined : false}>
                          <Button
                            aria-label={`${t('Rename')} ${row.path}`}
                            icon={<EditOutlined />}
                            onBlur={() => setActionFocusedPath((current) => (current === row.path ? null : current))}
                            onClick={(event) => {
                              event.stopPropagation();
                              startInlineEdit('folder', row.path, false);
                            }}
                            onFocus={() => setActionFocusedPath(row.path)}
                            size="small"
                            style={{ height: 20, padding: 0, width: 20 }}
                            tabIndex={actionsVisible ? 0 : -1}
                            type="text"
                          />
                        </Tooltip>
                      ) : null}
                    </Space>
                  ) : null}
                </div>
              </List.Item>
            );
          }

          const dirty = isWorkspaceFileDirty(savedFiles, row.file);
          const isActive = activePath === row.path;
          const actionsVisible = hoveredPath === row.path || actionFocusedPath === row.path;
          const pathAccess = resolvePathAccess(row.path, 'file');
          return (
            <List.Item
              draggable={pathAccess.canMove && row.path !== runJSManifestPath}
              onDragStart={(event) => {
                if (!pathAccess.canMove) {
                  event.preventDefault();
                  return;
                }
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
                    color: pathAccess.reason ? token.colorTextDisabled : isActive ? token.colorPrimary : undefined,
                    justifyContent: 'flex-start',
                    minWidth: 0,
                    paddingInlineEnd: readOnly ? undefined : 76,
                  }}
                  type="text"
                >
                  <Space size={6} style={{ minWidth: 0 }}>
                    <RunJSFileTypeIcon path={row.path} />
                    {pathAccess.reason ? (
                      <Tooltip title={pathAccess.reason}>
                        <LockOutlined aria-label={pathAccess.reason} style={{ color: token.colorTextDisabled }} />
                      </Tooltip>
                    ) : null}
                    <Typography.Text
                      ellipsis
                      style={{ color: pathAccess.reason ? token.colorTextDisabled : undefined, maxWidth: 152 }}
                    >
                      {row.name}
                      {dirty ? ' *' : ''}
                    </Typography.Text>
                  </Space>
                </Button>
              )}
              {pathAccess.canRename || pathAccess.canDelete ? (
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
                  {pathAccess.canRename ? (
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
                  ) : null}
                  {pathAccess.canDelete ? (
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
                  ) : null}
                </Space>
              ) : null}
            </List.Item>
          );
        }}
      />
    </aside>
  );
}

export function CodeTab(props: {
  activeFile?: RunJSWorkspaceFile;
  activePath?: string;
  diffRows: RunJSLineDiffRow[];
  emptyDiffDescription?: string;
  filesCollapsed: boolean;
  isDiff: boolean;
  onChange: (content: string) => void;
  onCloseFile: (path: string) => void;
  onDiffToggle: () => void;
  onFilesCollapsedChange: (collapsed: boolean) => void;
  onOpenFile: (path: string) => void;
  onRunPreview?: () => void;
  openPaths: string[];
  previewing?: boolean;
  readOnly: boolean;
  runJSModelUse?: string;
  runJSGlobalContextType?: string;
  savedFiles: RunJSWorkspaceFile[];
  scene?: string;
  showRunButton?: boolean;
  t: (key: string) => string;
  toolbarActions?: React.ReactNode;
  version: string;
  workspaceFiles: RunJSWorkspaceFile[];
  fullscreenControl?: CodeEditorFullscreenControl;
  jsonSchemaResolver?: RunJSWorkspaceJsonSchemaResolver;
}) {
  const {
    activeFile,
    activePath,
    diffRows,
    emptyDiffDescription,
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
    runJSModelUse,
    runJSGlobalContextType,
    savedFiles,
    scene,
    showRunButton = true,
    t,
    toolbarActions,
    version,
    workspaceFiles,
    fullscreenControl,
    jsonSchemaResolver,
  } = props;
  const openFiles = openPaths
    .map((path) => workspaceFiles.find((file) => file.path === path))
    .filter((file): file is RunJSWorkspaceFile => Boolean(file));
  const moduleImportCompletions = useRunJSImportModuleCompletions(workspaceFiles, activeFile?.path);
  const typescriptProject = useMemo(
    () => buildRunJSTypeScriptProject(workspaceFiles, activeFile, runJSModelUse, runJSGlobalContextType),
    [activeFile, runJSGlobalContextType, runJSModelUse, workspaceFiles],
  );
  const jsonSchema = useMemo(
    () => (activeFile ? jsonSchemaResolver?.(activeFile.path, workspaceFiles) : undefined),
    [activeFile, jsonSchemaResolver, workspaceFiles],
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
    <Space size={8}>
      {toolbarActions}
      <Space.Compact>
        {showRunButton ? (
          <Button disabled={isDiff || !onRunPreview} loading={previewing} onClick={onRunPreview} size="small">
            {t('Run')}
          </Button>
        ) : null}
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
    </Space>
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
        <SideBySideDiffView emptyDescription={emptyDiffDescription} rows={diffRows} t={t} />
      </section>
    );
  }

  return (
    <section
      aria-label={t('Code')}
      data-runjs-code-editor="true"
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
        enableLinter={isRunJSTypeScriptProjectFile(activeFile.path)}
        height="100%"
        language={isDiff ? 'diff' : activeFile.language || inferLanguageFromPath(activeFile.path)}
        jsonSchema={jsonSchema}
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
        fullscreenControl={fullscreenControl}
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

function SideBySideDiffView(props: {
  emptyDescription?: string;
  rows: RunJSLineDiffRow[];
  t: (key: string) => string;
}) {
  const { emptyDescription, rows, t } = props;
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
          <Empty description={emptyDescription || t('No changes between current editor and saved version')} />
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

export function VersionHistoryDock(props: {
  baseVersion: string;
  collapsed: boolean;
  emptyHistoryDescription?: string;
  hasMore: boolean;
  hasUnsavedLocalChanges: boolean;
  historyItems: RunJSSourceHistoryItem[];
  loading: boolean;
  loadingMore: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onSelect: (commit: RunJSSourceHistoryItem) => void;
  onViewChanges: () => void;
  restoreDisabled?: boolean;
  restoreDisabledReason?: string;
  t: (key: string) => string;
}) {
  const {
    baseVersion,
    collapsed,
    emptyHistoryDescription,
    hasMore,
    hasUnsavedLocalChanges,
    historyItems,
    loading,
    loadingMore,
    onCollapsedChange,
    onLoadMore,
    onRefresh,
    onSelect,
    onViewChanges,
    restoreDisabled = false,
    restoreDisabledReason,
    t,
  } = props;

  return (
    <section
      aria-label={t('Version history')}
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
            <Button
              aria-label={t('Refresh history')}
              disabled={loadingMore}
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onRefresh}
            />
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
            {historyItems.length === 0 ? <Empty description={emptyHistoryDescription || t('No versions yet')} /> : null}
            {historyItems.map((commit) => {
              const restoreButton = (
                <button
                  aria-label={`${t('Restore')} ${formatCommitTime(commit)} ${formatVersion(commit.seq)}`}
                  disabled={restoreDisabled}
                  key={commit.id}
                  onClick={() => onSelect(commit)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    borderRadius: 6,
                    cursor: restoreDisabled ? 'not-allowed' : 'pointer',
                    display: 'block',
                    opacity: restoreDisabled ? 0.55 : 1,
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
                      </Space>
                      <Typography.Text ellipsis type="secondary">
                        {commit.message}
                      </Typography.Text>
                    </Space>
                    {restoreDisabled ? (
                      <LockOutlined aria-hidden="true" style={{ color: '#8c8c8c', flex: '0 0 auto', marginTop: 3 }} />
                    ) : (
                      <ImportOutlined
                        aria-hidden="true"
                        style={{ color: '#8c8c8c', flex: '0 0 auto', fontSize: 13, marginTop: 3 }}
                      />
                    )}
                  </Space>
                </button>
              );

              return restoreDisabled && restoreDisabledReason ? (
                <Tooltip key={commit.id} title={restoreDisabledReason}>
                  <span style={{ display: 'block' }}>{restoreButton}</span>
                </Tooltip>
              ) : (
                restoreButton
              );
            })}
            {hasMore ? (
              <Button block disabled={loading} loading={loadingMore} onClick={onLoadMore} size="small">
                {t('Load more')}
              </Button>
            ) : null}
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

export function ConsolePanel(props: {
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
            [{entry.level}]{' '}
            {entry.path
              ? `${entry.path}${entry.line ? `:${entry.line}` : ''}${entry.column ? `:${entry.column}` : ''} `
              : ''}
            {entry.message}
          </button>
        ))}
      </div>
    </section>
  );
}

export function SaveVersionModal(props: {
  loading: boolean;
  onAfterClose: () => void;
  onCancel: () => void;
  onSave: () => void;
  onVersionMessageChange: (value: string) => void;
  open: boolean;
  readOnly: boolean;
  summary: RunJSChangeSummary;
  t: (key: string) => string;
  versionMessage: string;
}) {
  const {
    loading,
    onAfterClose,
    onCancel,
    onSave,
    onVersionMessageChange,
    open,
    readOnly,
    summary,
    t,
    versionMessage,
  } = props;
  const trimmed = versionMessage.trim();
  const messageInvalid = trimmed.length < 3 || trimmed.length > 200;
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
      onOk={onSave}
      open={open}
      title={t('Save version')}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text strong>{t('Changes')}</Typography.Text>
        <Typography.Text>{formatChangeSummary(summary, t)}</Typography.Text>
        {summary.files === 0 ? <Alert message={t('No changes to save')} showIcon type="info" /> : null}
        <Input
          aria-label={t('Version message')}
          maxLength={200}
          onChange={(event) => onVersionMessageChange(event.target.value)}
          placeholder={t('Describe this version')}
          ref={inputRef}
          showCount
          status={versionMessage && messageInvalid ? 'error' : undefined}
          value={versionMessage}
        />
      </Space>
    </Modal>
  );
}

export function SaveDiagnosticsModal(props: {
  diagnostics: RunJSCompileDiagnostic[];
  onCancel: () => void;
  onJump: (diagnostic: RunJSCompileDiagnostic) => void;
  open: boolean;
  t: (key: string) => string;
}) {
  const { diagnostics, onCancel, onJump, open, t } = props;
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
          {diagnostics.length
            ? diagnostics.map((diagnostic, index) => {
                const text = formatCompileDiagnostics([diagnostic]);
                if (!diagnostic.path) {
                  return (
                    <span key={`${diagnostic.code || diagnostic.ruleId || 'diagnostic'}-${index}`}>
                      {text}
                      {index < diagnostics.length - 1 ? '\n\n' : ''}
                    </span>
                  );
                }

                return (
                  <button
                    aria-label={text}
                    key={`${diagnostic.path}-${diagnostic.line || 0}-${diagnostic.column || 0}-${index}`}
                    onClick={() => onJump(diagnostic)}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'block',
                      font: 'inherit',
                      marginBottom: index < diagnostics.length - 1 ? 12 : 0,
                      padding: 0,
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap',
                      width: '100%',
                      wordBreak: 'break-word',
                    }}
                    type="button"
                  >
                    {text}
                  </button>
                );
              })
            : details}
        </pre>
      </Space>
    </Modal>
  );
}

export function CloseConfirmModal(props: {
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

export function RestoreVersionModal(props: {
  commit: RunJSSourceHistoryItem | null;
  loading: boolean;
  onCancel: () => void;
  onRestore: () => void;
  scopeDescription?: string;
  showRestoreSecondaryNote?: boolean;
  t: (key: string) => string;
}) {
  const { commit, loading, onCancel, onRestore, scopeDescription, showRestoreSecondaryNote = true, t } = props;
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
        <Typography.Text strong>
          {t('Target version')}: {version}
        </Typography.Text>
        {commit?.message ? <Typography.Text type="secondary">{commit.message}</Typography.Text> : null}
        <Typography.Text>{t('This will copy files from this version into the editor.')}</Typography.Text>
        {scopeDescription ? <Alert message={scopeDescription} showIcon type="info" /> : null}
        {showRestoreSecondaryNote ? (
          <Typography.Text>{t('It will not create a version until you save.')}</Typography.Text>
        ) : null}
        <Typography.Text>{t('You can review and save after restoring.')}</Typography.Text>
      </Space>
    </Modal>
  );
}

function formatRestoreTitle(version: string, t: (key: string) => string): string {
  return t('Restore {{version}}?').replace('{{version}}', version);
}
