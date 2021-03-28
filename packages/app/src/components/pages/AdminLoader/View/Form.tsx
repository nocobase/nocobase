import React, { useState } from 'react';
import { Tooltip, Card, Button, message } from 'antd';
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
import cloneDeep from 'lodash/cloneDeep';
import { Spin } from '@nocobase/client';
import { markdown } from '@/components/views/Field';
import scopes from '@/components/views/Form/scopes';

export function fields2properties(fields = [], options: any = {}) {
  const { mode } = options;
  const properties = {};
  fields.forEach(field => {
    const data = {
      ...field.component,
      title: field.title,
      required: field.required,
    };
    if (field.multiple) {
      set(data, 'x-component-props.mode', 'multiple');
    }
    if (field.dateFormat) {
      set(data, 'x-component-props.format', field.dateFormat);
    }
    if (field.showTime) {
      set(data, 'x-component-props.showTime', true);
      field.timeFormat &&
        set(
          data,
          'x-component-props.format',
          `${field.dateFormat} ${field.timeFormat}`,
        );
    }
    if (field.createOnly && mode !== 'create') {
      set(data, 'x-component-props.disabled', true);
    }
    const linkages = field.linkages;
    delete field.linkages;
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
          type: 'string',
          title: '选项',
          required: true,
          'x-component-props': {
            bordered: false,
          },
        },
        color: {
          type: 'colorSelect',
          title: '颜色',
          'x-component-props': {
            bordered: false,
          },
        },
      });
      set(data, 'items.properties', property);
    }
    if (linkages) {
      data['x-linkages'] = linkages;
    }
    if (field.defaultValue !== null) {
      data.default = field.defaultValue;
    }
    if (field.tooltip) {
      data.description = (
        <div
          className={'markdown-content'}
          dangerouslySetInnerHTML={{ __html: markdown(field.tooltip) }}
        ></div>
      );
    }
  });
  console.log({ properties, options });
  return properties;
}
const actions = createFormActions();

export function Form(props: any) {
  const {
    initialValues = {},
    onValueChange,
    onReset,
    __parent,
    noRequest = false,
    onFinish,
    onDraft,
    resolve,
    data: record = {},
    associatedKey,
    schema = {},
  } = props;
  console.log({ noRequest, record, associatedKey, __parent });
  const {
    statusable,
    resourceName,
    rowKey = 'id',
    fields = [],
    appends = [],
    associationField = {},
  } = schema;

  const resourceKey =
    props.resourceKey || record[associationField.targetKey || rowKey];

  const { data = {}, loading, refresh } = useRequest(() => {
    return !noRequest && resourceKey
      ? api.resource(resourceName).get({
          associatedKey,
          resourceKey,
          'fields[appends]': appends,
        })
      : Promise.resolve({ data: record });
  });

  const [status, setStatus] = useState('publish');

  if (loading) {
    return <Spin />;
  }

  return (
    <SchemaForm
      colon={true}
      layout={'vertical'}
      initialValues={{
        ...data,
        ...initialValues,
        associatedKey,
        resourceKey,
      }}
      effects={($, { setFormState, setFieldState, getFieldState }) => {
        $(LifeCycleTypes.ON_FORM_INIT).subscribe(() => {
          setFieldState('*', state => {
            set(state.props, 'x-component-props.__index', resourceKey);
          });
        });
      }}
      // actions={actions}
      schema={{
        type: 'object',
        properties: fields2properties(fields, {
          mode: !!Object.keys(data).length ? null : 'create',
        }),
      }}
      onReset={async () => {
        onReset && (await onReset());
      }}
      onChange={values => {
        console.log('onValueChange');
        onValueChange && onValueChange(values);
      }}
      onSubmit={async values => {
        console.log({ status });
        if (!noRequest) {
          resourceKey
            ? await api.resource(resourceName).update({
                associatedKey,
                resourceKey,
                values: {
                  ...values,
                  status,
                },
              })
            : await api.resource(resourceName).create({
                associatedKey,
                values: {
                  ...values,
                  status,
                },
              });
        }
        onFinish && (await onFinish(values));
      }}
      expressionScope={scopes}
    >
      <FormButtonGroup className={'form-button-group'} align={'end'}>
        <Reset>取消</Reset>
        {statusable && (
          <FormSpy
            selector={[
              LifeCycleTypes.ON_FORM_MOUNT,
              LifeCycleTypes.ON_FORM_SUBMIT_START,
              LifeCycleTypes.ON_FORM_SUBMIT_END,
            ]}
            reducer={(state, action) => {
              switch (action.type) {
                case LifeCycleTypes.ON_FORM_SUBMIT_START:
                  return {
                    ...state,
                    submitting: true,
                  };
                case LifeCycleTypes.ON_FORM_SUBMIT_END:
                  return {
                    ...state,
                    submitting: false,
                  };
                default:
                  return state;
              }
            }}
          >
            {({ state, form }) => {
              const [submitting, setSubmitting] = useState(false);
              return (
                <Button
                  onClick={e => {
                    setSubmitting(true);
                    form.getFormState(state => {
                      (async () => {
                        resourceKey
                          ? await api.resource(resourceName).update({
                              associatedKey,
                              resourceKey,
                              values: {
                                ...state.values,
                                status: 'draft',
                              },
                            })
                          : await api.resource(resourceName).create({
                              associatedKey,
                              values: {
                                ...state.values,
                                status: 'draft',
                              },
                            });
                        await form.reset({
                          validate: false,
                        });
                        onDraft &&
                          (await onDraft({
                            ...state.values,
                            status: 'draft',
                          }));
                        setSubmitting(false);
                      })();
                    });
                  }}
                  {...props}
                  htmlType={'button'}
                  loading={submitting}
                >
                  {'保存草稿'}
                </Button>
              );
            }}
          </FormSpy>
        )}
        <Submit>确定</Submit>
      </FormButtonGroup>
    </SchemaForm>
  );
}
