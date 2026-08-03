/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import type { UploadFile, UploadProps } from 'antd';
import { App, Button, Form, Input, Modal, Upload } from 'antd';
import React, { useState } from 'react';
import { useBackupAppInfo } from '../hooks/useBackupAppInfo';
import { useCheckBackupMessage } from '../hooks/useCheckBackupMessage';
import { useRestoreTask } from '../hooks/useRestoreTask';
import { useT } from '../locale';

type RestoreTaskBody = {
  task?: string;
};

type ResourceResponse<T> = {
  data?: T;
};

type ErrorMessage = string | { message?: string };

export const RestoreFromLocal = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { notification } = App.useApp();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [progressing, setProgressing] = useState(false);
  const [password, setPassword] = useState('');
  const [dbSchema, setDbSchema] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const submittingRef = React.useRef(false);
  const restoreTaskId = useRestoreTask();
  const { showCheckBackupMessage } = useCheckBackupMessage();
  const {
    database: { schema: currentDbSchema, dialect },
  } = useBackupAppInfo();
  const currentDbSchemaTips = currentDbSchema ? `[${currentDbSchema}]` : '';

  const beforeUpload: UploadProps['beforeUpload'] = (selectedFile) => {
    setFile(selectedFile);
    setFileList([selectedFile]);
    return false;
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const resetFields = () => {
    setPassword('');
    setFile(null);
    setFileList([]);
    setDbSchema('');
  };

  const handleOk = async () => {
    if (submittingRef.current) {
      return;
    }

    if (!file) {
      notification.error({ message: t('Please select a backup file') });
      return;
    }

    submittingRef.current = true;
    setProgressing(true);
    let keepBlocked = false;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    formData.append('dbSchema', dbSchema);
    try {
      const response = await ctx.api.request<ResourceResponse<RestoreTaskBody>>({
        url: 'backups:upload',
        method: 'post',
        data: formData,
        skipNotify: true,
      });
      restoreTaskId.current = response.data?.data?.task ?? null;
      showCheckBackupMessage();
      setIsModalVisible(false);
      resetFields();
    } catch (error: unknown) {
      const requestError = error as { response?: { data?: { error?: { maintaining?: boolean } } } };
      keepBlocked = !requestError.response || requestError.response.data?.error?.maintaining === true;
      const errors = ctx.api.toErrMessages(error) as ErrorMessage[];
      notification.error({
        message: errors.map((item, index) => {
          const message = typeof item === 'string' ? item : item.message;
          return <div key={`${index}_${message}`}>{message || t('Restore failed')}</div>;
        }),
        role: 'alert',
      });
    } finally {
      if (!keepBlocked) {
        submittingRef.current = false;
        setProgressing(false);
      }
    }
  };

  const handleCancel = () => {
    if (submittingRef.current) {
      return;
    }
    setIsModalVisible(false);
    resetFields();
  };

  const handleRemove = () => {
    setFileList([]);
    setFile(null);
  };

  return (
    <>
      <Button icon={<UploadOutlined />} onClick={showModal}>
        {t('Restore backup from local')}
      </Button>
      <Modal
        title={t('Restore backup from local')}
        open={isModalVisible}
        onCancel={handleCancel}
        closable={!progressing}
        keyboard={!progressing}
        maskClosable={!progressing}
        footer={[
          <Button key="back" disabled={progressing} onClick={handleCancel}>
            {t('Cancel')}
          </Button>,
          <Button key="submit" type="primary" loading={progressing} disabled={progressing} onClick={handleOk}>
            {t('Submit')}
          </Button>,
        ]}
      >
        <Form layout="vertical" autoComplete="off" disabled={progressing}>
          <Form.Item>
            <Upload.Dragger
              onRemove={handleRemove}
              fileList={fileList}
              multiple={false}
              maxCount={1}
              beforeUpload={beforeUpload}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{t('Click or drag file to this area to upload')}</p>
            </Upload.Dragger>
          </Form.Item>
          {['postgres', 'kingbase'].includes(dialect) && (
            <Form.Item
              label={t('Confirm the application database schema')}
              help={t('Required if application database schema is different with the backup', { currentDbSchemaTips })}
            >
              <Input autoComplete="new-password" value={dbSchema} onChange={(e) => setDbSchema(e.target.value)} />
            </Form.Item>
          )}
          <Form.Item colon label={t('Restore password')}>
            <Input.Password
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
