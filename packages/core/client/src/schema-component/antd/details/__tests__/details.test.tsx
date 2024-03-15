import { render, screen } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe('Details', () => {
  it('should render correctly', () => {
    render(<App1 />);

    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
