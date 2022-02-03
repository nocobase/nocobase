import { DatabaseOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { PluginManager } from '../plugin-manager';
import { SchemaComponent, useActionVisible, VisibleContext } from '../schema-component';
import { ConfigurationTable } from './Configuration';

const useCloseAction = () => {
  const { setVisible } = useActionVisible();
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

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
    <VisibleContext.Provider value={[visible, setVisible]}>
      <PluginManager.Toolbar.Item
        icon={<DatabaseOutlined />}
        title={'数据表配置'}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent scope={{ useCloseAction }} schema={schema} components={{ ConfigurationTable }} />
    </VisibleContext.Provider>
  );
};
