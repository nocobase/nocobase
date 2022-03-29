import { FormLayout } from '@formily/antd';
import { createForm, Field } from '@formily/core';
import { FieldContext, FormContext, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { useMemo } from 'react';
import { useAttach, useComponent } from '../..';

export interface FormProps {
  [key: string]: any;
}

const FormComponent: React.FC<FormProps> = (props) => {
  const { form, children, ...others } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'} {...others}>
          <RecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties />
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const Def = (props: any) => props.children;

const FormDecorator: React.FC<FormProps> = (props) => {
  const { form, children, ...others } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  const Component = useComponent(fieldSchema['x-component'], Def);
  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'} {...others}>
          <FieldContext.Provider value={f}>
            <Component {...field.componentProps}>
              <RecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties />
            </Component>
          </FieldContext.Provider>
          {/* <FieldContext.Provider value={f}>{children}</FieldContext.Provider> */}
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const WithForm = (props) => {
  const fieldSchema = useFieldSchema();
  return fieldSchema['x-decorator'] === 'Form' ? <FormDecorator {...props} /> : <FormComponent {...props} />;
};

const WithoutForm = (props) => {
  const fieldSchema = useFieldSchema();
  const form = useMemo(() => createForm(), []);
  return fieldSchema['x-decorator'] === 'Form' ? (
    <FormDecorator form={form} {...props} />
  ) : (
    <FormComponent form={form} {...props} />
  );
};

export const Form: React.FC<FormProps> & { Designer?: any; ReadPrettyDesigner?: any } = observer((props) => {
  const { useProps, ...restProps } = props;
  const field = useField<Field>();
  const { form, ...otherProps } = useProps?.() || {};
  const others = { ...restProps, ...otherProps };
  return (
    <form>
      <Spin spinning={field.loading || false}>
        {form ? <WithForm form={form} {...others} /> : <WithoutForm {...others} />}
      </Spin>
    </form>
  );
});
