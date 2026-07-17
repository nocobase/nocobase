/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Descriptions, Drawer, Modal, Popconfirm, Space, Spin, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import type {
  LightExtensionRepoRecord,
  LightExtensionSyncPlan,
  LightExtensionSyncSourceSummary,
} from '../../shared/types';
import {
  getLightExtensionSyncErrorTranslationKey,
  LightExtensionSyncHookError,
  useLightExtensionSync,
} from '../hooks/useLightExtensionSync';
import { useT } from '../locale';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
type SyncOperation = 'testConnection' | 'disconnect' | 'pull' | 'push';

export interface LightExtensionSyncDrawerProps {
  open: boolean;
  repo: LightExtensionRepoRecord;
  onClose: () => void;
  onRepoUpdated: (repo: LightExtensionRepoRecord) => void;
  onSyncSourceChanged: (source: LightExtensionSyncSourceSummary | null) => void;
  configurationPanel?: React.ReactNode;
  onRequestConfigure?: () => void;
}

interface SyncData {
  source: LightExtensionSyncSourceSummary | null;
  plan: LightExtensionSyncPlan;
}

interface RequestIdentity {
  repoId: string;
  version: number;
}

interface ActiveOperation {
  id: symbol;
  name: SyncOperation;
  repoId: string;
}

interface PushConfirmation {
  repoId: string;
  planFingerprint: string;
}

interface StatusContent {
  message: string;
  description: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

function shortRevision(value: string | null): string {
  return value ? value.slice(0, 8) : '-';
}

export function LightExtensionSyncDrawer(props: LightExtensionSyncDrawerProps) {
  const { open, repo, onClose, onRepoUpdated, onSyncSourceChanged, configurationPanel, onRequestConfigure } = props;
  const t = useT();
  const sync = useLightExtensionSync();
  const requestVersionRef = useRef(0);
  const currentOpenRef = useRef(open);
  const currentRepoIdRef = useRef(repo.id);
  const activeOperationRef = useRef<ActiveOperation>();
  currentOpenRef.current = open;
  currentRepoIdRef.current = repo.id;
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [syncData, setSyncData] = useState<SyncData>();
  const [operation, setOperation] = useState<SyncOperation>();
  const [confirmation, setConfirmation] = useState<PushConfirmation>();
  const [errorKey, setErrorKey] = useState<string>();
  const currentPlanRef = useRef<LightExtensionSyncPlan>();
  const confirmationRef = useRef<PushConfirmation>();
  currentPlanRef.current = syncData?.plan;
  confirmationRef.current = confirmation;

  const setSafeError = useCallback((error: unknown) => {
    const code = error instanceof LightExtensionSyncHookError ? error.code : undefined;
    setErrorKey(getLightExtensionSyncErrorTranslationKey(code) || 'Unable to complete sync operation');
  }, []);

  const isCurrentRequest = useCallback(
    (identity: RequestIdentity) =>
      currentOpenRef.current &&
      currentRepoIdRef.current === identity.repoId &&
      requestVersionRef.current === identity.version,
    [],
  );

  const loadSyncData = useCallback(
    async (identity: RequestIdentity) => {
      setLoadState('loading');
      setErrorKey(undefined);
      try {
        await sync.get({ repoId: identity.repoId });
        if (!isCurrentRequest(identity)) {
          return;
        }
        const planResult = await sync.plan({ repoId: identity.repoId });
        if (!isCurrentRequest(identity)) {
          return;
        }
        setSyncData({ source: planResult.source, plan: planResult.plan });
        setLoadState('ready');
      } catch (error) {
        if (!isCurrentRequest(identity)) {
          return;
        }
        setSyncData(undefined);
        setSafeError(error);
        setLoadState('error');
      }
    },
    [isCurrentRequest, setSafeError, sync],
  );

  const refreshPlan = useCallback(
    async (identity: RequestIdentity) => {
      const planResult = await sync.plan({ repoId: identity.repoId });
      if (!isCurrentRequest(identity)) {
        return undefined;
      }
      setSyncData({ source: planResult.source, plan: planResult.plan });
      return planResult;
    },
    [isCurrentRequest, sync],
  );

  const startOperation = useCallback((name: SyncOperation): ActiveOperation | undefined => {
    if (activeOperationRef.current) {
      return undefined;
    }
    const activeOperation = { id: Symbol(name), name, repoId: currentRepoIdRef.current };
    activeOperationRef.current = activeOperation;
    setOperation(name);
    return activeOperation;
  }, []);

  const finishOperation = useCallback((activeOperation: ActiveOperation) => {
    if (activeOperationRef.current?.id !== activeOperation.id) {
      return;
    }
    activeOperationRef.current = undefined;
    setOperation(undefined);
  }, []);

  useEffect(() => {
    requestVersionRef.current += 1;
    const identity = { repoId: currentRepoIdRef.current, version: requestVersionRef.current };
    if (!open) {
      setLoadState('idle');
      setSyncData(undefined);
      setErrorKey(undefined);
      setConfirmation(undefined);
      return;
    }
    loadSyncData(identity);
  }, [loadSyncData, open, repo.id]);

  useEffect(() => {
    setConfirmation((current) => {
      if (!current || (open && current.repoId === repo.id && current.planFingerprint === syncData?.plan.fingerprint)) {
        return current;
      }
      return undefined;
    });
  }, [open, repo.id, syncData?.plan.fingerprint]);

  const runTestConnection = useCallback(async () => {
    const activeOperation = startOperation('testConnection');
    if (!activeOperation) {
      return;
    }
    const identity = { repoId: currentRepoIdRef.current, version: requestVersionRef.current };
    setErrorKey(undefined);
    try {
      await sync.testConnection({ repoId: identity.repoId });
      if (!isCurrentRequest(identity)) {
        return;
      }
      await refreshPlan(identity);
    } catch (error) {
      if (isCurrentRequest(identity)) {
        setSafeError(error);
      }
    } finally {
      finishOperation(activeOperation);
    }
  }, [finishOperation, isCurrentRequest, refreshPlan, setSafeError, startOperation, sync]);

  const runDisconnect = useCallback(async () => {
    const activeOperation = startOperation('disconnect');
    if (!activeOperation) {
      return;
    }
    const identity = { repoId: currentRepoIdRef.current, version: requestVersionRef.current };
    setErrorKey(undefined);
    try {
      await sync.disconnect({ repoId: identity.repoId });
      if (!isCurrentRequest(identity)) {
        return;
      }
      onSyncSourceChanged(null);
      await refreshPlan(identity);
    } catch (error) {
      if (isCurrentRequest(identity)) {
        setSafeError(error);
      }
    } finally {
      finishOperation(activeOperation);
    }
  }, [finishOperation, isCurrentRequest, onSyncSourceChanged, refreshPlan, setSafeError, startOperation, sync]);

  const runSyncOperation = useCallback(
    async (nextOperation: 'pull' | 'push') => {
      const plan = currentPlanRef.current;
      if (!plan || plan.remoteTargetVersion === null || (nextOperation === 'pull' ? !plan.canPull : !plan.canPush)) {
        return;
      }
      const activeOperation = startOperation(nextOperation);
      if (!activeOperation) {
        return;
      }
      const identity = { repoId: currentRepoIdRef.current, version: requestVersionRef.current };
      setErrorKey(undefined);
      try {
        const result = await sync[nextOperation]({
          repoId: identity.repoId,
          expectedHeadCommitId: plan.local.headCommitId,
          expectedRemoteRevision: plan.remote.revision,
          expectedRemoteTargetVersion: plan.remoteTargetVersion,
          planFingerprint: plan.fingerprint,
        });
        if (!isCurrentRequest(identity)) {
          return;
        }
        onRepoUpdated(result.repo);
        onSyncSourceChanged(result.source);
        setSyncData({ source: result.source, plan: result.plan });
        await refreshPlan(identity);
      } catch (error) {
        if (isCurrentRequest(identity)) {
          setSafeError(error);
        }
      } finally {
        finishOperation(activeOperation);
      }
    },
    [
      finishOperation,
      isCurrentRequest,
      onRepoUpdated,
      onSyncSourceChanged,
      refreshPlan,
      setSafeError,
      startOperation,
      sync,
    ],
  );

  const confirmPush = useCallback(() => {
    const plan = currentPlanRef.current;
    if (activeOperationRef.current || !plan?.canPush) {
      return;
    }
    setConfirmation({ repoId: currentRepoIdRef.current, planFingerprint: plan.fingerprint });
  }, []);

  const confirmPushOperation = useCallback(async () => {
    const currentConfirmation = confirmationRef.current;
    const plan = currentPlanRef.current;
    if (
      !currentConfirmation ||
      !plan?.canPush ||
      currentConfirmation.repoId !== currentRepoIdRef.current ||
      currentConfirmation.planFingerprint !== plan.fingerprint
    ) {
      setConfirmation(undefined);
      return;
    }
    await runSyncOperation('push');
    setConfirmation(undefined);
  }, [runSyncOperation]);

  const source = syncData?.source;
  const plan = syncData?.plan;
  const status = plan ? getStatusContent(plan, t) : undefined;
  const currentRepoOperation = activeOperationRef.current?.repoId === repo.id ? operation : undefined;
  const actionsDisabled = Boolean(operation || activeOperationRef.current) || loadState !== 'ready';
  const canPull = Boolean(plan?.canPull && plan.remoteTargetVersion !== null) && !actionsDisabled;
  const canPush = Boolean(plan?.canPush && plan.remoteTargetVersion !== null) && !actionsDisabled;

  return (
    <>
      <Drawer
        aria-label={t('Sync code')}
        destroyOnHidden
        onClose={onClose}
        open={open}
        title={t('Sync code')}
        width={560}
      >
        <Spin spinning={loadState === 'loading'} tip={t('Loading sync status')}>
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            {errorKey ? (
              <Alert description={t(errorKey)} message={t('Sync failed')} role="alert" showIcon type="error" />
            ) : null}

            {loadState === 'error' ? (
              <Button
                onClick={() =>
                  loadSyncData({
                    repoId: repo.id,
                    version: ++requestVersionRef.current,
                  })
                }
              >
                {t('Retry')}
              </Button>
            ) : null}

            {loadState === 'ready' && plan?.state === 'unconfigured' ? (
              <>
                <Alert
                  description={t('Connect this light extension to a GitHub repository to sync its code.')}
                  message={t('Sync source is not configured')}
                  role="alert"
                  showIcon
                  type="info"
                />
                {configurationPanel ??
                  (onRequestConfigure ? (
                    <Button onClick={onRequestConfigure} type="primary">
                      {t('Configure')}
                    </Button>
                  ) : null)}
              </>
            ) : null}

            {loadState === 'ready' && source && plan ? (
              <>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t('Provider')}>GitHub</Descriptions.Item>
                  <Descriptions.Item label={t('Repository')}>
                    {source.config.owner}/{source.config.repository}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Branch')}>
                    {source.config.branch || t('Default branch')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Subdirectory')}>
                    {source.config.subdirectory || t('Repository root')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Credential')}>
                    {source.credentialConfigured ? (
                      <Space size="small">
                        <Tag color="success">{t('Configured')}</Tag>
                        {source.authRefDisplay ? <Typography.Text code>{source.authRefDisplay}</Typography.Text> : null}
                      </Space>
                    ) : (
                      <Tag>{t('Not configured')}</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Last synced at')}>
                    {source.lastSyncedAt ? (
                      <time dateTime={source.lastSyncedAt}>{new Date(source.lastSyncedAt).toLocaleString()}</time>
                    ) : (
                      t('Never')
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Local Head')}>
                    <Typography.Text code>{shortRevision(plan.local.headCommitId)}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Remote revision')}>
                    <Typography.Text code>{shortRevision(plan.remote.revision)}</Typography.Text>
                  </Descriptions.Item>
                </Descriptions>

                {status ? (
                  <Alert
                    description={status.description}
                    message={status.message}
                    role="alert"
                    showIcon
                    type={status.type}
                  />
                ) : null}

                <Space wrap>
                  <Button
                    disabled={actionsDisabled}
                    loading={currentRepoOperation === 'testConnection'}
                    onClick={runTestConnection}
                  >
                    {t('Test connection')}
                  </Button>
                  <Button
                    disabled={!canPull}
                    loading={currentRepoOperation === 'pull'}
                    onClick={() => runSyncOperation('pull')}
                  >
                    {t('Pull from Git')}
                  </Button>
                  <Button
                    disabled={!canPush}
                    loading={currentRepoOperation === 'push'}
                    onClick={confirmPush}
                    type="primary"
                  >
                    {t('Push to Git')}
                  </Button>
                  <Popconfirm
                    cancelText={t('Cancel')}
                    description={t('The saved sync source will be removed from this light extension.')}
                    disabled={actionsDisabled}
                    okText={t('Disconnect')}
                    onConfirm={runDisconnect}
                    title={t('Disconnect sync source?')}
                  >
                    <Button danger disabled={actionsDisabled} loading={currentRepoOperation === 'disconnect'}>
                      {t('Disconnect')}
                    </Button>
                  </Popconfirm>
                </Space>
              </>
            ) : null}
          </Space>
        </Spin>
      </Drawer>
      <Modal
        aria-label={t('Push changes to GitHub?')}
        cancelText={t('Cancel')}
        confirmLoading={currentRepoOperation === 'push'}
        okText={t('Push to Git')}
        onCancel={() => setConfirmation(undefined)}
        onOk={confirmPushOperation}
        open={Boolean(
          confirmation &&
            confirmation.repoId === repo.id &&
            confirmation.planFingerprint === syncData?.plan.fingerprint,
        )}
        title={t('Push changes to GitHub?')}
      >
        <Typography.Paragraph>{t('This will modify the remote branch and will not force push.')}</Typography.Paragraph>
      </Modal>
    </>
  );
}

function getStatusContent(plan: LightExtensionSyncPlan, t: ReturnType<typeof useT>): StatusContent {
  if (plan.reasonCode === 'initial-ambiguous') {
    return {
      message: t('Initial sync needs a clear source'),
      description: t(
        'Local and remote content differ. Create from GitHub instead, or configure an empty branch or subdirectory before syncing.',
      ),
      type: 'warning',
    };
  }

  if (plan.state === 'in-sync') {
    return { message: t('In sync'), description: t('Local and remote code match.'), type: 'success' };
  }
  if (plan.state === 'local-ahead') {
    return { message: t('Local changes'), description: t('Local code can be pushed to GitHub.'), type: 'info' };
  }
  if (plan.state === 'remote-ahead') {
    return {
      message: t('Remote changes'),
      description: t('Remote code can be pulled into this light extension.'),
      type: 'info',
    };
  }
  if (plan.state === 'diverged') {
    return {
      message: t('Diverged'),
      description: t('Local and remote code both changed. Resolve the divergence outside this sync screen.'),
      type: 'warning',
    };
  }
  if (plan.state === 'error') {
    const errorKey = getLightExtensionSyncErrorTranslationKey(plan.reasonCode);
    return {
      message: t('Sync unavailable'),
      description: t(errorKey || 'The sync plan could not be loaded safely.'),
      type: 'error',
    };
  }
  return {
    message: t('Sync source is not configured'),
    description: t('Connect this light extension to a GitHub repository to sync its code.'),
    type: 'info',
  };
}

export default LightExtensionSyncDrawer;
