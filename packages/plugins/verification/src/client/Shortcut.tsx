import React from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircleOutlined } from '@ant-design/icons';
import { PluginManager } from '@nocobase/client';
import { NAMESPACE } from './locale';

export const Shortcut = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      icon={<CheckCircleOutlined />}
      title={t('Verification', { ns: NAMESPACE })}
      onClick={() => {
        history.push('/admin/settings/verification/providers');
      }}
    />
  );
};
