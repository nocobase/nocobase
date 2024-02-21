import React, { ComponentType, useEffect } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionManager,
  useCollectionManager,
  useCollections,
  Application,
  DataSourceApplicationProvider,
  CollectionManagerProvider,
  ExtendCollectionsProvider,
} from '@nocobase/client';
import collections from '../collections.json';

function renderApp(Demo: ComponentType, dataSource?: string) {
  const app = new Application({
    dataSourceManager: {
      collections: collections as any,
      dataSources: [
        {
          key: 'a',
          displayName: 'a',
          collections: [collections[0]] as any,
        },
      ],
    },
  });
  return render(
    <DataSourceApplicationProvider dataSourceManager={app.dataSourceManager} dataSource={dataSource}>
      <Demo></Demo>
    </DataSourceApplicationProvider>,
  );
}

describe('CollectionManagerProvider', () => {
  test('should render', () => {
    const Demo = () => {
      const cm = useCollectionManager();
      useEffect(() => {
        expect(cm instanceof CollectionManager).toBeTruthy();
      }, [cm]);
      const users = cm.getCollection('users');
      return <div data-testid="demo">{users.name}</div>;
    };
    renderApp(Demo);

    expect(screen.getByTestId('demo')).toHaveTextContent('users');
  });

  test('useCollections()', () => {
    const Demo = () => {
      const collections = useCollections();
      return <div data-testid="demo">{collections.length}</div>;
    };
    renderApp(Demo);

    expect(screen.getByTestId('demo')).toHaveTextContent('2');
  });

  test('useCollections({ predicate })', () => {
    const Demo = () => {
      const collections = useCollections((collection) => collection.name === 'users');
      return <div data-testid="demo">{collections.length}</div>;
    };
    renderApp(Demo);

    expect(screen.getByTestId('demo')).toHaveTextContent('1');
  });

  test('useCollections() with dataSource', () => {
    const Demo = () => {
      const collections = useCollections();
      return <div data-testid="demo">{collections.length}</div>;
    };
    renderApp(Demo, 'a');

    expect(screen.getByTestId('demo')).toHaveTextContent('1');
  });

  test('extend collections by props', () => {
    const Demo = () => {
      const collections = useCollections();
      return <div data-testid="demo">{collections.length}</div>;
    };

    const Wrapper = () => {
      return (
        <CollectionManagerProvider collections={[collections[1] as any]}>
          <Demo></Demo>
        </CollectionManagerProvider>
      );
    };

    renderApp(Wrapper, 'a');

    expect(screen.getByTestId('demo')).toHaveTextContent('2');
  });

  test('extend collections by ExtendCollectionsProvider', () => {
    const Demo = () => {
      const collections = useCollections();
      return <div data-testid="demo">{collections.length}</div>;
    };

    const Wrapper = () => {
      return (
        <ExtendCollectionsProvider collections={[collections[1] as any]}>
          <CollectionManagerProvider>
            <Demo></Demo>
          </CollectionManagerProvider>
        </ExtendCollectionsProvider>
      );
    };

    renderApp(Wrapper, 'a');

    expect(screen.getByTestId('demo')).toHaveTextContent('2');
  });
});
