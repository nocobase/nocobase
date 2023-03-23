import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Result } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { usePluginUtils } from './hooks/i18';

interface Props {
  type: 'restore' | 'backup';
  loading: boolean;
  fileName?: string;
}

export const ResultWithLoading = ({ type, fileName, loading }: Props) => {
  const { t } = usePluginUtils();

  const loadingTextMap = {
    restore: {
      title: t('Restoring'),
      subTitle: t('Do not perform other operations while Restoring'),
      success: {
        title: t('Restore successful'),
        subTitle: t('The database has been restored successfully'),
      },
    },
    backup: {
      title: t('Backing up'),
      subTitle: t('Do not perform other operations while backing up'),
      success: {
        title: t('Backup successful'),
        subTitle: t('File name has been saved as: ') + fileName,
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

  return (
    <Result
      status="success"
      title={loadingTextMap[type].success.title}
      subTitle={loadingTextMap[type].success.subTitle}
    />
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
