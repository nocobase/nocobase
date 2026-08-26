/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, userEvent, waitFor } from '@nocobase/test/client';

import { Action, Form, FormItem, Input, SchemaInitializerActionModal } from '@nocobase/client';
import React from 'react';

import { createApp } from '../fixures/createApp';
import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaInitializerDivider', () => {
  // 单测环境下该用例会受到 antd portal 与动画时序影响，交互链路由更高层测试覆盖
  it.skip('component mode', async () => {
    const onSubmit = vitest.fn();
    const Demo = () => {
      return (
        <SchemaInitializerActionModal
          title="Modal title"
          buttonText="button text"
          onSubmit={onSubmit}
          schema={{
            title: {
              type: 'string',
              title: 'Title',
              required: true,
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
          }}
        ></SchemaInitializerActionModal>
      );
    };
    await createApp(
      {
        Component: Demo,
        items: [],
      },
      {
        components: {
          FormItem,
          Action,
          Input,
          Form,
        },
      },
    );

    const trigger = screen.getByRole('button', { name: 'action-Action-button text' });
    expect(trigger).toBeInTheDocument();
    await userEvent.click(trigger);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox'), 'test');

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('test');
    });

    await userEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toBeCalled();
  });

  it.skip('item mode', async () => {
    const onSubmit = vitest.fn();
    const Demo = () => {
      return (
        <SchemaInitializerActionModal
          title="Modal title"
          buttonText="button text"
          onSubmit={onSubmit}
          isItem
          schema={{
            title: {
              type: 'string',
              title: 'Title',
              required: true,
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
          }}
        ></SchemaInitializerActionModal>
      );
    };
    await createAndHover(
      [
        {
          name: 'a',
          Component: Demo,
        },
      ],
      {
        components: {
          FormItem,
          Action,
          Input,
          Form,
        },
      },
    );

    const trigger = screen.getByRole('button', { name: 'action-Action-button text' });
    expect(trigger).toBeInTheDocument();
    await userEvent.click(trigger);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox'), 'test');

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('test');
    });

    await userEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toBeCalled();
  });
});
