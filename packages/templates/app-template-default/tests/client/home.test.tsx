import { renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import HomePage from '../../client/pages/home/index.js';

function renderHome() {
  return renderWithApp(<HomePage />, {
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: enUS },
  });
}

const writeText = vi.fn<(text: string) => Promise<void>>();
const clipboard = { fail: false };

/** `userEvent.setup()` installs a clipboard stub of its own, so the mock goes in after it. */
function setup(): ReturnType<typeof userEvent.setup> {
  const user = userEvent.setup();
  writeText
    .mockReset()
    .mockImplementation(() =>
      clipboard.fail ? Promise.reject(new Error('denied')) : Promise.resolve(),
    );
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return user;
}

describe('home page', () => {
  beforeEach(() => {
    clipboard.fail = false;
  });

  it('tells people to build by asking their coding agent', async () => {
    await renderHome();

    expect(
      screen.getByRole('heading', { level: 1, name: enUS.home.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(enUS.home.steps.describe.title)).toBeVisible();
    // The home page links to no capability guide.
    expect(screen.queryAllByRole('link')).toEqual([]);
  });

  it('copies the sample request', async () => {
    const user = setup();
    const view = await renderHome();

    await user.click(
      screen.getByRole('button', { name: enUS.home.prompt.copy }),
    );

    expect(writeText).toHaveBeenCalledWith(enUS.home.example.text);
    expect(view.toasts()).toEqual([
      expect.objectContaining({
        type: 'success',
        title: enUS.home.prompt.copied,
      }),
    ]);
  });

  it('reports a copy the browser refuses', async () => {
    clipboard.fail = true;
    const user = setup();
    const view = await renderHome();

    await user.click(
      screen.getByRole('button', { name: enUS.home.prompt.copy }),
    );

    expect(view.toasts()).toEqual([
      expect.objectContaining({
        type: 'error',
        title: enUS.home.prompt.copyFailed,
      }),
    ]);
  });
});
