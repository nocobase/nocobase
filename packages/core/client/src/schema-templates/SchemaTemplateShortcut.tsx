import { LayoutOutlined } from '@ant-design/icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PluginManager } from '../plugin-manager';

export const SchemaTemplateShortcut = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      icon={<LayoutOutlined />}
      title={t('Block templates')}
      onClick={() => {
        history.push('/admin/plugins/block-templates');
      }}
    />
  );
};
