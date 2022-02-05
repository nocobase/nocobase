import { FormLayout } from '@formily/antd';
import { createForm, FormPath } from '@formily/core';
import {
  FieldContext,
  FormContext,
  observer,
  SchemaContext,
  SchemaOptionsContext,
  useField,
  useFieldSchema
} from '@formily/react';
import { toJS } from '@formily/reactive';
import { Spin } from 'antd';
import React, { useContext, useMemo } from 'react';
import { SchemaComponent, useAttach } from '../..';
import { useRequest } from '../../../api-client';

type ComposedForm = React.FC<any> & {
  __NOCOBASE_FORM?: boolean;
};

const useFormDecorator = () => {
  const field = useField();
  const options = useContext(SchemaOptionsContext);
  const decorator = field.decoratorType ? FormPath.getIn(options?.components, field.decoratorType) : null;
  return decorator?.__NOCOBASE_FORM ? decorator : null;
};

const FormDecorator: React.FC<any> = (props) => {
  const { form } = props;
  const options = useContext(SchemaOptionsContext);
  const field = useField();
  const fieldSchema = useFieldSchema();
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  const finalComponent = FormPath.getIn(options?.components, field.componentType) ?? field.componentType;
  return (
    <FormContext.Provider value={form}>
      <SchemaContext.Provider value={fieldSchema}>
        <FieldContext.Provider value={f}>
          {React.createElement(finalComponent, toJS(field.componentProps))}
        </FieldContext.Provider>
      </SchemaContext.Provider>
    </FormContext.Provider>
  );
};

const FormComponent: React.FC<any> = (props) => {
  const { form } = props;
  const fieldSchema = useFieldSchema();
  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <SchemaComponent schema={fieldSchema} />
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const useRequestProps = (props: any) => {
  const { request, initialValue } = props;
  if (request) {
    return request;
  }
  return () => {
    return Promise.resolve({
      data: initialValue,
    });
  };
};

const useDefaultValues = (props: any = {}, opts: any = {}) => {
  return useRequest(useRequestProps(props), opts);
};

export const Form: ComposedForm = observer((props) => {
  const { request, initialValue, useValues = useDefaultValues, ...others } = props;
  const decorator = useFormDecorator();
  const fieldSchema = useFieldSchema();
  const form = useMemo(() => createForm(), []);
  const { loading } = useValues(props, {
    uid: fieldSchema['x-uid'],
    async onSuccess(data) {
      await form.reset();
      form.setValues(data?.data);
    },
  });
  return (
    <Spin spinning={loading}>
      <FormLayout layout={'vertical'} {...others}>
        {decorator ? <FormDecorator form={form} /> : <FormComponent form={form} />}
      </FormLayout>
    </Spin>
  );
});

Form.__NOCOBASE_FORM = true;
