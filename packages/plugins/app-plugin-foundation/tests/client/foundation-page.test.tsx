import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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
    // jsdom has no matchMedia of its own; capability counts must also stay stable without reduced motion.
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
      screen.getByRole('button', {
        name: 'Notifications: Information pending update',
      }),
    ).toHaveAttribute('data-status', 'undetermined');
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(
      FOUNDATION_CAPABILITIES.length - 1,
    );
    expect(screen.getByText('3 / 13')).toBeInTheDocument();
    expect(
      screen.getByText('Information pending update (1)'),
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
    const preview = within(detail).getByRole('list', {
      name: 'Collection preview',
    });
    expect(within(preview).getByText('equipment')).toBeInTheDocument();
    expect(within(preview).getByText('borrowings')).toBeInTheDocument();
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
    ).not.toBeVisible();
    fireEvent.click(within(detail).getByText('Read details'));
    expect(
      within(detail).getByText('Could not read: userInvitations'),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Notifications: Information pending update',
      }),
    );
    const failed = screen.getByRole('region', { name: /Notifications/ });
    fireEvent.click(within(failed).getByText('Read details'));
    expect(
      within(failed).getByText('Examining it took too long.'),
    ).toBeVisible();
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

  it('shows a collecting placeholder without invented counts before the first result', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    const pending = new Promise((done) => {
      resolve = done;
    });
    const calls = await render(() => pending);
    expect(screen.getByRole('status')).toHaveTextContent('Collecting');
    expect(
      document.querySelector('[aria-busy="true"] [data-slot="skeleton"]'),
    ).not.toBeNull();
    expect(screen.queryByText('0 / 13')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Refresh' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(calls).toHaveLength(1));
    await act(async () => resolve({ data: OVERVIEW }));
    expect(await screen.findByText('3 / 13')).toBeInTheDocument();
  });

  it('does not restart known counts from zero when a newer result arrives without reduced motion', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: false }),
    });
    const calls = await render((call) => ({
      data: {
        ...OVERVIEW,
        checkedAt: call.query?.refresh
          ? '2026-10-21T08:00:00.000Z'
          : OVERVIEW.checkedAt,
      },
    }));
    expect(await screen.findByText('3 / 13')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(calls).toHaveLength(2));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled(),
    );
    expect(screen.getByText('3 / 13')).toBeInTheDocument();
    expect(screen.queryByText('0 / 13')).not.toBeInTheDocument();
  });

  it('refreshes the overview without requesting expensive business record counts', async () => {
    let completeRefresh: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      completeRefresh = resolve;
    });
    const calls = await render((call) =>
      call.query?.refresh
        ? pending.then(() => ({ data: OVERVIEW }))
        : { data: OVERVIEW },
    );
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
    expect(
      within(screen.getByRole('region', { name: 'NocoBase Core' })).getByRole(
        'button',
        { name: 'Collecting…' },
      ),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('3 / 13')).toBeInTheDocument();
    await act(async () => completeRefresh());
    expect(
      await screen.findByRole('button', { name: 'Refresh' }),
    ).toBeEnabled();
  });

  it('explains active model services without asking native OnlineAgent users to define an Agent', async () => {
    await render(() => ({
      data: {
        ...OVERVIEW,
        capabilities: OVERVIEW.capabilities.map((item) =>
          item.key === 'aiAgents'
            ? capability('aiAgents', {
                status: 'active',
                facts: [
                  { code: 'modelServices', params: { count: 1 } },
                  { code: 'runners', params: { count: 1 } },
                ],
                parts: [
                  { key: 'modelServices', status: 'active' },
                  { key: 'agents', status: 'unused' },
                ],
              })
            : item,
        ),
      },
    }));
    fireEvent.click(
      await screen.findByRole('button', { name: /^AI & agents:/ }),
    );
    const detail = await screen.findByRole('region', { name: /AI & agents/ });
    expect(
      within(detail).getByText(
        '1 enabled model services support OnlineAgent and model gateway calls.',
      ),
    ).toBeInTheDocument();
    expect(
      within(detail).getByText('1 registered runners support agent execution.'),
    ).toBeInTheDocument();
    expect(
      within(detail).queryByText('No agent is defined.'),
    ).not.toBeInTheDocument();
  });

  it('counts business records only when explicitly requested', async () => {
    const calls = await render();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Count business records' }),
    );
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]).toMatchObject({
      path: 'foundation/overview',
      query: { countRecords: 'true' },
    });
  });

  it('keeps the catalog in a dialog and searches automatically across pages', async () => {
    const names = Array.from(
      { length: 61 },
      (_, index) => `collection${String(index).padStart(3, '0')}`,
    );
    const calls = await render((call) => {
      if (call.path !== 'foundation/collections') return { data: OVERVIEW };
      const matching = names.filter((name) =>
        name.includes(String(call.query?.search ?? '')),
      );
      const offset = Number(call.query?.offset ?? 0);
      return {
        data: matching
          .slice(offset, offset + 50)
          .map((name) => ({ name, kind: 'table' })),
        meta: { total: matching.length },
      };
    });
    const open = await screen.findByRole('button', {
      name: 'View all collections',
    });
    expect(calls).toHaveLength(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(open);
    const dialog = await screen.findByRole('dialog', { name: 'Collections' });
    await screen.findByText('collection000');
    expect(
      within(dialog).getByRole('list', { name: 'Collections' }).children,
    ).toHaveLength(50);
    expect(screen.queryByText('collection060')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('collection060');
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search collections' }),
      { target: { value: 'collection059' } },
    );
    await screen.findByText('Showing 1–1 of 1');
    expect(calls.at(-1)).toMatchObject({
      path: 'foundation/collections',
      query: { search: 'collection059', offset: '0' },
    });
    expect(screen.queryByText('collection060')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close collections' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(open).toHaveFocus();
  });

  it('waits for IME composition to finish and shows a useful empty search state', async () => {
    const calls = await render((call) =>
      call.path === 'foundation/collections'
        ? { data: [], meta: { total: 0 } }
        : { data: OVERVIEW },
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'View all collections' }),
    );
    const input = await screen.findByRole('textbox', {
      name: 'Search collections',
    });
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'shebei' } });
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(
      calls.filter((call) => call.query?.search === 'shebei'),
    ).toHaveLength(0);
    fireEvent.change(input, { target: { value: '设备' } });
    fireEvent.compositionEnd(input);
    await waitFor(() => expect(calls.at(-1)?.query?.search).toBe('设备'));
    expect(
      await screen.findByText('No matching collections'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Try another name or clear the search.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('keeps a large catalog preview bounded without requesting its full list', async () => {
    const calls = await render(() => ({
      data: {
        ...OVERVIEW,
        capabilities: OVERVIEW.capabilities.map((item) =>
          item.key === 'dataModeling'
            ? {
                ...item,
                facts: [
                  {
                    code: 'applicationCollectionsPreview',
                    params: {
                      count: 1018,
                      names: Array.from(
                        { length: 1000 },
                        (_, index) => `demo${index}`,
                      ),
                    },
                  },
                ],
              }
            : item,
        ),
      },
    }));
    const preview = await screen.findByRole('list', {
      name: 'Collection preview',
    });
    expect(within(preview).getAllByRole('listitem')).toHaveLength(6);
    expect(within(preview).getByText('+1,013')).toBeInTheDocument();
    expect(screen.queryByText('demo999')).not.toBeInTheDocument();
    expect(calls).toHaveLength(1);
  });

  it.each([403, 500])(
    'offers catalog retry only for a recoverable failure (%i)',
    async (status) => {
      let failed = true;
      await render((call) =>
        call.path !== 'foundation/collections'
          ? { data: OVERVIEW }
          : failed
            ? Response.json(
                {
                  error: {
                    code: status,
                    status:
                      status === 403
                        ? 'PERMISSION_DENIED'
                        : 'INTERNAL_SERVER_ERROR',
                    reason: 'FAILED',
                    domain: 'foundation',
                    message: 'Unavailable.',
                  },
                },
                { status },
              )
            : {
                data: [{ name: 'recovered', kind: 'table' }],
                meta: { total: 1 },
              },
      );
      fireEvent.click(
        await screen.findByRole('button', { name: 'View all collections' }),
      );
      const dialog = await screen.findByRole('dialog', { name: 'Collections' });
      await within(dialog).findByRole('alert');
      if (status === 403)
        expect(
          within(dialog).queryByRole('button', { name: 'Try again' }),
        ).not.toBeInTheDocument();
      else {
        failed = false;
        fireEvent.click(
          within(dialog).getByRole('button', { name: 'Try again' }),
        );
        expect(
          await within(dialog).findByText('recovered'),
        ).toBeInTheDocument();
      }
    },
  );

  it.each([
    ['en-US', 'focus'],
    ['zh-CN', 'focus'],
    ['en-US', 'hover'],
    ['zh-CN', 'hover'],
  ])(
    'shows capability header tooltips in %s on %s',
    async (locale, interaction) => {
      await renderWithApp(
        <FoundationOverviewView
          overview={OVERVIEW}
          registeredRoutes={[
            {
              id: 'app:orders',
              name: 'orders',
              path: '/orders',
              source: 'application',
              packageName: 'app',
              auth: 'required',
              authz: 'skip',
              navigation: { title: 'Orders' },
              componentLoader: async () => ({ default: () => null }),
            },
          ]}
        />,
        { plugins: [plugin()], namespace: FOUNDATION_I18N_NAMESPACE, locale },
      );
      const matrix = screen.getByRole('region', {
        name:
          locale === 'en-US'
            ? 'Business modules and foundation capabilities'
            : '业务模块与底座能力',
      });
      const name = locale === 'en-US' ? 'Data modeling' : '数据建模';
      const trigger = within(matrix).getByRole('button', { name });
      if (interaction === 'focus') {
        fireEvent.keyDown(document, { key: 'Tab' });
        act(() => trigger.focus());
      } else {
        fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);
      }
      expect(await screen.findByRole('tooltip')).toHaveTextContent(name);
    },
  );

  it.each([401, 403])(
    'offers no retry when initial access is denied (%i)',
    async (status) => {
      await render(() =>
        Response.json(
          {
            error: {
              code: status,
              status: 'PERMISSION_DENIED',
              reason: 'FOUNDATION_FORBIDDEN',
              domain: 'foundation',
              message: 'Forbidden.',
            },
          },
          { status },
        ),
      );

      expect(
        await screen.findByText(
          'Only an administrator with unrestricted access can view the App foundation.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Try again' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Refresh' }),
      ).not.toBeInTheDocument();
    },
  );

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
    const timestamp = screen.getByText(/^Last check /).textContent;
    fail = true;
    fireEvent.click(refresh);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The latest refresh failed. Showing the last successfully collected result.',
    );
    expect(
      screen.getByRole('region', { name: 'NocoBase Core' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Last check /)).toHaveTextContent(timestamp!);
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
  });

  it.each(['partial', 'failed'] as const)(
    'uses only the top refresh for a %s capability without a missing-configuration claim',
    async (completeness) => {
      let reads = 0;
      await render((call) => {
        if (reads++ > 0) {
          expect(call.query).toEqual({ refresh: 'true' });
          return {
            data: {
              ...OVERVIEW,
              capabilities: [capability('mail', { status: 'active' })],
            },
          };
        }
        return {
          data: {
            ...OVERVIEW,
            capabilities: [
              capability('mail', {
                status: null,
                completeness,
                issues: [{ code: 'SOURCE_UNREADABLE', source: 'mailAccounts' }],
              }),
            ],
          },
        };
      });
      const detail = await screen.findByRole('region', {
        name: 'Mail Information pending update',
      });
      expect(
        within(detail).queryByText('No mailbox is connected.'),
      ).not.toBeInTheDocument();
      expect(within(detail).getByRole('note')).not.toHaveClass(
        'border-destructive/30',
      );
      expect(
        screen.queryByRole('button', { name: 'Try again' }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Refresh' })).toHaveLength(
        1,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      expect(
        await screen.findByRole('region', { name: 'Mail In use' }),
      ).toBeInTheDocument();
      expect(reads).toBe(2);
    },
  );

  it('retries an initial whole-page failure and restores the overview with top refresh', async () => {
    let reads = 0;
    await render((call) => {
      if (reads++ === 0)
        return Response.json(
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
        );
      expect(call.query).toEqual({ refresh: 'true' });
      return { data: OVERVIEW };
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Information pending update',
    );
    expect(
      screen.queryByRole('button', { name: 'Refresh' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'NocoBase Core' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('region', { name: 'NocoBase Core' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(reads).toBe(2);
  });

  it('words partial file numbers and distinguishes original history dates from the latest check', async () => {
    const historicalAt = '2026-10-19T07:00:00Z';
    await render(() => ({
      data: {
        ...OVERVIEW,
        capabilities: [
          capability('files', {
            status: 'active',
            checkedAt: historicalAt,
            completeness: 'partial',
            facts: [
              {
                code: 'fileCollectionsPartial',
                params: { count: 1, names: ['photos'] },
              },
            ],
            metrics: [
              { key: 'files', value: 3, unit: 'count', complete: false },
              {
                key: 'storedBytes',
                value: 120,
                unit: 'bytes',
                complete: false,
              },
              {
                key: 'fileCollections',
                value: 2,
                unit: 'count',
                complete: true,
                checkedAt: historicalAt,
              },
            ],
          }),
        ],
      },
    }));
    const detail = await screen.findByRole('region', {
      name: 'File management In use',
    });
    expect(within(detail).getByText('Counted 3')).toBeVisible();
    expect(within(detail).getByText('Counted 120 B')).toBeVisible();
    expect(
      within(detail).getByText('Counted 1 file collections: photos.'),
    ).toBeVisible();
    expect(
      within(detail).getAllByText('Some data is pending update'),
    ).toHaveLength(2);
    expect(
      within(detail).getAllByText(/Last confirmed Oct 19, 2026/),
    ).toHaveLength(2);
    expect(screen.getByText(/Last check Oct 20, 2026/)).toBeVisible();
    expect(within(detail).queryByText(/≥/)).not.toBeInTheDocument();
    expect(
      within(detail).queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument();
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
      expect(
        screen.queryByRole('button', { name: 'Try again' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Refresh' }),
      ).not.toBeInTheDocument();
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

  it('shows related packages once without recognition diagnostics', async () => {
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
              name: '@nocobase/app-plugin-database-explorer',
              version: '2.0.0',
              installed: true,
              kind: 'plugin',
              origin: 'nocobase',
              categories: ['dataModeling', 'interface'],
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
    expect(
      within(inventory).getByText('@nocobase/app-plugin-database-explorer'),
    ).toBeVisible();
    expect(within(inventory).getByText('2.0.0')).toBeVisible();
    expect(within(inventory).getAllByText('@nocobase/db')).toHaveLength(1);
    expect(within(inventory).getByText('1.2.3')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Recognition notes' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^Scope:/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('provider packages discovered'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Manifest found')).not.toBeInTheDocument();
  });

  it('shows only the selected capability packages including registered extensions', async () => {
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
    expect(screen.getByText('3 / 6')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Mail: Ready, needs setup' }),
    );
    const mailDetail = screen.getByRole('region', {
      name: 'Mail Ready, needs setup',
    });
    expect(
      within(mailDetail).queryByRole('button', { name: 'Recognition notes' }),
    ).not.toBeInTheDocument();
    expect(
      within(mailDetail).queryByText('@nocobase/db'),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Pro audit: Pending recognition' }),
    );
    const extension = screen.getByRole('region', {
      name: 'Pro audit Pending recognition',
    });
    expect(
      within(extension).getByText('@vendor/app-plugin-pro-audit'),
    ).toBeVisible();
    expect(within(extension).getByText('2.3.4')).toBeVisible();
    expect(
      within(extension).queryByRole('button', { name: 'Recognition notes' }),
    ).not.toBeInTheDocument();
  });
});
