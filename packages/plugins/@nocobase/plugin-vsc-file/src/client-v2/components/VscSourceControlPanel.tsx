/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BranchesOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Empty, Input, List, Space, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { VscDraftFileChange, VscDraftFileRecord } from '../../shared/types';
import {
  useVscFileRepo,
  type VscFileRepoActiveDraftResult,
  type VscFileRepoFileDiffEntry,
  type VscFileRepoFileDiffResult,
  type VscFileRepoPushInput,
  type VscFileRepoPushResult,
} from '../hooks';
import { useT } from '../locale';
import { compareVscPaths, draftRecordsToPushFileChanges, formatVscComponentError, toPushFileChanges } from './utils';

interface LoadDraftStateOptions {
  clearCurrent?: boolean;
}

export interface VscSourceControlPanelProps {
  repoId: string;
  baseCommitId: string | null;
  draftId?: string | null;
  draftFiles?: VscDraftFileChange[];
  onDraftSaved?: (draft: VscFileRepoActiveDraftResult) => void;
  onCommitted?: (result: VscFileRepoPushResult) => void;
  onDiffSelected?: (file: VscFileRepoFileDiffEntry) => void;
}

export function VscSourceControlPanel(props: VscSourceControlPanelProps) {
  const { repoId, baseCommitId, draftId, draftFiles = [], onDraftSaved, onCommitted, onDiffSelected } = props;
  const t = useT();
  const draftStateLoadKey = `${repoId}:${baseCommitId || ''}`;
  const draftStateQueryKey = `${draftStateLoadKey}:${draftId || ''}`;
  const repo = useVscFileRepo();
  const repoRef = useRef(repo);
  const draftSavedRef = useRef(onDraftSaved);
  const committedRef = useRef(onCommitted);
  const loadRequestIdRef = useRef(0);
  const [verifiedDraftId, setVerifiedDraftId] = useState<string | null>(null);
  const [verifiedDraftLoadKey, setVerifiedDraftLoadKey] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<VscFileRepoActiveDraftResult | null>(null);
  const [diffResult, setDiffResult] = useState<VscFileRepoFileDiffResult | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  repoRef.current = repo;
  draftSavedRef.current = onDraftSaved;
  committedRef.current = onCommitted;

  useEffect(() => {
    setVerifiedDraftId(null);
    setVerifiedDraftLoadKey(null);
    setDiffResult(null);
    setActiveDraft(null);
  }, [draftStateQueryKey]);

  const loadDraftState = React.useCallback(
    async (options?: LoadDraftStateOptions) => {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      const loadKey = draftStateLoadKey;
      const queryKey = draftStateQueryKey;
      const shouldClearCurrent = options?.clearCurrent !== false;

      setLoadingDiff(true);
      setError(null);
      if (shouldClearCurrent) {
        setDiffResult(null);
        setActiveDraft(null);
      }
      try {
        const [nextDiff, nextDraft] = await Promise.all([
          repoRef.current.diffDraft({ repoId }),
          repoRef.current.getDraft({ repoId }),
        ]);
        if (
          loadRequestIdRef.current !== requestId ||
          loadKey !== draftStateLoadKey ||
          queryKey !== draftStateQueryKey
        ) {
          return;
        }
        const usableDraft = isActiveDraftForCurrentState(nextDraft, repoId, baseCommitId) ? nextDraft : null;
        setDiffResult(usableDraft || !nextDraft ? nextDiff : null);
        setActiveDraft(usableDraft);
        setVerifiedDraftId(usableDraft?.draft.id || null);
        setVerifiedDraftLoadKey(usableDraft ? loadKey : null);
      } catch (nextError) {
        if (
          loadRequestIdRef.current !== requestId ||
          loadKey !== draftStateLoadKey ||
          queryKey !== draftStateQueryKey
        ) {
          return;
        }
        setError(nextError);
        if (shouldClearCurrent) {
          setDiffResult(null);
          setActiveDraft(null);
        }
      } finally {
        if (loadRequestIdRef.current === requestId) {
          setLoadingDiff(false);
        }
      }
    },
    [baseCommitId, draftStateLoadKey, draftStateQueryKey, repoId],
  );

  useEffect(() => {
    loadDraftState();
  }, [loadDraftState]);

  const localDiffFiles = useMemo<VscFileRepoFileDiffEntry[]>(() => {
    return draftFiles
      .map((file) => {
        const status: VscFileRepoFileDiffEntry['status'] = file.operation === 'delete' ? 'deleted' : 'modified';

        return {
          status,
          path: file.path,
          pathHash: file.path,
          tooLarge: false,
        };
      })
      .sort((left, right) => compareVscPaths(left.path, right.path));
  }, [draftFiles]);

  const persistedDraftFiles = activeDraft?.files || [];
  const displayedFiles = mergeSourceControlFiles(diffResult?.files || [], localDiffFiles);
  const hasLocalChanges = draftFiles.length > 0;
  const commitFiles = mergeDraftCommitFiles(persistedDraftFiles, draftFiles);
  const commitDraftId = verifiedDraftLoadKey === draftStateLoadKey ? verifiedDraftId : null;
  const hasCommitChanges = commitFiles.length > 0;
  const commitDisabled = !hasCommitChanges || !commitMessage.trim();

  const saveDraft = async () => {
    if (!hasLocalChanges) {
      return;
    }

    setSavingDraft(true);
    setError(null);
    try {
      const draft = await repoRef.current.saveDraft({
        repoId,
        baseCommitId,
        files: draftFiles,
      });
      const currentDraft = isActiveDraftForCurrentState(draft, repoId, baseCommitId) ? draft : null;
      setActiveDraft(currentDraft);
      if (currentDraft) {
        setVerifiedDraftId(draft.draft.id);
        setVerifiedDraftLoadKey(draftStateLoadKey);
      } else {
        setVerifiedDraftId(null);
        setVerifiedDraftLoadKey(null);
      }
      draftSavedRef.current?.(draft);
      await loadDraftState({ clearCurrent: false });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setSavingDraft(false);
    }
  };

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
      if (commitDraftId) {
        pushInput.draftId = commitDraftId;
      }

      const result = await repoRef.current.push(pushInput);
      setCommitMessage('');
      setVerifiedDraftId(null);
      setVerifiedDraftLoadKey(null);
      setActiveDraft(null);
      committedRef.current?.(result);
      await loadDraftState();
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
        <Button
          aria-label={t('Refresh changes')}
          icon={<ReloadOutlined />}
          loading={loadingDiff}
          onClick={() => loadDraftState()}
        />
      </Space>

      {error ? (
        <Alert message={formatVscComponentError(error, t('Source control request failed'))} showIcon type="error" />
      ) : null}

      {displayedFiles.length === 0 ? (
        <Empty description={loadingDiff ? t('Loading changes') : t('No changes')} />
      ) : (
        <List
          dataSource={displayedFiles}
          loading={loadingDiff}
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
                description={file.oldPath && file.oldPath !== file.path ? file.oldPath : undefined}
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
      <Space wrap>
        <Button
          aria-label={t('Save draft')}
          disabled={!hasLocalChanges}
          icon={<SaveOutlined />}
          loading={savingDraft}
          onClick={saveDraft}
        >
          {t('Save draft')}
        </Button>
        <Button disabled={commitDisabled} loading={committing} onClick={commitChanges} type="primary">
          {t('Commit')}
        </Button>
      </Space>
    </section>
  );
}

function mergeDraftCommitFiles(persistedFiles: VscDraftFileRecord[], localFiles: VscDraftFileChange[]) {
  const merged = new Map<string, ReturnType<typeof draftRecordsToPushFileChanges>[number]>();

  for (const file of draftRecordsToPushFileChanges(persistedFiles)) {
    merged.set(file.path, file);
  }
  for (const file of toPushFileChanges(localFiles)) {
    merged.set(file.path, file);
  }

  return Array.from(merged.values()).sort((left, right) => compareVscPaths(left.path, right.path));
}

function isActiveDraftForCurrentState(
  draft: VscFileRepoActiveDraftResult | null | undefined,
  repoId: string,
  baseCommitId: string | null,
): draft is VscFileRepoActiveDraftResult {
  return Boolean(draft && draft.draft.repoId === repoId && draft.draft.baseCommitId === baseCommitId);
}

function mergeSourceControlFiles(
  persistedFiles: VscFileRepoFileDiffEntry[],
  localFiles: VscFileRepoFileDiffEntry[],
): VscFileRepoFileDiffEntry[] {
  const merged = new Map<string, VscFileRepoFileDiffEntry>();

  for (const file of persistedFiles) {
    merged.set(file.path, file);
  }
  for (const file of localFiles) {
    merged.set(file.path, file);
  }

  return Array.from(merged.values()).sort((left, right) => compareVscPaths(left.path, right.path));
}
