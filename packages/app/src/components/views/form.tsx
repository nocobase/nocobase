import React from 'react';
import { Tooltip, Input } from 'antd';
import 'antd/lib/style/index.css';
import {
  SchemaForm,
  SchemaMarkupField as Field,
  createFormActions,
  createAsyncFormActions,
  Submit,
  Reset,
  FormButtonGroup,
  registerFormFields,
  FormValidator,
  setValidationLanguage,
} from '@formily/antd';
import { setup } from '@/components/form.fields';
import { QuestionCircleOutlined } from '@ant-design/icons';

setup();
setValidationLanguage('zh-CN');
const actions = createAsyncFormActions();

export function Form(props: any) {
  return (
    <div>
      <SchemaForm 
          colon={true}
          layout={'vertical'}
          initialValues={{}}
          actions={actions}
          schema={{
            type: 'object',
            properties: {
              title: {
                type: 'string',
                title: '标题',
              },
            },
          }}
          expressionScope={{
            text(...args) {
              return React.createElement('span', {}, ...args)
            },
            tooltip(title: string, offset = 3) {
              return (
                <Tooltip title={title}>
                  <QuestionCircleOutlined
                    style={{ margin: '0 3px', cursor: 'default', marginLeft: offset }}
                  />
                </Tooltip>
              );
            },
          }}
        >
        </SchemaForm>
    </div>
  );
}
