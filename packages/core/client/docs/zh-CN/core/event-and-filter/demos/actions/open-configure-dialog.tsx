import { Modal } from 'antd';
import React, { useMemo } from 'react';
import { ActionDefinition, FlowContext, BaseFlowModel, ISchema } from '@nocobase/client';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { createForm } from '@formily/core';
import { FormItem, Input, Select, Switch, Form } from '@formily/antd-v5';


// Define a components object for SchemaComponentProvider
const formilyComponents = {
    FormItem,
    Input,
    Select,
    Switch,
    TextArea: Input.TextArea,
};

export const configureAction: ActionDefinition = {
  name: 'system:configureStep',
  title: '打开配置对话框',
  uiSchema: {
    modalTitle: { type: 'string', title: '弹窗标题', 'x-component': 'Input' } as ISchema,
    formUiSchemaJson: { 
        type: 'string', 
        title: '表单UI Schema (JSON)', 
        'x-component': 'TextArea',
        'x-component-props': { rows: 5 } 
    } as ISchema,
    initialValuesJson: { 
        type: 'string', 
        title: '表单初始值 (JSON)', 
        'x-component': 'TextArea',
        'x-component-props': { rows: 3 }
    } as ISchema,
  },
  defaultParams: {
    modalTitle: '参数配置',
    formUiSchemaJson: JSON.stringify({ 
        type: 'object', 
        properties: { 
            info: { type: 'string', title:'提示', default:'请为此步骤提供有效的表单Schema以配置参数。' , 'x-component': 'Input', 'x-read-pretty': true },
            field1: { type: 'string', title: '参数一', 'x-component': 'Input' }
        }
    }),
    initialValuesJson: JSON.stringify({ field1: '默认值' }),
  },
  handler: async (ctx: FlowContext, model: BaseFlowModel, params: any) => {
    const { modalTitle, formUiSchemaJson, initialValuesJson } = params;

    let formUiSchema: ISchema;
    let initialValues: Record<string, any>;

    try {
      formUiSchema = JSON.parse(formUiSchemaJson);
      if (typeof formUiSchema !== 'object' || formUiSchema === null || !formUiSchema.properties) { 
          throw new Error('formUiSchema must be an object with a properties field.');
      }
    } catch (e) {
      console.error('Invalid formUiSchemaJson:', e);
      formUiSchema = { type: 'object', properties: { error: { type: 'string', title: '错误', default: `无效的表单Schema配置: ${(e as Error).message}`, 'x-component':'Input', 'x-read-pretty': true } } };
      initialValues = {};
    }

    try {
      initialValues = JSON.parse(initialValuesJson);
      if (typeof initialValues !== 'object' || initialValues === null) throw new Error('initialValues must be an object.');
    } catch (e) {
      console.error('Invalid initialValuesJson, using empty object:', e);
      initialValues = {}; 
    }
    
    const processedProperties = {};
    if (formUiSchema.properties) {
        for (const [key, fieldSchemaValue] of Object.entries(formUiSchema.properties)) {
            const fieldS = fieldSchemaValue as ISchema;
            processedProperties[key] = {
                ...fieldS,
                'x-decorator': fieldS['x-decorator'] || 'FormItem',
            };
        }
    }
    const finalSchemaToRender: ISchema = { ...formUiSchema, properties: processedProperties };

    return new Promise((resolve) => {
      const ConfigurationModal = ({ onOkSubmit, onModalCancel }: { onOkSubmit: (values: any) => void, onModalCancel: () => void }) => {
        const form = useMemo(() => createForm({ initialValues }), [initialValues]);

        return (
          <Modal title={modalTitle} open={true} onOk={() => form.submit().then(onOkSubmit)} onCancel={onModalCancel} destroyOnClose>
            <SchemaComponentProvider form={form} components={formilyComponents}> 
              <Form form={form} layout="vertical"> 
                <SchemaComponent schema={finalSchemaToRender} />
              </Form>
            </SchemaComponentProvider>
          </Modal>
        );
      };

      const container = document.createElement('div');
      document.body.appendChild(container);
      const { createRoot } = require('react-dom/client');
      const root = createRoot(container);

      const cleanup = (result: any) => {
        root.unmount();
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
        resolve(result);
      };

      root.render(
        <ConfigurationModal 
          onOkSubmit={(values) => cleanup({ success: true, data: values })}
          onModalCancel={() => cleanup({ success: false, canceled: true })}
        />
      );
    });
  },
};

export default configureAction;
