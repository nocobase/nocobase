// @vitest-environment jsdom
/**
 * The Agent page: the agents discovered from runners, filtered by state, a pending one enabled with what it is good at
 * (started from the catalog's suggestion), an enabled one edited, and only readable for who does not manage agents.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AgentView } from '../../shared/agents.js';
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

describe('the Agent page', () => {
  beforeEach(() => {
    agents = [
      agent('opus', {
        name: 'Claude · Opus 5.5',
        model: 'claude-opus-5-5',
        status: 'pending',
        unusable: 'pending',
        suggestion: {
          en: 'Designs, architecture, hard investigations and reviews of important changes.',
          zh: '方案、架构、疑难排查、重要改动的评审。',
        },
      }),
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
    ];
    resetApi({
      agents: () => agents,
      'PATCH agents/opus': (request) => ({
        ...agents[0],
        ...(request.json as object),
        status: 'enabled',
      }),
    });
  });

  it('lists the agents by state, pending first, and filters them', async () => {
    renderPage(<AgentsPage />);
    const rows = await screen.findAllByTestId(/^agent-(opus|sonnet|kimi)$/u);
    expect(rows.map((row) => row.dataset.state)).toEqual([
      'pending',
      'enabled',
      'unreported',
    ]);
    fireEvent.click(screen.getByTestId('agents-filter-unreported'));
    await waitFor(() =>
      expect(screen.queryByTestId('agent-opus')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('agent-kimi')).toBeInTheDocument();
  });

  it('enables a pending agent with what it is good at, starting from the suggestion', async () => {
    renderPage(<AgentsPage />);
    fireEvent.click(await screen.findByTestId('agent-edit-opus'));
    const dialog = await screen.findByTestId('agent-dialog');
    const goodAt = within(dialog).getByTestId('agent-good-at');
    expect(goodAt).toHaveValue(
      'Designs, architecture, hard investigations and reviews of important changes.',
    );
    fireEvent.change(goodAt, { target: { value: '' } });
    fireEvent.click(within(dialog).getByTestId('agent-dialog-save'));
    expect(
      await within(dialog).findByText('agents.enable.goodAtRequired'),
    ).toBeInTheDocument();
    expect(callsTo('PATCH', 'agents/opus')).toHaveLength(0);
    fireEvent.change(goodAt, { target: { value: 'Hard problems' } });
    fireEvent.click(within(dialog).getByTestId('agent-dialog-save'));
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/opus').map((call) => call.json)).toEqual([
        {
          description: 'Hard problems',
          effort: null,
          enabled: true,
          expectedRevision: 1,
        },
      ]),
    );
  });

  it('offers no change to who does not manage agents', async () => {
    agents = agents.map((each) => ({ ...each, canEdit: false }));
    renderPage(<AgentsPage />);
    await screen.findByTestId('agent-opus');
    expect(screen.queryByTestId('agent-edit-opus')).not.toBeInTheDocument();
    expect(screen.queryByTestId('agent-edit-sonnet')).not.toBeInTheDocument();
  });
});
