import { renderWithApp } from '@nocobase/app-testing/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import HomePage from '../../client/pages/home/index.js';
import { CAPABILITIES } from '../../client/pages/home/capabilities.js';

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
  });

  it('shows one card per built-in capability', async () => {
    await renderHome();

    for (const { id } of CAPABILITIES) {
      const title =
        enUS.home.capabilities[id as keyof typeof enUS.home.capabilities].title;
      expect(
        screen.getByRole('button', { name: new RegExp(title) }),
      ).toBeInTheDocument();
    }
  });

  it('opens a capability, switches prompts, and copies the edited text', async () => {
    const user = setup();
    const view = await renderHome();
    const scheduler = enUS.home.capabilities.scheduler;

    await user.click(
      screen.getByRole('button', { name: new RegExp(scheduler.title) }),
    );
    const dialog = await screen.findByRole('dialog');
    const prompt = within(dialog).getByRole('textbox', {
      name: enUS.home.prompt.label,
    });
    expect(prompt).toHaveValue(scheduler.prompts.reminder.text);

    await user.click(
      within(dialog).getByRole('tab', {
        name: scheduler.prompts.weeklyReport.label,
      }),
    );
    expect(prompt).toHaveValue(scheduler.prompts.weeklyReport.text);

    await user.clear(prompt);
    await user.type(prompt, 'Every Friday');
    await user.click(
      within(dialog).getByRole('button', { name: enUS.home.prompt.copy }),
    );

    expect(writeText).toHaveBeenCalledWith('Every Friday');
    expect(view.toasts()).toEqual([
      expect.objectContaining({
        type: 'success',
        title: enUS.home.prompt.copied,
      }),
    ]);

    await user.click(
      within(dialog).getByRole('button', { name: enUS.home.prompt.reset }),
    );
    expect(prompt).toHaveValue(scheduler.prompts.weeklyReport.text);
  });

  it('starts from the default prompt each time the dialog opens', async () => {
    const user = setup();
    await renderHome();
    const theme = enUS.home.capabilities.theme;
    const card = screen.getByRole('button', { name: new RegExp(theme.title) });

    await user.click(card);
    const prompt = within(await screen.findByRole('dialog')).getByRole(
      'textbox',
    );
    await user.type(prompt, ' Edited.');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    await user.click(card);
    expect(
      within(await screen.findByRole('dialog')).getByRole('textbox'),
    ).toHaveValue(theme.prompts.changeTheme.text);
  });

  it('reports a copy the browser refuses', async () => {
    clipboard.fail = true;
    const user = setup();
    const view = await renderHome();

    await user.click(
      screen.getAllByRole('button', { name: enUS.home.prompt.copy })[0],
    );

    expect(view.toasts()).toEqual([
      expect.objectContaining({
        type: 'error',
        title: enUS.home.prompt.copyFailed,
      }),
    ]);
  });
});

describe('home page copy', () => {
  it('translates every capability prompt into Chinese', () => {
    for (const { id, prompts } of CAPABILITIES) {
      const key = id as keyof typeof zhCN.home.capabilities;
      for (const prompt of prompts) {
        const zh = (
          zhCN.home.capabilities[key].prompts as Record<
            string,
            { label: string; text: string }
          >
        )[prompt];
        expect(zh?.text, `${id}.${prompt}`).toBeTruthy();
        expect(zh?.label, `${id}.${prompt}`).toBeTruthy();
      }
    }
  });
});
