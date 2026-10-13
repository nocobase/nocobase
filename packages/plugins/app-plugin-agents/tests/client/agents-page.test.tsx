// @vitest-environment jsdom
/**
 * The Agent page: the agents discovered from runners, filtered by state, a pending one enabled with what it is good at
 * (started from the catalog's suggestion), an enabled one edited, and only readable for who does not manage agents.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

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

  it('defaults to enabled, keeping discoveries collapsed and disabled reachable', async () => {
    renderPage(<AgentsPage />);
    const rows = await screen.findAllByTestId(/^agent-(opus|sonnet|kimi)$/u);
    expect(rows.map((row) => row.dataset.state)).toEqual([
      'enabled',
      'unreported',
    ]);
    expect(screen.getByTestId('agents-discovery-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    fireEvent.click(screen.getByTestId('agents-discovery-toggle'));
    expect(
      await screen.findByTestId('agent-discovery-opus'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('agents.discovery.disabled'));
    await waitFor(() =>
      expect(screen.queryByTestId('agent-opus')).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId('agent-kimi')).not.toBeInTheDocument();
  });

  it('enables a pending agent with what it is good at, starting from the suggestion', async () => {
    renderPage(<AgentsPage />);
    await screen.findByTestId('agent-sonnet');
    fireEvent.click(screen.getByTestId('agents-discovery-toggle'));
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

  it('labels provider choices before and after switching while saving the original ID', async () => {
    agents = ['openai', 'rightapi'].map((provider) =>
      agent(provider, {
        name: 'Pi · GPT-6 Astra',
        tool: 'pi',
        model: `${provider}/gpt-6-astra`,
        status: 'pending',
        discoveryKey: 'pi:gpt-6-astra',
        runners: {
          team: 1,
          personal: 0,
          mine: 0,
          names: [`${provider}-runner`],
        },
      }),
    );
    resetApi({
      agents: () => agents,
      'PATCH agents/rightapi': (request) => ({
        ...agents[1],
        ...(request.json as object),
      }),
    });
    renderPage(<AgentsPage />);
    await screen.findByTestId('agents-discovery-toggle');
    fireEvent.click(screen.getByTestId('agents-discovery-toggle'));
    fireEvent.click(await screen.findByTestId('agent-edit-openai'));
    const dialog = await screen.findByTestId('agent-dialog');
    const provider = within(dialog).getByLabelText('agents.discovery.provider');
    expect(provider).toHaveTextContent('openai/gpt-6-astra · openai-runner');
    const user = userEvent.setup();
    await user.click(provider);
    await user.click(
      await screen.findByRole('option', {
        name: 'rightapi/gpt-6-astra · rightapi-runner',
      }),
    );
    await waitFor(() =>
      expect(provider).toHaveTextContent(
        'rightapi/gpt-6-astra · rightapi-runner',
      ),
    );
    fireEvent.change(within(dialog).getByTestId('agent-good-at'), {
      target: { value: 'Provider fixture' },
    });
    fireEvent.click(within(dialog).getByTestId('agent-dialog-save'));
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/rightapi')).toHaveLength(1),
    );
    expect(callsTo('PATCH', 'agents/openai')).toHaveLength(0);
    expect(agents[1].model).toBe('rightapi/gpt-6-astra');
  });

  it.each([
    { ignored: false, count: 256 },
    { ignored: false, count: 257 },
    { ignored: true, count: 256 },
    { ignored: true, count: 257 },
  ])(
    'caps selection for $count groups with ignored=$ignored, including search and deselection',
    async ({ ignored, count }) => {
      agents = Array.from({ length: count }, (_, i) =>
        agent(`batch-${i}`, {
          name: `Batch ${i}`,
          model: `unknown-${i}`,
          status: 'pending',
          discoveryKey: `claude:unknown-${i}`,
          ignored,
        }),
      );
      resetApi({
        agents: () => agents,
        'PUT agents/discoveryPreferences': (request) => {
          const body = request.json as {
            groups: { key: string }[];
            ignored: boolean;
          };
          expect(body.groups).toHaveLength(256);
          expect(body.ignored).toBe(!ignored);
          return [];
        },
      });
      renderPage(<AgentsPage />);
      fireEvent.click(
        await screen.findByTestId(
          ignored ? 'agents-ignored-toggle' : 'agents-discovery-toggle',
        ),
      );
      fireEvent.click(
        await screen.findByText(
          count > 256
            ? 'agents.discovery.selectFirst(limit=256)'
            : 'agents.discovery.selectAll(limit=256)',
        ),
      );
      expect(
        screen.getByText(
          'agents.discovery.selectionCount(count=256,limit=256)',
        ),
      ).toBeInTheDocument();
      const boxes = screen.getAllByRole('checkbox');
      expect(
        boxes.filter((box) => box.getAttribute('aria-checked') === 'true'),
      ).toHaveLength(256);
      const unchecked = boxes.find(
        (box) => box.getAttribute('aria-checked') !== 'true',
      )!;
      if (unchecked) expect(unchecked).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(boxes[0]);
      const available = unchecked ?? boxes[0];
      expect(available).not.toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(available);
      expect(
        screen.getByText(
          'agents.discovery.selectionCount(count=256,limit=256)',
        ),
      ).toBeInTheDocument();
      fireEvent.click(
        screen.getByText(
          ignored
            ? 'agents.discovery.restoreSelected'
            : 'agents.discovery.ignoreSelected',
        ),
      );
      await waitFor(() =>
        expect(callsTo('PUT', 'agents/discoveryPreferences')).toHaveLength(1),
      );
      fireEvent.change(screen.getByPlaceholderText('agents.discovery.search'), {
        target: { value: `unknown-${count - 1}` },
      });
      expect(
        screen.getByText('agents.discovery.selectionCount(count=0,limit=256)'),
      ).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(1);
      fireEvent.click(
        screen.getByText('agents.discovery.selectAll(limit=256)'),
      );
      expect(
        screen.getByText('agents.discovery.selectionCount(count=1,limit=256)'),
      ).toBeInTheDocument();
    },
  );

  it('offers no change to who does not manage agents', async () => {
    agents = agents.map((each) => ({ ...each, canEdit: false }));
    renderPage(<AgentsPage />);
    await screen.findByTestId('agent-sonnet');
    fireEvent.click(screen.getByTestId('agents-discovery-toggle'));
    await screen.findByTestId('agent-discovery-opus');
    expect(screen.queryByTestId('agent-edit-opus')).not.toBeInTheDocument();
    expect(screen.queryByTestId('agent-edit-sonnet')).not.toBeInTheDocument();
  });
});
