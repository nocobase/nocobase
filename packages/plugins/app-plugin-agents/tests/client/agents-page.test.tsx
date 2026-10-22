// @vitest-environment jsdom
/**
 * The Agent page: agents filtered by state, an enabled or disabled one edited (`agent-dialog.tsx`), only readable for
 * who does not manage agents; an agent created from the available models drawer (`available-models-drawer.tsx`,
 * replacing the old discoveries section a runner's report filled on its own, and the single-dialog list before it);
 * and leftover never-enabled, never-run agents removed through the cleanup drawer (`cleanup-drawer.tsx`).
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import type {
  AgentView,
  AvailableModel,
  AvailableModelGroup,
  CleanupCandidate,
  CleanupGroup,
} from '../../shared/agents.js';
import { callsTo, clientMocks, resetApi } from './fake-client.js';
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
        return {
          data: rows,
          meta: { total: rows.length, page: 1, pageSize: 50 },
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
        return {
          data: rows,
          meta: { total: rows.length, page: 1, pageSize: 50 },
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

  it('defaults to enabled, with disabled reachable', async () => {
    renderPage(<AgentsPage />);
    const rows = await screen.findAllByTestId(/^agent-(sonnet|kimi|old)$/u);
    expect(rows.map((row) => row.dataset.state)).toEqual([
      'enabled',
      'unreported',
    ]);
    fireEvent.click(screen.getByText('agents.discovery.disabled'));
    await waitFor(() =>
      expect(screen.getByTestId('agent-old')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('agent-sonnet')).not.toBeInTheDocument();
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

  it('creates an agent from the available models drawer, starting from the suggestion', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const drawer = await screen.findByTestId('available-models-drawer');
    // The claude group has one model, at or under the default-expand threshold, so it opens without a click.
    fireEvent.click(
      await within(drawer).findByTestId(
        'available-model-create-claude-claude-opus-5-5',
      ),
    );
    const goodAt = await within(drawer).findByTestId('available-model-good-at');
    expect(goodAt).toHaveValue('modelSuggestions.design');
    fireEvent.click(
      within(drawer).getByTestId('available-model-create-submit'),
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

  it('selects several models across the group and adds them at once, using the suggested good-at', async () => {
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
    await waitFor(() =>
      expect(callsTo('POST', 'agents/runnerAgents')).toHaveLength(2),
    );
    const bodies = callsTo('POST', 'agents/runnerAgents').map(
      (call) => (call.json as { model: string }).model,
    );
    expect(new Set(bodies)).toEqual(
      new Set(['claude-opus-5-5', 'claude-fable-5-1']),
    );
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

  it('offers no change to who does not manage agents', async () => {
    agents = agents.map((each) => ({ ...each, canEdit: false }));
    renderPage(<AgentsPage />);
    await screen.findByTestId('agent-sonnet');
    expect(screen.queryByTestId('agent-edit-sonnet')).not.toBeInTheDocument();
    expect(screen.queryByTestId('agent-edit-kimi')).not.toBeInTheDocument();
  });
});
