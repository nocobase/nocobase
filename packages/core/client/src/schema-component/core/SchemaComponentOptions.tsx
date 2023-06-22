import { ExpressionScope, SchemaComponentsContext, SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useApp } from '../../application-v2';
import { ISchemaComponentOptionsProps } from '../types';

export const useSchemaOptionsContext = () => {
  const options = useContext(SchemaOptionsContext);
  return options || {};
};

export const SchemaComponentOptions: React.FC<ISchemaComponentOptionsProps> = (props) => {
  const { children } = props;
  const options = useSchemaOptionsContext();
  const app = useApp();
  const components = { ...app.components, ...options.components, ...props.components };
  const scope = { ...app.scopes, ...options.scope, ...props.scope };
  return (
    <SchemaOptionsContext.Provider value={{ scope, components }}>
      <SchemaComponentsContext.Provider value={components}>
        <ExpressionScope value={scope}>{children}</ExpressionScope>
      </SchemaComponentsContext.Provider>
    </SchemaOptionsContext.Provider>
  );
};
