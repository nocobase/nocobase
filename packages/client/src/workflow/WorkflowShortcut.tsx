import React, { useState } from 'react';
import { PartitionOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { PluginManager } from '../plugin-manager';
import { ActionContext, SchemaComponent, useActionContext } from '../schema-component';
import { WorkflowTable } from './WorkflowTable';

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
      title: '工作流',
      properties: {
        main: {
          type: 'void',
          'x-component': 'WorkflowTable',
        },
      },
    },
  },
};

export const WorkflowShortcut = () => {
  const [visible, setVisible] = useState(false);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        icon={<PartitionOutlined />}
        title={'工作流'}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent
        schema={schema}
        components={{
          WorkflowTable
        }}
        scope={{ useCloseAction }}
      />
    </ActionContext.Provider>
  );
};
