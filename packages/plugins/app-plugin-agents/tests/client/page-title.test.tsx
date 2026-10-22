// @vitest-environment jsdom
/**
 * A page under an application's own heading or tab bar: with `PageTitleContext` at `screenReaderOnly` it keeps its
 * `h1` for screen readers, and its description and actions take the title's row. A covering page shows its title.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ModelServiceView } from '../../shared/models.js';
import { clientMocks, resetApi } from './fake-client.js';
import { renderPage } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: ModelsPage } =
  await import('../../client/pages/models/index.js');
const { PageTitleContext } = await import('../../client/config.js');
const { PageHeader } = await import('../../client/components/page-header.js');
const { RouteChildPage } =
  await import('../../client/components/route-child-page.js');

const team: ModelServiceView = {
  name: 'team',
  title: 'Team',
  provider: 'openai-compatible',
  baseUrl: 'http://127.0.0.1:9999/v1',
  apiKeySet: true,
  enabled: true,
  models: [
    {
      value: 'mock-model',
      label: 'mock-model',
      kind: 'chat',
      dimensions: null,
    },
  ],
};

describe('a page title under the application’s own heading', () => {
  beforeEach(() => {
    resetApi({ 'agents/services': () => [team] }, [
      'agents.services/read',
      'agents.services/manage',
    ]);
  });

  it('shows the title by default', async () => {
    renderPage(<ModelsPage />);
    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'models.title',
    });
    expect(title).not.toHaveClass('sr-only');
    expect(screen.getByText('models.description')).toHaveClass('mt-1.5');
  });

  it('keeps the title for screen readers only, with the description and actions in its row', async () => {
    renderPage(
      <PageTitleContext.Provider value='screenReaderOnly'>
        <ModelsPage />
      </PageTitleContext.Provider>,
    );
    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'models.title',
    });
    expect(title).toHaveClass('sr-only');
    const description = screen.getByText('models.description');
    expect(description).not.toHaveClass('sr-only');
    expect(description).not.toHaveClass('mt-1.5');
    expect(
      await screen.findByRole('button', { name: 'services.add.open' }),
    ).toBeInTheDocument();
    expect(title.closest('header')).not.toHaveClass('sr-only');
  });

  it('takes no room when a header has nothing else to show', () => {
    render(
      <PageTitleContext.Provider value='screenReaderOnly'>
        <PageHeader title='Alone' />
      </PageTitleContext.Provider>,
    );
    const title = screen.getByRole('heading', { level: 1, name: 'Alone' });
    expect(title.closest('header')).toHaveClass('sr-only');
  });

  it('shows a covering page’s title, which no heading of the application names', () => {
    render(
      <PageTitleContext.Provider value='screenReaderOnly'>
        <PageHeader title='Beneath' description='The page beneath' />
        <RouteChildPage>
          <PageHeader title='Covering' description='A skill' />
        </RouteChildPage>
      </PageTitleContext.Provider>,
    );
    expect(screen.getByRole('heading', { name: 'Beneath' })).toHaveClass(
      'sr-only',
    );
    expect(screen.getByRole('heading', { name: 'Covering' })).not.toHaveClass(
      'sr-only',
    );
  });
});
