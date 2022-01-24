import { RecursionField, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { SchemaComponentContext } from '../context';
import { IRecursionComponentProps } from '../types';

export const RecursionComponent: React.FC<IRecursionComponentProps> = (props) => {
  const { components, scope } = useContext(SchemaComponentContext);
  return (
    <SchemaOptionsContext.Provider
      value={{
        scope: { ...scope, ...props.scope },
        components: { ...components, ...props.components },
      }}
    >
      <SchemaExpressionScopeContext.Provider value={{ ...scope, ...props.scope }}>
        <RecursionField {...props} />
      </SchemaExpressionScopeContext.Provider>
    </SchemaOptionsContext.Provider>
  );
};
