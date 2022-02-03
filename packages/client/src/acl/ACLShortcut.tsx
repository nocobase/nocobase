import { LockOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { PluginManager } from '../plugin-manager';
import { SchemaComponent, useActionVisible, VisibleContext } from '../schema-component';
import { RoleTable } from './RolePermissionManager';

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
      title: '角色配置',
      properties: {
        hello1: {
          type: 'void',
          'x-component': 'RoleTable',
        },
      },
    },
  },
};

export const ACLShortcut = () => {
  const [visible, setVisible] = useState(false);
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <PluginManager.Toolbar.Item
        icon={<LockOutlined />}
        title={'角色和权限'}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent components={{ RoleTable }} scope={{ useCloseAction }} schema={schema} />
    </VisibleContext.Provider>
  );
};
