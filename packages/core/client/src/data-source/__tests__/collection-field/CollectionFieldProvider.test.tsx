import React, { ComponentType } from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionFieldProvider,
  CollectionProvider,
  useCollectionField,
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
          <CollectionProvider name="users">
            <CollectionFieldProvider name={name}>
              <Demo></Demo>
            </CollectionFieldProvider>
          </CollectionProvider>
        </DataSourceApplicationProvider>
      </SchemaComponentProvider>
    </div>,
  );
}

describe('CollectionFieldProvider', () => {
  test('useCollectionField() should get current field', () => {
    const Demo = () => {
      const field = useCollectionField();
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

    expect(document.body.innerHTML).toContain('ant-typography');
    expect(document.body.innerHTML).not.toContain('children');
  });
});
