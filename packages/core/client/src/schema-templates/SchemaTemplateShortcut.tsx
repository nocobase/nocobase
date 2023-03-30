import { LayoutOutlined } from '@ant-design/icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PluginManager } from '../plugin-manager';

export const SchemaTemplateShortcut = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <PluginManager.Toolbar.Item
      icon={<LayoutOutlined />}
      title={t('Block templates')}
      onClick={() => {
        navigate('/admin/settings/block-templates/list');
      }}
    />
  );
};
