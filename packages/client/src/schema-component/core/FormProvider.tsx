import {
  FormProvider as FormilyFormProvider,
  IProviderProps,
  SchemaExpressionScopeContext,
  SchemaOptionsContext
} from '@formily/react';
import React, { useContext } from 'react';
import { SchemaComponentOptions } from './SchemaComponentOptions';

export const FormProvider: React.FC<IProviderProps> = (props) => {
  const { children, ...others } = props;
  let options = useContext(SchemaOptionsContext);
  const expressionScope = useContext(SchemaExpressionScopeContext);
  const scope = { ...options?.scope, ...expressionScope };
  const components = { ...options?.components };

  return (
    <FormilyFormProvider {...others}>
      <SchemaComponentOptions components={components} scope={scope}>
        {children}
      </SchemaComponentOptions>
    </FormilyFormProvider>
  );
};
