import React, { ComponentType } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionFieldProviderV2,
  CollectionProviderV2,
  useCollectionFieldV2,
  Application,
  SchemaComponentProvider,
  DataSourceApplicationProvider,
} from '@nocobase/client';
import collections from '../collections.json';

function renderApp(Demo: ComponentType, name?: string) {
  const app = new Application({
    dataSourceManager: {
      collections: collections as any,
    },
  });
  return render(
    <div data-testid="app">
      <SchemaComponentProvider designable={true}>
        <DataSourceApplicationProvider dataSourceManager={app.dataSourceManager}>
          <CollectionProviderV2 name="users">
            <CollectionFieldProviderV2 name={name}>
              <Demo></Demo>
            </CollectionFieldProviderV2>
          </CollectionProviderV2>
        </DataSourceApplicationProvider>
      </SchemaComponentProvider>
    </div>,
  );
}

describe('CollectionFieldProvider', () => {
  test('useCollectionFieldV2() should get current field', () => {
    const Demo = () => {
      const field = useCollectionFieldV2();
      return (
        <>
          <div data-testid="demo">{field.name}</div>
        </>
      );
    };

    renderApp(Demo, 'nickname');

    expect(screen.getByTestId('demo')).toHaveTextContent('nickname');
  });

  test('field not exists, should render `CollectionDeletedPlaceholder`', () => {
    const Demo = () => {
      return <div>children</div>;
    };

    renderApp(Demo, 'not-exists');

    expect(screen.getByTestId('app').innerHTML).toContain('ant-result');
    expect(screen.getByTestId('app').innerHTML).not.toContain('children');
  });
});
