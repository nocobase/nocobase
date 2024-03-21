import { fireEvent, render, screen } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('Password', () => {
  it('should works', () => {
    const { container } = render(<App1 />);
    const input = container.querySelector('input') as HTMLInputElement;

    expect(screen.queryByText('********')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '123456' } });
    expect(screen.queryByText('********')).toBeInTheDocument();
  });

  it('should works with checkStrength', () => {
    const { container } = render(<App2 />);
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '123456' } });
    expect(screen.getByText('********')).toBeInTheDocument();
  });
});
