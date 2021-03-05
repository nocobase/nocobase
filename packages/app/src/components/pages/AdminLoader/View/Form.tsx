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
import cloneDeep from 'lodash/cloneDeep'
import { Spin } from '@nocobase/client';

export function fields2properties(fields = []) {
  const properties = {};
  fields.forEach(field => {
    const data = {
      ...field.component,
      title: field.title,
      required: field.required,
    };
    set(data, 'x-component-props.schema', cloneDeep(field));
    if (field.dataSource) {
      data.enum = field.dataSource;
    }
    if (field.interface === 'boolean') {
      set(data, 'x-component-props.children', data.title);
      delete data.title;
    }
    properties[field.name] = data;
    if (field.interface === 'linkTo') {
      set(data, 'x-component-props.target', field.target);
      set(data, 'x-component-props.multiple', field.multiple);
    }
    if (field.name === 'dataSource') {
      set(data, 'x-component-props.operationsWidth', 'auto');
      set(data, 'x-component-props.bordered', true);
      set(data, 'x-component-props.className', 'data-source-table');
      const property = {};
      Object.assign(property, {
        label: {
          type: "string",
          title: "选项",
          required: true,
          'x-component-props': {
            bordered: false,
          },
        },
        color: {
          type: "colorSelect",
          title: "颜色",
          'x-component-props': {
            bordered: false,
          },
        },
      });
      set(data, 'items.properties', property);
    }
  });
  console.log({properties});
  return properties;
}
const actions = createFormActions();

export function Form(props: any) {
  const { onFinish, resolve, data: record = {}, associatedKey, schema = {} } = props;
  console.log({ record });
  const { resourceName, rowKey = 'id', fields = [], appends = [], associationField = {} } = schema;

  const resourceKey = props.resourceKey || record[associationField.targetKey||rowKey];

  const { data = {}, loading, refresh } = useRequest(() => {
    return resourceKey ? api.resource(resourceName).get({
      associatedKey,
      resourceKey,
      'fields[appends]': appends,
    }) : Promise.resolve({data: {}});
  });

  if (loading) {
    return <Spin/>;
  }

  return (
    <SchemaForm 
      colon={true}
      layout={'vertical'}
      initialValues={{
        ...data,
        associatedKey,
        resourceKey,
      }}
      // actions={actions}
      schema={{
        type: 'object',
        properties: fields2properties(fields),
      }}
      onSubmit={async (values) => {
        resourceKey 
          ? await api.resource(resourceName).update({
            associatedKey,
            resourceKey,
            values,
          })
          : await api.resource(resourceName).create({
            associatedKey,
            values,
          });
        onFinish && await onFinish(values);
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
