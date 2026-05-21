import { Button } from 'antd';
import { useT } from '../locale';
import React, { useContext } from 'react';
import { BackupsContext } from '../contexts';
import { ReloadOutlined, LoadingOutlined } from '@ant-design/icons';

export const RefreshBackups = () => {
  const t = useT();
  const { refresh, loading } = useContext(BackupsContext);
  const Icon = loading ? LoadingOutlined : ReloadOutlined;

  return (
    <Button onClick={refresh} icon={<Icon />} disabled={loading}>
      {t('Refresh')}
    </Button>
  );
};
