import { ExpressionScope, SchemaComponentsContext, SchemaOptionsContext } from '@formily/react';
import { lazyMerge } from '@formily/shared';
import React, { useContext } from 'react';
import { ISchemaComponentOptionsProps } from '../types';

const useSchemaOptionsContext = () => {
  const options = useContext(SchemaOptionsContext);
  return options || {};
};

export const SchemaComponentOptions: React.FC<ISchemaComponentOptionsProps> = (props) => {
  const { children } = props;
  const options = useSchemaOptionsContext();
  const components = lazyMerge(options.components, props.components);
  const scope = lazyMerge(options.scope, props.scope);
  return (
    <SchemaOptionsContext.Provider value={{ scope, components }}>
      <SchemaComponentsContext.Provider value={components}>
        <ExpressionScope value={scope}>{children}</ExpressionScope>
      </SchemaComponentsContext.Provider>
    </SchemaOptionsContext.Provider>
  );
};
