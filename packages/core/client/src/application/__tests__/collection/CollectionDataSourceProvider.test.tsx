import React from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  useCollectionDataSourceName,
  CollectionDataSourceProvider,
} from '../../collection/CollectionDataSourceProvider';
import { CollectionManagerProviderV2 } from '../../collection';
import { Application } from '../../Application';

describe('CollectionDataSourceProvider', () => {
  test('should work', () => {
    const app = new Application({
      collectionManager: {
        dataSources: [
          {
            key: 'a',
            displayName: 'a',
          },
        ],
      },
    });
    const Demo = () => {
      const name = useCollectionDataSourceName();
      return <div data-testid="content">{name}</div>;
    };

    render(
      <CollectionManagerProviderV2 collectionManager={app.collectionManager}>
        <CollectionDataSourceProvider dataSource={'a'}>
          <Demo />
        </CollectionDataSourceProvider>
      </CollectionManagerProviderV2>,
    );

    expect(screen.getByTestId('content')).toHaveTextContent('a');
  });
});
