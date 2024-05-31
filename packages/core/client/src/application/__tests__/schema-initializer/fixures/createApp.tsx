/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer } from '@formily/reactive-react';
import { renderAppOptions } from '@nocobase/test/client';
import {
  SchemaComponent,
  SchemaInitializer,
  useSchemaInitializer,
  useSchemaInitializerItem,
  SchemaInitializerItem,
  useSchemaInitializerRender,
} from '@nocobase/client';

export async function createApp(options = {}, appOptions = {}) {
  const testInitializers = new SchemaInitializer({
    name: 'test',
    title: 'Test',
    items: [
      {
        name: 'demo',
        title: 'Item',
        Component: () => {
          const { insert } = useSchemaInitializer();
          const { title } = useSchemaInitializerItem();
          const handleClick = () => {
            insert({
              type: 'void',
              'x-component': 'div',
              'x-content': 'Hello World!',
            });
          };
          return <SchemaInitializerItem title={title} onClick={handleClick} />;
        },
      },
    ],
    ...options,
  });

  const AddBlockButton = observer(() => {
    const { render } = useSchemaInitializerRender('test');

    return <div data-testid="render">{render()}</div>;
  });

  const WrapDemo = ({ children }) => {
    return (
      <div>
        <h1>WrapDemo</h1>
        {children}
      </div>
    );
  };

  const Page = observer(
    (props) => {
      return (
        <div>
          {props.children}
          <AddBlockButton />
        </div>
      );
    },
    { displayName: 'Page' },
  );

  const Root = () => {
    return (
      <SchemaComponent
        components={{ Page, WrapDemo }}
        schema={{
          name: 'root',
          type: 'void',
          'x-component': 'Page',
        }}
      />
    );
  };
  await renderAppOptions({
    appOptions: {
      providers: [Root],
      schemaInitializers: [testInitializers],
      designable: true,
      ...appOptions,
    },
  });
}
