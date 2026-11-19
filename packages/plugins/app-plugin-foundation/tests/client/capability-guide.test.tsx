import {
  PageBreadcrumbProvider,
  usePageBreadcrumbLevels,
} from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  defineAppRoutes,
  defineClientPlugin,
} from '@nocobase/app-client/plugins';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { CapabilityGuidePage } from '../../client/capability-guide/guide-page.js';
import plugin from '../../client/plugin.js';
import {
  createCapabilityCatalog,
  guideContent,
} from '../../shared/capability-guide/index.js';
import { SAMPLE_MANIFEST } from '../fixtures/capability-manifest.js';

const catalog = createCapabilityCatalog(SAMPLE_MANIFEST);

/** Stands in for the lifecycle example registering its demo page. */
const lifecycleDemo = defineClientPlugin({
  packageName: '@nocobase/app-plugin-lifecycle-example',
  routes: defineAppRoutes([
    {
      name: 'tickets',
      path: '/lifecycle-example/tickets',
      auth: 'required',
      authz: 'skip',
      componentLoader: () => Promise.resolve({ default: () => null }),
    },
  ]),
});

function HistoryBack(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <button type='button' onClick={() => void navigate(-1)}>
      history back
    </button>
  );
}
const en = guideContent('en-US');

function Location(): React.ReactElement {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname + location.search}
    </output>
  );
}

function BreadcrumbHeader() {
  const levels = usePageBreadcrumbLevels() ?? [];
  return (
    <nav aria-label='Breadcrumb'>
      {levels.map((level, index) =>
        index < levels.length - 1 && level.to ? (
          <Link key={level.label} to={level.to}>
            {level.label}
          </Link>
        ) : (
          <span key={level.label}>{level.label}</span>
        ),
      )}
    </nav>
  );
}

async function renderGuide(
  route: string,
  options: {
    readonly demo?: boolean;
    readonly catalog?: typeof catalog;
    readonly entryComponents?: Readonly<Record<string, React.ComponentType>>;
  } = {},
) {
  return renderWithApp(
    <PageBreadcrumbProvider>
      <BreadcrumbHeader />
      <Routes>
        <Route
          path='/settings/capabilities'
          element={
            <CapabilityGuidePage
              catalog={options.catalog ?? catalog}
              settingsPath='/settings'
              entryComponents={options.entryComponents}
            />
          }
        />
        <Route
          path='/settings/capabilities/:entryId'
          element={
            <CapabilityGuidePage
              catalog={options.catalog ?? catalog}
              settingsPath='/settings'
              entryComponents={options.entryComponents}
            />
          }
        />
      </Routes>
      <Location />
      <HistoryBack />
    </PageBreadcrumbProvider>,
    {
      plugins: [plugin(), ...(options.demo ? [lifecycleDemo()] : [])],
      namespace: '@nocobase/app-plugin-foundation',
      route,
      locale: 'en-US',
    },
  );
}

function rows(): HTMLElement[] {
  return within(
    screen.getByRole('list', { name: en.page.title }),
  ).queryAllByRole('link');
}

describe('capability guide page', () => {
  it('lists the full catalog mixed and numbered, then narrows by source and keyword together', async () => {
    await renderGuide('/settings/capabilities');
    expect(rows()).toHaveLength(catalog.entries.length);
    expect(rows()[0]).toHaveTextContent(/^1/);
    const list = screen.getByRole('list', { name: en.page.title });
    expect(within(list).getByText('@nocobase/app-plugin-file')).toBeVisible();
    expect(within(list).getByText('@nocobase/db')).toBeVisible();
    expect(
      within(list).getByText('@acme/app-plugin-crm', { selector: 'code' }),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole('tab', { name: new RegExp(`^${en.sources.kernel}`) }),
    );
    await waitFor(() => expect(rows()).toHaveLength(3));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/settings/capabilities?source=kernel',
      ),
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
        '/settings/capabilities?source=plugin&q=background',
      ),
    );
    expect(
      rows().every((row) => row.textContent?.includes(en.sources.plugin)),
    ).toBe(true);
  });

  it('opens an entry with the filter kept, so going back restores the same list', async () => {
    await renderGuide('/settings/capabilities?source=plugin&q=attach');
    const link = screen.getByRole('link', {
      name: new RegExp(en.entries['app-plugin-file'].title),
    });
    fireEvent.click(link);
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/settings/capabilities/app-plugin-file?source=plugin&q=attach',
      ),
    );
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: en.entries['app-plugin-file'].title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: en.detail.back }),
    ).not.toBeInTheDocument();
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(breadcrumb).getByRole('link', { name: 'System settings' }),
    ).toHaveAttribute('href', '/settings');
    expect(
      within(breadcrumb).getByText(en.entries['app-plugin-file'].title),
    ).toBeInTheDocument();
    fireEvent.click(
      within(breadcrumb).getByRole('link', { name: en.page.title }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        /^\/settings\/capabilities\?source=plugin&q=attach$/,
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
    await renderGuide('/settings/capabilities/db');
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
    await renderGuide('/settings/capabilities/app-plugin-lifecycle-example', {
      demo: true,
    });
    expect(
      screen.getByRole('heading', { name: en.detail.adapt.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.detail.demo })).toHaveAttribute(
      'href',
      '/lifecycle-example/tickets',
    );
  });

  it('offers no demo on an entry without one', async () => {
    await renderGuide('/settings/capabilities/db');
    expect(
      screen.queryByRole('link', { name: en.detail.demo }),
    ).not.toBeInTheDocument();
  });

  it('keeps the guidance but shows no demo when the example page is not registered', async () => {
    await renderGuide('/settings/capabilities/app-plugin-lifecycle-example');
    expect(
      screen.getByRole('heading', { name: en.detail.adapt.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: en.detail.demo }),
    ).not.toBeInTheDocument();
  });

  it('restores the tab, keywords and list the URL carries after the browser goes back', async () => {
    await renderGuide('/settings/capabilities/jobs?source=kernel&q=background');
    expect(screen.getByRole('searchbox')).toHaveValue('background');

    fireEvent.click(
      screen.getByRole('link', {
        name: new RegExp(en.entries.lifecycle.title),
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        /^\/settings\/capabilities\/lifecycle\?/,
      ),
    );
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    fireEvent.click(
      screen.getByRole('tab', { name: new RegExp(`^${en.sources.all}`) }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        /^\/settings\/capabilities\/lifecycle$/,
      ),
    );
    expect(rows()).toHaveLength(catalog.entries.length);

    fireEvent.click(screen.getByRole('button', { name: 'history back' }));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/settings/capabilities/jobs?source=kernel&q=background',
      ),
    );
    expect(screen.getByRole('searchbox')).toHaveValue('background');
    expect(
      screen.getByRole('tab', { name: new RegExp(`^${en.sources.kernel}`) }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      rows().every((row) => row.textContent?.includes(en.sources.kernel)),
    ).toBe(true);
  });
});

it('uses an app-owned database detail body while retaining catalog navigation', async () => {
  await renderGuide('/settings/capabilities/db?source=kernel&q=db', {
    entryComponents: { db: () => <p>Live database overview</p> },
  });
  expect(await screen.findByText('Live database overview')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: en.detail.copy }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(en.detail.prerequisite)).not.toBeInTheDocument();
  expect(
    screen.getByRole('navigation', { name: 'Breadcrumb' }),
  ).toHaveTextContent(en.entries.db.title);
});

it.each(
  catalog.entries.map(
    (entry) => [entry.id, entry.packageName, entry.docs] as const,
  ),
)(
  'keeps documentation and application context available for %s',
  async (id, packageName, docs) => {
    await renderGuide(`/settings/capabilities/${id}`);
    const article = screen.getByRole('article');
    expect(
      within(article).getByRole('link', { name: en.detail.docs }),
    ).toHaveAttribute(
      'href',
      docs
        ? `https://docs.nocobase.com${docs}`
        : `https://www.npmjs.com/package/${packageName}`,
    );
    expect(
      within(article).getByRole('heading', { name: 'This application' }),
    ).toBeVisible();
    expect(
      within(article).getByText(/No dedicated runtime overview is available/),
    ).toBeVisible();
  },
);

it('redirects the old i18n detail to the merged entry and keeps filters', async () => {
  const merged = createCapabilityCatalog({
    dependencies: {
      '@nocobase/i18n': '*',
      '@nocobase/app-plugin-i18n': '*',
    },
  });
  await renderGuide('/settings/capabilities/i18n?source=plugin&q=i18n', {
    catalog: merged,
    entryComponents: {
      'app-plugin-i18n': () => <p>Combined language configuration</p>,
    },
  });
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/settings/capabilities/app-plugin-i18n?source=plugin&q=i18n',
    ),
  );
  expect(
    await screen.findByText('Combined language configuration'),
  ).toBeVisible();
  expect(rows()).toHaveLength(1);
  expect(rows()[0]).toHaveAttribute(
    'href',
    '/settings/capabilities/app-plugin-i18n?source=plugin&q=i18n',
  );
});

it('opens the first filtered entry on desktop and preserves the search parameters', async () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  try {
    await renderGuide('/settings/capabilities?source=kernel&q=db');
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/settings/capabilities/db?source=kernel&q=db',
      ),
    );
  } finally {
    vi.unstubAllGlobals();
  }
});
