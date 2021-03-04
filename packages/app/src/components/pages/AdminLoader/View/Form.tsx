import React, { useState } from 'react';
import { Tooltip, Card, Button } from 'antd';
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
  FormSpy,
  LifeCycleTypes,
} from '@formily/antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import api from '@/api-client';
import { useRequest, useLocation } from 'umi';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import set from 'lodash/set';

export function fields2properties(fields = []) {
  const properties = {};
  fields.forEach(field => {
    const data = {
      ...field.component,
      title: field.title,
      required: field.required,
    };
    if (field.dataSource) {
      data.enum = field.dataSource;
    }
    if (field.interface === 'boolean') {
      set(data, 'x-component-props.children', data.title);
      delete data.title;
    }
    properties[field.name] = data;
  });
  console.log({properties});
  return properties;
}
const actions = createFormActions();

export function Form(props: any) {
  const { onFinish, resolve, data: record = {}, associatedKey, resourceKey, schema = {} } = props;
  console.log({ record });
  const { resourceName, rowKey = 'id', fields = [] } = schema;

  const resourceIndex = resourceKey || record[rowKey];

  const { data = {}, loading, refresh } = useRequest(() => {
    return resourceIndex ? api.resource(resourceName).get({
      associatedKey,
      resourceKey: resourceIndex,
    }) : Promise.resolve({data: {}});
  });

  return (
    <SchemaForm 
      colon={true}
      layout={'vertical'}
      initialValues={data}
      // actions={actions}
      schema={{
        type: 'object',
        properties: fields2properties(fields),
      }}
      onSubmit={async (values) => {
        resourceIndex 
          ? await api.resource(resourceName).update({
            resourceKey: resourceIndex,
            values,
          })
          : await api.resource(resourceName).create({
            values,
            associatedKey,
          });
        onFinish && onFinish(values);
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
      <FormButtonGroup align={'bottom'} sticky>
        <Submit/>
      </FormButtonGroup>
    </SchemaForm>
  );
}
