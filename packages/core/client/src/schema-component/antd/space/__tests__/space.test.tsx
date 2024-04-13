import { render } from '@testing-library/react';
import React from 'react';
import { Space } from '../index';

describe('Space', () => {
  it('renders without error', () => {
    const { container } = render(<Space />);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('renders with custom split', () => {
    const { container } = render(<Space split="|" />);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });
});
