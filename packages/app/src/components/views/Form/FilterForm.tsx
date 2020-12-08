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

export function FilterForm(props: any) {
  const actions = createAsyncFormActions();
  const { title, fields: properties ={} } = props.schema||{};
  return (
      <SchemaForm 
        colon={true}
        layout={'vertical'}
        initialValues={{}}
        actions={actions}
        schema={{
          type: 'object',
          properties,
        }}
        expressionScope={{
          text(...args: any[]) {
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
        <FormButtonGroup>
          <Reset>取消</Reset>
          <Submit onClick={async () => {
            const { values = {} } = await actions.submit();
            console.log(values);
          }}>确定</Submit>
        </FormButtonGroup>
      </SchemaForm>
  );
}
