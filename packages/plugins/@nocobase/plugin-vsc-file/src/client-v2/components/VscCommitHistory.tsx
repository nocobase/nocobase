/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined, RollbackOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Popconfirm, Space, Table, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

import type { VscCommitRecord } from '../../shared/types';
import { useVscFileRepo, type VscFileRepoRestoreResult } from '../hooks';
import { useT } from '../locale';
import { formatVscComponentError } from './utils';

export interface VscCommitHistoryProps {
  repoId: string;
  selectedCommitId?: string | null;
  onCommitSelected?: (commit: VscCommitRecord) => void;
  onCommitRestored?: (result: VscFileRepoRestoreResult) => void;
}

export function VscCommitHistory(props: VscCommitHistoryProps) {
  const { repoId, selectedCommitId, onCommitSelected, onCommitRestored } = props;
  const t = useT();
  const repo = useVscFileRepo();
  const repoRef = useRef(repo);
  const restoredRef = useRef(onCommitRestored);
  const requestIdRef = useRef(0);
  const [commits, setCommits] = useState<VscCommitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringCommitId, setRestoringCommitId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  repoRef.current = repo;
  restoredRef.current = onCommitRestored;

  const loadCommits = React.useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setCommits([]);
    try {
      const nextCommits = await repoRef.current.listCommits({ repoId });
      if (requestIdRef.current !== requestId) {
        return;
      }
      setCommits(nextCommits);
    } catch (nextError) {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setError(nextError);
      setCommits([]);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [repoId]);

  useEffect(() => {
    loadCommits();
  }, [loadCommits]);

  const restoreCommit = async (commit: VscCommitRecord) => {
    setRestoringCommitId(commit.id);
    setError(null);
    try {
      const result = await repoRef.current.restoreCommit({
        repoId,
        sourceCommitId: commit.id,
      });
      restoredRef.current?.(result);
      await loadCommits();
    } catch (nextError) {
      setError(nextError);
    } finally {
      setRestoringCommitId(null);
    }
  };

  return (
    <section aria-label={t('Commit history')} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space style={{ justifyContent: 'space-between' }}>
        <Typography.Text strong>{t('Commit history')}</Typography.Text>
        <Button
          aria-label={t('Refresh commits')}
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={loadCommits}
          size="small"
        />
      </Space>

      {error ? (
        <Alert message={formatVscComponentError(error, t('Failed to load commit history'))} showIcon type="error" />
      ) : null}

      {!loading && commits.length === 0 ? <Empty description={t('No commits')} /> : null}

      <Table<VscCommitRecord>
        columns={[
          {
            title: t('Seq'),
            dataIndex: 'seq',
            width: 80,
          },
          {
            title: t('Message'),
            dataIndex: 'message',
            render: (message, commit) => (
              <Button
                aria-current={selectedCommitId === commit.id ? 'true' : undefined}
                onClick={() => onCommitSelected?.(commit)}
                type="link"
              >
                {message}
              </Button>
            ),
          },
          {
            title: t('Actions'),
            key: 'actions',
            render: (_, commit) => (
              <Popconfirm
                cancelText={t('Cancel')}
                okText={t('Restore')}
                onConfirm={() => restoreCommit(commit)}
                title={t('Restore this commit?')}
              >
                <Button
                  aria-label={`${t('Restore commit')} ${commit.seq}`}
                  icon={<RollbackOutlined />}
                  loading={restoringCommitId === commit.id}
                  size="small"
                >
                  {t('Restore commit')}
                </Button>
              </Popconfirm>
            ),
          },
        ]}
        dataSource={commits}
        loading={loading}
        onRow={(commit) => ({
          'aria-selected': selectedCommitId === commit.id,
        })}
        pagination={false}
        rowKey="id"
        size="small"
      />
    </section>
  );
}
