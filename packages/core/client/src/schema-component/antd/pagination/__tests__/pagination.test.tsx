/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderAppOptions } from '@nocobase/test/client';
import { Pagination } from '@nocobase/client';

describe('Pagination', () => {
  it('renders without errors', async () => {
    const { container } = await renderAppOptions({
      Component: Pagination,
      props: {
        total: 20,
      },
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="css-dev-only-do-not-override-1rquknz ant-app"
          style="height: 100%;"
        >
          <div>
            <ul
              class="ant-pagination css-dev-only-do-not-override-1rquknz"
            >
              <li
                aria-disabled="true"
                class="ant-pagination-prev ant-pagination-disabled"
                title="Previous Page"
              >
                <button
                  class="ant-pagination-item-link"
                  disabled=""
                  tabindex="-1"
                  type="button"
                >
                  <span
                    aria-label="left"
                    class="anticon anticon-left"
                    role="img"
                  >
                    <svg
                      aria-hidden="true"
                      data-icon="left"
                      fill="currentColor"
                      focusable="false"
                      height="1em"
                      viewBox="64 64 896 896"
                      width="1em"
                    >
                      <path
                        d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"
                      />
                    </svg>
                  </span>
                </button>
              </li>
              <li
                class="ant-pagination-item ant-pagination-item-1 ant-pagination-item-active"
                tabindex="0"
                title="1"
              >
                <a
                  rel="nofollow"
                >
                  1
                </a>
              </li>
              <li
                class="ant-pagination-item ant-pagination-item-2"
                tabindex="0"
                title="2"
              >
                <a
                  rel="nofollow"
                >
                  2
                </a>
              </li>
              <li
                aria-disabled="false"
                class="ant-pagination-next"
                tabindex="0"
                title="Next Page"
              >
                <button
                  class="ant-pagination-item-link"
                  tabindex="-1"
                  type="button"
                >
                  <span
                    aria-label="right"
                    class="anticon anticon-right"
                    role="img"
                  >
                    <svg
                      aria-hidden="true"
                      data-icon="right"
                      fill="currentColor"
                      focusable="false"
                      height="1em"
                      viewBox="64 64 896 896"
                      width="1em"
                    >
                      <path
                        d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"
                      />
                    </svg>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `);
  });

  it('hides when hidden prop is true', async () => {
    const { container } = await renderAppOptions({
      Component: Pagination,
      props: {
        hidden: true,
      },
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="css-dev-only-do-not-override-1rquknz ant-app"
          style="height: 100%;"
        />
      </div>
    `);
  });
});
