/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import React, { FC, useMemo } from 'react';
import { useOpenModeContext } from '../../../modules/popup/OpenModeProvider';
import { useApp } from '../../hooks';
import { SchemaInitializerItems } from '../components';
import { SchemaInitializerButton } from '../components/SchemaInitializerButton';
import { SchemaInitializer } from '../SchemaInitializer';
import { SchemaInitializerOptions } from '../types';
import { withInitializer } from '../withInitializer';

const InitializerComponent: FC<SchemaInitializerOptions<any, any>> = (options) => {
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
};

InitializerComponent.displayName = 'InitializerComponent';

export function useSchemaInitializerRender<P1 = ButtonProps, P2 = {}>(
  name: string | SchemaInitializer<P1, P2>,
  options?: Omit<SchemaInitializerOptions<P1, P2>, 'name'>,
) {
  const app = useApp();
  const { isMobile } = useOpenModeContext() || {};

  // compatible with mobile
  // TODO: delete this code
  if (
    name === 'popup:common:addBlock' &&
    app.schemaInitializerManager.has('mobile:popup:common:addBlock') &&
    isMobile
  ) {
    name = 'mobile:popup:common:addBlock';
  }

  const initializer = useMemo(
    () => (typeof name === 'object' ? name : app.schemaInitializerManager.get<P1, P2>(name)),
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
