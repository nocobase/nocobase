import React, { useContext, useMemo } from 'react';
import { toJS } from '@formily/reactive';
import { createForm, FormPath } from '@formily/core';
import {
  FieldContext,
  FormContext,
  FormProvider,
  observer,
  SchemaContext,
  SchemaOptionsContext,
  useField,
  useFieldSchema,
} from '@formily/react';
import { useAttach } from './useAttach';
import { SchemaComponent } from '../schema-component';

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

export const Form: ComposedForm = observer((props) => {
  const form = useMemo(() => createForm(), []);
  const fieldSchema = useFieldSchema();
  const decorator = useFormDecorator();
  return decorator ? (
    <FormDecorator form={form} />
  ) : (
    <FormProvider form={form}>
      <SchemaComponent schema={fieldSchema} />
    </FormProvider>
  );
});

Form.__NOCOBASE_FORM = true;
