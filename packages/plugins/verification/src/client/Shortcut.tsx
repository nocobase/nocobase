import { CheckCircleOutlined } from '@ant-design/icons';
import { PluginManager } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { NAMESPACE } from './locale';

export const Shortcut = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <PluginManager.Toolbar.Item
      icon={<CheckCircleOutlined />}
      title={t('Verification', { ns: NAMESPACE })}
      onClick={() => {
        navigate('/admin/settings/verification/providers');
      }}
    />
  );
};
