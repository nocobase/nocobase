/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, renderApp, userEvent, waitFor, renderReadPrettyApp } from '@nocobase/test/client';
import { UnixTimestamp } from '@nocobase/client';

describe('UnixTimestamp', () => {
  it('renders without errors', async () => {
    const { container } = await renderApp({
      Component: UnixTimestamp,
      props: {
        accuracy: 'millisecond',
      },
      value: 0,
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="css-dev-only-do-not-override-wwtqkl ant-app"
          style="height: 100%;"
        >
          <div
            class="ant-picker css-dev-only-do-not-override-wwtqkl"
          >
            <div
              class="ant-picker-input"
            >
              <input
                autocomplete="off"
                placeholder="Select date"
                readonly=""
                size="12"
                title=""
                value=""
              />
              <span
                class="ant-picker-suffix"
              >
                <span
                  aria-label="calendar"
                  class="anticon anticon-calendar"
                  role="img"
                >
                  <svg
                    aria-hidden="true"
                    data-icon="calendar"
                    fill="currentColor"
                    focusable="false"
                    height="1em"
                    viewBox="64 64 896 896"
                    width="1em"
                  >
                    <path
                      d="M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V460h656v380zM184 392V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v136H184z"
                    />
                  </svg>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  it('millisecond', async () => {
    await renderApp({
      Component: UnixTimestamp,
      value: 1712819630000,
      props: {
        accuracy: 'millisecond',
      },
    });
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
    });
  });

  it('second', async () => {
    await renderApp({
      Component: UnixTimestamp,
      value: 1712819630,
      props: {
        accuracy: 'second',
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
    });
  });

  it('string', async () => {
    await renderApp({
      Component: UnixTimestamp,
      value: '2024-04-11',
      props: {
        accuracy: 'millisecond',
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
    });
  });

  it('change', async () => {
    const onChange = vitest.fn();
    await renderApp({
      Component: UnixTimestamp,
      value: '2024-04-11',
      onChange,
      props: {
        accuracy: 'millisecond',
      },
    });
    await userEvent.click(screen.getByRole('textbox'));

    await waitFor(() => {
      expect(screen.queryByRole('table')).toBeInTheDocument();
    });

    await userEvent.click(document.querySelector('td[title="2024-04-12"]'));

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('2024-04-12');
    });
    expect(onChange).toBeCalledWith(1712880000000);
  });

  it('read pretty', async () => {
    const { container } = await renderReadPrettyApp({
      Component: UnixTimestamp,
      value: '2024-04-11',
      props: {
        accuracy: 'millisecond',
      },
    });

    expect(screen.getByText('2024-04-11')).toBeInTheDocument();
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="css-dev-only-do-not-override-wwtqkl ant-app"
          style="height: 100%;"
        >
          <div
            class="ant-description-date-picker"
          >
            2024-04-11
          </div>
        </div>
      </div>
    `);
  });
});
