import React from 'react';
import { render, screen } from 'testUtils';
import App1 from '../demos/demo1';

describe('FormItem', () => {
  it('should render correctly', () => {
    render(<App1 />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });
});
