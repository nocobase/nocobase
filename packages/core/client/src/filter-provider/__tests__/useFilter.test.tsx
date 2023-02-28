import { render } from '@testing-library/react';
import React from 'react';
import { FilterProvider, useFilter } from '../FilterProvider';

// TODO: make jest can parse css files
describe('useFilter', () => {
  test('should get a empty array', () => {
    let getDataBlocks = null;
    const Comp = () => {
      ({ getDataBlocks } = useFilter());
      return null;
    };
    const App = () => {
      return (
        <FilterProvider>
          <Comp />
        </FilterProvider>
      );
    };
    render(<App />);
    expect(getDataBlocks()).toEqual([]);
  });

  test('should not repeat', () => {
    let getDataBlocks = null,
      recordDataBlocks = null;
    const Comp = () => {
      ({ getDataBlocks, recordDataBlocks } = useFilter());
      return null;
    };
    const App = () => {
      return (
        <FilterProvider>
          <Comp />
        </FilterProvider>
      );
    };
    render(<App />);

    recordDataBlocks({
      name: 'test',
      collection: {},
      doFilter: () => {},
    });
    expect(getDataBlocks().length).toBe(1);

    // avoid repeat
    recordDataBlocks({
      name: 'test',
      collection: {},
      doFilter: () => {},
    });
    expect(getDataBlocks().length).toBe(1);
  });
});
