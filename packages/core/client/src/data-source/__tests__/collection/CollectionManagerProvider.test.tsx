import React, { ComponentType, useEffect } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionManagerV2,
  useCollectionManagerV2,
  useCollectionsV2,
  Application,
  DataSourceApplicationProvider,
  CollectionManagerProviderV2,
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
      const collections = useCollectionsV2((collection) => collection.name === 'users');
      return <div data-testid="demo">{collections.length}</div>;
    };
    renderApp(Demo);

    expect(screen.getByTestId('demo')).toHaveTextContent('1');
  });

  test('useCollectionsV2() with dataSource', () => {
    const Demo = () => {
      const collections = useCollectionsV2();
      return <div data-testid="demo">{collections.length}</div>;
    };
    renderApp(Demo, 'a');

    expect(screen.getByTestId('demo')).toHaveTextContent('1');
  });

  test('extend collections by props', () => {
    const Demo = () => {
      const collections = useCollectionsV2();
      return <div data-testid="demo">{collections.length}</div>;
    };

    const Wrapper = () => {
      return (
        <CollectionManagerProviderV2 collections={[collections[1] as any]}>
          <Demo></Demo>
        </CollectionManagerProviderV2>
      );
    };

    renderApp(Wrapper, 'a');

    expect(screen.getByTestId('demo')).toHaveTextContent('2');
  });

  test('extend collections by ExtendCollectionsProvider', () => {
    const Demo = () => {
      const collections = useCollectionsV2();
      return <div data-testid="demo">{collections.length}</div>;
    };

    const Wrapper = () => {
      return (
        <ExtendCollectionsProvider collections={[collections[1] as any]}>
          <CollectionManagerProviderV2>
            <Demo></Demo>
          </CollectionManagerProviderV2>
        </ExtendCollectionsProvider>
      );
    };

    renderApp(Wrapper, 'a');

    expect(screen.getByTestId('demo')).toHaveTextContent('2');
  });
});
