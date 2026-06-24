/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined, RollbackOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Popconfirm, Space, Spin, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

import { useVscFileRepo, type VscFileRepoDiffFileEndpoint, type VscFileRepoDiffFileResult } from '../hooks';
import { useT } from '../locale';
import { formatVscComponentError } from './utils';

export interface VscDiffViewerProps {
  repoId: string;
  from?: VscFileRepoDiffFileEndpoint | null;
  to?: VscFileRepoDiffFileEndpoint | null;
  restoreSourceCommitId?: string;
  restorePath?: string;
  onFileRestored?: () => void;
}

export function VscDiffViewer(props: VscDiffViewerProps) {
  const { repoId, from, to, restoreSourceCommitId, restorePath, onFileRestored } = props;
  const t = useT();
  const repo = useVscFileRepo();
  const repoRef = useRef(repo);
  const restoredRef = useRef(onFileRestored);
  const requestIdRef = useRef(0);
  const [diff, setDiff] = useState<VscFileRepoDiffFileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<unknown>(null);

  repoRef.current = repo;
  restoredRef.current = onFileRestored;

  const loadDiff = React.useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!from && !to) {
      setError(null);
      setDiff(null);
      setLoading(false);
      return;
    }

    setDiff(null);
    setLoading(true);
    setError(null);
    try {
      const nextDiff = await repoRef.current.diffFile({
        repoId,
        from,
        to,
      });
      if (requestIdRef.current !== requestId) {
        return;
      }
      setDiff(nextDiff);
    } catch (nextError) {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setError(nextError);
      setDiff(null);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [from, repoId, to]);

  useEffect(() => {
    loadDiff();
  }, [loadDiff]);

  const restoreFile = async () => {
    if (!restoreSourceCommitId || !restorePath) {
      return;
    }

    setRestoring(true);
    setError(null);
    try {
      await repoRef.current.restoreFile({
        repoId,
        sourceCommitId: restoreSourceCommitId,
        path: restorePath,
      });
      restoredRef.current?.();
      await loadDiff();
    } catch (nextError) {
      setError(nextError);
    } finally {
      setRestoring(false);
    }
  };

  const canRestore = Boolean(restoreSourceCommitId && restorePath);
  const hasNoChanges = Boolean(diff && !diff.tooLarge && diff.hunks.length === 0);

  return (
    <section aria-label={t('Diff')} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space style={{ justifyContent: 'space-between' }}>
        <Typography.Text strong>{t('Diff')}</Typography.Text>
        <Space>
          <Button aria-label={t('Refresh diff')} icon={<ReloadOutlined />} loading={loading} onClick={loadDiff} />
          {canRestore ? (
            <Popconfirm
              cancelText={t('Cancel')}
              okText={t('Restore')}
              onConfirm={restoreFile}
              title={t('Restore this file?')}
            >
              <Button aria-label={t('Restore file')} icon={<RollbackOutlined />} loading={restoring}>
                {t('Restore file')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      </Space>

      {error ? (
        <Alert message={formatVscComponentError(error, t('Failed to load diff'))} showIcon type="error" />
      ) : null}

      {!from && !to ? <Empty description={t('Select a file to view diff')} /> : null}

      {loading ? (
        <div aria-live="polite" role="status" style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>{t('Loading diff')}</Typography.Text>
        </div>
      ) : null}

      {diff?.tooLarge ? <Alert message={t('Diff is too large to render')} showIcon type="warning" /> : null}

      {hasNoChanges ? <Empty description={t('No changes')} /> : null}

      {!loading && diff && !diff.tooLarge && diff.hunks.length > 0 ? (
        <pre
          aria-label={t('Diff output')}
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            margin: 0,
            overflow: 'auto',
            padding: 12,
          }}
        >
          {diff.hunks
            .flatMap((hunk) => hunk.lines)
            .map((line) => `${line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : ' '} ${line.content}`)
            .join('\n')}
        </pre>
      ) : null}
    </section>
  );
}
