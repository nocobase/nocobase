import { fireEvent, render, screen } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';

describe('Radio', () => {
  it('select radio', () => {
    const { container } = render(<App1 />);
    const [radio1, radio2] = Array.from(container.querySelectorAll('.ant-radio-input'));
    expect(radio2).toBeDisabled();
    fireEvent.click(radio1);
    expect(radio1).toBeChecked();
    expect(radio2).toBeChecked();
    expect(radio2).toBeDisabled();
  });

  it('select radio group', () => {
    const { container } = render(<App2 />);
    const 男 = screen.getByLabelText('男');
    const 女 = screen.getByLabelText('女');

    fireEvent.click(男);
    expect(男).toBeChecked();
    expect(container.querySelector('.ant-tag')?.innerHTML).toBe('男');
    fireEvent.click(女);
    expect(女).toBeChecked();
    expect(男).not.toBeChecked();
    expect(container.querySelector('.ant-tag')?.innerHTML).toBe('女');
  });

  it('select radio group with color', () => {
    const { container } = render(<App3 />);
    const 男 = screen.getByLabelText('男');
    const 女 = screen.getByLabelText('女');

    fireEvent.click(男);
    expect(男).toBeChecked();
    expect(container.querySelector('.ant-tag-blue')?.innerHTML).toBe('男');
    fireEvent.click(女);
    expect(女).toBeChecked();
    expect(男).not.toBeChecked();
    expect(container.querySelector('.ant-tag-red')?.innerHTML).toBe('女');
  });
});
