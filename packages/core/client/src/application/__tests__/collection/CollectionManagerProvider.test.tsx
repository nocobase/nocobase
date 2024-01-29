import React, { ComponentType, useEffect } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionManagerProviderV2,
  CollectionManagerV2,
  useCollectionManagerV2,
  useCollectionsV2,
} from '../../collection';
import { Application } from '../../Application';
import collections from './collections.json';

function renderApp(Demo: ComponentType) {
  const app = new Application({
    collectionManager: {
      collections: collections as any,
      dataSources: [
        {
          name: 'a',
          description: 'a',
          collections: [collections[0]] as any,
        },
      ],
    },
  });
  return render(
    <CollectionManagerProviderV2 collectionManager={app.collectionManager}>
      <Demo></Demo>
    </CollectionManagerProviderV2>,
  );
}

describe('CollectionManagerProvider', () => {
  test('should render', () => {
    const Demo = () => {
      const cm = useCollectionManagerV2();
      useEffect(() => {
        expect(cm instanceof CollectionManagerV2).toBeTruthy();
      }, [cm]);
      const users = cm.getCollection('users');
      return <div data-testid="demo">{users.name}</div>;
    };
    renderApp(Demo);

    expect(screen.getByTestId('demo')).toHaveTextContent('users');
  });

  test('useCollectionsV2()', () => {
    const Demo = () => {
      const collections = useCollectionsV2();
      return <div data-testid="demo">{collections.length}</div>;
    };
    renderApp(Demo);

    expect(screen.getByTestId('demo')).toHaveTextContent('2');
  });

  test('useCollectionsV2({ predicate })', () => {
    const Demo = () => {
      const collections = useCollectionsV2({
        predicate: (collection) => collection.name === 'users',
      });
      return <div data-testid="demo">{collections.length}</div>;
    };
    renderApp(Demo);

    expect(screen.getByTestId('demo')).toHaveTextContent('1');
  });

  test('useCollectionsV2({ dataSource })', () => {
    const Demo = () => {
      const collections = useCollectionsV2({
        dataSource: 'a',
      });
      return <div data-testid="demo">{collections.length}</div>;
    };
    renderApp(Demo);

    expect(screen.getByTestId('demo')).toHaveTextContent('1');
  });
});
