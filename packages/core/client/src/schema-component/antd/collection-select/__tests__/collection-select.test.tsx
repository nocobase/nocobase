/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionSelect, FormItem } from '@nocobase/client';
import { renderAppOptions, renderReadPrettyApp, screen, userEvent, waitFor } from '@nocobase/test/client';

describe('CollectionSelect', () => {
  it('should works', async () => {
    const { container } = await renderAppOptions({
      schema: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
            title: 'demo title',
            'x-decorator': FormItem,
            'x-component': CollectionSelect,
          },
        },
      },
    });

    expect(screen.getByText('demo title')).toBeInTheDocument();

    await userEvent.click(document.querySelector('.ant-select-selector'));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeInTheDocument();
    });

    expect(screen.queryByText('Users')).toBeInTheDocument();
    expect(screen.queryByText('Roles')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Users'));

    await waitFor(() => {
      expect(document.body.querySelector('.ant-select-selection-item')).toHaveTextContent('Users');
    });

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="css-dev-only-do-not-override-1rquknz ant-app"
          style="height: 100%;"
        >
          <div
            aria-label="block-item-demo title"
            class="nb-block-item nb-form-item css-1elzyjx ant-nb-block-item css-dev-only-do-not-override-1rquknz"
            role="button"
          >
            <div
              class="css-9mlexe ant-formily-item ant-formily-item-layout-horizontal ant-formily-item-feedback-layout-loose ant-formily-item-label-align-right ant-formily-item-control-align-left css-dev-only-do-not-override-1rquknz"
            >
              <div
                class="ant-formily-item-label"
              >
                <div
                  class="ant-formily-item-label-content"
                >
                  <span>
                    <label>
                      demo title
                    </label>
                  </span>
                </div>
                <span
                  class="ant-formily-item-colon"
                >
                  :
                </span>
              </div>
              <div
                class="ant-formily-item-control"
              >
                <div
                  class="ant-formily-item-control-content"
                >
                  <div
                    class="ant-formily-item-control-content-component"
                  >
                    <div
                      class="ant-select ant-select-outlined css-dev-only-do-not-override-1rquknz ant-select-focused ant-select-single ant-select-show-arrow ant-select-show-search"
                      data-testid="select-collection"
                      role="button"
                    >
                      <span
                        aria-live="polite"
                        style="width: 0px; height: 0px; position: absolute; overflow: hidden; opacity: 0;"
                      >
                        Users
                      </span>
                      <div
                        class="ant-select-selector"
                      >
                        <span
                          class="ant-select-selection-wrap"
                        >
                          <span
                            class="ant-select-selection-search"
                          >
                            <input
                              aria-autocomplete="list"
                              aria-controls="rc_select_TEST_OR_SSR_list"
                              aria-expanded="false"
                              aria-haspopup="listbox"
                              aria-owns="rc_select_TEST_OR_SSR_list"
                              autocomplete="off"
                              class="ant-select-selection-search-input"
                              id="rc_select_TEST_OR_SSR"
                              role="button"
                              type="search"
                              value=""
                            />
                          </span>
                          <span
                            class="ant-select-selection-item"
                            title="Users"
                          >
                            Users
                          </span>
                        </span>
                      </div>
                      <span
                        aria-hidden="true"
                        class="ant-select-arrow"
                        style="user-select: none;"
                        unselectable="on"
                      >
                        <span
                          aria-label="down"
                          class="anticon anticon-down ant-select-suffix"
                          role="img"
                        >
                          <svg
                            aria-hidden="true"
                            data-icon="down"
                            fill="currentColor"
                            focusable="false"
                            height="1em"
                            viewBox="64 64 896 896"
                            width="1em"
                          >
                            <path
                              d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"
                            />
                          </svg>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  it('read pretty', async () => {
    const { container } = await renderReadPrettyApp({
      value: {
        test: 'users',
      },
      schema: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
            title: 'demo title',
            'x-decorator': FormItem,
            'x-component': CollectionSelect,
          },
        },
      },
    });

    expect(screen.getByText('demo title')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="css-dev-only-do-not-override-1rquknz ant-app"
          style="height: 100%;"
        >
          <div
            aria-label="block-item-demo title"
            class="nb-block-item nb-form-item css-1elzyjx ant-nb-block-item css-dev-only-do-not-override-1rquknz"
            role="button"
          >
            <div
              class="css-9mlexe ant-formily-item ant-formily-item-layout-horizontal ant-formily-item-feedback-layout-loose ant-formily-item-label-align-right ant-formily-item-control-align-left css-dev-only-do-not-override-1rquknz"
            >
              <div
                class="ant-formily-item-label"
              >
                <div
                  class="ant-formily-item-label-content"
                >
                  <span>
                    <label>
                      demo title
                    </label>
                  </span>
                </div>
                <span
                  class="ant-formily-item-colon"
                >
                  :
                </span>
              </div>
              <div
                class="ant-formily-item-control"
              >
                <div
                  class="ant-formily-item-control-content"
                >
                  <div
                    class="ant-formily-item-control-content-component"
                  >
                    <div>
                      <span
                        class="ant-tag css-dev-only-do-not-override-1rquknz"
                      >
                        Users
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  it('read pretty: multiple', async () => {
    await renderReadPrettyApp({
      value: {
        test: ['users', 'roles'],
      },
      schema: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
            title: 'demo title',
            'x-decorator': FormItem,
            'x-component': CollectionSelect,
            'x-component-props': {
              mode: 'multiple',
            },
          },
        },
      },
    });

    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });
});
