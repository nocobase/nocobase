import { fireEvent, render, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('TimePicker', () => {
  it('should display the value of user input', async () => {
    const { container } = render(<App1 />);
    const input = container.querySelector('input') as HTMLInputElement;

    // 1.先点击一下输入框，显示出时间选择器
    await userEvent.click(input);
    const submit = screen.getByText('OK');

    // 2.然后输入 12:00:00
    fireEvent.change(input, { target: { value: '12:00:00' } });

    // 3.然后点击 OK 按钮
    await userEvent.click(submit);

    expect(input.value).toBe('12:00:00');
    expect(screen.getByText('12:00:00')).toBeInTheDocument();
  });
});

describe('TimePicker.RangePicker', () => {
  it('should display the value of user input', async () => {
    render(<App2 />);
    const startInput = screen.getByPlaceholderText('Start time') as HTMLInputElement;
    const endInput = screen.getByPlaceholderText('End time') as HTMLInputElement;

    // 设置开始时间
    await userEvent.click(startInput);
    fireEvent.change(startInput, { target: { value: '12:00:00' } });
    await userEvent.click(screen.getByText('OK'));

    // 设置结束时间
    await userEvent.click(endInput);
    fireEvent.change(endInput, { target: { value: '14:00:00' } });
    await userEvent.click(screen.getByText('OK'));

    expect(startInput.value).toBe('12:00:00');
    expect(endInput.value).toBe('14:00:00');
    expect(screen.getByText('12:00:00~14:00:00')).toBeInTheDocument();
  });
});
