import { LoadingOutlined } from '@ant-design/icons';
import { Result } from 'antd';
import React from 'react';
import { createPortal } from 'react-dom';
import { usePluginUtils } from './hooks/i18';

interface Props {
  type: 'restore' | 'backup' | 'restart';
  loading: boolean;
  fileName?: string;
  success?: boolean;
}

export const WAIT_INTERVAL = 3000;

export const ResultWithLoading = ({ type, fileName, loading, success }: Props) => {
  const { t } = usePluginUtils();

  const loadingTextMap = {
    restore: {
      title: t('Restoring'),
      subTitle: t('Do not perform other operations while Restoring'),
      success: {
        title: t('Restore successful'),
        subTitle: t('The server will restart after 3 seconds'),
      },
      error: {
        title: t('Restore failed'),
        subTitle: t('The database has been restored failed'),
      },
    },
    backup: {
      title: t('Backing up'),
      subTitle: t('Do not perform other operations while backing up'),
      success: {
        title: t('Backup successful'),
        subTitle: t('File name has been saved as: ') + fileName,
      },
      error: {
        title: t('Backup failed'),
        subTitle: t('The database has been backed up failed'),
      },
    },
    // 重启服务
    restart: {
      title: t('Restarting'),
      subTitle: t('Do not perform other operations while restarting'),
      success: {
        title: t('Restart successful'),
        subTitle: t('The page will be refreshed after 3 seconds'),
      },
      error: {
        title: t('Restart failed'),
        subTitle: t('The service has been restarted failed'),
      },
    },
  };

  if (loading) {
    return (
      <>
        <Result
          icon={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          title={loadingTextMap[type].title}
          subTitle={loadingTextMap[type].subTitle}
        />
        {createPortal(<Mask />, document.body)}
      </>
    );
  }

  if (success) {
    return (
      <Result
        status="success"
        title={loadingTextMap[type].success.title}
        subTitle={loadingTextMap[type].success.subTitle}
      />
    );
  }

  return (
    <Result status="error" title={loadingTextMap[type].error.title} subTitle={loadingTextMap[type].error.subTitle} />
  );
};

function Mask() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 100,
        cursor: 'not-allowed',
      }}
    />
  );
}
