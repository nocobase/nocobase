import { FileOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { ActionContextProvider, PluginManager, SchemaComponent } from '@nocobase/client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storageSchema } from './schemas/storage';
import { StorageOptions } from './StorageOptions';

const schema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '{{t("File manager")}}',
      properties: {
        storageSchema,
      },
    },
  },
};

export const FileStorageShortcut = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        eventKey={'FileStorage'}
        onClick={() => {
          setVisible(true);
        }}
        icon={<FileOutlined />}
        title={t('File manager')}
      />
      <SchemaComponent components={{ StorageOptions }} schema={schema} />
    </ActionContextProvider>
  );
};
