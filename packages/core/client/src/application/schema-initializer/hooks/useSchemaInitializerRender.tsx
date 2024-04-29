import { ButtonProps } from 'antd';
import React, { FC, useMemo } from 'react';
import { useApp } from '../../hooks';
import { SchemaInitializerItems } from '../components';
import { SchemaInitializerButton } from '../components/SchemaInitializerButton';
import { withInitializer } from '../withInitializer';
import { SchemaInitializerOptions } from '../types';

const InitializerComponent: FC<SchemaInitializerOptions<any, any>> = React.memo((options) => {
  const Component: any = options.Component || SchemaInitializerButton;

  const ItemsComponent: any = options.ItemsComponent || SchemaInitializerItems;
  const itemsComponentProps: any = {
    ...options.itemsComponentProps,
    options,
    items: options.items,
    style: options.itemsComponentStyle,
  };

  const C = useMemo(() => withInitializer(Component), [Component]);

  return React.createElement(C, options, React.createElement(ItemsComponent, itemsComponentProps));
});
InitializerComponent.displayName = 'InitializerComponent';

export function useSchemaInitializerRender<P1 = ButtonProps, P2 = {}>(
  name: string,
  options?: Omit<SchemaInitializerOptions<P1, P2>, 'name'>,
) {
  const app = useApp();
  const initializer = useMemo(
    () => app.schemaInitializerManager.get<P1, P2>(name),
    [app.schemaInitializerManager, name],
  );
  const res = useMemo(() => {
    if (!name) {
      return {
        exists: false,
        render: () => null,
      };
    }

    if (!initializer) {
      console.error(`[nocobase]: SchemaInitializer "${name}" not found`);
      return {
        exists: false,
        render: () => null,
      };
    }
    return {
      exists: true,
      render: (props?: Omit<SchemaInitializerOptions<P1, P2>, 'name'>) => {
        return React.createElement(InitializerComponent, {
          ...initializer.options,
          ...options,
          ...props,
        });
      },
    };
  }, [initializer, name, options]);

  return res;
}
