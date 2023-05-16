import { useFieldSchema } from '@formily/react';
import { isPlainObj } from '@formily/shared';
import get from 'lodash/get';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { SchemaComponentOptions } from '../schema-component';
import { SchemaInitializer } from './SchemaInitializer';
import * as globals from './buttons';
import * as initializerComponents from './components';
import * as items from './items';

export const SchemaInitializerContext = createContext<any>({});

export interface SchemaInitializerProviderProps {
  components?: any;
  initializers?: Record<string, any>;
}

export const useSchemaInitializer = (name: string, props = {}) => {
  const fieldSchema = useFieldSchema();
  const initializers = useContext(SchemaInitializerContext);
  const render = (component?: any, props?: any) => {
    return component && React.createElement(component, props);
  };

  const initializerPropsRef = useRef({});
  const initializer = name ? get(initializers, name || fieldSchema?.['x-initializer']) : null;
  const initializerProps = { ...props, ...fieldSchema?.['x-initializer-props'] };
  initializerPropsRef.current = initializerProps;

  const InitializerComponent = useMemo(() => {
    let C = React.Fragment;
    if (!initializer) {
      return C;
    } else if (isPlainObj(initializer)) {
      C = (initializer as any).component || SchemaInitializer.Button;
      return (p) => <C {...initializer} {...initializerPropsRef.current} {...p} />;
    } else {
      C = initializer;
      return (p) => <C {...initializerPropsRef.current} {...p} />;
    }
  }, [initializer]);

  if (!initializer) {
    return { exists: false, InitializerComponent, render: (props?: any) => render(null) };
  }

  if (isPlainObj(initializer)) {
    return {
      exists: true,
      InitializerComponent,
      render: (props?: any) => {
        const component = (initializer as any).component || SchemaInitializer.Button;
        return render(component, { ...initializer, ...initializerProps, ...props });
      },
    };
  }

  return {
    exists: true,
    InitializerComponent,
    render: (props?: any) => render(initializer, { ...initializerProps, ...props }),
  };
};

export const SchemaInitializerPluginContext = createContext(null);

export const SchemaInitializerProvider: React.FC<SchemaInitializerProviderProps> = (props) => {
  const { initializers, components, children } = props;
  const parentInitializers = useContext(SchemaInitializerContext);

  return (
    <SchemaInitializerContext.Provider value={{ ...globals, ...parentInitializers, ...initializers }}>
      <SchemaComponentOptions components={{ ...items, ...components, ...initializerComponents }}>
        {children}
      </SchemaComponentOptions>
    </SchemaInitializerContext.Provider>
  );
};
