import React from 'react';
import { render, screen } from '@testing-library/react';
import { useExtendCollections, ExtendCollectionsProvider } from '@nocobase/client';

describe('ExtendCollectionsProvider', () => {
  test('should provide extend collections', () => {
    const TestComponent = () => {
      const extendCollections = useExtendCollections();
      return (
        <div data-testid="demo">
          {extendCollections.map((collection) => (
            <div key={collection.name}>{collection.name}</div>
          ))}
        </div>
      );
    };

    const collections = [{ name: 'collection1' }, { name: 'collection2' }, { name: 'collection3' }];

    render(
      <ExtendCollectionsProvider collections={collections}>
        <TestComponent />
      </ExtendCollectionsProvider>,
    );

    expect(screen.getByTestId('demo')).toHaveTextContent('collection1');
    expect(screen.getByTestId('demo')).toHaveTextContent('collection2');
    expect(screen.getByTestId('demo')).toHaveTextContent('collection3');
  });
});
