import { DatabaseOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { PluginManager } from '../plugin-manager';
import { ActionContext, SchemaComponent } from '../schema-component';
import { AddFieldAction, ConfigurationTable, EditFieldAction } from './Configuration';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '数据表配置',
      properties: {
        configuration: {
          'x-component': 'ConfigurationTable',
        },
      },
    },
  },
};

export const CollectionManagerShortcut = () => {
  const [visible, setVisible] = useState(false);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        icon={<DatabaseOutlined />}
        title={'数据表配置'}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent schema={schema} components={{ ConfigurationTable, AddFieldAction, EditFieldAction }} />
    </ActionContext.Provider>
  );
};
