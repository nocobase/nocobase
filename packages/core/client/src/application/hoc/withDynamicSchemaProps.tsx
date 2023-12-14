import React, { ComponentType, useMemo } from 'react';
import { merge } from 'lodash';
import { useDesignable, useSchemaComponentContext } from '../../schema-component';

const useDefaultSchemaProps = () => undefined;

interface WithSchemaHookOptions {
  displayName?: string;
}

export function withDynamicSchemaProps<T = any>(Component: ComponentType<T>, options: WithSchemaHookOptions = {}) {
  const displayName = options.displayName || Component.displayName || Component.name;
  const ComponentWithProps: ComponentType<T> = (props) => {
    const { dn } = useDesignable();
    const { scope } = useSchemaComponentContext();
    const useComponentPropsStr = useMemo(() => {
      if (dn.getSchemaAttribute('x-component')) {
        return dn.getSchemaAttribute('x-use-component-props');
      }
      if (dn.getSchemaAttribute('x-decorator')) {
        return dn.getSchemaAttribute('x-use-decorator-props');
      }
    }, [dn]);
    const useSchemaProps = useMemo(() => {
      let res = undefined;
      if (useComponentPropsStr) {
        res = scope[useComponentPropsStr];
        if (!res) {
          console.error(`${useComponentPropsStr} is not registered`);
        }
      }
      return res || useDefaultSchemaProps;
    }, [scope, useComponentPropsStr]);
    const schemaProps = useSchemaProps(props);

    return <Component {...merge(schemaProps, props)} />;
  };

  Component.displayName = displayName;
  ComponentWithProps.displayName = `withSchemaProps(${displayName})`;

  return ComponentWithProps;
}
