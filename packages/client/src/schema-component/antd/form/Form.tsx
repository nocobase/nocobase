import { FormLayout } from '@formily/antd';
import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Options, Result } from 'ahooks/lib/useRequest/src/types';
import { Spin } from 'antd';
import React, { createContext, useContext, useMemo } from 'react';
import { useAttach, useComponent } from '../..';
import { useRequest } from '../../../api-client';
import { useCollection } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

type Opts = Options<any, any> & { uid?: string };

export interface FormProps {
  [key: string]: any;
}

export type FormUseValues = (opts?: Opts, props?: FormProps) => Result<any, any>;

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

const useDef = (opts: any = {}, props: FormProps = {}) => {
  return useRequest(useRequestProps(props), opts);
};

const FormBlockContext = createContext<any>(null);

export const Form: React.FC<FormProps> & { Designer?: any } = observer((props) => {
  const { request, effects, initialValue, useValues = useDef, ...others } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const form = useMemo(() => createForm({ effects }), []);
  const result = useValues(
    {
      uid: fieldSchema['x-uid'],
      async onSuccess(data) {
        await form.reset();
        form.setValues(data?.data);
      },
    },
    props,
  );
  const parent = useContext(FormBlockContext);
  return (
    <FormBlockContext.Provider value={{ parent, form, result, field, fieldSchema }}>
      <Spin spinning={result?.loading || false}>
        {fieldSchema['x-decorator'] === 'Form' ? (
          <FormDecorator form={form} {...others} />
        ) : (
          <FormComponent form={form} {...others} />
        )}
      </Spin>
    </FormBlockContext.Provider>
  );
});

Form.Designer = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.Template componentName={'Form'} collectionName={name} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
