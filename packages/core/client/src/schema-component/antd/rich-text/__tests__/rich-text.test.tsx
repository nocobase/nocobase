import { render, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe('RichText', () => {
  it('should display the value of user input', async () => {
    const { container } = render(<App1 />);
    const editor = container.querySelector('.ql-editor') as HTMLElement;

    editor.focus();
    await userEvent.type(editor, `Hello World`);
    expect(screen.queryAllByText('Hello World')).toHaveLength(2);
  });
});
