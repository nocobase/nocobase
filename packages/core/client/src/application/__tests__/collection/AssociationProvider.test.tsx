import React, { ComponentType } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  AssociationProviderV2,
  CollectionManagerProviderV2,
  useCollectionFieldV2,
  useCollectionV2,
} from '../../collection';
import { Application } from '../../Application';
import collections from './collections.json';
import { SchemaComponentProvider } from '../../../schema-component';

function renderApp(Demo: ComponentType, props: any = {}) {
  const app = new Application({
    collectionManager: {
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
  return render(
    <div data-testid="app">
      <SchemaComponentProvider designable={true}>
        <CollectionManagerProviderV2 collectionManager={app.collectionManager}>
          <AssociationProviderV2 {...props}>
            <Demo></Demo>
          </AssociationProviderV2>
        </CollectionManagerProviderV2>
      </SchemaComponentProvider>
    </div>,
  );
}

describe('AssociationProvider', () => {
  test('should render', () => {
    const Demo = () => {
      const collection = useCollectionV2();
      const collectionFiled = useCollectionFieldV2();
      return (
        <>
          <div data-testid="collection">{collection.name}</div>
          <div data-testid="field">{collectionFiled.name}</div>
        </>
      );
    };

    renderApp(Demo, { name: 'users.roles' });

    expect(screen.getByTestId('collection')).toHaveTextContent('roles');
    expect(screen.getByTestId('field')).toHaveTextContent('roles');
  });

  test('should render with dataSource', () => {
    const Demo = () => {
      const collection = useCollectionV2();
      const collectionFiled = useCollectionFieldV2();
      return (
        <>
          <div data-testid="collection">{collection.name}</div>
          <div data-testid="field">{collectionFiled.name}</div>
        </>
      );
    };

    renderApp(Demo, { name: 'users.roles', dataSource: 'a' });

    expect(screen.getByTestId('collection')).toHaveTextContent('roles');
    expect(screen.getByTestId('field')).toHaveTextContent('roles');
  });

  test('not exists, should render `CollectionDeletedPlaceholder`', () => {
    const Demo = () => {
      return <div>children</div>;
    };
    renderApp(Demo, { name: 'users.not-exists' });

    expect(screen.getByTestId('app').innerHTML).not.toContain('children');
  });
});
