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
import scopes from './scopes';

export function FilterForm(props: any) {
  // const actions = createAsyncFormActions();
  const { setVisible, onTrigger } = props;
  const { title, fields: properties = {} } = props.schema || {};
  return (
    <SchemaForm
      colon={true}
      layout={'vertical'}
      initialValues={{}}
      // actions={actions}
      onReset={() => {
        setVisible && setVisible(false);
      }}
      onSubmit={async values => {
        if (onTrigger) {
          await onTrigger(values);
        }
        setVisible && setVisible(false);
      }}
      schema={{
        type: 'object',
        properties,
      }}
      expressionScope={scopes}
    >
      <FormButtonGroup align={'end'}>
        <Reset>取消</Reset>
        <Submit>确定</Submit>
      </FormButtonGroup>
    </SchemaForm>
  );
}
