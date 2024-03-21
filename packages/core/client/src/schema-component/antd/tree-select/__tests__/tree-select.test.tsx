import { render, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe('TreeSelect', () => {
  it('should display the value of user input', async () => {
    const { container } = render(<App1 />);
    const input = container.querySelector('input') as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.click(screen.getByText('选项1'));
    expect(container.querySelector('.ant-tag')?.innerHTML).toBe('选项1');
  });
});
