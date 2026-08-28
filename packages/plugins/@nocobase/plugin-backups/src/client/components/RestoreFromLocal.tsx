/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InboxOutlined, QuestionCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useAPIClient } from '@nocobase/client';
import { App, Button, Checkbox, Flex, Input, Modal, Tooltip, Upload, Form, UploadFile } from 'antd';
import React, { useState } from 'react';
import { useCheckBackupMessage } from '../hooks/useCheckBackupMessage';
import { useRestoreTask } from '../hooks/useRestoreTask';
import { useT } from '../locale';
import { useBackupAppInfo } from '../hooks/useBackupAppInfo';

export const RestoreFromLocal = () => {
  const t = useT();
  const { notification } = App.useApp();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [progressing, setProgressing] = useState(false);
  const [password, setPassword] = useState('');
  const [dbSchema, setDbSchema] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState([]);
  const apiClient = useAPIClient();
  const restoreTaskId = useRestoreTask();
  const { showCheckBackupMessage } = useCheckBackupMessage();
  const {
    database: { schema: currentDbSchema, dialect },
  } = useBackupAppInfo();
  const currentDbSchemaTips = currentDbSchema ? `[${currentDbSchema}]` : '';

  const beforeUpload = (file: File) => {
    setFile(file);
    setFileList([file]);
    return false;
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    if (!file) {
      notification.error({ message: t('Please select a backup file') });
      return;
    }

    setProgressing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    formData.append('dbSchema', dbSchema);
    try {
      const {
        data: { data },
      } = await apiClient.request({
        url: 'backups:upload',
        method: 'post',
        data: formData,
      });
      restoreTaskId.current = data?.task;
      showCheckBackupMessage();
    } catch (error) {
      console.error(error);
    }
    setProgressing(false);
    setIsModalVisible(false);
    setPassword('');
    setFileList([]);
    setDbSchema('');
  };

  const handleCancel = () => {
    setPassword('');
    setFileList([]);
    setIsModalVisible(false);
    setDbSchema('');
  };

  const handleRemove = (file: UploadFile) => {
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
        footer={[
          <Button key="back" onClick={handleCancel}>
            {t('Cancel')}
          </Button>,
          <Button key="submit" type="primary" loading={progressing} onClick={handleOk}>
            {t('Submit')}
          </Button>,
        ]}
      >
        <Form layout={'vertical'} autoComplete="off">
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
              <p className="ant-upload-text"> {t('Click or drag file to this area to upload')}</p>
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
          <Form.Item colon={true} label={t('Restore password')}>
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
