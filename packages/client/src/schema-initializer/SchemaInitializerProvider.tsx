import { isPlainObj } from '@formily/shared';
import React, { createContext, useContext } from 'react';
import { SchemaComponentOptions } from '../schema-component';
import { initializes as globals, items } from './Initializers';
import { SchemaInitializer } from './SchemaInitializer';

const SchemaInitializerContext = createContext(null);

export interface SchemaInitializerProviderProps {
  components?: any;
  initializers?: Record<string, any>;
}

export const useSchemaInitializer = (name: string) => {
  const initializers = useContext(SchemaInitializerContext);

  const render = (component?: any, props?: any) => {
    return component && React.createElement(component, props);
  };

  if (!name) {
    return { exists: false, render };
  }

  const initializer = initializers?.[name];

  if (!initializer) {
    return { exists: false, render };
  }

  if (isPlainObj(initializer)) {
    return {
      exists: true,
      render: (props?: any) => {
        const component = (initializer as any).component || SchemaInitializer.Button;
        return render(component, { ...initializer, ...props });
      },
    };
  }

  return {
    exists: true,
    render: (props?: any) => render(initializer, props),
  };
};

export const SchemaInitializerProvider: React.FC<SchemaInitializerProviderProps> = (props) => {
  const { initializers, components, children } = props;

  return (
    <SchemaInitializerContext.Provider value={{ ...globals, ...initializers }}>
      <SchemaComponentOptions components={{ ...items, ...components }}>{children}</SchemaComponentOptions>
    </SchemaInitializerContext.Provider>
  );
};
