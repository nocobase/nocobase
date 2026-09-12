/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, sleep, userEvent } from '@nocobase/test/client';
import { FormItem } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormProvider, Field } from '@formily/react';
import React from 'react';
import { RichText } from '../RichText';
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

  it('sanitizes stored HTML in read-pretty mode', () => {
    const form = createForm();
    const { container } = render(
      <FormProvider form={form}>
        <Field
          name="content"
          value={'<p>safe</p><img src="https://example.com/image.png" onerror="alert(1)"><script>alert(1)</script>'}
          pattern="readPretty"
          decorator={[FormItem]}
          component={[RichText]}
        />
      </FormProvider>,
    );

    expect(container.querySelector('p')).toHaveTextContent('safe');
    expect(container.querySelector('img')).not.toHaveAttribute('onerror');
    expect(container.querySelector('script')).toBeNull();
  });
});
