/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, List, Space, Spin, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { VscRefName } from '../../shared/types';
import { useVscFileRepo, type VscFileRepoPulledFile, type VscFileRepoPullResult } from '../hooks';
import { useT } from '../locale';
import { compareVscPaths, formatVscComponentError } from './utils';

export interface VscFileExplorerProps {
  repoId: string;
  refName?: VscRefName;
  selectedPath?: string;
  onFileOpen?: (file: VscFileRepoPulledFile) => void;
  onPulled?: (result: VscFileRepoPullResult) => void;
}

export function VscFileExplorer(props: VscFileExplorerProps) {
  const { repoId, refName, selectedPath, onFileOpen, onPulled } = props;
  const t = useT();
  const repo = useVscFileRepo();
  const repoRef = useRef(repo);
  const onPulledRef = useRef(onPulled);
  const requestIdRef = useRef(0);
  const [files, setFiles] = useState<VscFileRepoPulledFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  repoRef.current = repo;
  onPulledRef.current = onPulled;

  const sortedFiles = useMemo(() => [...files].sort((left, right) => compareVscPaths(left.path, right.path)), [files]);

  const loadFiles = React.useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setFiles([]);
    try {
      const result = await repoRef.current.pull({
        repoId,
        ref: refName,
        includeContent: 'none',
      });
      if (requestIdRef.current !== requestId) {
        return;
      }
      setFiles(result.files || []);
      onPulledRef.current?.(result);
    } catch (nextError) {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setError(nextError);
      setFiles([]);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [refName, repoId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <section aria-label={t('Files')} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space style={{ justifyContent: 'space-between' }}>
        <Typography.Text strong>{t('Files')}</Typography.Text>
        <Button
          aria-label={t('Refresh files')}
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={loadFiles}
          size="small"
        />
      </Space>

      {error ? (
        <Alert message={formatVscComponentError(error, t('Failed to load files'))} showIcon type="error" />
      ) : null}

      {loading ? (
        <div aria-live="polite" role="status" style={{ padding: 16, textAlign: 'center' }}>
          <Spin />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>{t('Loading files')}</Typography.Text>
        </div>
      ) : null}

      {!loading && !error && sortedFiles.length === 0 ? <Empty description={t('Empty repository')} /> : null}

      {!loading && !error && sortedFiles.length > 0 ? (
        <List
          dataSource={sortedFiles}
          rowKey="path"
          size="small"
          renderItem={(file) => (
            <List.Item style={{ paddingInline: 0 }}>
              <Button
                aria-pressed={selectedPath === file.path}
                aria-label={file.path}
                block
                icon={<FileTextOutlined />}
                onClick={() => onFileOpen?.(file)}
                style={{ justifyContent: 'flex-start' }}
                type={selectedPath === file.path ? 'primary' : 'text'}
              >
                {file.path}
              </Button>
            </List.Item>
          )}
        />
      ) : null}
    </section>
  );
}
