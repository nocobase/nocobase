import { fireEvent, render, screen } from '@nocobase/test/client';
import React from 'react';
import App2 from '../demos/addonBefore&addonAfter';
import App3 from '../demos/highPrecisionDecimals';
import App1 from '../demos/inputNumber';

describe('InputNumber', () => {
  it('should display the title', () => {
    render(<App1 />);

    expect(screen.getByText('Editable').innerHTML).toBe('Editable');
    expect(screen.getByText('Read pretty').innerHTML).toBe('Read pretty');
  });

  it('should display the value of user input', async () => {
    const { container } = render(<App1 />);

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 1 } });
    expect(input.value).toBe('1');
    // @ts-ignore
    expect(screen.getByText('1')).toBeInTheDocument();

    // empty value
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(screen.queryByText('NaN')).toBeNull();
  });
});

describe('InputNumber: addonBefore/addonAfter', () => {
  it('should display the title', () => {
    render(<App2 />);

    expect(screen.getByText('Editable').innerHTML).toBe('Editable');
    expect(screen.getByText('Read pretty').innerHTML).toBe('Read pretty');
  });

  it('should display the value of user input', async () => {
    const { container } = render(<App2 />);

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 1 } });
    expect(input.value).toBe('1');
    // @ts-ignore
    expect(screen.getByText('¥1万元')).toBeInTheDocument();

    // empty value
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(screen.queryByText('NaN')).toBeNull();
  });
});

describe('InputNumber: High precision decimals', () => {
  it('should display the title', () => {
    render(<App3 />);

    expect(screen.getByText('Editable').innerHTML).toBe('Editable');
    expect(screen.getByText('Read pretty').innerHTML).toBe('Read pretty');
  });

  it('should display the value of user input', async () => {
    const { container } = render(<App3 />);

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 1 } });
    expect(input.value).toBe('1.00');
    // @ts-ignore
    expect(screen.getByText('1.00%')).toBeInTheDocument();

    // empty value
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(screen.queryByText('NaN')).toBeNull();
  });
});
