import React from 'react';
import { Tooltip, Button } from 'antd';
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
  const { setVisible, onTrigger } = props;
  const { title, fields: properties ={} } = props.schema||{};
  return (
      <SchemaForm 
        colon={true}
        layout={'vertical'}
        initialValues={{}}
        actions={actions}
        onReset={() => {
          setVisible && setVisible(false);
        }}
        onSubmit={async (values) => {
          if (onTrigger) {
            await onTrigger(values);
          }
          setVisible && setVisible(false);
        }}
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
          <Submit>确定</Submit>
        </FormButtonGroup>
      </SchemaForm>
  );
}
