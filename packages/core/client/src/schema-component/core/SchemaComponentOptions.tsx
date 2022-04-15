import { SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { ISchemaComponentOptionsProps } from '../types';

export const SchemaComponentOptions: React.FC<ISchemaComponentOptionsProps> = (props) => {
  const { inherit } = props;
  let options = useContext(SchemaOptionsContext);
  const expressionScope = useContext(SchemaExpressionScopeContext);
  const scope = { ...options?.scope, ...expressionScope, ...props.scope };
  const components = { ...options?.components, ...props.components };
  return (
    <SchemaOptionsContext.Provider value={{ scope, components }}>
      <SchemaExpressionScopeContext.Provider value={scope}>{props.children}</SchemaExpressionScopeContext.Provider>
    </SchemaOptionsContext.Provider>
  );
};
