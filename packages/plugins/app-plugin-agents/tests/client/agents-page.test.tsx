// @vitest-environment jsdom
/**
 * The Agent page: agents filtered by state (enabled by default, disabled shown alongside once toggled on), an
 * enabled or disabled one edited (`agent-dialog.tsx`), only readable for who does not manage agents; one or several
 * models added through the available models drawer's two-step select-then-confirm flow (`available-models-drawer.tsx`,
 * replacing the old discoveries section a runner's report filled on its own, and the single-dialog list before it);
 * and leftover never-enabled, never-run agents removed through the cleanup drawer (`cleanup-drawer.tsx`).
 */
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import type {
  AgentView,
  AvailableModel,
  AvailableModelGroup,
  CleanupCandidate,
  CleanupGroup,
} from '../../shared/agents.js';
import {
  api,
  callsTo,
  clientMocks,
  FakeApiError,
  resetApi,
} from './fake-client.js';
import { agent } from './fixtures.js';
import { renderPage } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: AgentsPage } =
  await import('../../client/pages/agents/index.js');

let agents: AgentView[] = [];
let availableGroups: AvailableModelGroup[] = [];
let availableRows: Record<string, AvailableModel[]> = {};
let cleanupGroups: CleanupGroup[] = [];
let cleanupRows: Record<string, CleanupCandidate[]> = {};

describe('the Agent page', () => {
  beforeEach(() => {
    agents = [
      agent('sonnet', {
        name: 'Claude · Sonnet 5',
        description: 'Small changes',
        effort: 'medium',
      }),
      agent('kimi', {
        name: 'OpenCode · Kimi K2',
        tool: 'opencode',
        model: 'moonshotai/kimi-k2',
        description: 'Pages and styles',
        reported: false,
        unusable: 'unreported',
        runners: { team: 0, personal: 0, mine: 0, names: [] },
      }),
      agent('old', { name: 'Old Codex', status: 'disabled' }),
    ];
    availableGroups = [
      {
        tool: 'claude',
        modelCount: 1,
        runnerCount: 1,
        status: 'available',
        recommendedCount: 0,
      },
    ];
    availableRows = {
      claude: [
        {
          tool: 'claude',
          model: 'claude-opus-5-5',
          agentId: null,
          status: null,
          recommended: false,
          suggestion: {
            en: 'Designs, architecture, hard investigations and reviews of important changes.',
            zh: '方案、架构、疑难排查、重要改动的评审。',
          },
          availability: 'available',
          runners: { ready: 1, total: 1, names: ['runner-1'] },
        },
      ],
    };
    cleanupGroups = [{ tool: 'kilo', count: 1 }];
    cleanupRows = {
      kilo: [
        {
          id: 'stray-1',
          name: 'Kilo Code · Stray',
          tool: 'kilo',
          model: 'stray',
          createdAt: '2026-10-01T08:00:00.000Z',
        },
      ],
    };
    resetApi({
      agents: () => agents,
      'agents/availableModels': (request) => {
        const tool = request.query.tool as string | undefined;
        if (!tool)
          return {
            data: availableGroups,
            meta: {
              total: availableGroups.length,
              page: 1,
              pageSize: availableGroups.length,
            },
          };
        const rows = availableRows[tool] ?? [];
        const page = Number(request.query.page ?? 1);
        const pageSize = Number(request.query.pageSize ?? 50);
        return {
          data: rows.slice((page - 1) * pageSize, page * pageSize),
          meta: { total: rows.length, page, pageSize },
        };
      },
      'agents/cleanupCandidates': (request) => {
        const tool = request.query.tool as string | undefined;
        if (!tool)
          return {
            data: cleanupGroups,
            meta: {
              total: cleanupGroups.length,
              page: 1,
              pageSize: cleanupGroups.length,
            },
          };
        const rows = cleanupRows[tool] ?? [];
        const page = Number(request.query.page ?? 1);
        const pageSize = Number(request.query.pageSize ?? 50);
        return {
          data: rows.slice((page - 1) * pageSize, page * pageSize),
          meta: { total: rows.length, page, pageSize },
        };
      },
      'PATCH agents/sonnet': (request) => ({
        ...agents[0],
        ...(request.json as object),
      }),
      'POST agents/runnerAgents': (request) => {
        const body = request.json as {
          tool: string;
          model: string;
          description: string;
        };
        return {
          id: `${body.tool}-${body.model}`,
          name: `Created · ${body.model}`,
          status: 'enabled',
          description: body.description,
        };
      },
      'POST agents/cleanup': (request) => {
        const body = request.json as { agentIds: string[] };
        return { removed: body.agentIds, skipped: [] };
      },
    });
  });

  it('defaults to enabled only, and showing disabled adds them alongside', async () => {
    renderPage(<AgentsPage />);
    const rows = await screen.findAllByTestId(/^agent-(sonnet|kimi|old)$/u);
    expect(rows.map((row) => row.dataset.state)).toEqual([
      'enabled',
      'unreported',
    ]);
    expect(screen.queryByTestId('agent-old')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('agents-toggle-disabled'));
    await waitFor(() =>
      expect(screen.getByTestId('agent-old')).toBeInTheDocument(),
    );
    // Showing disabled agents never hides the enabled ones that were already visible.
    expect(screen.getByTestId('agent-sonnet')).toBeInTheDocument();
    expect(screen.getByTestId('agent-old')).toHaveAttribute(
      'data-state',
      'disabled',
    );
  });

  it('edits an enabled agent', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agent-edit-sonnet'));
    const dialog = await screen.findByTestId('agent-dialog');
    fireEvent.change(within(dialog).getByTestId('agent-good-at'), {
      target: { value: 'Updated description' },
    });
    fireEvent.click(within(dialog).getByTestId('agent-dialog-save'));
    await waitFor(() =>
      expect(
        callsTo('PATCH', 'agents/sonnet').map((call) => call.json),
      ).toEqual([
        expect.objectContaining({ description: 'Updated description' }),
      ]),
    );
  });

  it('adds one model from the available models drawer through the confirm step, starting from the suggestion', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    // The claude group has one model, at or under the default-expand threshold, so it opens without a click.
    fireEvent.click(
      await within(drawer).findByTestId(
        'available-model-create-claude-claude-opus-5-5',
      ),
    );
    const goodAt = await within(drawer).findByTestId(
      'available-model-good-at-claude-claude-opus-5-5',
    );
    expect(goodAt).toHaveValue('modelSuggestions.design');
    fireEvent.click(
      within(drawer).getByTestId('available-models-confirm-submit'),
    );
    await waitFor(() =>
      expect(
        callsTo('POST', 'agents/runnerAgents').map((call) => call.json),
      ).toEqual([
        {
          tool: 'claude',
          model: 'claude-opus-5-5',
          description: 'modelSuggestions.design',
        },
      ]),
    );
  });

  it('shows a group’s setup guidance even when it already has a model with an agent', async () => {
    availableGroups = [
      {
        tool: 'goose',
        modelCount: 1,
        runnerCount: 1,
        status: 'needsSetup',
        statusDetail: 'No provider configured; run `goose configure`.',
        recommendedCount: 0,
      },
    ];
    availableRows.goose = [
      {
        tool: 'goose',
        model: 'already-added',
        agentId: 'goose-already-added',
        status: 'enabled',
        recommended: false,
        suggestion: null,
        availability: 'needsSetup',
        runners: { ready: 0, total: 1, names: [] },
      },
    ];
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    fireEvent.click(
      within(drawer).getByTestId('available-models-filter-needsSetup'),
    );
    expect(
      within(drawer).getByTestId('available-models-filter-available'),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(drawer).getByTestId('available-models-filter-needsSetup'),
    ).toHaveAttribute('aria-pressed', 'true');
    // One model is at or under the default-expand threshold, so the group opens without a click.
    expect(
      await within(drawer).findByText('goose configure', { selector: 'code' }),
    ).toBeInTheDocument();
    expect(
      await within(drawer).findByTestId('available-model-goose-already-added'),
    ).toBeInTheDocument();
  });

  it('uses catalog names and secondary ids without repeating a matching group status', async () => {
    availableRows.claude![0] = {
      ...availableRows.claude![0]!,
      displayModel: 'claude-opus-5-5',
    };
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const row = await screen.findByTestId(
      'available-model-claude-claude-opus-5-5',
    );
    expect(within(row).getByText('Claude · Opus 5.5')).toBeInTheDocument();
    expect(within(row).getByText('claude-opus-5-5')).toBeInTheDocument();
    expect(
      within(row).queryByText('agents.available.status.available'),
    ).toBeNull();
  });

  it('marks an enabled historical agent with no fitting runtime as currently unavailable', async () => {
    agents[0] = {
      ...agents[0]!,
      unusable: 'noRunner',
      runners: { team: 0, personal: 0, mine: 0, names: [] },
    };
    renderPage(<AgentsPage />);
    const row = await screen.findByTestId('agent-sonnet');
    expect(within(row).getByText('agents.state.enabled')).toBeInTheDocument();
    expect(
      within(row).getAllByText('agents.where.noneOnline').length,
    ).toBeGreaterThan(0);
  });

  it('selects several models across the group, edits one good-at, and adds them at once from the confirm step', async () => {
    availableGroups = [
      {
        tool: 'claude',
        modelCount: 2,
        runnerCount: 1,
        status: 'available',
        recommendedCount: 0,
      },
    ];
    availableRows.claude = [
      ...availableRows.claude!,
      {
        tool: 'claude',
        model: 'claude-fable-5-1',
        agentId: null,
        status: null,
        recommended: false,
        suggestion: null,
        availability: 'available',
        runners: { ready: 1, total: 1, names: ['runner-1'] },
      },
    ];
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    const opus = await within(drawer).findByTestId(
      'available-model-claude-claude-opus-5-5',
    );
    fireEvent.click(within(opus).getByRole('checkbox'));
    const fable = await within(drawer).findByTestId(
      'available-model-claude-claude-fable-5-1',
    );
    fireEvent.click(within(fable).getByRole('checkbox'));
    fireEvent.click(
      within(drawer).getByTestId('available-models-add-selected'),
    );
    // Fable has no catalog suggestion, so the confirm step leaves it for the admin to fill in.
    const fableGoodAt = await within(drawer).findByTestId(
      'available-model-good-at-claude-claude-fable-5-1',
    );
    expect(fableGoodAt).toHaveValue('');
    expect(fableGoodAt).toHaveAttribute('aria-invalid', 'true');
    expect(
      within(drawer).getByText('agents.enable.goodAtRequired'),
    ).toBeVisible();
    expect(
      within(drawer).getByTestId('available-models-confirm-submit'),
    ).toBeDisabled();
    fireEvent.change(fableGoodAt, { target: { value: '   ' } });
    expect(
      within(drawer).getByTestId('available-models-confirm-submit'),
    ).toBeDisabled();
    fireEvent.change(fableGoodAt, { target: { value: 'Fable good at' } });
    expect(
      within(drawer).getByTestId('available-models-confirm-submit'),
    ).toBeEnabled();
    fireEvent.click(
      within(drawer).getByTestId('available-models-confirm-submit'),
    );
    await waitFor(() =>
      expect(callsTo('POST', 'agents/runnerAgents')).toHaveLength(2),
    );
    const bodies = callsTo('POST', 'agents/runnerAgents').map(
      (call) => call.json as { model: string; description: string },
    );
    expect(new Set(bodies.map((body) => body.model))).toEqual(
      new Set(['claude-opus-5-5', 'claude-fable-5-1']),
    );
    expect(
      bodies.find((body) => body.model === 'claude-fable-5-1')?.description,
    ).toBe('Fable good at');
  });

  it('keeps a failed row’s typed text and real error on screen instead of closing when every add fails', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    fireEvent.click(
      await within(drawer).findByTestId(
        'available-model-create-claude-claude-opus-5-5',
      ),
    );
    api.routes['POST agents/runnerAgents'] = () => {
      throw new FakeApiError(409, 'AGENT_NAME_TAKEN');
    };
    fireEvent.click(
      within(drawer).getByTestId('available-models-confirm-submit'),
    );
    // The drawer stays open at the confirm step, with the typed text and the real reason still showing, instead of
    // being discarded by a close that assumed the failure meant the agent already existed.
    await waitFor(() =>
      expect(
        screen.getByTestId('available-model-error-claude-claude-opus-5-5'),
      ).toHaveTextContent('errors.AGENT_NAME_TAKEN'),
    );
    expect(
      await within(drawer).findByTestId(
        'available-model-good-at-claude-claude-opus-5-5',
      ),
    ).toHaveValue('modelSuggestions.design');
    expect(screen.queryByTestId('available-models-drawer')).toBeInTheDocument();
  });

  it('owns delayed submissions across both steps, blocks dismissal and preserves failed drafts until retry succeeds', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    fireEvent.click(
      await within(drawer).findByTestId(
        'available-model-create-claude-claude-opus-5-5',
      ),
    );
    const input = within(drawer).getByTestId(
      'available-model-good-at-claude-claude-opus-5-5',
    );
    fireEvent.change(input, {
      target: { value: 'Preserved custom description' },
    });
    let reject!: (reason: unknown) => void;
    api.routes['POST agents/runnerAgents'] = () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      });
    const submit = within(drawer).getByTestId(
      'available-models-confirm-submit',
    );
    const form = submit.getAttribute('form')!;
    fireEvent.submit(document.getElementById(form)!);
    fireEvent.submit(document.getElementById(form)!);
    await waitFor(() =>
      expect(callsTo('POST', 'agents/runnerAgents')).toHaveLength(1),
    );
    expect(submit).toBeDisabled();
    const back = within(drawer).getByRole('button', { name: 'actions.back' });
    expect(back).toBeDisabled();
    fireEvent.click(back);
    fireEvent.keyDown(drawer, { key: 'Escape' });
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveAttribute('aria-busy', 'true');
    expect(
      within(drawer).queryByRole('button', { name: 'actions.close' }),
    ).not.toBeInTheDocument();
    await act(async () => {
      reject(new FakeApiError(409, 'AGENT_NAME_TAKEN'));
    });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(back);
    fireEvent.click(
      await within(drawer).findByTestId('available-models-add-selected'),
    );
    expect(
      within(drawer).getByTestId(
        'available-model-good-at-claude-claude-opus-5-5',
      ),
    ).toHaveValue('Preserved custom description');
    expect(
      within(drawer).getByTestId(
        'available-model-error-claude-claude-opus-5-5',
      ),
    ).toHaveTextContent('errors.AGENT_NAME_TAKEN');
    api.routes['POST agents/runnerAgents'] = () => {
      agents.push(agent('created', { name: 'Added from retry' }));
      return { id: 'created' };
    };
    fireEvent.click(
      within(drawer).getByTestId('available-models-confirm-submit'),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId('available-models-drawer'),
      ).not.toBeInTheDocument(),
    );
    expect(await screen.findByTestId('agent-created')).toHaveTextContent(
      'Added from retry',
    );
    expect(callsTo('POST', 'agents/runnerAgents')).toHaveLength(2);
    fireEvent.click(screen.getByTestId('agents-available-open'));
    expect(
      await screen.findByTestId('available-models-add-selected'),
    ).toBeDisabled();
  });

  it('discards cancelled selections and drafts when closing and entering the flow again', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    fireEvent.click(
      await within(drawer).findByTestId(
        'available-model-create-claude-claude-opus-5-5',
      ),
    );
    fireEvent.change(
      within(drawer).getByTestId(
        'available-model-good-at-claude-claude-opus-5-5',
      ),
      { target: { value: 'Cancelled draft' } },
    );
    fireEvent.click(
      within(drawer).getByRole('button', { name: 'actions.back' }),
    );
    fireEvent.click(
      within(drawer).getAllByRole('button', { name: 'actions.close' }).at(-1)!,
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId('available-models-drawer'),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId('agents-available-open'));
    const reopened = await screen.findByTestId('available-models-drawer');
    expect(
      within(reopened).getByTestId('available-models-add-selected'),
    ).toBeDisabled();
    fireEvent.click(
      await within(reopened).findByTestId(
        'available-model-create-claude-claude-opus-5-5',
      ),
    );
    expect(
      within(reopened).getByTestId(
        'available-model-good-at-claude-claude-opus-5-5',
      ),
    ).toHaveValue('modelSuggestions.design');
    expect(callsTo('POST', 'agents/runnerAgents')).toHaveLength(0);
  });

  it('drops only the models that were added after a partial failure, keeping the failed one selected with its own error', async () => {
    availableGroups = [
      {
        tool: 'claude',
        modelCount: 2,
        runnerCount: 1,
        status: 'available',
        recommendedCount: 0,
      },
    ];
    availableRows.claude = [
      ...availableRows.claude!,
      {
        tool: 'claude',
        model: 'claude-fable-5-1',
        agentId: null,
        status: null,
        recommended: false,
        suggestion: null,
        availability: 'available',
        runners: { ready: 1, total: 1, names: ['runner-1'] },
      },
    ];
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    const opus = await within(drawer).findByTestId(
      'available-model-claude-claude-opus-5-5',
    );
    fireEvent.click(within(opus).getByRole('checkbox'));
    const fable = await within(drawer).findByTestId(
      'available-model-claude-claude-fable-5-1',
    );
    fireEvent.click(within(fable).getByRole('checkbox'));
    fireEvent.click(
      within(drawer).getByTestId('available-models-add-selected'),
    );
    const fableGoodAt = await within(drawer).findByTestId(
      'available-model-good-at-claude-claude-fable-5-1',
    );
    fireEvent.change(fableGoodAt, { target: { value: 'Fable good at' } });
    // Opus succeeds; Fable fails with a real, specific reason.
    api.routes['POST agents/runnerAgents'] = (request) => {
      const body = request.json as { model: string; description: string };
      if (body.model === 'claude-fable-5-1')
        throw new FakeApiError(400, 'GOOD_AT_REQUIRED');
      return {
        id: `claude-${body.model}`,
        name: `Created · ${body.model}`,
        status: 'enabled',
        description: body.description,
      };
    };
    fireEvent.click(
      within(drawer).getByTestId('available-models-confirm-submit'),
    );
    // Opus is gone from the confirm step (it succeeded); Fable remains, with its typed text and its own real error.
    await waitFor(() =>
      expect(
        screen.queryByTestId('available-model-good-at-claude-claude-opus-5-5'),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(drawer).getByTestId(
        'available-model-good-at-claude-claude-fable-5-1',
      ),
    ).toHaveValue('Fable good at');
    expect(
      within(drawer).getByTestId(
        'available-model-error-claude-claude-fable-5-1',
      ),
    ).toHaveTextContent('errors.GOOD_AT_REQUIRED');
    // Retrying submits only what remains (Fable), and it now succeeds.
    api.routes['POST agents/runnerAgents'] = (request) => {
      const body = request.json as { model: string; description: string };
      return {
        id: `claude-${body.model}`,
        name: `Created · ${body.model}`,
        status: 'enabled',
        description: body.description,
      };
    };
    fireEvent.click(
      within(drawer).getByTestId('available-models-confirm-submit'),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId('available-models-drawer'),
      ).not.toBeInTheDocument(),
    );
    const bodies = callsTo('POST', 'agents/runnerAgents').map(
      (call) => (call.json as { model: string }).model,
    );
    expect(bodies.filter((model) => model === 'claude-fable-5-1')).toHaveLength(
      2,
    );
    expect(bodies.filter((model) => model === 'claude-opus-5-5')).toHaveLength(
      1,
    );
  });

  it('keeps the selection and typed good-at text when going back from the confirm step', async () => {
    availableGroups = [
      {
        tool: 'claude',
        modelCount: 2,
        runnerCount: 1,
        status: 'available',
        recommendedCount: 0,
      },
    ];
    availableRows.claude = [
      ...availableRows.claude!,
      {
        tool: 'claude',
        model: 'claude-fable-5-1',
        agentId: null,
        status: null,
        recommended: false,
        suggestion: null,
        availability: 'available',
        runners: { ready: 1, total: 1, names: ['runner-1'] },
      },
    ];
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    const opus = await within(drawer).findByTestId(
      'available-model-claude-claude-opus-5-5',
    );
    fireEvent.click(within(opus).getByRole('checkbox'));
    const fable = await within(drawer).findByTestId(
      'available-model-claude-claude-fable-5-1',
    );
    fireEvent.click(within(fable).getByRole('checkbox'));
    fireEvent.click(
      within(drawer).getByTestId('available-models-add-selected'),
    );
    const fableGoodAt = await within(drawer).findByTestId(
      'available-model-good-at-claude-claude-fable-5-1',
    );
    fireEvent.change(fableGoodAt, { target: { value: 'Draft text' } });
    fireEvent.click(within(drawer).getByText('actions.back'));
    // Both checkboxes are still checked after going back to the selection step.
    expect(
      within(
        await within(drawer).findByTestId(
          'available-model-claude-claude-opus-5-5',
        ),
      ).getByRole('checkbox'),
    ).toBeChecked();
    expect(
      within(
        await within(drawer).findByTestId(
          'available-model-claude-claude-fable-5-1',
        ),
      ).getByRole('checkbox'),
    ).toBeChecked();
    fireEvent.click(
      within(drawer).getByTestId('available-models-add-selected'),
    );
    expect(
      await within(drawer).findByTestId(
        'available-model-good-at-claude-claude-fable-5-1',
      ),
    ).toHaveValue('Draft text');
  });

  it('removes chosen cleanup candidates after a second confirmation', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-cleanup-open'));
    const drawer = await screen.findByTestId('cleanup-drawer');
    fireEvent.click(await within(drawer).findByTestId('cleanup-group-kilo'));
    fireEvent.click(
      within(
        await within(drawer).findByTestId('cleanup-candidate-stray-1'),
      ).getByRole('checkbox'),
    );
    fireEvent.click(within(drawer).getByTestId('cleanup-open-confirm'));
    const confirm = await screen.findByTestId('cleanup-confirm');
    fireEvent.click(within(confirm).getByTestId('cleanup-confirm-submit'));
    await waitFor(() =>
      expect(
        callsTo('POST', 'agents/cleanup').map((call) => call.json),
      ).toEqual([{ agentIds: ['stray-1'] }]),
    );
  });

  it('selects an entire cleanup group at once', async () => {
    cleanupGroups = [{ tool: 'kilo', count: 2 }];
    cleanupRows.kilo = [
      ...cleanupRows.kilo!,
      {
        id: 'stray-2',
        name: 'Kilo Code · Stray 2',
        tool: 'kilo',
        model: 'stray-2',
        createdAt: '2026-10-01T08:00:00.000Z',
      },
    ];
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-cleanup-open'));
    const drawer = await screen.findByTestId('cleanup-drawer');
    fireEvent.click(await within(drawer).findByTestId('cleanup-group-kilo'));
    fireEvent.click(
      await within(drawer).findByTestId('cleanup-group-select-all-kilo'),
    );
    await waitFor(() =>
      expect(
        within(drawer).getByTestId('cleanup-open-confirm'),
      ).toHaveTextContent('2'),
    );
  });

  it('cleans up a selection larger than the per-request cap in several batches, and clears the whole group across pages', async () => {
    cleanupGroups = [{ tool: 'kilo', count: 278 }];
    cleanupRows.kilo = Array.from({ length: 278 }, (_, i) => ({
      id: `stray-${i}`,
      name: `Kilo Code · Stray ${i}`,
      tool: 'kilo',
      model: `stray-${i}`,
      createdAt: '2026-10-01T08:00:00.000Z',
    }));
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-cleanup-open'));
    const drawer = await screen.findByTestId('cleanup-drawer');
    fireEvent.click(await within(drawer).findByTestId('cleanup-group-kilo'));
    fireEvent.click(
      await within(drawer).findByTestId('cleanup-group-select-all-kilo'),
    );
    await waitFor(() =>
      expect(
        within(drawer).getByTestId('cleanup-open-confirm'),
      ).toHaveTextContent('278'),
    );
    // Clearing the whole group again must drop every selected id, not just the page the group list has loaded.
    fireEvent.click(
      await within(drawer).findByTestId('cleanup-group-select-all-kilo'),
    );
    expect(within(drawer).getByTestId('cleanup-open-confirm')).toBeDisabled();
    fireEvent.click(
      await within(drawer).findByTestId('cleanup-group-select-all-kilo'),
    );
    await waitFor(() =>
      expect(
        within(drawer).getByTestId('cleanup-open-confirm'),
      ).toHaveTextContent('278'),
    );
    fireEvent.click(within(drawer).getByTestId('cleanup-open-confirm'));
    const confirm = await screen.findByTestId('cleanup-confirm');
    fireEvent.click(within(confirm).getByTestId('cleanup-confirm-submit'));
    await waitFor(() =>
      expect(callsTo('POST', 'agents/cleanup')).toHaveLength(2),
    );
    const sizes = callsTo('POST', 'agents/cleanup').map(
      (call) => (call.json as { agentIds: string[] }).agentIds.length,
    );
    expect(new Set(sizes)).toEqual(new Set([256, 22]));
    const allIds = callsTo('POST', 'agents/cleanup').flatMap(
      (call) => (call.json as { agentIds: string[] }).agentIds,
    );
    expect(new Set(allIds).size).toBe(278);
  });

  it('keeps a batch’s successful removals when a later batch fails, and leaves only the failed ids selected to retry', async () => {
    cleanupGroups = [{ tool: 'kilo', count: 278 }];
    cleanupRows.kilo = Array.from({ length: 278 }, (_, i) => ({
      id: `stray-${i}`,
      name: `Kilo Code · Stray ${i}`,
      tool: 'kilo',
      model: `stray-${i}`,
      createdAt: '2026-10-01T08:00:00.000Z',
    }));
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-cleanup-open'));
    const drawer = await screen.findByTestId('cleanup-drawer');
    fireEvent.click(await within(drawer).findByTestId('cleanup-group-kilo'));
    fireEvent.click(
      await within(drawer).findByTestId('cleanup-group-select-all-kilo'),
    );
    await waitFor(() =>
      expect(
        within(drawer).getByTestId('cleanup-open-confirm'),
      ).toHaveTextContent('278'),
    );
    // The first 256-item batch succeeds; the second (the remaining 22) fails, as a network error would.
    let calls = 0;
    api.routes['POST agents/cleanup'] = (request) => {
      calls += 1;
      if (calls === 2) throw new FakeApiError(500, 'SERVER_ERROR');
      const body = request.json as { agentIds: string[] };
      return { removed: body.agentIds, skipped: [] };
    };
    fireEvent.click(within(drawer).getByTestId('cleanup-open-confirm'));
    const confirm = await screen.findByTestId('cleanup-confirm');
    fireEvent.click(within(confirm).getByTestId('cleanup-confirm-submit'));
    // The 256 that succeeded are gone from the selection; only the 22 that failed remain, ready to retry.
    await waitFor(() =>
      expect(
        within(drawer).getByTestId('cleanup-open-confirm'),
      ).toHaveTextContent('22'),
    );
    expect(screen.queryByTestId('cleanup-confirm')).toBeInTheDocument();
  });

  it('offers no change to who does not manage agents', async () => {
    agents = agents.map((each) => ({ ...each, canEdit: false }));
    renderPage(<AgentsPage />);
    await screen.findByTestId('agent-sonnet');
    expect(screen.queryByTestId('agent-edit-sonnet')).not.toBeInTheDocument();
    expect(screen.queryByTestId('agent-edit-kimi')).not.toBeInTheDocument();
  });
});
