import { renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import HomePage from '../../client/pages/home/index.js';
import {
  CAPABILITY_GUIDE_PATH,
  capabilityPath,
  createCapabilityCatalog,
  entryContent,
  format,
  guideContent,
} from '@nocobase/app-plugin-foundation/capability-guide';

const catalog = createCapabilityCatalog(packageMetadata);
const escape = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

  it('features capabilities from the shared guide catalog, each linking to its entry', async () => {
    await renderHome();
    const content = guideContent('en-US');

    expect(catalog.featured.length).toBeGreaterThan(0);
    for (const entry of catalog.featured) {
      const title = entryContent(content, entry).title;
      expect(
        screen.getByRole('link', { name: new RegExp(escape(title)) }),
      ).toHaveAttribute('href', capabilityPath(entry.id));
    }
  });

  it('leads to the full catalog, counted from the dependencies this application declares', async () => {
    await renderHome();
    const content = guideContent('en-US');

    expect(
      screen.getByRole('link', {
        name: format(content.home.viewAll, { count: catalog.entries.length }),
      }),
    ).toHaveAttribute('href', CAPABILITY_GUIDE_PATH);
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
