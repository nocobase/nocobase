import { createForm } from '@formily/core';
import {
  FormProvider as FormilyFormProvider,
  SchemaExpressionScopeContext,
  SchemaOptionsContext
} from '@formily/react';
import React, { useContext, useMemo } from 'react';
import { SchemaComponentOptions } from './SchemaComponentOptions';

export const FormProvider: React.FC<any> = (props) => {
  const { children, ...others } = props;
  let options = useContext(SchemaOptionsContext);
  const expressionScope = useContext(SchemaExpressionScopeContext);
  const scope = { ...options?.scope, ...expressionScope };
  const components = { ...options?.components };
  const form = useMemo(() => props.form || createForm(), []);
  return (
    <FormilyFormProvider {...others} form={form}>
      <SchemaComponentOptions components={components} scope={scope}>
        {children}
      </SchemaComponentOptions>
    </FormilyFormProvider>
  );
};
