import {
  screen,
  renderComponentWithSchema,
  userEvent,
  waitFor,
  renderComponentReadPrettySchema,
} from '@nocobase/test/client';
import { UnixTimestamp } from '@nocobase/client';

describe('UnixTimestamp', () => {
  it('renders without errors', async () => {
    const { container } = await renderComponentWithSchema({
      Component: UnixTimestamp,
    });
    expect(container).toMatchInlineSnapshot();
  });

  it('millisecond', async () => {
    await renderComponentWithSchema({
      Component: UnixTimestamp,
      value: 1712819630000,
    });
    expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
  });

  it('second', async () => {
    await renderComponentWithSchema({
      Component: UnixTimestamp,
      value: 1712819630,
      props: {
        accuracy: 'second',
      },
    });
    expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
  });

  it('string', async () => {
    await renderComponentWithSchema({
      Component: UnixTimestamp,
      value: '2024-04-11',
    });
    expect(screen.getByRole('textbox')).toHaveValue('2024-04-11');
  });

  it('change', async () => {
    const onChange = vitest.fn();
    await renderComponentWithSchema({
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

  it('read pretty', async () => {
    const { container } = await renderComponentReadPrettySchema({
      Component: UnixTimestamp,
      value: '2024-04-11',
    });

    expect(screen.getByText('2024-04-11')).toBeInTheDocument();
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="css-dev-only-do-not-override-1mw46su ant-app"
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
