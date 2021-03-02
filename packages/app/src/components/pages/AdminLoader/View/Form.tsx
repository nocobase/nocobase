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

function fields2properties(fields = []) {
  const properties = {};
  fields.forEach(field => {
    properties[field.name] = {
      ...field.component,
      title: field.title,
    };
  });
  return properties;
}

export function Form(props: any) {
  const { schema = {} } = props;
  const { fields = [] } = schema;
  const actions = createFormActions();

  return (
    <SchemaForm 
      colon={true}
      layout={'vertical'}
      initialValues={{}}
      actions={actions}
      schema={{
        type: 'object',
        properties: fields2properties(fields),
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
      <FormButtonGroup sticky>
        <Submit/>
      </FormButtonGroup>
    </SchemaForm>
  );
}
