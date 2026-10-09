// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RUNNERS_TOPIC } from '../../shared/realtime.js';
import type { RunnerSummary } from '../../shared/runners.js';
import { callsTo, clientMocks, realtime, resetApi } from './fake-client.js';
import { runner } from './fixtures.js';
import { renderPage, renderRoute } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: RuntimesPage } =
  await import('../../client/pages/runtimes/index.js');
const { default: ConnectPage } =
  await import('../../client/pages/runtimes/connect.js');

describe('runtimes page', () => {
  let runners: RunnerSummary[];
  beforeEach(() => {
    runners = [
      runner('r1', {
        name: 'Mac Studio',
        tools: [
          {
            kind: 'claude',
            version: '2.1.0',
            path: '/usr/bin/claude',
            authenticated: true,
          },
          { kind: 'codex', version: '0.159.3', authenticated: false },
        ],
        canChangeTrust: true,
        canManage: true,
        activeRuns: 1,
        slots: 2,
      }),
      runner('r2', { name: 'old-box', status: 'revoked', tools: [] }),
    ];
    resetApi({
      'agents/runners': () => runners,
      'agents/runners/r1/runs': () => [
        {
          id: 'run1',
          title: 'Coder',
          status: 'completed',
          startedAt: '2026-10-01T08:00:00.000Z',
          finishedAt: '2026-10-01T08:10:00.000Z',
          createdAt: '2026-10-01T08:00:00.000Z',
          path: '/samples/1',
        },
      ],
      'PATCH agents/runners/r1': (request) => ({
        ...runners[0],
        ...(request.json as object),
      }),
      'POST agents/runners/registrationTokens': (request) => ({
        id: 't1',
        token: 'fgreg_secret',
        trust: (request.json as { trust: string }).trust,
        enabledTools: (request.json as { enabledTools: unknown }).enabledTools,
        slots: (request.json as { slots: unknown }).slots,
        toolSlots: (request.json as { toolSlots?: unknown }).toolSlots ?? null,
        expiresAt: '2026-10-01T09:00:00.000Z',
      }),
    });
  });

  /** Opens r1's sheet by clicking its row. */
  const openSheet = async (id = 'r1'): Promise<HTMLElement> => {
    fireEvent.click(await screen.findByTestId(`runner-${id}`));
    return await screen.findByTestId('runner-sheet');
  };

  it('lists each runtime as one overview row, without switches', async () => {
    renderPage(<RuntimesPage />);
    const row = await screen.findByTestId('runner-r1');
    within(row).getByText('Mac Studio');
    within(row).getByText('darwin · arm64');
    // Never the host name.
    expect(within(row).queryByText(/r1\.local/u)).toBeNull();
    within(row).getByText(/^runtimes\.activity\.online\(active=1,slots=2,/u);
    within(row).getByText('runtimes.trust.ownerOnly');
    within(row).getByText('0.1.0');
    expect(within(row).queryByRole('switch')).toBeNull();
    const claude = within(row)
      .getByText('tools.claude')
      .closest('[data-state]');
    expect(claude).toHaveAttribute('data-state', 'signedIn');
    const codex = within(row).getByText('tools.codex').closest('[data-state]');
    expect(codex).toHaveAttribute('data-state', 'signedOut');
    // No paths or versions of the tools on the list.
    expect(within(row).queryByText('/usr/bin/claude')).toBeNull();
    expect(within(row).queryByText('2.1.0')).toBeNull();
    expect(
      screen.getByText('runtimes.revokedList(count=1)'),
    ).toBeInTheDocument();
  });

  it('says busy with the slots in use, and how long a runtime has been offline', async () => {
    runners = [
      runner('r1', { activeRuns: 1, slots: 1 }),
      runner('r4', { status: 'offline' }),
    ];
    renderPage(<RuntimesPage />);
    const busy = await screen.findByTestId('runner-r1');
    within(busy).getByText(/^runtimes\.activity\.busy\(active=1,slots=1,/u);
    within(screen.getByTestId('runner-r4')).getByText(
      /^runtimes\.activity\.offline\(/u,
    );
  });

  it('marks a runner a newer version is served for, with the command that updates it', async () => {
    runners[0] = { ...runners[0]!, updateVersion: '0.2.0' };
    renderPage(<RuntimesPage />);
    const row = await screen.findByTestId('runner-r1');
    // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
    await userEvent.click(within(row).getByText('runtimes.upgrade.badge'));
    expect(
      await screen.findByText('nocobase-runner update'),
    ).toBeInTheDocument();
    // The mark does not open the runtime.
    expect(screen.queryByTestId('runner-sheet')).toBeNull();
  });

  it('opens a runtime’s settings from its row: tools with versions and paths, local policy and recent runs', async () => {
    runners[0] = {
      ...runners[0]!,
      policy: { subjects: ['NP-*'], repos: [] },
    };
    renderPage(<RuntimesPage />);
    const sheet = await openSheet();
    expect(sheet).toHaveClass('data-[side=right]:sm:max-w-xl');
    expect(sheet).not.toHaveClass('data-[side=right]:sm:max-w-sm');
    within(sheet).getByText('runtimes.detail.general');
    expect(within(sheet).getByLabelText('runtimes.edit.name')).toHaveValue(
      'Mac Studio',
    );
    const claude = within(sheet).getByTestId('runner-tool-claude');
    within(claude).getByText('runtimes.tool.version(version=2.1.0)');
    // Where it is installed, as small text in the row when the server sent it.
    expect(
      within(claude).getByTestId('runner-tool-claude-path'),
    ).toHaveTextContent('/usr/bin/claude');
    within(claude).getByText('runtimes.tool.signedIn');
    within(sheet).getByText('NP-*');
    within(sheet).getByText('runtimes.policy.nothing');
    within(sheet).getByText('runtimes.policy.any');
    const runs = await within(sheet).findByTestId('runner-runs');
    expect(within(runs).getByRole('link', { name: 'Coder' })).toHaveAttribute(
      'href',
      '/samples/1',
    );
    within(runs).getByText('runs.status.completed');
  });

  it('opens the same settings from the row’s Edit item', async () => {
    renderPage(<RuntimesPage />);
    const row = await screen.findByTestId('runner-r1');
    await userEvent.click(
      within(row).getByRole('button', {
        name: 'runtimes.actionsFor(name=Mac Studio)',
      }),
    );
    fireEvent.click(await screen.findByText('runtimes.edit.button'));
    expect(await screen.findByTestId('runner-sheet')).toBeInTheDocument();
  });

  it('says why a runtime that needs an upgrade takes no work, and how to update it', async () => {
    runners = [
      runner('r3', {
        name: 'Old laptop',
        status: 'upgrade_required',
        version: '0.0.9',
        product: 'nocobase-runner',
        protocolVersion: 2,
        updateVersion: '0.2.0',
      }),
    ];
    renderPage(<RuntimesPage />);
    const row = await screen.findByTestId('runner-r3');
    expect(
      within(row).getByText('runtimes.status.upgrade_required'),
    ).toBeInTheDocument();
    const sheet = await openSheet('r3');
    const notice = within(sheet)
      .getByText('runtimes.upgradeRequired.title')
      .closest<HTMLElement>('[role="status"]')!;
    expect(
      within(notice).getByText(
        /^runtimes\.upgradeRequired\.older\(version=0\.0\.9,protocol=2,required=3–4/u,
      ),
    ).toBeInTheDocument();
    expect(
      within(notice).getByText(
        /^runtimes\.upgradeRequired\.latest\(.*latest=0\.2\.0/u,
      ),
    ).toBeInTheDocument();
    expect(
      within(notice).getByText('nocobase-runner update'),
    ).toBeInTheDocument();
  });

  it('says to install a runner again that does not report how it was installed', async () => {
    runners = [
      runner('r5', {
        name: 'Older laptop',
        status: 'upgrade_required',
        version: '0.0.8',
        product: null,
        protocolVersion: 2,
        updateVersion: null,
      }),
    ];
    renderPage(<RuntimesPage />);
    const sheet = await openSheet('r5');
    expect(
      within(sheet).getByText(/^runtimes\.upgradeRequired\.reinstall/u),
    ).toBeInTheDocument();
    expect(within(sheet).queryByText(/runner update$/u)).toBeNull();
  });

  it('shows the runs by coding tool against each tool’s limit', async () => {
    runners = [
      runner('r1', {
        slots: 3,
        activeRuns: 3,
        toolSlots: { claude: 2, codex: 1 },
        activeByTool: { claude: 2, codex: 1 },
      }),
      runner('r3', { slots: 2 }),
    ];
    renderPage(<RuntimesPage />);
    const row = await screen.findByTestId('runner-r1');
    const usage = within(row).getByRole('list', {
      name: 'runtimes.toolUsage.label',
    });
    expect(
      within(usage)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'runtimes.toolUsage.item(tool=tools.claude,used=2,limit=2)',
      'runtimes.toolUsage.item(tool=tools.codex,used=1,limit=1)',
    ]);
    // Without limits per tool and with nothing running, there is nothing to show.
    expect(
      within(screen.getByTestId('runner-r3')).queryByRole('list', {
        name: 'runtimes.toolUsage.label',
      }),
    ).toBeNull();
  });

  it('shows a runtime built without limits per tool, as code from before them builds it', async () => {
    const {
      toolSlots: _toolSlots,
      toolLoad: _toolLoad,
      activeByTool: _activeByTool,
      ...older
    } = runner('r1', { activeRuns: 1, slots: 2, canManage: true });
    runners = [older];
    renderPage(<RuntimesPage />);
    const row = await screen.findByTestId('runner-r1');
    within(row).getByText(/^runtimes\.activity\.online\(active=1,slots=2,/u);
    expect(
      within(row).queryByRole('list', { name: 'runtimes.toolUsage.label' }),
    ).toBeNull();
    const sheet = await openSheet();
    expect(
      within(sheet).getByLabelText(
        'runtimes.toolSlots.inputLabel(tool=tools.claude)',
      ),
    ).toHaveValue('');
    // What it runs per tool is unknown, not zero.
    expect(
      within(within(sheet).getByTestId('runner-tool-claude')).getByText('—'),
    ).toBeInTheDocument();
  });

  it('saves limits per coding tool, and clears them', async () => {
    runners[0] = { ...runners[0]!, toolSlots: { codex: 1 } };
    renderPage(<RuntimesPage />);
    const sheet = await openSheet();
    // One table: each tool's switch, sign-in, limit and runs, in one row.
    const claudeRow = within(sheet).getByTestId('runner-tool-claude');
    within(claudeRow).getByRole('switch');
    within(claudeRow).getByText('runtimes.tool.signedIn');
    const claude = within(claudeRow).getByLabelText(
      'runtimes.toolSlots.inputLabel(tool=tools.claude)',
    );
    const codex = within(sheet).getByLabelText(
      'runtimes.toolSlots.inputLabel(tool=tools.codex)',
    );
    expect(codex).toHaveValue('1');
    // Above the max concurrent runs (2): said, and bounded by them.
    fireEvent.change(claude, { target: { value: '3' } });
    expect(
      within(sheet).getByTestId('tool-slots-over-total'),
    ).toHaveTextContent(
      'runtimes.toolSlots.overTotal(tools=tools.claude,slots=2)',
    );
    fireEvent.change(claude, { target: { value: '0' } });
    fireEvent.click(
      within(sheet).getByRole('button', { name: 'actions.save' }),
    );
    expect(
      await within(sheet).findByText('runtimes.toolSlots.invalid'),
    ).toBeInTheDocument();
    expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(0);
    fireEvent.change(claude, { target: { value: '2' } });
    fireEvent.change(codex, { target: { value: '' } });
    fireEvent.click(
      within(sheet).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(1),
    );
    expect(callsTo('PATCH', 'agents/runners/r1')[0]?.json).toEqual({
      toolSlots: { claude: 2 },
    });
  });

  it('saves the name and concurrency, and warns before sharing with the team', async () => {
    renderPage(<RuntimesPage />);
    const sheet = await openSheet();
    fireEvent.change(within(sheet).getByLabelText('runtimes.edit.name'), {
      target: { value: 'Studio' },
    });
    fireEvent.change(within(sheet).getByLabelText('connect.slots'), {
      target: { value: '3' },
    });
    fireEvent.click(
      within(sheet).getByRole('radio', { name: /^runtimes\.trust\.team/u }),
    );
    fireEvent.click(
      within(sheet).getByRole('button', { name: 'actions.save' }),
    );
    const warning = await screen.findByRole('alertdialog');
    expect(
      within(warning).getByText('runtimes.share.description'),
    ).toBeInTheDocument();
    expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(0);
    fireEvent.click(
      within(warning).getByRole('button', { name: 'runtimes.share.confirm' }),
    );
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(1),
    );
    expect(callsTo('PATCH', 'agents/runners/r1')[0]?.json).toEqual({
      name: 'Studio',
      slots: 3,
      trust: 'team',
    });
  });

  it('offers build jobs only when the application gives runners jobs', async () => {
    renderPage(<RuntimesPage />);
    let sheet = await openSheet();
    expect(within(sheet).queryByText('runtimes.jobs.allow')).toBeNull();
    cleanup();

    runners[0] = {
      ...runners[0]!,
      offersJobs: true,
      features: ['input', 'jobs.build', 'jobs.git.check'],
    };
    renderPage(<RuntimesPage />);
    sheet = await openSheet();
    within(sheet).getByText('runtimes.jobs.hint(kinds=build, git.check)');
    const jobs = within(sheet).getByRole('switch', {
      name: 'runtimes.jobs.allow',
    });
    expect(jobs).not.toBeChecked();
    fireEvent.click(jobs);
    fireEvent.click(
      within(sheet).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(1),
    );
    expect(callsTo('PATCH', 'agents/runners/r1')[0]?.json).toEqual({
      acceptJobs: true,
    });
  });

  it('adds a personal runtime with one command and shows it connected', async () => {
    renderRoute(<ConnectPage />, '/runtimes/connect', '/runtimes/connect');
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).queryByRole('radio', { name: 'runtimes.trust.team' }),
    ).toBeNull();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'connect.createCredential' }),
    );
    await within(dialog).findByText('connect.after');
    expect(
      callsTo('POST', 'agents/runners/registrationTokens')[0]?.json,
    ).toEqual({
      trust: 'ownerOnly',
      enabledTools: null,
      slots: 1,
    });
    expect(within(dialog).getAllByText(/fgreg_secret/u).length).toBeGreaterThan(
      0,
    );
    expect(
      within(dialog).getByText(
        /^nocobase-runner register .*--token fgreg_secret.* && nocobase-runner service install$/u,
      ),
    ).toBeInTheDocument();
    runners = [...runners, runner('r3', { name: 'build-box' })];
    realtime.publish(RUNNERS_TOPIC, {
      kind: 'runners.changed',
      runnerId: 'r3',
    });
    expect(
      await within(dialog).findByText('connect.connected(name=build-box)'),
    ).toBeInTheDocument();
  });

  it('lets a manager of runners add a runtime shared with the team', async () => {
    resetApi(
      {
        'agents/runners': () => runners,
        'POST agents/runners/registrationTokens': () => ({
          id: 't1',
          token: 'fgreg_secret',
          trust: 'team',
          expiresAt: '2026-10-01T09:00:00.000Z',
        }),
      },
      ['agents.runners/manage'],
    );
    renderRoute(<ConnectPage />, '/runtimes/connect', '/runtimes/connect');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('radio', { name: 'runtimes.trust.team' }),
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'connect.createCredential' }),
    );
    await waitFor(() =>
      expect(
        callsTo('POST', 'agents/runners/registrationTokens')[0]?.json,
      ).toEqual({
        trust: 'team',
        enabledTools: null,
        slots: 1,
      }),
    );
  });

  it('turns a coding tool on or off for a runtime, greying the ones that are off', async () => {
    runners[0] = { ...runners[0]!, enabledTools: ['codex', 'pi'] };
    renderPage(<RuntimesPage />);
    const sheet = await openSheet();
    const claude = within(sheet).getByTestId('runner-tool-claude');
    expect(claude).toHaveAttribute('data-enabled', 'false');
    expect(within(claude).getByText('runtimes.tool.off')).toBeInTheDocument();
    // Enabled but not reported: not listed.
    expect(within(sheet).queryByTestId('runner-tool-pi')).toBeNull();

    fireEvent.click(
      within(claude).getByRole('switch', {
        name: 'runtimes.tool.enableLabel(tool=tools.claude,name=Mac Studio)',
      }),
    );
    // A switch is saved with the form, as the limits are.
    expect(claude).toHaveAttribute('data-enabled', 'true');
    expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(0);
    fireEvent.click(
      within(sheet).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(1),
    );
    expect(callsTo('PATCH', 'agents/runners/r1')[0]?.json).toEqual({
      enabledTools: ['claude', 'codex', 'pi'],
    });
  });

  it('turns one tool off out of every tool', async () => {
    renderPage(<RuntimesPage />);
    const sheet = await openSheet();
    const codex = within(sheet).getByTestId('runner-tool-codex');
    expect(codex).toHaveAttribute('data-enabled', 'true');
    fireEvent.click(within(codex).getByRole('switch'));
    fireEvent.click(
      within(sheet).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(1),
    );
    expect(callsTo('PATCH', 'agents/runners/r1')[0]?.json).toEqual({
      enabledTools: ['claude', 'opencode', 'pi'],
    });
  });

  it('shows the settings read-only to someone who may not manage the runtime', async () => {
    runners[0] = { ...runners[0]!, canManage: false, canChangeTrust: false };
    renderPage(<RuntimesPage />);
    const row = await screen.findByTestId('runner-r1');
    expect(
      within(row).queryByRole('button', { name: /actionsFor/u }),
    ).toBeNull();
    const sheet = await openSheet();
    within(sheet).getByText('runtimes.detail.readOnly');
    expect(within(sheet).getByLabelText('runtimes.edit.name')).toBeDisabled();
    expect(
      within(sheet).queryByRole('button', { name: 'actions.save' }),
    ).toBeNull();
    const toggle = within(
      within(sheet).getByTestId('runner-tool-claude'),
    ).getByRole('switch');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(toggle);
    expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(0);
  });

  it('adds a runtime that runs only the coding tools checked, with its concurrency', async () => {
    renderRoute(<ConnectPage />, '/runtimes/connect', '/runtimes/connect');
    const dialog = await screen.findByRole('dialog');
    for (const tool of ['claude', 'codex', 'opencode', 'pi'])
      expect(
        within(dialog).getByRole('checkbox', { name: `tools.${tool}` }),
      ).toBeChecked();
    for (const tool of ['claude', 'codex', 'opencode', 'pi'])
      fireEvent.click(
        within(dialog).getByRole('checkbox', { name: `tools.${tool}` }),
      );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'connect.createCredential' }),
    );
    expect(
      await within(dialog).findByText('connect.toolsRequired'),
    ).toBeInTheDocument();
    expect(callsTo('POST', 'agents/runners/registrationTokens')).toHaveLength(
      0,
    );

    fireEvent.click(
      within(dialog).getByRole('checkbox', { name: 'tools.codex' }),
    );
    const slots = within(dialog).getByLabelText('connect.slots');
    expect(slots).toHaveValue('1');
    fireEvent.change(slots, { target: { value: '65' } });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'connect.createCredential' }),
    );
    expect(
      await within(dialog).findByText('runtimes.edit.slotsInvalid'),
    ).toBeInTheDocument();
    expect(callsTo('POST', 'agents/runners/registrationTokens')).toHaveLength(
      0,
    );
    fireEvent.change(slots, { target: { value: '3' } });
    // Limits per tool are advanced options, folded away until asked for.
    expect(dialog.querySelector('#ag-add-tool-slots-codex')).toBeNull();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'connect.advanced' }),
    );
    // Only the checked tools take a limit.
    await waitFor(() =>
      expect(dialog.querySelector('#ag-add-tool-slots-codex')).not.toBeNull(),
    );
    expect(dialog.querySelector('#ag-add-tool-slots-claude')).toBeNull();
    fireEvent.change(dialog.querySelector('#ag-add-tool-slots-codex')!, {
      target: { value: '1' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'connect.createCredential' }),
    );
    await within(dialog).findByText('connect.after');
    expect(
      callsTo('POST', 'agents/runners/registrationTokens')[0]?.json,
    ).toEqual({
      trust: 'ownerOnly',
      enabledTools: ['codex'],
      slots: 3,
      toolSlots: { codex: 1 },
    });
    expect(
      within(dialog).getByText(
        /connect\.tokenToolSlots\(limits=tools\.codex 1\)/u,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/connect\.tokenTools\(tools=tools\.codex\)/u),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/connect\.tokenSlots\(slots=3\)/u),
    ).toBeInTheDocument();
  });
});
