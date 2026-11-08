// db-test-portability: dialect-specific — UI fixtures describe SQLite and PostgreSQL connections returned by a mocked API; no database is opened.
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import DatabaseOverview from '../../../client/capability-guide/details/database-overview.js';
import enUS from '../../../client/locales/en-US.js';
import packageMetadata from '../../../package.json' with { type: 'json' };

function mount(api: (call: ApiCall) => unknown) {
  return renderWithApp(<DatabaseOverview />, {
    route: '/capabilities/db',
    namespace: '@nocobase/app-plugin-foundation',
    namespaces: { [packageMetadata.name]: enUS },
    fetch: answerApi(api),
  });
}

it('shows configured connections, safe effective values and connection-specific browser links', async () => {
  const user = userEvent.setup();
  await mount(({ path }) => {
    expect(path).toContain('databaseExplorer/connections');
    return {
      data: [
        {
          name: 'main',
          dialect: 'sqlite',
          isDefault: true,
          schemaManagement: 'managed',
          password: 'must-not-render',
        },
        {
          name: 'reports & history',
          dialect: 'postgres',
          isDefault: false,
          schemaManagement: 'external',
          databaseName: 'reports',
          schemas: ['public'],
          naming: { underscored: false },
        },
      ],
    };
  });
  expect(
    await screen.findByText('2 configured connections'),
  ).toBeInTheDocument();
  const cards = screen.getAllByRole('listitem');
  expect(within(cards[0]).getByText('Default')).toBeInTheDocument();
  expect(within(cards[1]).queryByText('Default')).not.toBeInTheDocument();
  expect(
    within(cards[1]).getByRole('link', { name: 'Browse tables and fields' }),
  ).toHaveAttribute(
    'href',
    '/settings/database-explorer?connection=reports+%26+history',
  );
  await user.click(
    within(cards[1]).getByRole('button', {
      name: 'View effective configuration',
    }),
  );
  expect(within(cards[1]).getByText('Externally managed')).toBeInTheDocument();
  expect(within(cards[1]).getByText('public')).toBeInTheDocument();
  expect(within(cards[1]).getByText('No')).toBeInTheDocument();
  expect(
    within(cards[1]).getByText(/Their individual source/),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'How to add a database connection' }),
  );
  await user.click(screen.getByRole('tab', { name: 'Manual configuration' }));
  expect(
    screen.getByText(
      /Keep existing connections and database.default unchanged/,
    ),
  ).toBeInTheDocument();
  expect(screen.getByText('pnpm nocobase config check')).toBeInTheDocument();
  expect(
    screen.getByText(/schemaManagement: external/, { selector: 'code' }),
  ).toBeInTheDocument();
  expect(screen.queryByText('must-not-render')).not.toBeInTheDocument();
  expect(
    screen.queryByText(/not an export of this application/),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Configuration keys and YAML example' }),
  );
  expect(
    screen.getByText(/not an export of this application/),
  ).toBeInTheDocument();
});

it('does not report zero connections while loading, and retries a failed read', async () => {
  let attempts = 0;
  const user = userEvent.setup();
  await mount(() =>
    ++attempts === 1 ? new Response(null, { status: 503 }) : { data: [] },
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load database information',
  );
  expect(
    screen.queryByText('0 configured connections'),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  expect(
    await screen.findByText('No database connections are configured.'),
  ).toBeInTheDocument();
  expect(screen.getByText('0 configured connections')).toBeInTheDocument();
});

it.each([401, 403])(
  'handles denied reads (%s) without configuration values or browse links',
  async (status) => {
    await mount(() => new Response(null, { status }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      status === 401
        ? 'Your session has expired'
        : 'You do not have permission',
    );
    expect(
      screen.queryByRole('link', { name: 'Browse tables and fields' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
    if (status === 401)
      expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
        'href',
        '/login',
      );
  },
);

it('defaults to Agent, generates requirements, preserves edits across tabs and copies the visible draft', async () => {
  const user = userEvent.setup();
  const writeText = vi
    .spyOn(navigator.clipboard, 'writeText')
    .mockResolvedValue();
  await mount(() => ({ data: [] }));
  await user.click(
    screen.getByRole('button', { name: 'How to add a database connection' }),
  );
  expect(screen.getByRole('tab', { name: 'Use Agent' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const purpose = screen.getByRole('textbox', { name: 'Purpose' });
  await user.type(purpose, 'Sales reports');
  await user.click(screen.getByRole('button', { name: 'Update prompt' }));
  const prompt = screen.getByRole('textbox', { name: 'Editable prompt' });
  expect((prompt as HTMLTextAreaElement).value).toContain(
    'Purpose: Sales reports',
  );
  await user.clear(prompt);
  await user.type(prompt, 'My edited connection request');
  await user.click(screen.getByRole('tab', { name: 'Manual configuration' }));
  expect(screen.getByText('pnpm nocobase config check')).toBeVisible();
  expect(prompt).not.toBeVisible();
  await user.click(screen.getByRole('tab', { name: 'Use Agent' }));
  expect(prompt).toHaveValue('My edited connection request');
  await user.click(screen.getByRole('button', { name: 'Copy prompt' }));
  expect(await screen.findByText('Copied')).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledWith('My edited connection request');
  await user.type(prompt, ' amended');
  expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'How to add a database connection' }),
  );
  await user.click(
    screen.getByRole('button', { name: 'How to add a database connection' }),
  );
  expect(screen.getByRole('textbox', { name: 'Editable prompt' })).toHaveValue(
    'My edited connection request amended',
  );
});

it('offers manual copying when the clipboard is unavailable', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('Not allowed'),
  );
  await mount(() => ({ data: [] }));
  await user.click(
    screen.getByRole('button', { name: 'How to add a database connection' }),
  );
  await user.click(screen.getByRole('button', { name: 'Copy prompt' }));
  expect(
    await screen.findByText(
      'Copy failed. Select the prompt above and copy it manually.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('textbox', { name: 'Editable prompt' }),
  ).toBeEnabled();
});
