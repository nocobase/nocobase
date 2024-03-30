import { fireEvent, render, screen } from '@nocobase/test/client';
import React from 'react';
import { formatNumberWithSeparator, formatUnitConversion, scientificNotation } from '../ReadPretty';
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
    expect(screen.getByText('¥')).toBeInTheDocument();

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
    expect(screen.getByText('1.00')).toBeInTheDocument();

    // empty value
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(screen.queryByText('NaN')).toBeNull();
  });
});

describe('ReadPretty:formatNumberWithSeparator', () => {
  // Test case 1: Format a number with default format '0,0.00'
  test('Format number with default separator', () => {
    const formatted = formatNumberWithSeparator(1234567.89);
    expect(formatted).toBe('1234567.9');
  });

  // Test case 2: Format a number with custom format '0.00'
  test('Format number with custom separator', () => {
    const formatted = formatNumberWithSeparator(1234567.89, '0,0.00', 1);
    expect(formatted).toBe('1,234,567.9');
  });
});
describe('ReadPretty:formatUnitConversion', () => {
  // Test case 1: Multiply a value by 2
  test('Multiply value by 2', () => {
    const result = formatUnitConversion(10, '*', 2);
    expect(result).toBe(20);
  });
  // Test case 2: Divide a value by 0 (error case)
  test('Divide value by zero', () => {
    const result = formatUnitConversion(10, '/', 0);
    expect(result).toBe(10);
  });

  test('0.1*0.2', () => {
    const result = formatUnitConversion(0.1, '*', 0.2);
    expect(result).toBe(0.02);
  });
});

describe('ReadPretty:scientificNotation', () => {
  // Test case 1: Format a number into scientific notation with 2 decimal places
  test('Format number into scientific notation', () => {
    const formatted = scientificNotation(1234567.89, 2);
    expect(formatted).toBe('1.23×10<sup>6</sup>');
  });

  // Test case 2: Format a number into scientific notation with custom separator '.'
  test('Format number into scientific notation with custom separator', () => {
    const formatted = scientificNotation(1234567.89, 2, '.');
    expect(formatted).toBe('1.23×10<sup>6</sup>');
  });
});
