/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CodeEditor } from '@nocobase/client-v2';
import { Alert, Empty, Spin, Tabs, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { VscFileChange } from '../../shared/types';
import { useVscFileRepo } from '../hooks';
import { useT } from '../locale';
import { compareVscPaths, formatVscComponentError, uniquePaths } from './utils';

function NoEditorExtras() {
  return null;
}

interface EditorFileState {
  path: string;
  loadKey: string;
  content: string;
  editedContent: string;
  language?: string;
  loading: boolean;
  error?: unknown;
}

export interface VscEditorTabsProps {
  repoId: string;
  baseCommitId: string | null;
  openPaths: string[];
  refName?: string;
  activePath?: string;
  onActivePathChange?: (path: string) => void;
  onDirtyFilesChange?: (files: VscFileChange[]) => void;
}

export function VscEditorTabs(props: VscEditorTabsProps) {
  const { repoId, baseCommitId, openPaths, refName, activePath, onActivePathChange, onDirtyFilesChange } = props;
  const t = useT();
  const repo = useVscFileRepo();
  const repoRef = useRef(repo);
  const dirtyCallbackRef = useRef(onDirtyFilesChange);
  const requestedLoadKeysRef = useRef<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, EditorFileState>>({});

  repoRef.current = repo;
  dirtyCallbackRef.current = onDirtyFilesChange;

  const normalizedOpenPaths = useMemo(() => uniquePaths(openPaths), [openPaths]);
  const currentActivePath =
    activePath && normalizedOpenPaths.includes(activePath) ? activePath : normalizedOpenPaths[0];
  const fileLoadKey = `${repoId}:${refName || ''}:${baseCommitId || ''}`;

  useEffect(() => {
    const openPathSet = new Set(normalizedOpenPaths);
    for (const path of Object.keys(requestedLoadKeysRef.current)) {
      if (!openPathSet.has(path) || requestedLoadKeysRef.current[path] !== fileLoadKey) {
        delete requestedLoadKeysRef.current[path];
      }
    }

    setFiles((current) => {
      const next: Record<string, EditorFileState> = {};
      for (const path of normalizedOpenPaths) {
        if (current[path]?.loadKey === fileLoadKey) {
          next[path] = current[path];
        }
      }
      return next;
    });
  }, [fileLoadKey, normalizedOpenPaths]);

  useEffect(() => {
    let active = true;

    const loadMissingFiles = async () => {
      for (const path of normalizedOpenPaths) {
        if (requestedLoadKeysRef.current[path] === fileLoadKey) {
          continue;
        }

        requestedLoadKeysRef.current[path] = fileLoadKey;
        setFiles((nextFiles) => ({
          ...nextFiles,
          [path]: {
            path,
            loadKey: fileLoadKey,
            content: '',
            editedContent: '',
            loading: true,
          },
        }));

        try {
          const file = await repoRef.current.getFile({
            repoId,
            ref: refName,
            path,
          });
          if (!active) {
            return;
          }

          setFiles((nextFiles) => ({
            ...nextFiles,
            [path]: {
              path,
              loadKey: fileLoadKey,
              content: file.content,
              editedContent: file.content,
              language: file.language,
              loading: false,
            },
          }));
        } catch (error) {
          if (!active) {
            return;
          }

          setFiles((nextFiles) => ({
            ...nextFiles,
            [path]: {
              path,
              loadKey: fileLoadKey,
              content: '',
              editedContent: '',
              loading: false,
              error,
            },
          }));
        }
      }
    };

    loadMissingFiles();

    return () => {
      active = false;
    };
  }, [fileLoadKey, normalizedOpenPaths, refName, repoId]);

  const dirtyFiles = useMemo(() => {
    return Object.values(files)
      .filter((file) => !file.loading && !file.error && file.editedContent !== file.content)
      .sort((left, right) => compareVscPaths(left.path, right.path))
      .map((file) => ({
        path: file.path,
        operation: 'upsert' as const,
        content: file.editedContent,
      }));
  }, [files]);

  useEffect(() => {
    dirtyCallbackRef.current?.(dirtyFiles);
  }, [dirtyFiles]);

  const handleContentChange = (path: string, value: string) => {
    setFiles((current) => {
      const file = current[path];
      if (!file) {
        return current;
      }

      return {
        ...current,
        [path]: {
          ...file,
          editedContent: value,
        },
      };
    });
  };

  const activeFile = currentActivePath ? files[currentActivePath] : undefined;

  if (normalizedOpenPaths.length === 0) {
    return <Empty description={t('No open files')} />;
  }

  return (
    <section aria-label={t('Editor')} style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      <Typography.Text strong>{t('Editor')}</Typography.Text>

      <Tabs
        activeKey={currentActivePath}
        items={normalizedOpenPaths.map((path) => {
          const file = files[path];
          const dirty = Boolean(file && file.editedContent !== file.content);
          return {
            key: path,
            label: dirty ? `${path} *` : path,
            children: null,
          };
        })}
        onChange={onActivePathChange}
      />

      {activeFile?.loading || !activeFile ? (
        <div aria-live="polite" role="status" style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>{t('Loading file')}</Typography.Text>
        </div>
      ) : null}

      {activeFile?.error ? (
        <Alert message={formatVscComponentError(activeFile.error, t('Failed to load file'))} showIcon type="error" />
      ) : null}

      {activeFile && !activeFile.loading && !activeFile.error ? (
        <CodeEditor
          height={360}
          language={activeFile.language || 'text'}
          onChange={(value) => handleContentChange(activeFile.path, value)}
          placeholder={t('Edit file content')}
          RightExtra={NoEditorExtras}
          showLogs={false}
          value={activeFile.editedContent}
        />
      ) : null}
    </section>
  );
}
