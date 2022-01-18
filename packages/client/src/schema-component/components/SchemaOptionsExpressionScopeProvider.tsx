import React, { useContext } from 'react';
import { SchemaOptionsContext, SchemaExpressionScopeContext } from '@formily/react';
import { SchemaComponentContext } from '../context';

export const SchemaOptionsExpressionScopeProvider: React.FC = (props) => {
  const { components, scope } = useContext(SchemaComponentContext);
  return (
    <SchemaOptionsContext.Provider
      value={{
        scope,
        components,
      }}
    >
      <SchemaExpressionScopeContext.Provider value={{ scope }}>{props.children}</SchemaExpressionScopeContext.Provider>
    </SchemaOptionsContext.Provider>
  );
};
