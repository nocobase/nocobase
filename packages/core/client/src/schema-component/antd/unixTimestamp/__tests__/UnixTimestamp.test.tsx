import { screen, renderSchema, userEvent, waitFor, renderReadPrettySchema } from '@nocobase/test/client';
import { UnixTimestamp } from '@nocobase/client';

describe('UnixTimestamp', () => {
  it('renders without errors', () => {
    const { container } = renderSchema({
      Component: UnixTimestamp,
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="ant-picker css-dev-only-do-not-override-dkbvqv"
        >
          <div
            class="ant-picker-input"
          >
            <input
              autocomplete="off"
              placeholder="Select date"
              readonly=""
              size="12"
              title="Invalid Date"
              value="Invalid Date"
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
            <span
              class="ant-picker-clear"
              role="button"
            >
              <span
                aria-label="close-circle"
                class="anticon anticon-close-circle"
                role="img"
              >
                <svg
                  aria-hidden="true"
                  data-icon="close-circle"
                  fill="currentColor"
                  fill-rule="evenodd"
                  focusable="false"
                  height="1em"
                  viewBox="64 64 896 896"
                  width="1em"
                >
                  <path
                    d="M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.05-.09l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 00-.07 0z"
                  />
                </svg>
              </span>
            </span>
          </div>
        </div>
      </div>
    `);
  });

  it('millisecond', () => {
    renderSchema({
      Component: UnixTimestamp,
      value: 1712819630000,
    });
    expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
  });

  it('second', () => {
    renderSchema({
      Component: UnixTimestamp,
      value: 1712819630,
      props: {
        accuracy: 'second',
      },
    });
    expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
  });

  it('string', () => {
    renderSchema({
      Component: UnixTimestamp,
      value: '2024-04-11',
    });
    expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
  });

  it('change', async () => {
    const onChange = vitest.fn();
    renderSchema({
      Component: UnixTimestamp,
      value: '2024-04-11',
      onChange,
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

  it('read pretty', () => {
    const { container } = renderReadPrettySchema({
      Component: UnixTimestamp,
      value: '2024-04-11',
    });

    expect(screen.getByText('2024-04-11')).toBeInTheDocument();
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="ant-description-date-picker"
        >
          2024-04-11
        </div>
      </div>
    `);
  });
});
