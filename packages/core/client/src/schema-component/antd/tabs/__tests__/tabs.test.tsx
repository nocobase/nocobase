import React from 'react';
import { render, screen, userEvent } from 'testUtils';
import App1 from '../demos/demo1';

describe('Tabs', () => {
  it('basic', async () => {
    render(<App1 />);

    expect(screen.getByText('Hello1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Tab2'));
    expect(screen.getByText('Hello2')).toBeInTheDocument();
  });
});
