/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, userEvent, sleep, act } from '@nocobase/test/client';
import { ISchema } from '@formily/json-schema';
import { uid } from '@formily/shared';
import { createApp } from './fixures/createApp';

describe('withInitializer', () => {
  it('renders the component with initializer', async () => {
    const user = userEvent.setup();

    await createApp();
    expect(screen.getByTestId('render')).toHaveTextContent('Test');
    expect(screen.queryByText('Item')).not.toBeInTheDocument();

    await act(async () => {
      await user.hover(screen.getByText('Test'));
      await sleep(100);
    });
    expect(screen.queryByText('Item')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText('Item'));
      await sleep(100);
    });

    expect(screen.queryByText('Hello World!')).toBeInTheDocument();
  });

  it('when app designable is false, the component will not be rendered', async () => {
    await createApp({}, { designable: false });
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('when SchemaInitializer config designable is true, but app is false, the component will  be rendered', async () => {
    await createApp({ designable: true }, { designable: false });
    expect(screen.queryByText('Test')).toBeInTheDocument();
  });

  it('when popover is false, only render button', async () => {
    const user = userEvent.setup();

    await createApp({ popover: false });

    expect(screen.queryByText('Test')).toBeInTheDocument();
    expect(screen.queryByText('Item')).not.toBeInTheDocument();

    await act(async () => {
      await user.hover(screen.getByText('Test'));
      await sleep(100);
    });

    expect(screen.queryByText('Item')).not.toBeInTheDocument();
  });

  it('wrap', async () => {
    const user = userEvent.setup();

    await createApp({
      wrap: (schema: ISchema) => {
        return {
          type: 'void',
          'x-component': 'WrapDemo',
          properties: {
            [schema.name || uid()]: schema,
          },
        };
      },
    });

    await act(async () => {
      await user.hover(screen.getByText('Test'));
      await sleep(100);
    });

    await act(async () => {
      await user.click(screen.getByText('Item'));
      await sleep(100);
    });

    expect(screen.queryByText('WrapDemo')).toBeInTheDocument();
    expect(screen.queryByText('Hello World!')).toBeInTheDocument();
  });

  it('insert', async () => {
    const user = userEvent.setup();

    const insert = vitest.fn();
    await createApp({
      insert,
    });

    await act(async () => {
      await user.hover(screen.getByText('Test'));
      await sleep(100);
    });

    await act(async () => {
      await user.click(screen.getByText('Item'));
      await sleep(100);
    });

    expect(insert).toBeCalledWith({
      type: 'void',
      'x-component': 'div',
      'x-content': 'Hello World!',
    });
  });

  it('userInsert', async () => {
    const user = userEvent.setup();

    const insert = vitest.fn();
    await createApp({
      useInsert: () => insert,
    });

    await act(async () => {
      await user.hover(screen.getByText('Test'));
      await sleep(100);
    });

    await act(async () => {
      await user.click(screen.getByText('Item'));
      await sleep(100);
    });

    expect(insert).toBeCalledWith({
      type: 'void',
      'x-component': 'div',
      'x-content': 'Hello World!',
    });
  });
});
