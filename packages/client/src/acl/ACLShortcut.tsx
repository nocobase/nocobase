import { LockOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PluginManager } from '../plugin-manager';
import { ActionContext, SchemaComponent, useActionContext } from '../schema-component';
import * as components from './Configuration';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
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
      title: '{{t("Roles & Permissions")}}',
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
  const { t } = useTranslation();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        icon={<LockOutlined />}
        title={t('Roles & Permissions')}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent components={components} scope={{ useCloseAction }} schema={schema} />
    </ActionContext.Provider>
  );
};
