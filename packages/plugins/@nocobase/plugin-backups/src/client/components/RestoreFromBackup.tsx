import { useAPIClient } from '@nocobase/client';
import { Button, Input, Modal, Form } from 'antd';
import React from 'react';
import { useCheckBackupMessage } from '../hooks/useCheckBackupMessage';
import { useRestoreTask } from '../hooks/useRestoreTask';
import { useT } from '../locale';
import { BackupFile } from './BackupsTable';
import { useBackupAppInfo } from '../hooks/useBackupAppInfo';

export const RestoreFromBackup = ({ backup }: { backup: BackupFile }) => {
  const t = useT();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [progressing, setProgressing] = React.useState(false);
  const [dbSchema, setDbSchema] = React.useState('');
  const apiClient = useAPIClient();
  const restoreTaskId = useRestoreTask();
  const { showCheckBackupMessage } = useCheckBackupMessage();
  const {
    database: { schema: currentDbSchema, dialect },
  } = useBackupAppInfo();
  const currentDbSchemaTips = currentDbSchema ? `[${currentDbSchema}]` : '';

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    setProgressing(true);
    try {
      const {
        data: { data },
      } = await apiClient.request({
        url: 'backups:restore',
        method: 'post',
        data: {
          name: backup.name,
          password,
          dbSchema,
        },
      });
      restoreTaskId.current = data?.task;
      showCheckBackupMessage();
    } catch (error) {
      console.error(error);
    }
    setProgressing(false);
    setIsModalVisible(false);
    setPassword('');
    setDbSchema('');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setPassword('');
    setDbSchema('');
  };

  return (
    <>
      <a type="link" role="button" onClick={showModal}>
        {t('Restore')}
      </a>
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
        <Form layout={'vertical'} autoComplete="off">
          {dialect === 'postgres' && (
            <Form.Item
              label={<strong>{t('Confirm the application database schema')}</strong>}
              help={t('Required if application database schema is different with the backup', { currentDbSchemaTips })}
            >
              <Input autoComplete="new-password" value={dbSchema} onChange={(e) => setDbSchema(e.target.value)} />
            </Form.Item>
          )}

          <Form.Item colon={true} label={<strong>{t('Restore password')}</strong>}>
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
