import React, { ComponentType } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionProviderV2,
  useCollectionFieldsV2,
  useCollectionV2,
  Application,
  SchemaComponent,
  SchemaComponentProvider,
  DataSourceApplicationProvider,
} from '@nocobase/client';
import collections from '../collections.json';

function renderApp(Demo: ComponentType, props: any = {}) {
  const app = new Application({
    dataSourceManager: {
      collections: collections as any,
    },
  });
  const schema = {
    name: 'root',
    type: 'void',
    'x-component': 'Demo',
    'x-decorator': 'CollectionProviderV2',
    'x-decorator-props': props,
  };

  return render(
    <div data-testid="app">
      <SchemaComponentProvider designable={true}>
        <DataSourceApplicationProvider dataSourceManager={app.dataSourceManager}>
          <SchemaComponent schema={schema} components={{ Demo, CollectionProviderV2 }} />
        </DataSourceApplicationProvider>
      </SchemaComponentProvider>
    </div>,
  );
}

describe('CollectionProvider', () => {
  test('should render', () => {
    const Demo = () => {
      const collection = useCollectionV2();
      const collectionFields = useCollectionFieldsV2();
      return (
        <>
          <div data-testid="name">{collection.name}</div>
          <div data-testid="fields">{collectionFields.length}</div>
        </>
      );
    };

    renderApp(Demo, { name: 'users' });

    expect(screen.getByTestId('name')).toHaveTextContent('users');

    const usersOptions = collections.find((item) => item.name === 'users');
    expect(screen.getByTestId('fields')).toHaveTextContent(String(usersOptions.fields.length));
  });

  test('collection not exists and { allowNull: true }, should render children', () => {
    const Demo = () => {
      const collection = useCollectionV2();
      expect(collection).toBeFalsy();

      return <div data-testid="children">children</div>;
    };

    renderApp(Demo, { name: 'not-exists', allowNull: true });

    expect(screen.getByTestId('children')).toHaveTextContent('children');
  });

  test('collection not exists and { allowNull: false }, should render `CollectionDeletedPlaceholder` content', () => {
    const Demo = () => {
      const collection = useCollectionV2();
      expect(collection).toBeFalsy();

      return <div>children</div>;
    };

    renderApp(Demo, { name: 'not-exists', allowNull: false });

    expect(document.body.innerHTML).toContain('ant-result');
  });

  test('useCollectionFieldsV2() support predicate', () => {
    const Demo = () => {
      const fields = useCollectionFieldsV2({ name: 'id' });
      return <div data-testid="fields">{fields.length}</div>;
    };

    renderApp(Demo, { name: 'users' });

    expect(screen.getByTestId('fields')).toHaveTextContent('1');
  });
});
