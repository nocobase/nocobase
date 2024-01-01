import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Options, Result } from 'ahooks/es/useRequest/src/types';
import { ConfigProvider, Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAttach, useComponent } from '../..';
import { useRequest } from '../../../api-client';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
  SchemaSettingsTemplate,
} from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useCollectionV2 } from '../../../application';

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
  const { form, children, disabled, ...others } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  const Component = useComponent(fieldSchema['x-component'], Def);
  useEffect(() => {
    form.disabled = disabled || field.disabled;
  }, [disabled, field.disabled]);
  return (
    <ConfigProvider componentDisabled={disabled}>
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
    </ConfigProvider>
  );
};

const getRequestParams = (props: any) => {
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

const useDefaultValues = (opts: any = {}, props: FormProps = {}) => {
  return useRequest(getRequestParams(props), opts);
};

const FormBlockContext = createContext<any>(null);

export const Form: React.FC<FormProps> & { Designer?: any } = observer(
  (props) => {
    const { request, effects, initialValue, useValues = useDefaultValues, ...others } = props;
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
  },
  { displayName: 'Form' },
);

Form.Designer = function Designer() {
  const collection = useCollectionV2();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner template={template} title={collection.title || collection.name}>
      <SchemaSettingsTemplate componentName={'Form'} collectionName={collection.name} />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
