import React from 'react';
import { render } from 'testUtils';
import App1 from '../demos/demo1';

describe('Preview', () => {
  it('should render correctly', () => {
    const { getByText } = render(<App1 />);

    expect(getByText('s33766399')).toBeInTheDocument();
    expect(getByText('简历')).toBeInTheDocument();
  });
});
