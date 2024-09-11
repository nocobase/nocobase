/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Application,
  CollectionField,
  CollectionProvider,
  DataSourceApplicationProvider,
  FormItem,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useCollectionField,
} from '@nocobase/client';
import { render, screen } from '@nocobase/test/client';
import React from 'react';
import collections from '../collections.json';

function renderAppOptions(fieldName: string, components = {}) {
  const noUiSchema = {
    key: 'no-ui-schema',
    name: 'no-ui-schema',
    type: 'string',
    interface: 'select',
    description: null,
    collectionName: 't_vwpds9fs4xs',
    parentKey: null,
    reverseKey: null,
  };

  const useCustomDynamicProps = () => {
    return {
      addonBefore: 'addonBefore',
    };
  };

  const dynamicPropsSchema = {
    key: 'dynamic-props',
    name: 'dynamic-props',
    type: 'string',
    interface: 'select',
    description: null,
    collectionName: 't_vwpds9fs4xs',
    parentKey: null,
    reverseKey: null,
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'placeholder',
      },
      'x-use-component-props': 'useCustomDynamicProps',
    },
  };

  const usersCollection: any = collections[0];
  usersCollection.fields.push(noUiSchema);
  usersCollection.fields.push(dynamicPropsSchema);

  const app = new Application({
    dataSourceManager: {
      collections: [usersCollection],
    },
  });

  const schema = {
    name: 'root',
    type: 'object',
    properties: {
      [fieldName]: {
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
      },
    },
  };

  return render(
    <div data-testid="app">
      <SchemaComponentProvider designable={true}>
        <DataSourceApplicationProvider dataSourceManager={app.dataSourceManager}>
          <CollectionProvider name="users">
            <SchemaComponent
              schema={schema}
              scope={{ useCustomDynamicProps }}
              components={{ CollectionField: CollectionField, FormItem, Input, ...components }}
            />
          </CollectionProvider>
        </DataSourceApplicationProvider>
      </SchemaComponentProvider>
    </div>,
  );
}

describe('CollectionField', () => {
  it('works', () => {
    renderAppOptions('nickname');
    expect(screen.getByText('Nickname')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('ant-input');
  });

  it('context', () => {
    const Input = () => {
      const field = useCollectionField();
      return <div className={'input-test-1'}>{field?.name}</div>;
    };
    renderAppOptions('nickname', { Input });
    expect(document.querySelector('.input-test-1')).toHaveTextContent('nickname');
  });

  it('useComponentProps', () => {
    renderAppOptions('dynamic-props');
    expect(document.querySelector('.ant-input')).toHaveAttribute('placeholder', 'placeholder');
    expect(screen.queryByText('addonBefore')).toBeInTheDocument();
  });

  it('no schema', () => {
    renderAppOptions('no-ui-schema');
    expect(document.querySelector('.ant-formily-item-control-content-component')).toHaveTextContent('');
  });
});
