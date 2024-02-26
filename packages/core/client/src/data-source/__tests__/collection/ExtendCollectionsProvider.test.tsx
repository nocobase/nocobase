import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ExtendCollectionsProvider,
  Application,
  DataSourceManagerProvider,
  CollectionManagerProvider,
  useCollectionManager,
} from '@nocobase/client';
import { useDataSourceKey } from '../../data-source/DataSourceProvider';

describe('ExtendCollectionsProvider', () => {
  const app = new Application({
    dataSourceManager: {
      dataSources: [
        {
          key: 'test',
          displayName: 'test',
        },
      ],
    },
  });

  const TestComponent = () => {
    const cm = useCollectionManager();
    const dataSourceKey = useDataSourceKey();
    const collections = cm.getCollections();
    return (
      <>
        <div data-testid="data-source">{dataSourceKey}</div>
        <div data-testid="collections">
          {collections.map((collection) => (
            <div key={collection.name}>{collection.name}</div>
          ))}
        </div>
      </>
    );
  };

  const App = ({ children }) => {
    return (
      <DataSourceManagerProvider dataSourceManager={app.dataSourceManager}>
        <CollectionManagerProvider dataSource="test">{children}</CollectionManagerProvider>
      </DataSourceManagerProvider>
    );
  };

  test('should provide extend collections', () => {
    const collections = [{ name: 'collection1' }, { name: 'collection2' }];

    render(
      <App>
        <ExtendCollectionsProvider collections={collections}>
          <TestComponent />
        </ExtendCollectionsProvider>
      </App>,
    );

    expect(screen.getByTestId('collections')).toHaveTextContent('collection1');
    expect(screen.getByTestId('collections')).toHaveTextContent('collection2');

    expect(screen.getByTestId('data-source')).toHaveTextContent('test');
  });

  it('extends parent collections with the given ones', () => {
    render(
      <App>
        <ExtendCollectionsProvider collections={[{ name: 'collection1' }]}>
          <ExtendCollectionsProvider collections={[{ name: 'collection2' }]}>
            <TestComponent />
          </ExtendCollectionsProvider>
        </ExtendCollectionsProvider>
      </App>,
    );

    expect(screen.getByTestId('collections')).toHaveTextContent('collection1');
    expect(screen.getByTestId('collections')).toHaveTextContent('collection2');

    expect(screen.getByTestId('data-source')).toHaveTextContent('test');
  });
});
