import { fireEvent, render, screen } from '@nocobase/test/client';
import React from 'react';
import App from '../demos/demo1';

describe('ColorSelect', () => {
  it('should display the value of user selected', async () => {
    const { container } = render(<App />);

    const selector = container.querySelector('.ant-select-selector');
    fireEvent.mouseDown(selector);
    expect(screen.getByText('Red')).toBeInTheDocument();

    expect(screen.getByText('Magenta')).toBeInTheDocument();

    expect(screen.getByText('Volcano')).toBeInTheDocument();

    // select red
    fireEvent.click(screen.getByText('Red'));
    expect(screen.getAllByText('Red').length).toBe(3);
  });
});
