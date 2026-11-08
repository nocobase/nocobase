import { renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import examplesManifest from '../../../../templates/app-template-examples/package.json' with { type: 'json' };
import { CapabilityGuidePage } from '../../client/capability-guide/guide-page.js';
import plugin from '../../client/plugin.js';
import {
  createCapabilityCatalog,
  guideContent,
} from '../../shared/capability-guide/index.js';

const catalog = createCapabilityCatalog(examplesManifest);
const en = guideContent('en-US');

function Location(): React.ReactElement {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname + location.search}
    </output>
  );
}

async function renderGuide(route: string) {
  return renderWithApp(
    <>
      <Routes>
        <Route
          path='/capabilities'
          element={<CapabilityGuidePage catalog={catalog} />}
        />
        <Route
          path='/capabilities/:entryId'
          element={<CapabilityGuidePage catalog={catalog} />}
        />
      </Routes>
      <Location />
    </>,
    {
      plugins: [plugin()],
      namespace: '@nocobase/app-plugin-foundation',
      route,
      locale: 'en-US',
    },
  );
}

function rows(): HTMLElement[] {
  return within(screen.getByRole('list', { name: en.page.title })).getAllByRole(
    'link',
  );
}

describe('capability guide page', () => {
  it('lists the full catalog mixed and numbered, then narrows by source and keyword together', async () => {
    await renderGuide('/capabilities');
    expect(rows()).toHaveLength(catalog.entries.length);
    expect(rows()[0]).toHaveTextContent(/^1/);

    fireEvent.click(
      screen.getByRole('tab', { name: new RegExp(`^${en.sources.kernel}`) }),
    );
    await waitFor(() => expect(rows()).toHaveLength(7));
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/capabilities?source=kernel',
    );

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'background' },
    });
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('q=background'),
    );
    const kernelHits = rows().map((row) => row.textContent);
    expect(kernelHits.length).toBeGreaterThan(0);
    expect(kernelHits.every((text) => text?.includes(en.sources.kernel))).toBe(
      true,
    );

    fireEvent.click(
      screen.getByRole('tab', { name: new RegExp(`^${en.sources.plugin}`) }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/capabilities?source=plugin&q=background',
      ),
    );
    expect(
      rows().every((row) => row.textContent?.includes(en.sources.plugin)),
    ).toBe(true);
  });

  it('opens an entry with the filter kept, so going back restores the same list', async () => {
    await renderGuide('/capabilities?source=plugin&q=attach');
    const link = screen.getByRole('link', {
      name: new RegExp(en.entries['app-plugin-file'].title),
    });
    fireEvent.click(link);
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/capabilities/app-plugin-file?source=plugin&q=attach',
      ),
    );
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: en.entries['app-plugin-file'].title,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: en.detail.back }));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        /^\/capabilities\?source=plugin&q=attach$/,
      ),
    );
    expect(screen.getByRole('searchbox')).toHaveValue('attach');
  });

  it('copies exactly the prompt shown, including edits, and switches to the filled-in example', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() =>
      Promise.resolve(),
    );
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    await renderGuide('/capabilities/db');
    const prompt = en.entries.db.prompts.records;
    const box = screen.getByRole('textbox', { name: prompt.label });
    expect(box).toHaveValue(prompt.template);

    fireEvent.click(screen.getByRole('radio', { name: en.detail.example }));
    expect(box).toHaveValue(prompt.example);

    fireEvent.change(box, { target: { value: 'Edited prompt' } });
    fireEvent.click(screen.getByRole('button', { name: en.detail.copy }));
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('Edited prompt'),
    );

    fireEvent.click(screen.getByRole('button', { name: en.detail.reset }));
    expect(box).toHaveValue(prompt.example);
  });

  it('shows an example plugin with how to adapt it and its own demo', async () => {
    await renderGuide('/capabilities/app-plugin-lifecycle-example');
    expect(
      screen.getByRole('heading', { name: en.detail.adapt.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.detail.demo })).toHaveAttribute(
      'href',
      '/lifecycle-example/tickets',
    );
  });

  it('offers no demo on an entry without one', async () => {
    await renderGuide('/capabilities/db');
    expect(
      screen.queryByRole('link', { name: en.detail.demo }),
    ).not.toBeInTheDocument();
  });
});
