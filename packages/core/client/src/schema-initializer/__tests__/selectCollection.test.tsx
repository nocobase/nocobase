import React, { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { SelectCollection } from '../SelectCollection';
import { CollectionManagerProvider } from '../../collection-manager/CollectionManagerProvider';
import collectionsData from '../../collection-manager/__tests__/collections';

const ComponentA = ({fakeCb}) => {
  const [value, onChange] = useState(null);
  return (
    <CollectionManagerProvider collections={collectionsData}>
      <SelectCollection value={value} onChange={onChange} setSelected={fakeCb} />
      {[value]}
    </CollectionManagerProvider>
  );
};

describe('SelectCollection', () => {
  it('SelectCollection', async () => {
    const fakeCb = jest.fn();
    const { container } = render(<ComponentA fakeCb={fakeCb} />);
    const collection_input = screen.queryByPlaceholderText(/Search and select collection/i);
    fireEvent.change(collection_input, {
        target: { value: 'c' },
    });
    expect(collection_input).toHaveValue('c');
    expect(fakeCb).toHaveBeenCalledTimes(1);
    expect(container).toMatchSnapshot();
  });
});

