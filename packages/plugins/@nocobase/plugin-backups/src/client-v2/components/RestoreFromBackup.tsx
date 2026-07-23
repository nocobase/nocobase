/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { App, Button, Form, Input, Modal } from 'antd';
import React from 'react';
import { useBackupAppInfo } from '../hooks/useBackupAppInfo';
import { useCheckBackupMessage } from '../hooks/useCheckBackupMessage';
import { useRestoreTask } from '../hooks/useRestoreTask';
import { useT } from '../locale';
import type { BackupFile } from './BackupsTable';

type RestoreTaskBody = {
  task?: string;
};

type ResourceResponse<T> = {
  data?: T;
};

type ErrorMessage = string | { message?: string };

export const RestoreFromBackup = ({ backup }: { backup: BackupFile }) => {
  const t = useT();
  const ctx = useFlowContext();
  const { notification } = App.useApp();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [progressing, setProgressing] = React.useState(false);
  const [dbSchema, setDbSchema] = React.useState('');
  const restoreTaskId = useRestoreTask();
  const { showCheckBackupMessage } = useCheckBackupMessage();
  const {
    database: { schema: currentDbSchema, dialect },
  } = useBackupAppInfo();
  const currentDbSchemaTips = currentDbSchema ? `[${currentDbSchema}]` : '';

  const showModal = () => {
    setIsModalVisible(true);
  };

  const resetFields = () => {
    setPassword('');
    setDbSchema('');
  };

  const handleOk = async () => {
    setProgressing(true);
    try {
      const response = await ctx.api.request<ResourceResponse<RestoreTaskBody>>({
        url: 'backups:restore',
        method: 'post',
        skipNotify: true,
        data: {
          name: backup.name,
          password,
          dbSchema,
        },
      });
      restoreTaskId.current = response.data?.data?.task ?? null;
      showCheckBackupMessage();
      setIsModalVisible(false);
      resetFields();
    } catch (error: unknown) {
      const errors = ctx.api.toErrMessages(error) as ErrorMessage[];
      notification.error({
        message: errors.map((item, index) => {
          const message = typeof item === 'string' ? item : item.message;
          return <div key={`${index}_${message}`}>{message || t('Restore failed')}</div>;
        }),
        role: 'alert',
      });
    } finally {
      setProgressing(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    resetFields();
  };

  return (
    <>
      <Button type="link" size="small" onClick={showModal}>
        {t('Restore')}
      </Button>
      <Modal
        title={t('Restore')}
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
        <Form layout="vertical" autoComplete="off">
          {['postgres', 'kingbase'].includes(dialect) && (
            <Form.Item
              label={<strong>{t('Confirm the application database schema')}</strong>}
              help={t('Required if application database schema is different with the backup', { currentDbSchemaTips })}
            >
              <Input autoComplete="new-password" value={dbSchema} onChange={(e) => setDbSchema(e.target.value)} />
            </Form.Item>
          )}

          <Form.Item colon label={<strong>{t('Restore password')}</strong>}>
            <Input.Password
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
