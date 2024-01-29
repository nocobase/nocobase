import React, { ComponentType } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionManagerProviderV2,
  CollectionProviderV2,
  useCollectionFieldsV2,
  useCollectionV2,
} from '../../collection';
import { Application } from '../../Application';
import collections from './collections.json';
import { SchemaComponentProvider } from '../../../schema-component';

function renderApp(Demo: ComponentType, props: any = {}) {
  const app = new Application({
    collectionManager: {
      collections: collections as any,
    },
  });
  return render(
    <div data-testid="app">
      <SchemaComponentProvider designable={true}>
        <CollectionManagerProviderV2 collectionManager={app.collectionManager}>
          <CollectionProviderV2 {...props}>
            <Demo></Demo>
          </CollectionProviderV2>
        </CollectionManagerProviderV2>
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

  test('collection not exists and { allowNull: false }, should render `DeletedPlaceholder` content', () => {
    const Demo = () => {
      const collection = useCollectionV2();
      expect(collection).toBeFalsy();

      return <div>children</div>;
    };

    renderApp(Demo, { name: 'not-exists', allowNull: false });

    expect(screen.getByText(`Collection: "not-exists" not exists`)).toBeInTheDocument();
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
