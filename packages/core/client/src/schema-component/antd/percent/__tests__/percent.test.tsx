import { fireEvent, render } from '@nocobase/test/client';
import React from 'react';
import App from '../demos/percent';

describe('Percent', () => {
  it('should display the value of user input', () => {
    const { container } = render(<App />);
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10' } });
    expect(input.value).toBe('10');
  });
});
