/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useACLRoleContext } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Alert, Button, Empty, Flex, Modal, Result, Space, Table, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RcFile } from 'rc-upload/lib/interface';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionClientAppDescriptor,
  LightExtensionClientAppReference,
} from '../api/lightExtensionClientAppsRequests';
import {
  deleteLightExtensionClientApp,
  listLightExtensionClientApps,
  uploadLightExtensionClientApp,
} from '../api/lightExtensionClientAppsRequests';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';

interface LightExtensionClientAppsPanelProps {
  repoId: string;
}

const ACTION_BUTTON_STYLE: React.CSSProperties = { height: 'auto', paddingInline: 0 };

export function LightExtensionClientAppsPanel({ repoId }: LightExtensionClientAppsPanelProps) {
  const { t } = useTranslation(NAMESPACE);
  const { parseAction } = useACLRoleContext();
  const { api } = useFlowContext() as { api: ApiClientLike };
  const canUpload = isAllowedAction(parseAction('lightExtensionClientApps:upload'));
  const canDelete = isAllowedAction(parseAction('lightExtensionClientApps:delete'));
  const {
    data: apps = [],
    loading,
    error: loadError,
    refresh: loadApps,
    mutate: setApps,
  } = useRequest(() => listLightExtensionClientApps(api, repoId), { refreshDeps: [repoId] });
  const { loading: uploading, runAsync: uploadApp } = useRequest(
    (file: File, expectedEntryId?: string) => uploadLightExtensionClientApp(api, repoId, file, expectedEntryId),
    { manual: true },
  );
  const { loading: removing, runAsync: deleteApp } = useRequest(
    (entryId: string) => deleteLightExtensionClientApp(api, entryId),
    { manual: true },
  );
  const [notice, setNotice] = useState<string>();
  const [uploadTarget, setUploadTarget] = useState<LightExtensionClientAppDescriptor | null>();
  const [uploadFile, setUploadFile] = useState<RcFile>();
  const [uploadError, setUploadError] = useState<string>();
  const [removeTarget, setRemoveTarget] = useState<LightExtensionClientAppDescriptor>();
  const [removeReferences, setRemoveReferences] = useState<LightExtensionClientAppReference[]>([]);
  const [removeError, setRemoveError] = useState<string>();

  const openUpload = useCallback((target: LightExtensionClientAppDescriptor | null) => {
    setUploadTarget(target);
    setUploadFile(undefined);
    setUploadError(undefined);
  }, []);

  const closeUpload = useCallback(() => {
    if (uploading) {
      return;
    }
    setUploadTarget(undefined);
    setUploadFile(undefined);
    setUploadError(undefined);
  }, [uploading]);

  const selectUploadFile = useCallback(
    (file: RcFile) => {
      if (!isZipFile(file)) {
        setUploadFile(undefined);
        setUploadError(t('Select a ZIP file'));
        return false;
      }
      setUploadFile(file);
      setUploadError(undefined);
      return false;
    },
    [t],
  );

  const submitUpload = useCallback(async () => {
    if (!uploadFile) {
      setUploadError(t('Select a ZIP file'));
      return;
    }
    setUploadError(undefined);
    try {
      const updatedApp = await uploadApp(uploadFile, uploadTarget?.entryId);
      setApps((current = []) => [updatedApp, ...current.filter((app) => app.entryId !== updatedApp.entryId)]);
      setNotice(
        uploadTarget ? t('Light extension application files replaced') : t('Light extension application uploaded'),
      );
      setUploadTarget(undefined);
      setUploadFile(undefined);
    } catch (error) {
      setUploadError(getClientAppErrorMessage(error, t));
    }
  }, [setApps, t, uploadApp, uploadFile, uploadTarget]);

  const closeRemove = useCallback(() => {
    if (removing) {
      return;
    }
    setRemoveTarget(undefined);
    setRemoveReferences([]);
    setRemoveError(undefined);
  }, [removing]);

  const confirmRemove = useCallback(async () => {
    if (!removeTarget) {
      return;
    }
    setRemoveError(undefined);
    try {
      await deleteApp(removeTarget.entryId);
      setApps((current = []) => current.filter((app) => app.entryId !== removeTarget.entryId));
      setRemoveTarget(undefined);
      setRemoveReferences([]);
      setNotice(t('Light extension application removed'));
    } catch (error) {
      setRemoveReferences(getErrorReferences(error));
      setRemoveError(getClientAppErrorMessage(error, t));
    }
  }, [deleteApp, removeTarget, setApps, t]);

  const columns = useMemo<ColumnsType<LightExtensionClientAppDescriptor>>(
    () => [
      {
        title: t('Application'),
        key: 'application',
        width: 230,
        render: (_value, app) => (
          <Space direction="vertical" size={0} style={{ maxWidth: 210, minWidth: 0 }}>
            <Typography.Text ellipsis strong style={{ maxWidth: 210 }}>
              {app.title || app.key}
            </Typography.Text>
            <Typography.Text code ellipsis style={{ maxWidth: 210 }} type="secondary">
              {app.key}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Entry HTML'),
        dataIndex: 'entryHtml',
        width: 200,
        render: (entryHtml: string) => (
          <Typography.Text code ellipsis={{ tooltip: entryHtml }} style={{ maxWidth: 180 }}>
            {entryHtml}
          </Typography.Text>
        ),
      },
      {
        title: t('Files'),
        key: 'files',
        width: 150,
        render: (_value, app) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{t('{{count}} files').replace('{{count}}', String(app.fileCount))}</Typography.Text>
            <Typography.Text type="secondary">{formatByteSize(app.byteSize)}</Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Updated at'),
        dataIndex: 'updatedAt',
        width: 180,
        render: (updatedAt: string | null) => formatDate(updatedAt),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 190,
        render: (_value, app) => {
          return (
            <Space size="small">
              {canUpload ? (
                <Button
                  aria-label={`${t('Replace files')} ${app.title || app.key}`}
                  onClick={() => openUpload(app)}
                  size="small"
                  style={ACTION_BUTTON_STYLE}
                  type="link"
                >
                  {t('Replace files')}
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  aria-label={`${t('Remove application')} ${app.title || app.key}`}
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setRemoveError(undefined);
                    setRemoveReferences([]);
                    setRemoveTarget(app);
                  }}
                  size="small"
                  style={ACTION_BUTTON_STYLE}
                  type="link"
                >
                  {t('Remove')}
                </Button>
              ) : null}
            </Space>
          );
        },
      },
    ],
    [canDelete, canUpload, openUpload, t],
  );

  if (loadError) {
    const error = getClientAppError(loadError);
    const permissionDenied = error.code === 'LIGHT_EXTENSION_PERMISSION_DENIED' || error.status === 403;
    return (
      <Result
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadApps}>
            {t('Retry')}
          </Button>
        }
        status={permissionDenied ? '403' : 'error'}
        subTitle={permissionDenied ? t('You do not have permission to manage light extension applications') : undefined}
        title={permissionDenied ? t('Access denied') : t('Failed to load light extension applications')}
      />
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      {notice ? (
        <Alert closable message={notice} onClose={() => setNotice(undefined)} role="status" showIcon type="success" />
      ) : null}
      <Flex align="center" justify="space-between" gap="small" wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('Custom frontend')}
        </Typography.Title>
        <Space wrap>
          <Button aria-label={t('Refresh')} icon={<ReloadOutlined />} loading={loading} onClick={loadApps}>
            {t('Refresh')}
          </Button>
          {canUpload ? (
            <Button
              aria-label={t('Upload application')}
              icon={<UploadOutlined />}
              onClick={() => openUpload(null)}
              type="primary"
            >
              {t('Upload application')}
            </Button>
          ) : null}
        </Space>
      </Flex>

      <Table<LightExtensionClientAppDescriptor>
        columns={columns}
        dataSource={apps}
        loading={loading}
        locale={{
          emptyText: (
            <Empty description={t('No light extension applications yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ),
        }}
        pagination={false}
        rowKey="entryId"
        scroll={{ x: 1310 }}
      />

      <Modal
        cancelButtonProps={{ disabled: uploading }}
        cancelText={t('Cancel')}
        closable={!uploading}
        confirmLoading={uploading}
        keyboard={!uploading}
        maskClosable={false}
        okButtonProps={{ disabled: !uploadFile }}
        okText={uploadTarget ? t('Replace files') : t('Upload')}
        onCancel={closeUpload}
        onOk={submitUpload}
        open={uploadTarget !== undefined}
        title={uploadTarget ? t('Replace application files') : t('Upload light extension application')}
      >
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          {uploadTarget ? (
            <Space direction="vertical" size="small">
              <Alert
                message={t('The current application remains available if replacement fails')}
                role="status"
                showIcon
                type="info"
              />
              <Typography.Text>
                {t('The ZIP entry key must match {{key}}').replace('{{key}}', uploadTarget.key)}
              </Typography.Text>
            </Space>
          ) : null}
          <Upload.Dragger
            accept=".zip,application/zip,application/x-zip-compressed"
            aria-label={t('Application ZIP')}
            beforeUpload={selectUploadFile}
            disabled={uploading}
            fileList={uploadFile ? [{ uid: uploadFile.uid, name: uploadFile.name, status: 'done' }] : []}
            maxCount={1}
            onRemove={() => {
              setUploadFile(undefined);
              setUploadError(undefined);
              return true;
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">{t('Click or drag an application ZIP file to this area')}</p>
          </Upload.Dragger>
          {uploadError ? (
            <Alert aria-live="assertive" message={uploadError} role="alert" showIcon type="error" />
          ) : null}
          {uploading ? (
            <Typography.Text aria-live="polite" role="status">
              {uploadTarget ? t('Replacing application files') : t('Uploading application')}
            </Typography.Text>
          ) : null}
        </Space>
      </Modal>

      <Modal
        cancelButtonProps={{ disabled: removing }}
        cancelText={t('Cancel')}
        closable={!removing}
        confirmLoading={removing}
        keyboard={!removing}
        maskClosable={false}
        okButtonProps={{ danger: true, disabled: Boolean(removeReferences.length) }}
        okText={t('Remove')}
        onCancel={closeRemove}
        onOk={confirmRemove}
        open={Boolean(removeTarget)}
        title={t('Remove this application?')}
      >
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <Typography.Text>
            {t('Application to remove')}:{' '}
            <Typography.Text strong>{removeTarget?.title || removeTarget?.key}</Typography.Text>
          </Typography.Text>
          {removeReferences.length ? (
            <Alert
              description={
                <Space direction="vertical" size={2}>
                  {removeReferences.map((reference, index) => (
                    <Typography.Text key={`${reference.ownerKind}:${reference.ownerId}:${index}`}>
                      {reference.ownerId}
                    </Typography.Text>
                  ))}
                </Space>
              }
              message={t('This application is used by a workspace and cannot be removed')}
              role="alert"
              showIcon
              type="warning"
            />
          ) : (
            <Alert message={t('This action cannot be undone')} showIcon type="warning" />
          )}
          {removeError ? (
            <Alert aria-live="assertive" message={removeError} role="alert" showIcon type="error" />
          ) : null}
        </Space>
      </Modal>
    </Space>
  );
}

function getErrorReferences(error: unknown): LightExtensionClientAppReference[] {
  const references = getClientAppError(error).details?.references;
  return Array.isArray(references) ? references.filter(isClientAppReference) : [];
}

function isClientAppReference(value: unknown): value is LightExtensionClientAppReference {
  const reference = toRecord(value);
  return (
    typeof reference?.entryId === 'string' &&
    typeof reference.ownerKind === 'string' &&
    typeof reference.ownerId === 'string'
  );
}

function getClientAppErrorMessage(error: unknown, t: (key: string) => string): string {
  const { code, status, details } = getClientAppError(error);
  if (code === 'LIGHT_EXTENSION_PERMISSION_DENIED' || status === 403) {
    return t('You do not have permission to manage light extension applications');
  }
  if (code === 'LIGHT_EXTENSION_REFERENCE_EXISTS') {
    return t('This application is used by a workspace and cannot be removed');
  }
  if (status === 413 || details?.category === 'client-app-upload') {
    return t('The ZIP file exceeds the upload limit');
  }
  if (details?.category === 'client-app-archive') {
    return t('The ZIP file is not a valid light extension application');
  }
  if (details?.category === 'client-app-replacement') {
    return t('The ZIP entry key does not match the application being replaced');
  }
  if (code === 'LIGHT_EXTENSION_REPO_DISABLED' || code === 'LIGHT_EXTENSION_REPO_ARCHIVED') {
    return t('Enable the repository before uploading an application');
  }
  if (code === 'LIGHT_EXTENSION_INVALID_INPUT' || code === 'LIGHT_EXTENSION_VALIDATION_FAILED') {
    return t('The ZIP file is not a valid light extension application');
  }
  return t('Light extension application request failed');
}

function getClientAppError(error: unknown): {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
} {
  const response = toRecord(toRecord(error)?.response);
  const responseData = toRecord(response?.data);
  const errors = responseData?.errors;
  const serverError = Array.isArray(errors) ? toRecord(errors[0]) : toRecord(responseData?.error);
  return {
    code: typeof serverError?.code === 'string' ? serverError.code : undefined,
    status:
      typeof serverError?.status === 'number'
        ? serverError.status
        : typeof response?.status === 'number'
          ? response.status
          : undefined,
    details: toRecord(serverError?.details) || undefined,
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isZipFile(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith('.zip') || ['application/zip', 'application/x-zip-compressed'].includes(file.type)
  );
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatByteSize(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return '-';
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function isAllowedAction(permission: unknown): boolean {
  return permission !== null && permission !== undefined && permission !== false;
}

export default LightExtensionClientAppsPanel;
