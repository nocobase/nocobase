/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { ConfigProvider } from 'antd';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowEngineProvider } from '../../../provider';
import { FlowEngine } from '../../../flowEngine';
import LazyDropdown from '../LazyDropdown';

const setViewportHeight = (height: number) => {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
};

describe('LazyDropdown', () => {
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    setViewportHeight(originalInnerHeight);
    vi.restoreAllMocks();
  });

  it('uses the current viewport space when opening after the viewport height changes', async () => {
    setViewportHeight(720);
    const engine = new FlowEngine();
    const user = userEvent.setup();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <LazyDropdown
            trigger={['click']}
            menu={{
              items: [{ key: 'field', label: 'Field' }],
            }}
          >
            <button type="button">Open fields</button>
          </LazyDropdown>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Open fields' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      bottom: 196,
      height: 32,
      left: 49,
      right: 141,
      top: 164,
      width: 92,
      x: 49,
      y: 164,
      toJSON: () => ({}),
    });
    setViewportHeight(460);

    await user.click(trigger);

    const menu = await screen.findByRole('menu');
    await waitFor(() => expect(menu).toHaveStyle({ maxHeight: '256px', overflowY: 'auto' }));
  });

  it('updates the available height while the dropdown is open', async () => {
    setViewportHeight(720);
    const engine = new FlowEngine();
    const user = userEvent.setup();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <LazyDropdown
            trigger={['click']}
            menu={{
              items: [{ key: 'field', label: 'Field' }],
            }}
          >
            <button type="button">Open fields</button>
          </LazyDropdown>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Open fields' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      bottom: 196,
      height: 32,
      left: 49,
      right: 141,
      top: 164,
      width: 92,
      x: 49,
      y: 164,
      toJSON: () => ({}),
    });

    await user.click(trigger);

    const menu = await screen.findByRole('menu');
    await waitFor(() => expect(menu).toHaveStyle({ maxHeight: '400px', overflowY: 'auto' }));

    act(() => {
      setViewportHeight(460);
      window.dispatchEvent(new Event('resize'));
    });
    await waitFor(() => expect(menu).toHaveStyle({ maxHeight: '256px', overflowY: 'auto' }));

    act(() => {
      setViewportHeight(720);
      window.dispatchEvent(new Event('resize'));
    });
    await waitFor(() => expect(menu).toHaveStyle({ maxHeight: '400px', overflowY: 'auto' }));
  });

  it('reserves the placement offset when the dropdown has an arrow', async () => {
    setViewportHeight(460);
    const engine = new FlowEngine();
    const user = userEvent.setup();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <LazyDropdown
            arrow
            trigger={['click']}
            menu={{
              items: [{ key: 'field', label: 'Field' }],
            }}
          >
            <button type="button">Open fields</button>
          </LazyDropdown>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Open fields' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      bottom: 196,
      height: 32,
      left: 49,
      right: 141,
      top: 164,
      width: 92,
      x: 49,
      y: 164,
      toJSON: () => ({}),
    });

    await user.click(trigger);

    const menu = await screen.findByRole('menu');
    await waitFor(() => expect(menu).toHaveStyle({ maxHeight: '248px', overflowY: 'auto' }));
  });

  it('uses the space above when it is larger than the space below', async () => {
    setViewportHeight(460);
    const engine = new FlowEngine();
    const user = userEvent.setup();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <LazyDropdown
            trigger={['click']}
            menu={{
              items: [{ key: 'field', label: 'Field' }],
            }}
          >
            <button type="button">Open fields</button>
          </LazyDropdown>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Open fields' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      bottom: 332,
      height: 32,
      left: 49,
      right: 141,
      top: 300,
      width: 92,
      x: 49,
      y: 300,
      toJSON: () => ({}),
    });

    await user.click(trigger);

    const menu = await screen.findByRole('menu');
    await waitFor(() => expect(menu).toHaveStyle({ maxHeight: '292px', overflowY: 'auto' }));
  });
});
