import { act, fireEvent, render } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('Markdown', () => {
  it('should display the value of user input', () => {
    const { container } = render(<App1 />);
    const textarea = container.querySelector('.ant-input') as HTMLTextAreaElement;
    act(() => {
      fireEvent.change(textarea, { target: { value: '## Hello World' } });
    });
    expect(textarea.value).toBe('## Hello World');
  });
});

describe('Markdown.Void', () => {
  it('should display the value of user input', async () => {
    const { container } = render(<App2 />);
    const button = container.querySelector('.ant-btn') as HTMLButtonElement;

    expect(button).not.toBeNull();
    expect(container.querySelector('.ant-input')).toBeNull();

    // TODO: fix this test
    // await userEvent.click(button);
    // expect(document.querySelector('.ant-input')).not.toBeNull();
  });
});
