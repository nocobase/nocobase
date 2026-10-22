// @vitest-environment jsdom
/**
 * The Agent page: agents filtered by state, an enabled or disabled one edited (`agent-dialog.tsx`), only readable for
 * who does not manage agents; an agent created from the available models list (`available-models-dialog.tsx`,
 * replacing the old discoveries section a runner's report filled on its own); and leftover never-enabled, never-run
 * agents removed through the cleanup dialog (`cleanup-dialog.tsx`).
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import type { AgentView, AvailableModel, CleanupCandidate } from '../../shared/agents.js';
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
let available: AvailableModel[] = [];
let candidates: CleanupCandidate[] = [];

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
    available = [
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
      },
    ];
    candidates = [
      {
        id: 'stray-1',
        name: 'Kilo Code · Stray',
        tool: 'kilo',
        model: 'stray',
        createdAt: '2026-10-01T08:00:00.000Z',
      },
    ];
    resetApi({
      agents: () => agents,
      'agents/availableModels': () => available,
      'agents/cleanupCandidates': () => candidates,
      'PATCH agents/sonnet': (request) => ({
        ...agents[0],
        ...(request.json as object),
      }),
      'POST agents/runnerAgents': (request) => {
        const body = request.json as { tool: string; model: string; description: string };
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
      expect(callsTo('PATCH', 'agents/sonnet').map((call) => call.json)).toEqual([
        expect.objectContaining({ description: 'Updated description' }),
      ]),
    );
  });

  it('creates an agent from the available models list, starting from the suggestion', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-available-open'));
    const dialog = await screen.findByTestId('available-models-dialog');
    fireEvent.click(
      await within(dialog).findByTestId(
        'available-model-create-claude-claude-opus-5-5',
      ),
    );
    const goodAt = await within(dialog).findByTestId('available-model-good-at');
    expect(goodAt).toHaveValue('modelSuggestions.design');
    fireEvent.click(within(dialog).getByTestId('available-model-create-submit'));
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

  it('removes chosen cleanup candidates', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agents-cleanup-open'));
    const dialog = await screen.findByTestId('cleanup-dialog');
    fireEvent.click(
      within(await within(dialog).findByTestId('cleanup-candidate-stray-1'))
        .getByRole('checkbox'),
    );
    fireEvent.click(within(dialog).getByTestId('cleanup-submit'));
    await waitFor(() =>
      expect(callsTo('POST', 'agents/cleanup').map((call) => call.json)).toEqual([
        { agentIds: ['stray-1'] },
      ]),
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
