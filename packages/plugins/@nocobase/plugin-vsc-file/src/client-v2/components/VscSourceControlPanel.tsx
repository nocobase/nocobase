/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BranchesOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Empty, Input, List, Space, Tag, Typography } from 'antd';
import React, { useMemo, useRef, useState } from 'react';

import type { VscFileChange } from '../../shared/types';
import {
  useVscFileRepo,
  type VscFileRepoFileDiffEntry,
  type VscFileRepoPushInput,
  type VscFileRepoPushResult,
} from '../hooks';
import { useT } from '../locale';
import { compareVscPaths, formatVscComponentError, toPushFileChanges } from './utils';

export interface VscSourceControlPanelProps {
  repoId: string;
  baseCommitId: string | null;
  files?: VscFileChange[];
  onCommitted?: (result: VscFileRepoPushResult) => void;
  onDiffSelected?: (file: VscFileRepoFileDiffEntry) => void;
}

export function VscSourceControlPanel(props: VscSourceControlPanelProps) {
  const { repoId, baseCommitId, files = [], onCommitted, onDiffSelected } = props;
  const t = useT();
  const repo = useVscFileRepo();
  const repoRef = useRef(repo);
  const committedRef = useRef(onCommitted);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  repoRef.current = repo;
  committedRef.current = onCommitted;

  const commitFiles = useMemo(() => toPushFileChanges(files), [files]);
  const displayedFiles = useMemo<VscFileRepoFileDiffEntry[]>(
    () =>
      commitFiles
        .map((file) => ({
          status: file.operation === 'delete' ? ('deleted' as const) : ('modified' as const),
          path: file.path,
          pathHash: file.path,
          language: file.language,
          mode: file.mode,
          tooLarge: false,
        }))
        .sort((left, right) => compareVscPaths(left.path, right.path)),
    [commitFiles],
  );
  const commitDisabled = commitFiles.length === 0 || !commitMessage.trim();

  const commitChanges = async () => {
    if (commitDisabled) {
      return;
    }

    setCommitting(true);
    setError(null);
    try {
      const pushInput: VscFileRepoPushInput = {
        repoId,
        baseCommitId,
        message: commitMessage.trim(),
        files: commitFiles,
      };
      const result = await repoRef.current.push(pushInput);
      setCommitMessage('');
      committedRef.current?.(result);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <section aria-label={t('Source control')} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space style={{ justifyContent: 'space-between' }}>
        <Space>
          <BranchesOutlined />
          <Typography.Text strong>{t('Source control')}</Typography.Text>
          <Badge count={displayedFiles.length} size="small" />
        </Space>
      </Space>

      {error ? (
        <Alert message={formatVscComponentError(error, t('Source control request failed'))} showIcon type="error" />
      ) : null}

      {displayedFiles.length === 0 ? (
        <Empty description={t('No changes')} />
      ) : (
        <List
          dataSource={displayedFiles}
          rowKey={(file) => `${file.status}:${file.path}`}
          size="small"
          renderItem={(file) => (
            <List.Item
              actions={[
                <Button key="diff" onClick={() => onDiffSelected?.(file)} size="small" type="link">
                  {t('View diff')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag>{t(file.status)}</Tag>
                    <span>{file.path}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Input.TextArea
        aria-label={t('Commit message')}
        onChange={(event) => setCommitMessage(event.target.value)}
        placeholder={t('Commit message')}
        value={commitMessage}
      />
      <Button disabled={commitDisabled} loading={committing} onClick={commitChanges} type="primary">
        {t('Commit')}
      </Button>
    </section>
  );
}
