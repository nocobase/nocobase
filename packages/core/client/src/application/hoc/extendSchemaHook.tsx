import React, { ComponentType, useMemo } from 'react';
import { merge } from 'lodash';
import { useDesignable, useSchemaComponentContext } from '../../schema-component';

const useDefaultSchemaProps = () => undefined;

export function extendSchemaHook(schemaProperty: string) {
  function withSchemaHook<T = any>(Component: ComponentType<T>) {
    const ComponentWithProps: ComponentType<T> = (props) => {
      const { dn } = useDesignable();
      const { scope } = useSchemaComponentContext();
      const useComponentPropsStr = dn.getSchemaAttribute(schemaProperty);
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
      const schemaProps = useSchemaProps();

      return <Component {...merge(schemaProps, props)} />;
    };

    ComponentWithProps.displayName = `${Component.displayName || Component.name}(${schemaProperty})`;

    return ComponentWithProps;
  }

  return withSchemaHook;
}

export const withSchemaDecoratorProps = extendSchemaHook('x-use-decorator-props');
export const withSchemaComponentProps = extendSchemaHook('x-use-component-props');
