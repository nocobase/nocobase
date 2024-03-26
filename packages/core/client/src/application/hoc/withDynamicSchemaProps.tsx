import { useExpressionScope } from '@formily/react';
import { merge, omit } from 'lodash';
import React, { ComponentType, useMemo } from 'react';
import { useDesignable } from '../../schema-component';

const useDefaultSchemaProps = () => undefined;

interface WithSchemaHookOptions {
  displayName?: string;
}

export function withDynamicSchemaProps<T = any>(Component: any, options: WithSchemaHookOptions = {}) {
  const displayName = options.displayName || Component.displayName || Component.name;
  const ComponentWithProps: ComponentType<T> = (props) => {
    const { dn, findComponent } = useDesignable();
    const scope = useExpressionScope();
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

    const memoProps = useMemo(() => {
      return merge(omit(props, 'children'), omit(schemaProps, 'children'));
    }, [schemaProps, props]);

    return <Component {...memoProps}>{props.children}</Component>;
  };

  Component.displayName = displayName;
  ComponentWithProps.displayName = `withSchemaProps(${displayName})`;

  return ComponentWithProps;
}
