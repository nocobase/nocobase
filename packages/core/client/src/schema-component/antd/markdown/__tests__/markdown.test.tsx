/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import { MemoryRouter } from 'react-router-dom';

describe('Markdown', () => {
  it('should display the value of user input', function () {
    const { container } = render(
      <MemoryRouter>
        <App1 />
      </MemoryRouter>,
    );
    const textarea = container.querySelector('.ant-input') as HTMLTextAreaElement;
    act(() => {
      fireEvent.change(textarea, { target: { value: '## Hello World' } });
    });
    expect(textarea.value).toBe('## Hello World');
  });
});

describe('Markdown.Void', function () {
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
