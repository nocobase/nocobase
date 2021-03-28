import React from 'react';
import { Tooltip, Card } from 'antd';
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
import { QuestionCircleOutlined } from '@ant-design/icons';

export function Form(props: any) {
  const actions = createFormActions();

  return (
    <Card bordered={false}>
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
              required: true,
            },
          },
        }}
        expressionScope={{
          text(...args: any[]) {
            return React.createElement('span', {}, ...args);
          },
          tooltip(title: string, offset = 3) {
            return (
              <Tooltip title={title}>
                <QuestionCircleOutlined
                  style={{
                    margin: '0 3px',
                    cursor: 'default',
                    marginLeft: offset,
                  }}
                />
              </Tooltip>
            );
          },
        }}
      >
        <FormButtonGroup sticky>
          <Submit />
        </FormButtonGroup>
      </SchemaForm>
    </Card>
  );
}
