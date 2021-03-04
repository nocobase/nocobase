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
import scopes from '@/components/views/Form/scopes';
import { fields2properties } from './Form';

export function FilterForm(props: any) {
  // const actions = createAsyncFormActions();
  const { onFinish } = props;
  const { fields = [] } = props.schema||{};
  return (
      <SchemaForm 
        colon={true}
        layout={'vertical'}
        initialValues={{}}
        // actions={actions}
        onReset={async () => {
          onFinish && await onFinish(null);
        }}
        onSubmit={async (values) => {
          if (onFinish) {
            await onFinish(values);
          }
        }}
        schema={{
          type: 'object',
          properties: fields2properties(fields),
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
