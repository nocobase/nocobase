import React, { ComponentType } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  AssociationProvider,
  useCollectionField,
  useCollection,
  Application,
  SchemaComponent,
  SchemaComponentProvider,
  DataSourceApplicationProvider,
  useParentCollection,
} from '@nocobase/client';
import collections from '../collections.json';

function renderApp(Demo: ComponentType, props: any = {}) {
  const app = new Application({
    dataSourceManager: {
      collections: collections as any,
      dataSources: [
        {
          key: 'a',
          displayName: 'a',
          collections: collections as any,
        },
      ],
    },
  });

  const schema = {
    name: 'root',
    type: 'void',
    'x-component': 'Demo',
    'x-decorator': 'AssociationProvider',
    'x-decorator-props': props,
  };

  return render(
    <div data-testid="app">
      <SchemaComponentProvider designable={true}>
        <DataSourceApplicationProvider dataSourceManager={app.dataSourceManager}>
          <SchemaComponent schema={schema} components={{ Demo, AssociationProvider }} />
        </DataSourceApplicationProvider>
      </SchemaComponentProvider>
    </div>,
  );
}

describe('AssociationProvider', () => {
  test('should render', () => {
    const Demo = () => {
      const collection = useCollection();
      const parentCollection = useParentCollection();
      const collectionFiled = useCollectionField();
      return (
        <>
          <div data-testid="collection">{collection.name}</div>
          <div data-testid="parent-collection">{parentCollection.name}</div>
          <div data-testid="field">{collectionFiled.name}</div>
        </>
      );
    };

    renderApp(Demo, { name: 'users.roles' });

    expect(screen.getByTestId('collection')).toHaveTextContent('roles');
    expect(screen.getByTestId('parent-collection')).toHaveTextContent('users');
    expect(screen.getByTestId('field')).toHaveTextContent('roles');
  });

  test('should render with dataSource', () => {
    const Demo = () => {
      const collection = useCollection();
      const parentCollection = useParentCollection();
      const collectionFiled = useCollectionField();
      return (
        <>
          <div data-testid="collection">{collection.name}</div>
          <div data-testid="parent-collection">{parentCollection.name}</div>
          <div data-testid="field">{collectionFiled.name}</div>
        </>
      );
    };

    renderApp(Demo, { name: 'users.roles', dataSource: 'a' });

    expect(screen.getByTestId('collection')).toHaveTextContent('roles');
    expect(screen.getByTestId('parent-collection')).toHaveTextContent('users');
    expect(screen.getByTestId('field')).toHaveTextContent('roles');
  });

  test('not exists, should render `CollectionDeletedPlaceholder`', () => {
    const Demo = () => {
      return <div>Demo</div>;
    };
    renderApp(Demo, { name: 'users.not-exists' });

    expect(document.body.innerHTML).toContain('ant-result');
  });
});
