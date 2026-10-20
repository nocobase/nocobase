import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import plugin from '../../client/plugin.js';
import {
  FoundationPage,
  FoundationOverviewView,
} from '../../client/components/foundation-page.js';
import {
  FOUNDATION_CAPABILITIES,
  FOUNDATION_I18N_NAMESPACE,
  type FoundationCapability,
  type FoundationOverview,
} from '../../shared/foundation.js';

function capability(
  key: FoundationCapability['key'],
  overrides: Partial<FoundationCapability> = {},
): FoundationCapability {
  return {
    key,
    status: 'unused',
    facts: [],
    metrics: [],
    parts: [],
    packages: [],
    completeness: 'complete',
    issues: [],
    ...overrides,
  };
}

const OVERVIEW: FoundationOverview = {
  checkedAt: '2026-10-20T08:00:00.000Z',
  durationMs: 40,
  connection: 'default',
  capabilities: FOUNDATION_CAPABILITIES.map((key) => {
    switch (key) {
      case 'dataModeling':
        return capability(key, {
          status: 'active',
          facts: [
            {
              code: 'applicationCollections',
              params: { count: 2, names: ['equipment', 'borrowings'] },
            },
          ],
          metrics: [
            {
              key: 'businessRecords',
              value: 75413,
              unit: 'count',
              complete: true,
            },
            {
              key: 'businessCollections',
              value: 2,
              unit: 'count',
              complete: true,
            },
          ],
          packages: [{ name: '@nocobase/db', version: '1.2.3' }],
        });
      case 'permissions':
        return capability(key, {
          status: 'active',
          facts: [
            {
              code: 'permissionSets',
              // A stored translation key in a namespace this page has not loaded is shown by its last segment.
              params: {
                count: 1,
                names: [{ key: 'roles.borrower', ns: 'some-app' }],
              },
            },
          ],
        });
      case 'usersAndOrganizations':
        return capability(key, {
          status: 'active',
          // Part of the accounts could not be read: the count is a lower bound.
          metrics: [
            { key: 'accounts', value: 12, unit: 'count', complete: false },
          ],
          completeness: 'partial',
          issues: [{ code: 'SOURCE_UNREADABLE', source: 'userInvitations' }],
        });
      case 'mail':
        return capability(key, {
          status: 'needsSetup',
          reason: 'noConnectedMailbox',
        });
      case 'notifications':
        return capability(key, {
          status: null,
          completeness: 'failed',
          issues: [{ code: 'COLLECTOR_TIMEOUT' }],
        });
      case 'audit':
        return capability(key, { reason: 'notProvided' });
      default:
        return capability(key);
    }
  }),
};

describe('App Foundation page', () => {
  beforeEach(() => {
    // The page honours reduced motion by lighting everything at once, which keeps these tests free of timers.
    // jsdom has no matchMedia of its own.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) =>
        ({ matches: query.includes('reduce'), media: query }) as MediaQueryList,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  async function render(
    answer: (call: ApiCall) => unknown = () => ({ data: OVERVIEW }),
    locale = 'en-US',
  ) {
    const calls: ApiCall[] = [];
    // The application's routes provide the query cache; a test provides its own.
    await renderWithApp(
      <QueryClientProvider client={new QueryClient()}>
        <FoundationPage />
      </QueryClientProvider>,
      {
        plugins: [plugin()],
        namespace: FOUNDATION_I18N_NAMESPACE,
        locale,
        fetch: answerApi((call) => {
          calls.push(call);
          return answer(call);
        }),
      },
    );
    return calls;
  }

  it('shows every capability in the band with its real status', async () => {
    await render();

    const band = await screen.findByRole('button', {
      name: 'Data modeling: In use',
    });
    expect(band).toHaveAttribute('data-status', 'active');
    expect(
      screen.getByRole('button', { name: 'Mail: Ready, needs setup' }),
    ).toHaveAttribute('data-status', 'needsSetup');
    // A capability that could not be examined is undetermined, never "not used".
    expect(
      screen.getByRole('button', { name: 'Notifications: Undetermined' }),
    ).toHaveAttribute('data-status', 'undetermined');
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(
      FOUNDATION_CAPABILITIES.length - 1,
    );
    expect(screen.getByText('3 / 13')).toBeInTheDocument();
    expect(
      screen.getByText('1 capability could not be determined'),
    ).toBeInTheDocument();
  });

  it('renders discovered module associations, filters the band on focus and explains the value when selected', async () => {
    await renderWithApp(
      <FoundationOverviewView
        overview={OVERVIEW}
        registeredRoutes={[
          {
            id: 'sample:orders',
            name: 'orders',
            packageName: 'sample',
            source: 'application',
            path: '/orders',
            auth: 'required',
            authz: 'unrestricted',
            navigation: { title: 'Orders' },
            componentLoader: async () => ({ default: () => null }),
          },
        ]}
      />,
      { plugins: [plugin()], namespace: FOUNDATION_I18N_NAMESPACE },
    );
    const matrix = screen.getByRole('region', {
      name: 'Business modules and foundation capabilities',
    });
    expect(
      within(matrix).getAllByText('Capabilities: 3 · Pages: 1')[0],
    ).toBeInTheDocument();
    const chip = screen.getByRole('button', { name: 'Orders 3' });
    fireEvent.focus(chip);
    expect(
      screen
        .getByRole('button', { name: 'Data modeling: In use' })
        .closest('li'),
    ).toHaveClass('opacity-25');
    expect(
      screen.getByRole('button', { name: 'Permissions: In use' }).closest('li'),
    ).not.toHaveClass('opacity-25');
    fireEvent.blur(chip);
    expect(
      screen
        .getByRole('button', { name: 'Data modeling: In use' })
        .closest('li'),
    ).not.toHaveClass('opacity-25');
    fireEvent.click(
      within(matrix).getAllByRole('button', {
        name: 'Inspect Orders × Permissions',
      })[0]!,
    );
    expect(
      within(matrix).getByText('Page access controlled by permissions'),
    ).toBeInTheDocument();
    expect(
      within(matrix).getByText('Without the foundation'),
    ).toBeInTheDocument();
    const detail = screen.getByRole('region', { name: 'Permissions In use' });
    expect(
      within(
        within(detail).getByRole('list', {
          name: 'Connected business modules',
        }),
      ).getByText('Orders'),
    ).toBeInTheDocument();
    expect(
      within(matrix).getAllByLabelText('Not identified').length,
    ).toBeGreaterThan(0);
  });

  it('shows the selected capability’s evidence, numbers and packages', async () => {
    await render();

    const detail = await screen.findByRole('region', { name: /Data modeling/ });
    expect(
      within(detail).getByText(
        '2 Collections of the application’s own: equipment and borrowings.',
      ),
    ).toBeInTheDocument();
    expect(within(detail).getByText('75,413')).toBeInTheDocument();
    expect(within(detail).getByText('@nocobase/db')).toBeInTheDocument();
    expect(within(detail).getByText('1.2.3')).toBeInTheDocument();
  });

  it('marks a partial count as a lower bound and explains a missing one', async () => {
    await render();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Users & organizations: In use',
      }),
    );
    const detail = screen.getByRole('region', {
      name: /Users & organizations/,
    });
    expect(within(detail).getByText('≥ 12')).toBeInTheDocument();
    expect(
      within(detail).getByText('Could not read: userInvitations'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Notifications: Undetermined' }),
    );
    const failed = screen.getByRole('region', { name: /Notifications/ });
    expect(
      within(failed).getByText('Examining it took too long.'),
    ).toBeInTheDocument();
    expect(within(failed).queryByText('0')).not.toBeInTheDocument();
  });

  it('names stored titles in the reader’s language, or by their key when it cannot', async () => {
    await render();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Permissions: In use' }),
    );
    const detail = screen.getByRole('region', { name: /Permissions/ });
    expect(
      within(detail).getByText(
        '1 permission sets besides the unrestricted one: borrower.',
      ),
    ).toBeInTheDocument();
  });

  it('says why a capability is not in use and what using it brings', async () => {
    await render();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Mail: Ready, needs setup' }),
    );
    const detail = screen.getByRole('region', { name: /Mail/ });
    expect(
      within(detail).getByText('No mailbox is connected.'),
    ).toBeInTheDocument();
    expect(within(detail).getByText('Once in use')).toBeInTheDocument();
  });

  it('offers only refresh and collects again when asked to', async () => {
    const calls = await render();
    await screen.findByText('3 / 13');

    expect(
      screen.queryByRole('button', { name: 'Replay' }),
    ).not.toBeInTheDocument();
    expect(calls).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]).toMatchObject({
      method: 'GET',
      path: 'foundation/overview',
      query: { refresh: 'true' },
    });
  });

  it('tells a user without unrestricted access that the page is not theirs', async () => {
    await render(() =>
      Response.json(
        {
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            reason: 'FOUNDATION_FORBIDDEN',
            domain: 'foundation',
            message: 'Forbidden.',
          },
        },
        { status: 403 },
      ),
    );

    expect(
      await screen.findByText(
        'Only an administrator with unrestricted access can view the App foundation.',
      ),
    ).toBeInTheDocument();
  });

  it('makes a failed refresh visible while retaining the previous result and recovers on retry', async () => {
    let fail = false;
    await render(() =>
      fail
        ? Response.json(
            {
              error: {
                code: 500,
                status: 'INTERNAL_SERVER_ERROR',
                reason: 'FAILED',
                domain: 'foundation',
                message: 'Unavailable.',
              },
            },
            { status: 500 },
          )
        : { data: OVERVIEW },
    );
    const refresh = await screen.findByRole('button', { name: 'Refresh' });
    const timestamp = screen.getByText(/^Collected /).textContent;
    fail = true;
    fireEvent.click(refresh);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The latest refresh failed. Showing the last successfully collected result.',
    );
    expect(
      screen.getByRole('region', { name: 'NocoBase Core' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Collected /)).toHaveTextContent(timestamp!);
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
  });

  it.each([401, 403])(
    'hides cached internals when a refresh loses authorization (%i)',
    async (status) => {
      let denied = false;
      await render(() =>
        denied
          ? Response.json(
              {
                error: {
                  code: status,
                  status: 'PERMISSION_DENIED',
                  reason: 'ACCESS_DENIED',
                  domain: 'foundation',
                  message: 'Denied.',
                },
              },
              { status },
            )
          : { data: OVERVIEW },
      );
      const refresh = await screen.findByRole('button', { name: 'Refresh' });
      denied = true;
      fireEvent.click(refresh);
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Only an administrator with unrestricted access can view the App foundation.',
      );
      expect(
        screen.queryByRole('region', { name: 'NocoBase Core' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('75,413')).not.toBeInTheDocument();
    },
  );

  it('renders in Chinese', async () => {
    await render(undefined, 'zh-CN');

    expect(
      await screen.findByRole('button', { name: '数据建模: 在用' }),
    ).toBeInTheDocument();
    expect(screen.getByText('项底座能力正在支撑本系统')).toBeInTheDocument();
  });

  it('shows installed but unregistered Agents as unused in the band and its detail', async () => {
    await render(() => ({
      data: {
        ...OVERVIEW,
        capabilities: OVERVIEW.capabilities.filter(
          (entry) => entry.key === 'dataModeling' || entry.key === 'aiAgents',
        ),
        inventory: {
          entries: [
            {
              name: '@nocobase/app-plugin-foundation',
              version: 'test',
              installed: true,
              kind: 'plugin',
              origin: 'nocobase',
              registration: 'observed',
              categories: ['interface'],
              evidence: ['serverRegistration'],
            },
            {
              name: '@nocobase/app-plugin-agents',
              version: '1.0.0-beta.16',
              installed: true,
              kind: 'plugin',
              origin: 'nocobase',
              registration: 'unknown',
              categories: ['aiAgents'],
              evidence: ['manifest'],
            },
          ],
          complete: true,
          unreadable: [],
          serverRegistrationsComplete: true,
        },
      },
    }));
    const button = await screen.findByRole('button', {
      name: 'AI & agents: Not used yet',
    });
    expect(await screen.findByText('1 / 2')).toBeInTheDocument();
    fireEvent.click(button);
    const detail = screen.getByRole('region', {
      name: 'AI & agents Not used yet',
    });
    expect(
      within(detail).getByText(
        'Installed, but no current enablement or usage evidence has been identified.',
      ),
    ).toBeInTheDocument();
  });

  it('adds an injected Pro extension to the band and removes it again after unregistering', async () => {
    const foundation = {
      name: '@nocobase/app-plugin-foundation',
      version: 'test',
      installed: true,
      kind: 'plugin',
      origin: 'nocobase',
      registration: 'observed',
      categories: ['interface'],
      evidence: ['serverRegistration'],
    };
    const pro = {
      name: '@vendor/pro-approval',
      displayName: 'Pro approval',
      version: '1.2.3',
      installed: true,
      kind: 'plugin',
      origin: 'unverified',
      registration: 'observed',
      categories: [],
      evidence: ['serverRegistration'],
    };
    let entries = [foundation, pro];
    await render(() => ({
      data: {
        ...OVERVIEW,
        capabilities: OVERVIEW.capabilities.filter(
          (entry) => entry.key === 'dataModeling',
        ),
        inventory: {
          entries,
          complete: true,
          unreadable: [],
          serverRegistrationsComplete: true,
        },
      },
    }));
    const button = await screen.findByRole('button', {
      name: 'Pro approval: Pending recognition',
    });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    fireEvent.click(button);
    const detail = screen.getByRole('region', { name: /Pro approval/ });
    expect(within(detail).getByText('1.2.3')).toBeInTheDocument();
    expect(within(detail).getByText('Pending recognition')).toBeInTheDocument();
    entries = [foundation];
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('1 / 1');
    expect(
      screen.queryByRole('button', {
        name: 'Pro approval: Pending recognition',
      }),
    ).not.toBeInTheDocument();
  });

  it('keeps package versions and collapsed recognition evidence in the capability detail without a duplicate provider section', async () => {
    await render(() => ({
      data: {
        ...OVERVIEW,
        inventory: {
          complete: true,
          unreadable: [],
          entries: [
            {
              name: '@nocobase/app-plugin-foundation',
              version: 'test',
              installed: true,
              kind: 'plugin',
              origin: 'nocobase',
              categories: ['interface'],
              registration: 'observed',
              evidence: ['serverRegistration'],
            },
            {
              name: '@nocobase/db',
              version: '1.2.3',
              installed: true,
              kind: 'core',
              origin: 'nocobase',
              categories: ['dataModeling'],
              registration: 'unknown',
              evidence: ['manifest'],
            },
          ],
        },
      },
    }));
    const inventory = await screen.findByRole('region', {
      name: 'Data modeling In use',
    });
    expect(
      screen.queryByRole('region', { name: 'Capabilities and providers' }),
    ).not.toBeInTheDocument();
    expect(
      within(inventory).queryByRole('heading', {
        name: 'Additional providers · awaiting recognition',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(inventory).queryByText(
        'No additional provider was found within the current discovery scope.',
      ),
    ).not.toBeInTheDocument();
    const trigger = within(inventory).getByRole('button', {
      name: 'Recognition notes',
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(within(inventory).queryByText(/^Scope:/)).not.toBeInTheDocument();
    expect(within(inventory).getByText('@nocobase/db')).toBeVisible();
    expect(within(inventory).getByText('1.2.3')).toBeVisible();
    expect(
      within(inventory).queryByText('provider packages discovered'),
    ).not.toBeInTheDocument();
    expect(
      within(inventory).queryByText('Manifest found'),
    ).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await within(inventory).findByText(/^Scope:/)).toBeVisible();
    expect(
      within(inventory).getByText('provider packages discovered'),
    ).toBeVisible();
    expect(within(inventory).getByText('Manifest found')).toBeVisible();
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(within(inventory).queryByText(/^Scope:/)).not.toBeInTheDocument(),
    );
    expect(
      within(inventory).queryByText('provider packages discovered'),
    ).not.toBeInTheDocument();
    expect(within(inventory).getByText('@nocobase/db')).toBeVisible();
  });

  it('keeps extension diagnostics with the selected capability and resets the disclosure on capability changes', async () => {
    await render(() => ({
      data: {
        ...OVERVIEW,
        inventory: {
          complete: true,
          unreadable: [],
          entries: [
            {
              name: '@nocobase/db',
              version: '1.2.3',
              installed: true,
              kind: 'core',
              origin: 'nocobase',
              categories: ['dataModeling'],
              registration: 'unknown',
              evidence: ['manifest'],
            },
            {
              name: '@vendor/app-plugin-pro-audit',
              displayName: 'Pro audit',
              version: '2.3.4',
              installed: true,
              kind: 'plugin',
              origin: 'unverified',
              categories: [],
              registration: 'observed',
              evidence: ['manifest', 'databaseContribution'],
            },
          ],
        },
      },
    }));
    const inventory = await screen.findByRole('region', {
      name: 'Data modeling In use',
    });
    expect(
      screen.queryByRole('region', { name: 'Capabilities and providers' }),
    ).not.toBeInTheDocument();
    expect(within(inventory).getByText('@nocobase/db')).toBeVisible();
    expect(
      within(inventory).queryByText('@vendor/app-plugin-pro-audit'),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(inventory).getByRole('button', { name: 'Recognition notes' }),
    );
    expect(within(inventory).getByText('Manifest found')).toBeInTheDocument();
    expect(screen.getByText('3 / 6')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Mail: Ready, needs setup' }),
    );
    const mailDetail = screen.getByRole('region', {
      name: 'Mail Ready, needs setup',
    });
    expect(
      within(mailDetail).getByRole('button', { name: 'Recognition notes' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(mailDetail).queryByText('@nocobase/db'),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Pro audit: Pending recognition' }),
    );
    const extension = screen.getByRole('region', {
      name: 'Pro audit Pending recognition',
    });
    fireEvent.click(
      within(extension).getByRole('button', { name: 'Recognition notes' }),
    );
    expect(
      within(extension).getByText('Source unverified'),
    ).toBeInTheDocument();
    expect(
      within(extension).getByText('Current runtime contribution observed'),
    ).toBeInTheDocument();
  });
});
