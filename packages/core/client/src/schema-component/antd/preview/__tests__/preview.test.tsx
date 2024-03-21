import { render } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe('Preview', () => {
  it('should render correctly', () => {
    const { queryAllByText } = render(<App1 />);

    expect(queryAllByText('s33766399').length).toBe(2);
    expect(queryAllByText('简历').length).toBe(2);
  });
});
