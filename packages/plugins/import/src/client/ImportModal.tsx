import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Button, Modal, Space, Spin } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useImportContext } from './context';

export const ImportStatus = {
  IMPORTING: 1,
  IMPORTED: 2,
};

export const ImportModal = (props: any) => {
  const { t } = useTranslation();
  const { importModalVisible, importStatus, importResult, setImportModalVisible } = useImportContext();
  debugger;
  const doneHandler = () => {
    setImportModalVisible(false);
  };
  return (
    <Modal
      title={t('Import Data')}
      width="50%"
      bodyStyle={{ height: 'calc(80vh - 200px)' }}
      visible={importModalVisible}
      footer={null}
      closable={importStatus === ImportStatus.IMPORTED}
    >
      <div
        className={css`
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        `}
      >
        {importStatus === ImportStatus.IMPORTING && (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip={t('Excel data importing')} />
        )}
        {importStatus === ImportStatus.IMPORTED && (
          <Space direction="vertical" align="center">
            <ExclamationCircleFilled style={{ fontSize: 72, color: '#1890ff' }} />
            <p>
              {t('Import done, total success have {{successCount}} , total failure have {{failureCount}}', {
                ...importResult,
              })}
            </p>
            <Space>
              <Button>{t('To download the failure data')}</Button>
              <Button type="primary" onClick={doneHandler}>
                {t('Done')}
              </Button>
            </Space>
          </Space>
        )}
      </div>
    </Modal>
  );
};
