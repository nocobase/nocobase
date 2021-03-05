import React, { useState } from 'react';
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
import { fields2properties } from '@/components/pages/AdminLoader/View/Form';
import Drawer from '@/components/pages/AdminLoader/Drawer';

export function Form(props: any) {
  const { data, onFinish } = props;
  const { fields = [] } = props.schema||{};
  return (
    <SchemaForm 
      colon={true}
      layout={'vertical'}
      initialValues={data}
      // actions={actions}
      onReset={async () => {
        // setData({filter: {}});
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

export default Form;
