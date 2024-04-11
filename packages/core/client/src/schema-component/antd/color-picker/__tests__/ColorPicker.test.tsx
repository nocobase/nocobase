import { ColorPicker } from '@nocobase/client';
import {
  renderComponentWithSchema,
  screen,
  renderComponentReadPrettySchema,
  userEvent,
  waitFor,
} from '@nocobase/test/client';

describe('ColorPicker', () => {
  test('basic', async () => {
    const { container } = renderComponentWithSchema({
      Component: ColorPicker,
      value: 'rgb(139, 187, 17)',
    });

    await waitFor(() => {
      expect(container.querySelector('.ant-color-picker-color-block-inner')).toHaveAttribute(
        'style',
        'background: rgb(139, 187, 17);',
      );
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          aria-label="color-picker-normal"
          role="button"
          style="display: inline-block;"
        >
          <div
            class="ant-color-picker-trigger css-dev-only-do-not-override-dkbvqv"
          >
            <div
              class="ant-color-picker-color-block"
            >
              <div
                class="ant-color-picker-color-block-inner"
                style="background: rgb(139, 187, 17);"
              />
            </div>
          </div>
        </div>
      </div>
    `);
  });

  test('change', async () => {
    const { container } = renderComponentWithSchema({
      Component: ColorPicker,
      value: 'rgb(139, 187, 17)',
    });

    await userEvent.hover(screen.getByRole('button').querySelector('.ant-color-picker-trigger'));

    await waitFor(() => {
      expect(document.querySelector('.ant-color-picker-input')).toBeInTheDocument();
    });

    const input = document.querySelector('.ant-color-picker-input').querySelector('input');
    await userEvent.clear(input);
    await userEvent.type(input, '123123'); // 对应的 rgb(18, 49, 35)

    await waitFor(() => {
      expect(container.querySelector('.ant-color-picker-color-block-inner')).toHaveAttribute(
        'style',
        'background: rgb(18, 49, 35);',
      );
    });
  });

  test('read pretty', async () => {
    const { container } = renderComponentReadPrettySchema({
      Component: ColorPicker,
      value: 'rgb(139, 187, 17)',
    });
    await waitFor(() => {
      expect(container.querySelector('.ant-color-picker-color-block-inner')).toHaveAttribute(
        'style',
        'background: rgb(139, 187, 17);',
      );
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          aria-label="color-picker-read-pretty"
          class="ant-description-color-picker css-gy8kge"
          role="button"
        >
          <div
            class="ant-color-picker-trigger ant-color-picker-sm css-dev-only-do-not-override-dkbvqv ant-color-picker-trigger-disabled"
          >
            <div
              class="ant-color-picker-color-block"
            >
              <div
                class="ant-color-picker-color-block-inner"
                style="background: rgb(139, 187, 17);"
              />
            </div>
          </div>
        </div>
      </div>
    `);
  });
});
