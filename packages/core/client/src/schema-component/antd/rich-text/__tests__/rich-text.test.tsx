/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, sleep, userEvent } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe('RichText', () => {
  it('should display the value of user input', async () => {
    const { container } = render(<App1 />);

    // wait for editor to be rendered
    await sleep(300);

    const editor = container.querySelector('.ql-editor') as HTMLElement;

    editor.focus();
    await userEvent.type(editor, `Hello World`);
    expect(screen.queryAllByText('Hello World')).toHaveLength(2);
  });
});
