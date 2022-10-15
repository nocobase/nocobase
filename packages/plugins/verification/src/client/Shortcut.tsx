import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleOutlined } from '@ant-design/icons';
import { PluginManager, ActionContext, SchemaComponent } from '@nocobase/client';
import providersSchema from './schemas/providers';
import ProviderOptions from './ProviderOptions';

export const Shortcut = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        eventKey={'VerificationProvider'}
        onClick={() => {
          setVisible(true);
        }}
        icon={<CheckCircleOutlined />}
        title={t('Verification providers')}
      />
      <SchemaComponent components={{ ProviderOptions }} schema={providersSchema} />
    </ActionContext.Provider>
  );
};
