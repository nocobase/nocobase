import React, { ComponentType, useMemo } from 'react';
import { useDesignable, useSchemaComponentContext } from '../../schema-component';

const useDefaultSchemaProps = () => undefined;

interface WithSchemaHookOptions {
  displayName?: string;
}

export function withDynamicSchemaProps<T = any>(Component: ComponentType<T>, options: WithSchemaHookOptions = {}) {
  const displayName = options.displayName || Component.displayName || Component.name;
  const ComponentWithProps: ComponentType<T> = (props) => {
    const { dn, findComponent } = useDesignable();
    const { scope } = useSchemaComponentContext();
    const useComponentPropsStr = useMemo(() => {
      const xComponent = dn.getSchemaAttribute('x-component');
      const xDecorator = dn.getSchemaAttribute('x-decorator');
      const xUseComponentProps = dn.getSchemaAttribute('x-use-component-props');
      const xUseDecoratorProps = dn.getSchemaAttribute('x-use-decorator-props');

      if (xComponent && xUseComponentProps && findComponent(xComponent) === ComponentWithProps) {
        return xUseComponentProps;
      }

      if (xDecorator && xUseDecoratorProps && findComponent(xDecorator) === ComponentWithProps) {
        return xUseDecoratorProps;
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

    return <Component {...props} {...schemaProps} />;
  };

  Component.displayName = displayName;
  ComponentWithProps.displayName = `withSchemaProps(${displayName})`;

  return ComponentWithProps;
}
