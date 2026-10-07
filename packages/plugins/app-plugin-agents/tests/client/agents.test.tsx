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

import type { AgentInput, AgentSummary } from '../../shared/agents.js';
import type { ModelCatalog } from '../../shared/models.js';
import {
  api,
  callsTo,
  clientMocks,
  FakeApiError,
  granted,
  resetApi,
} from './fake-client.js';
import { agent, runner, skill } from './fixtures.js';
import { renderPage, renderRoute } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: AgentsPage } =
  await import('../../client/pages/agents/index.js');
const { default: NewAgentPage } =
  await import('../../client/pages/agents/new.js');
const { default: AgentDetailPage } =
  await import('../../client/pages/agents/detail/index.js');

const MANAGE = ['agents.agents/read', 'agents.agents/manage'];
const AT = '2026-10-01T09:00:00.000Z';

describe('agent pages', () => {
  let agents: AgentSummary[];
  let catalog: ModelCatalog;
  beforeEach(() => {
    catalog = {
      services: [
        {
          name: 'openai',
          title: 'OpenAI',
          provider: 'openai',
          models: [{ value: 'gpt-x', label: 'GPT X' }],
        },
      ],
    };
    agents = [
      agent('a1', {
        name: 'Reviewer',
        description: 'Reviews pull requests',
        access: 'ownerOnly',
        activeRuns: 1,
        onlineRunners: 2,
        actions: ['crm.deals/comment'],
      }),
      agent('a2', {
        name: 'Builder',
        modelEntries: [{ tool: 'claude', model: 'claude-opus-5' }],
        runnerIds: ['r1'],
        onlineRunners: 0,
      }),
      agent('a4', {
        name: 'PM',
        type: 'online',
        modelEntries: [{ modelService: 'openai', model: 'gpt-x' }],
        onlineRunners: 1,
      }),
    ];
    resetApi(
      {
        agents: () => agents,
        'agents/a1': () => agents[0],
        'agents/runners': () => [
          runner('r1', { name: 'Mac Studio' }),
          runner('r2', { tools: [{ kind: 'codex', authenticated: true }] }),
        ],
        'agents/actions': () => [
          {
            key: 'crm.deals/view',
            group: 'crm.deals',
            title: { key: 'dealActions.view', ns: 'crm' },
            groupTitle: { key: 'dealActions.group', ns: 'crm' },
            defaultOn: true,
          },
          {
            key: 'crm.deals/comment',
            group: 'crm.deals',
            title: { key: 'dealActions.comment', ns: 'crm' },
            defaultOn: true,
          },
          { key: 'crm.deals/close', group: 'crm.deals' },
          {
            key: 'crm.deals/attach',
            group: 'crm.deals',
            types: ['runner'],
          },
        ],
        'agents/models': () => catalog.services,
        'agents/defaultModels': () => {
          const service = catalog.services[0];
          const model = service?.models[0];
          return {
            chat: null,
            effectiveChat:
              service && model
                ? {
                    modelService: service.name,
                    model: model.value,
                    serviceTitle: service.title,
                    modelLabel: model.label,
                  }
                : null,
          };
        },
        'POST agents/checkModel': () => ({ ok: true, message: null }),
        'agents/chatSettings': () => ({ defaultAgentId: 'a1' }),
        'PATCH agents/chatSettings': (request) => request.json,
        'agents/a4': () => agents[2],
        'agents/vocabulary': () => ({
          subjects: [
            {
              kind: 'deal',
              title: { key: 'subjects.deal', ns: 'crm' },
              triggers: {},
              preview: true,
            },
            {
              kind: 'conversation',
              title: { key: 'subjects.conversation', ns: 'agents' },
              triggers: {},
              preview: true,
            },
          ],
          sources: [],
          scopes: [],
        }),
        'agents/skills': () => [],
        'agents/users': () => [{ id: 'u2', name: 'Bob' }],
        'agents/variables/agent/a1': () => [
          {
            name: 'GITHUB_TOKEN',
            updatedAt: AT,
            updatedById: 'u1',
            updatedByName: 'Alice',
          },
        ],
        'agents/variables/agent/a1/audits': () => [],
        'POST agents/variables/agent/a1/reveal': () => [
          { name: 'GITHUB_TOKEN', value: 'ghp_secret' },
        ],
        'POST agents': (request) => ({
          ...agent('a3'),
          ...(request.json as AgentInput),
        }),
        'PATCH agents/a1': (request) => {
          const { expectedRevision: _revision, ...patch } =
            request.json as AgentInput & { expectedRevision: number };
          agents[0] = {
            ...agents[0]!,
            ...patch,
            revision: agents[0]!.revision + 1,
          };
          return agents[0];
        },
        'POST agents/a1/copy': () =>
          agent('a1-copy', { name: 'Reviewer (copy)' }),
        'agents/a1-copy': () => agent('a1-copy', { name: 'Reviewer (copy)' }),
        'agents/variables/agent/a1-copy': () => [],
        'agents/a1/previewBrief': (request) =>
          request.query.scenario === 'conversation'
            ? {
                scenario: 'conversation',
                subject: { key: 'chat-sample', title: '[sample] This week' },
                platform: 'Conversation rules\n\n',
                agentPrompt: 'Be brief.',
                firstMessage: '[sample] What is waiting for me this week?',
              }
            : {
                scenario: 'deal',
                subject: { key: 'DL-0', title: '[sample] Renewal' },
                platform: '## Rules here\n\n- One rule\n\n',
                agentPrompt: 'Be brief.',
                firstMessage: 'Continue',
              },
      },
      MANAGE,
    );
  });

  it('sets the system default chat agent at the top of the list', async () => {
    renderPage(<AgentsPage />);
    const section = await screen.findByTestId('chat-settings');
    // The agent picker as a form field, labelled by the setting, its availability on the avatar.
    const picker = await within(section).findByRole('button', {
      name: /^chat\.settings\.title: Reviewer, chat\.availability\./,
    });
    expect(picker).toHaveTextContent('Reviewer');
    expect(picker).toHaveAttribute('data-appearance', 'field');
    expect(picker).toHaveClass('border-input', 'h-8');
    expect(within(picker).getByRole('img')).toHaveClass('absolute');
    expect(picker).not.toHaveTextContent('chat.agents.systemDefault');
    expect(within(section).getByText('chat.settings.title')).toHaveAttribute(
      'for',
      picker.id,
    );
    expect(
      section.compareDocumentPosition(await screen.findByTestId('agent-a1')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await userEvent.click(picker);
    // "None" first, then the agents grouped by mode, the current one marked as the system default.
    const items = await screen.findAllByRole('menuitem');
    expect(items[0]).toHaveTextContent('chat.settings.none');
    expect(
      screen.getByRole('menuitem', { name: /^Reviewer/ }),
    ).toHaveTextContent('chat.agents.systemDefault');
    await userEvent.click(screen.getByRole('menuitem', { name: /^Builder/ }));
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/chatSettings')).toHaveLength(1),
    );
    expect(callsTo('PATCH', 'agents/chatSettings')[0]?.json).toEqual({
      defaultAgentId: 'a2',
    });
    // Choosing None clears it.
    await userEvent.click(picker);
    await userEvent.click(
      (await screen.findAllByRole('menuitem'))[0] as HTMLElement,
    );
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/chatSettings')).toHaveLength(2),
    );
    expect(callsTo('PATCH', 'agents/chatSettings')[1]?.json).toEqual({
      defaultAgentId: null,
    });
  });

  it('shows the system default chat agent as text to who does not manage agents', async () => {
    granted.delete('agents.agents/manage');
    renderPage(<AgentsPage />);
    const section = await screen.findByTestId('chat-settings');
    expect(await within(section).findByText('Reviewer')).toBeInTheDocument();
    expect(within(section).queryByRole('button')).toBeNull();
  });

  it('lists agents with their tool, model, where they run, active runs and visibility', async () => {
    renderPage(<AgentsPage />);
    const row = await screen.findByTestId('agent-a1');
    expect(within(row).getByText('Reviewer')).toBeInTheDocument();
    expect(within(row).getByText('Reviews pull requests')).toBeInTheDocument();
    expect(within(row).getByText('tools.claude')).toBeInTheDocument();
    expect(within(row).getByText('agents.defaultModel')).toBeInTheDocument();
    expect(within(row).getByText('agents.anyRunner')).toBeInTheDocument();
    expect(
      within(row).getByText('agents.onlineCount(count=2)'),
    ).toBeInTheDocument();
    expect(within(row).getByText('/ 2')).toBeInTheDocument();
    expect(
      within(row).getByText('agents.access.ownerOnly'),
    ).toBeInTheDocument();
    const named = screen.getByTestId('agent-a2');
    expect(await within(named).findByText('Mac Studio')).toBeInTheDocument();
    expect(within(named).getByText('claude-opus-5')).toBeInTheDocument();
  });

  it('creates an agent with the default capabilities and opens it', async () => {
    renderRoute(<NewAgentPage />, '/agents/new', '/agents/new');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('agentForm.name'), {
      target: { value: ' Coder ' },
    });
    // The application's titles and group, and the actions it marks for a new agent.
    await within(dialog).findByText('dealActions.view');
    expect(within(dialog).getByText('dealActions.group')).toBeInTheDocument();
    expect(within(dialog).getByText('crm.deals/close')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(dialog).getByRole('checkbox', { name: 'dealActions.view' }),
      ).toBeChecked(),
    );
    // A second entry, in the same compact list as the agent page's.
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'modelEntries.add' }),
    );
    const rows = within(dialog).getAllByTestId('ag-model-entry');
    expect(rows).toHaveLength(2);
    fireEvent.change(within(rows[1]!).getByLabelText('agentForm.model'), {
      target: { value: 'opus' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));
    await waitFor(() => expect(callsTo('POST', 'agents')).toHaveLength(1));
    expect(callsTo('POST', 'agents')[0]?.json).toEqual({
      name: 'Coder',
      description: null,
      type: 'runner',
      modelEntries: [
        { tool: 'claude', model: null, effort: null },
        { tool: 'claude', model: 'opus', effort: null },
      ],
      instructions: null,
      actions: ['crm.deals/view', 'crm.deals/comment'],
    });
  });

  it('asks the type first and creates an online agent with an offered model', async () => {
    renderRoute(<NewAgentPage />, '/agents/new', '/agents/new');
    const dialog = await screen.findByRole('dialog');
    // Runner by default: the coding tool, and every action.
    expect(within(dialog).getByLabelText('agentForm.tool')).toBeInTheDocument();
    expect(
      await within(dialog).findByText('crm.deals/attach'),
    ).toBeInTheDocument();
    fireEvent.click(document.getElementById('ag-agent-type-online')!);
    await waitFor(() =>
      expect(within(dialog).queryByLabelText('agentForm.tool')).toBeNull(),
    );
    expect(within(dialog).queryByText('crm.deals/attach')).toBeNull();
    expect(
      within(dialog).getByLabelText('agentForm.modelService'),
    ).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('agentForm.name'), {
      target: { value: 'PM' },
    });
    await waitFor(() =>
      expect(
        within(dialog).getByRole('checkbox', { name: 'dealActions.view' }),
      ).toBeChecked(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));
    await waitFor(() => expect(callsTo('POST', 'agents')).toHaveLength(1));
    expect(callsTo('POST', 'agents')[0]?.json).toEqual({
      name: 'PM',
      description: null,
      type: 'online',
      modelEntries: [{ modelService: 'openai', model: 'gpt-x', effort: null }],
      instructions: null,
      actions: ['crm.deals/view', 'crm.deals/comment'],
    });
  });

  it('says an online agent needs a model service when none offers a model', async () => {
    catalog = { services: [] };
    renderRoute(<NewAgentPage />, '/agents/new', '/agents/new');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(document.getElementById('ag-agent-type-online')!);
    expect(
      await within(dialog).findByText('agentForm.noModels'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: 'agents.setUpModels' }),
    ).toHaveAttribute('href', '/models');
    fireEvent.change(within(dialog).getByLabelText('agentForm.name'), {
      target: { value: 'PM' },
    });
    expect(
      within(dialog).getByRole('button', { name: 'modelEntries.choose' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));
    expect(
      await within(dialog).findByText('modelEntries.required'),
    ).toBeInTheDocument();
    expect(callsTo('POST', 'agents')).toHaveLength(0);
  });

  it('shows an online agent that lists no model answering with the system default chat model', async () => {
    agents[2] = { ...agents[2]!, modelEntries: [] };
    renderPage(<AgentsPage />);
    const row = await screen.findByTestId('agent-a4');
    expect(
      await within(row).findByText(
        'agents.defaultModelShort(model=OpenAI · GPT X)',
      ),
    ).toBeInTheDocument();
    cleanup();
    // A new online agent with no model says what it will answer with, and where to change it.
    renderRoute(<NewAgentPage />, '/agents/new', '/agents/new');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(document.getElementById('ag-agent-type-online')!);
    for (const button of within(dialog).queryAllByRole('button', {
      name: 'modelEntries.remove',
    }))
      fireEvent.click(button);
    expect(
      await within(dialog).findByText(
        'agents.usesDefaultModel(model=OpenAI · GPT X)',
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: 'agents.changeDefaultModel' }),
    ).toHaveAttribute('href', '/models');
  });

  it('lists an online agent with its type, model and where it runs', async () => {
    renderPage(<AgentsPage />);
    const row = await screen.findByTestId('agent-a4');
    expect(within(row).getByText('agentTypes.online')).toBeInTheDocument();
    expect(within(row).getByText('openai · gpt-x')).toBeInTheDocument();
    expect(within(row).getByText('agentTypes.onServer')).toBeInTheDocument();
    expect(within(row).getByText('agents.modelReady')).toBeInTheDocument();
    expect(within(row).queryByText('/ 2')).toBeNull();
    expect(
      within(screen.getByTestId('agent-a1')).getByText('agentTypes.runner'),
    ).toBeInTheDocument();
  });

  it("shows a built-in agent's name and description in the viewer's language until someone edits them", async () => {
    agents[0] = {
      ...agents[0]!,
      name: 'Project lead',
      description: 'Plans the work',
      nameText: { key: 'presets.lead.name', ns: 'acme' },
      descriptionText: { key: 'presets.lead.description', ns: 'acme' },
    };
    const list = renderPage(<AgentsPage />);
    const row = await screen.findByTestId('agent-a1');
    expect(within(row).getByText('presets.lead.name')).toBeInTheDocument();
    expect(
      within(row).getByText('presets.lead.description'),
    ).toBeInTheDocument();
    list.unmount();
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    const basics = await screen.findByRole('region', {
      name: 'agentDetail.basics',
    });
    expect(within(basics).getByLabelText('agentForm.name')).toHaveValue(
      'presets.lead.name',
    );
    // Editing the description sends it alone; the name keeps its translation.
    fireEvent.change(
      within(basics).getByLabelText('agentForm.descriptionLabel'),
      { target: { value: 'Plans and ships' } },
    );
    fireEvent.click(
      within(
        screen.getByRole('region', { name: 'agentDetail.unsaved' }),
      ).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() => expect(callsTo('PATCH', 'agents/a1')).toHaveLength(1));
    expect(callsTo('PATCH', 'agents/a1')[0]?.json).toEqual({
      description: 'Plans and ships',
      expectedRevision: 1,
    });
  });

  it('says an online agent with no model yet needs one', async () => {
    agents = [
      ...agents,
      agent('a5', {
        name: 'Assistant',
        type: 'online',
        modelEntries: [],
        onlineRunners: 0,
      }),
    ];
    renderPage(<AgentsPage />);
    const row = await screen.findByTestId('agent-a5');
    expect(within(row).getAllByText('agents.needsModel')).toHaveLength(2);
  });

  it('shows an online agent its model and where it runs under Capabilities, with no Runtime tab', async () => {
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a4?tab=capabilities',
    );
    const model = await screen.findByRole('region', {
      name: 'modelSection.title',
    });
    expect(screen.getAllByText('agentTypes.online').length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('tab', { name: 'agentDetail.tabs.runtime' }),
    ).toBeNull();
    expect(
      screen.queryByRole('region', { name: 'toolSection.title' }),
    ).toBeNull();
    expect(screen.queryByText('envVars.title')).toBeNull();
    expect(
      screen.getByText('agentTypes.onServer', { selector: 'p' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('placement.attempts')).toBeInTheDocument();
    expect(screen.queryByText('agentForm.maxConcurrentRuns')).not.toBeVisible();
    fireEvent.click(
      within(model).getByRole('button', { name: 'modelSection.test' }),
    );
    await waitFor(() =>
      expect(callsTo('POST', 'agents/checkModel')).toHaveLength(1),
    );
    expect(callsTo('POST', 'agents/checkModel')[0]?.json).toEqual({
      modelService: 'openai',
      model: 'gpt-x',
    });
  });

  it('lets an online agent remove its last model and wait for one', async () => {
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a4?tab=capabilities',
    );
    const model = await screen.findByRole('region', {
      name: 'modelSection.title',
    });
    // Its description says once that the models are in order.
    expect(
      within(model).getByText('modelEntries.hintOnline'),
    ).toBeInTheDocument();
    const remove = within(model).getByRole('button', {
      name: 'modelEntries.remove',
    });
    expect(remove).toBeEnabled();
    fireEvent.click(remove);
    // Without a row of its own, the empty list says which model answers instead.
    expect(
      await within(model).findByTestId('ag-default-model-note'),
    ).toBeInTheDocument();
    expect(
      within(model).getByRole('button', { name: 'modelEntries.choose' }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(
        screen.getByRole('region', { name: 'agentDetail.unsaved' }),
      ).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() => expect(callsTo('PATCH', 'agents/a4')).toHaveLength(1));
    expect(callsTo('PATCH', 'agents/a4')[0]?.json).toMatchObject({
      modelEntries: [],
    });
  });

  it('lets an online agent take skills, listing the scripts it skips', async () => {
    agents[2] = { ...agents[2]!, skillIds: ['s1', 's2'] };
    api.routes['agents/skills'] = () => [
      skill('s1', {
        name: 'Release',
        scriptCount: 2,
        scripts: ['scripts/tag.sh', 'scripts/publish.py'],
      }),
      skill('s2', { name: 'Style' }),
    ];
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a4?tab=capabilities',
    );
    expect(
      await screen.findByRole('region', { name: 'agentSkills.title' }),
    ).toBeInTheDocument();
    const notice = await screen.findByTestId('ag-skill-scripts-notice');
    expect(notice).toHaveTextContent('agentSkills.onlineScripts');
    const listed = within(notice).getAllByRole('listitem');
    expect(listed).toHaveLength(1);
    expect(listed[0]).toHaveTextContent('Release');
    expect(listed[0]).toHaveTextContent('scripts/tag.sh');
    expect(listed[0]).toHaveTextContent('scripts/publish.py');
  });

  it('sums the agent up in the header: type, tool and model, where it runs, whether it is busy', async () => {
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    const summary = await screen.findByTestId('agent-summary');
    expect(within(summary).getByText('agentTypes.runner')).toBeInTheDocument();
    expect(
      within(summary).getByText('tools.claude · agents.defaultModel'),
    ).toBeInTheDocument();
    expect(within(summary).getByText('agents.anyRunner')).toBeInTheDocument();
    expect(
      within(summary).getByText('agentDetail.busy(count=1)'),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText('agentDetail.owner(name=Alice)'),
    ).toBeInTheDocument();
  });

  it('opens the tab the address names and keeps the chosen tab in it', async () => {
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a1?tab=runtime',
    );
    expect(
      await screen.findByRole('tab', { name: 'agentDetail.tabs.runtime' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('region', { name: 'placement.title' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'commandPolicy.title' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('tab', { name: 'agentDetail.tabs.capabilities' }),
    );
    expect(
      await screen.findByRole('region', { name: 'toolSection.title' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'agentSkills.title' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'capabilities.confirmChanges' }),
    ).toBeInTheDocument();
  });

  it('saves the changed sections of a tab together from the bar', async () => {
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    const basics = await screen.findByRole('region', {
      name: 'agentDetail.basics',
    });
    // No bar, and no save button, while nothing changed.
    expect(screen.queryByRole('button', { name: 'actions.save' })).toBeNull();
    fireEvent.change(within(basics).getByLabelText('agentForm.instructions'), {
      target: { value: 'Write tests first.' },
    });
    const access = screen.getByRole('region', { name: 'agentDetail.access' });
    fireEvent.click(
      within(access).getByRole('radio', { name: 'agents.access.everyone' }),
    );
    const bar = screen.getByRole('region', { name: 'agentDetail.unsaved' });
    fireEvent.click(within(bar).getByRole('button', { name: 'actions.save' }));
    await waitFor(() => expect(callsTo('PATCH', 'agents/a1')).toHaveLength(1));
    // Only the fields that changed: the name and description were left alone.
    expect(callsTo('PATCH', 'agents/a1')[0]?.json).toEqual({
      instructions: 'Write tests first.',
      access: 'everyone',
      userIds: [],
      expectedRevision: 1,
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'agentDetail.unsaved' }),
      ).toBeNull(),
    );

    fireEvent.click(
      screen.getByRole('tab', { name: 'agentDetail.tabs.capabilities' }),
    );
    const tool = await screen.findByRole('region', {
      name: 'toolSection.title',
    });
    fireEvent.change(within(tool).getByLabelText('toolSection.maxTurns'), {
      target: { value: '40' },
    });
    fireEvent.click(
      screen.getByRole('radio', { name: 'capabilities.confirm.always' }),
    );
    fireEvent.click(
      within(
        screen.getByRole('region', { name: 'agentDetail.unsaved' }),
      ).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() => expect(callsTo('PATCH', 'agents/a1')).toHaveLength(2));
    expect(callsTo('PATCH', 'agents/a1')[1]?.json).toEqual({
      modelEntries: [{ tool: 'claude', model: null, effort: null }],
      toolPolicy: { maxTurns: 40 },
      confirmChanges: 'always',
      expectedRevision: 2,
    });
  });

  it("orders a runner agent's tools and models, the first being its default", async () => {
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a1?tab=capabilities',
    );
    const tool = await screen.findByRole('region', {
      name: 'toolSection.title',
    });
    expect(within(tool).getAllByTestId('ag-model-entry')).toHaveLength(1);
    expect(within(tool).getByText('modelEntries.default')).toBeInTheDocument();
    // One entry: it can be neither removed nor moved, and the remove button says why.
    const remove = within(tool).getByRole('button', {
      name: 'modelEntries.remove',
    });
    expect(remove).toBeDisabled();
    await userEvent.hover(remove.parentElement!);
    expect(
      await screen.findByText('modelEntries.runnerNeedsOne'),
    ).toBeInTheDocument();
    // The header and the rows are subgrids of one grid, so their columns line up.
    const row = within(tool).getByTestId('ag-model-entry');
    expect(row).toHaveClass('grid-cols-subgrid');
    expect(row.parentElement?.parentElement).toBe(
      within(tool).getByText('agentForm.tool').parentElement?.parentElement,
    );
    // A tool's option shows how many runtimes run it as a count, the sentence in a tooltip.
    await userEvent.click(
      within(row).getByRole('combobox', { name: 'agentForm.tool' }),
    );
    const claude = await screen.findByRole('option', {
      name: /^tools\.claude/,
    });
    expect(
      claude.querySelector('[aria-label="agentForm.toolOnline(count=1)"]'),
    ).toHaveTextContent('1');
    await userEvent.keyboard('{Escape}');
    fireEvent.click(
      within(tool).getByRole('button', { name: 'modelEntries.add' }),
    );
    const rows = within(tool).getAllByTestId('ag-model-entry');
    expect(rows).toHaveLength(2);
    fireEvent.change(within(rows[1]!).getByLabelText('agentForm.model'), {
      target: { value: 'opus' },
    });
    // Each row has its own effort, among its tool's: Claude Code has no minimal.
    await userEvent.click(
      within(rows[1]!).getByRole('combobox', {
        name: 'agentForm.reasoningEffort',
      }),
    );
    expect(
      screen.queryByRole('option', { name: 'agentForm.efforts.minimal' }),
    ).toBeNull();
    await userEvent.click(
      await screen.findByRole('option', { name: 'agentForm.efforts.max' }),
    );
    fireEvent.click(
      within(rows[1]!).getByRole('button', { name: 'modelEntries.moveUp' }),
    );
    fireEvent.click(
      within(
        screen.getByRole('region', { name: 'agentDetail.unsaved' }),
      ).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() => expect(callsTo('PATCH', 'agents/a1')).toHaveLength(1));
    expect(callsTo('PATCH', 'agents/a1')[0]?.json).toMatchObject({
      modelEntries: [
        { tool: 'claude', model: 'opus', effort: 'max' },
        { tool: 'claude', model: null, effort: null },
      ],
      expectedRevision: 1,
    });
  });

  it('saves nothing while a section of the tab shows an error', async () => {
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a1?tab=runtime',
    );
    const commands = await screen.findByRole('region', {
      name: 'commandPolicy.title',
    });
    fireEvent.change(
      within(commands).getByLabelText('capabilities.deniedPatterns'),
      {
        target: { value: '(' },
      },
    );
    fireEvent.change(screen.getByLabelText('placement.attempts'), {
      target: { value: '4' },
    });
    const bar = screen.getByRole('region', { name: 'agentDetail.unsaved' });
    fireEvent.click(within(bar).getByRole('button', { name: 'actions.save' }));
    expect(
      await within(commands).findByText(
        'capabilities.patternInvalid(pattern=()',
      ),
    ).toBeInTheDocument();
    expect(callsTo('PATCH', 'agents/a1')).toHaveLength(0);
    fireEvent.change(
      within(commands).getByLabelText('capabilities.deniedPatterns'),
      {
        target: { value: 'rm -rf' },
      },
    );
    fireEvent.click(within(bar).getByRole('button', { name: 'actions.save' }));
    await waitFor(() => expect(callsTo('PATCH', 'agents/a1')).toHaveLength(1));
    expect(callsTo('PATCH', 'agents/a1')[0]?.json).toEqual({
      runnerIds: [],
      maxConcurrentRuns: 2,
      maxAttempts: 4,
      toolPolicy: { deniedPatterns: ['rm -rf'] },
      expectedRevision: 1,
    });
  });

  it('asks before switching tabs or leaving with unsaved changes, and discards them', async () => {
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    const name = await screen.findByLabelText('agentForm.name');
    fireEvent.change(name, { target: { value: 'Renamed' } });
    fireEvent.click(
      screen.getByRole('tab', { name: 'agentDetail.tabs.capabilities' }),
    );
    let confirm = await screen.findByRole('alertdialog');
    expect(
      within(confirm).getByText('unsavedChanges.title'),
    ).toBeInTheDocument();
    fireEvent.click(
      within(confirm).getByRole('button', {
        name: 'unsavedChanges.keepEditing',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(screen.getByLabelText('agentForm.name')).toHaveValue('Renamed');

    // "Discard" in the bar puts the saved values back.
    fireEvent.click(
      within(
        screen.getByRole('region', { name: 'agentDetail.unsaved' }),
      ).getByRole('button', { name: 'agentDetail.discard' }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('agentForm.name')).toHaveValue('Reviewer'),
    );
    expect(
      screen.queryByRole('region', { name: 'agentDetail.unsaved' }),
    ).toBeNull();

    // Leaving by a link asks too.
    fireEvent.change(screen.getByLabelText('agentForm.name'), {
      target: { value: 'Renamed' },
    });
    fireEvent.click(screen.getByRole('link', { name: 'agents.title' }));
    confirm = await screen.findByRole('alertdialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: 'unsavedChanges.discard' }),
    );
    expect(await screen.findByText('elsewhere')).toBeInTheDocument();
    expect(callsTo('PATCH', 'agents/a1')).toHaveLength(0);
  });

  it('groups capabilities with what they allow, and shows what is never granted to an agent', async () => {
    resetApi(
      {
        'agents/a1': () => agents[0],
        'agents/runners': () => [],
        'agents/skills': () => [],
        'agents/users': () => [],
        'agents/actions': () => [
          {
            key: 'crm.deals/comment',
            group: 'crm.deals',
            groupTitle: { key: 'dealActions.group', ns: 'crm' },
            description: { key: 'dealActions.commentHint', ns: 'crm' },
          },
          { key: 'crm.deals/delete', group: 'crm.deals' },
          {
            key: 'crm.admin/roles',
            group: 'crm.admin',
            grantable: false,
            reason: { key: 'dealActions.rolesReason', ns: 'crm' },
          },
        ],
      },
      MANAGE,
    );
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a1?tab=capabilities',
    );
    const deals = await screen.findByRole('group', {
      name: 'dealActions.group',
    });
    expect(
      within(deals).getByRole('checkbox', { name: 'crm.deals/comment' }),
    ).toBeChecked();
    expect(
      within(deals).getByText('dealActions.commentHint'),
    ).toBeInTheDocument();
    // Not ticked, but offered like any other.
    expect(
      within(deals).getByRole('checkbox', { name: 'crm.deals/delete' }),
    ).toBeEnabled();
    const boundary = screen.getByTestId('capability-crm.admin/roles');
    expect(within(boundary).getByRole('checkbox')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      within(boundary).getByText(
        'capabilities.notGrantableBecause(reason=dealActions.rolesReason)',
      ),
    ).toBeInTheDocument();
  });

  it('copies the agent as the person’s own and opens the copy', async () => {
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    fireEvent.click(
      await screen.findByRole('button', { name: 'agentDetail.copyAsMine' }),
    );
    await waitFor(() =>
      expect(callsTo('POST', 'agents/a1/copy')).toHaveLength(1),
    );
    // Named in the viewer's language.
    expect(callsTo('POST', 'agents/a1/copy')[0]?.json).toEqual({
      name: 'agentDetail.copyName(name=Reviewer)',
    });
    expect(
      (await screen.findAllByText('Reviewer (copy)')).length,
    ).toBeGreaterThan(0);
  });

  it('reloads and shows what changed when someone else saved the agent first', async () => {
    let current = agents[0]!;
    resetApi(
      {
        'agents/a1': () => current,
        'agents/runners': () => [],
        'agents/actions': () => [],
        'agents/skills': () => [],
        'agents/users': () => [{ id: 'u2', name: 'Bob' }],
        'agents/variables/agent/a1': () => [],
        'PATCH agents/a1': () => {
          // Bob saved the agent in another tab meanwhile.
          current = {
            ...current,
            revision: 2,
            instructions: 'Review security first.',
          };
          throw new FakeApiError(409, 'REVISION_CONFLICT');
        },
        'agents/a1/history': (request) =>
          request.query.afterRevision === 1
            ? [
                {
                  id: 'c2',
                  agentId: 'a1',
                  revision: 2,
                  action: 'updated',
                  actorUserId: 'u2',
                  actorName: 'Bob',
                  changes: [
                    {
                      field: 'instructions',
                      before: null,
                      after: 'Review security first.',
                    },
                  ],
                  createdAt: AT,
                },
              ]
            : [],
      },
      MANAGE,
    );
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    const basics = await screen.findByRole('region', {
      name: 'agentDetail.basics',
    });
    fireEvent.change(within(basics).getByLabelText('agentForm.instructions'), {
      target: { value: 'Mine' },
    });
    fireEvent.click(
      within(
        screen.getByRole('region', { name: 'agentDetail.unsaved' }),
      ).getByRole('button', { name: 'actions.save' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('agentDetail.conflict.title'),
    ).toBeInTheDocument();
    expect(await within(dialog).findByText('Bob')).toBeInTheDocument();
    expect(
      within(dialog).getByText('+ Review security first.'),
    ).toBeInTheDocument();
    expect(callsTo('PATCH', 'agents/a1')[0]?.json).toMatchObject({
      expectedRevision: 1,
    });
    // The page behind shows what Bob saved.
    await waitFor(() =>
      expect(screen.getByLabelText('agentForm.instructions')).toHaveValue(
        'Review security first.',
      ),
    );
  });

  it('shows who changed what in the history tab, without variable values', async () => {
    resetApi(
      {
        'agents/a1': () => agents[0],
        'agents/runners': () => [runner('r1', { name: 'Mac Studio' })],
        'agents/actions': () => [],
        'agents/skills': () => [],
        'agents/users': () => [{ id: 'u2', name: 'Bob' }],
        'agents/variables/agent/a1': () => [],
        'agents/a1/history': () => [
          {
            id: 'c3',
            agentId: 'a1',
            revision: 2,
            action: 'variables',
            actorUserId: 'u2',
            actorName: 'Bob',
            changes: [
              { field: 'variable', name: 'GITHUB_TOKEN', change: 'changed' },
            ],
            createdAt: AT,
          },
          {
            id: 'c2',
            agentId: 'a1',
            revision: 2,
            action: 'updated',
            actorUserId: 'u1',
            actorName: 'Alice',
            changes: [
              { field: 'model', before: null, after: 'claude-opus-5' },
              { field: 'runnerIds', before: [], after: ['r1'] },
            ],
            createdAt: AT,
          },
          {
            id: 'c1b',
            agentId: 'a1',
            revision: 1,
            action: 'updated',
            actorUserId: 'u9',
            actorName: null,
            changes: [],
            createdAt: AT,
          },
          {
            id: 'c1',
            agentId: 'a1',
            revision: 1,
            action: 'created',
            actorUserId: null,
            actorName: null,
            changes: [],
            createdAt: AT,
          },
        ],
      },
      MANAGE,
    );
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    fireEvent.click(
      await screen.findByRole('tab', { name: 'agentDetail.tabs.history' }),
    );
    const bob = await screen.findByTestId('agent-change-c3');
    expect(within(bob).getByText('GITHUB_TOKEN')).toBeInTheDocument();
    expect(
      within(bob).getByText('history.variable.changed'),
    ).toBeInTheDocument();
    const alice = screen.getByTestId('agent-change-c2');
    expect(within(alice).getByText('claude-opus-5')).toBeInTheDocument();
    expect(await within(alice).findByText('+ Mac Studio')).toBeInTheDocument();
    expect(
      within(alice).getByText('history.version(revision=2)'),
    ).toBeInTheDocument();
    // A change no person made is the system's; one by an account that is gone, a deleted user's. Never "someone".
    expect(
      within(screen.getByTestId('agent-change-c1')).getByText('history.system'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('agent-change-c1b')).getByText(
        'history.deletedUser',
      ),
    ).toBeInTheDocument();
  });

  it('previews the full prompt of a scenario on a sample subject', async () => {
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    fireEvent.click(
      await screen.findByRole('button', { name: 'brief.preview' }),
    );
    const dialog = await screen.findByRole('dialog');
    // The application's scenario first. The agent's own prompt is open as a card.
    expect(
      await within(dialog).findByTestId('ag-brief-agent-prompt'),
    ).toHaveTextContent('Be brief.');
    expect(
      within(dialog).getByText('brief.agentPrompt', { selector: 'h4' }),
    ).toBeInTheDocument();
    // The platform's part is collapsed to its size, with the note that it is sent in English.
    expect(within(dialog).queryByTestId('ag-brief-platform')).toBeNull();
    expect(within(dialog).getByText('brief.platformNote')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByText(/^brief\.platform\(size=/u));
    // Rendered as Markdown by default, as written on asking.
    expect(
      await within(dialog).findByRole('heading', { name: 'Rules here' }),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'brief.raw' }));
    expect(within(dialog).getByTestId('ag-brief-platform')).toHaveTextContent(
      '## Rules here',
    );
    expect(within(dialog).getByTestId('ag-brief-first')).toHaveTextContent(
      'Continue',
    );
    expect(within(dialog).queryByText('brief.layers.task')).toBeNull();
    expect(callsTo('GET', 'agents/a1/previewBrief')[0]?.query).toEqual({
      scenario: 'deal',
    });
    // Switching to a conversation renders that scenario.
    fireEvent.click(
      within(dialog).getByRole('tab', { name: 'subjects.conversation' }),
    );
    expect(
      await within(dialog).findByText(
        '[sample] What is waiting for me this week?',
      ),
    ).toBeInTheDocument();
    expect(callsTo('GET', 'agents/a1/previewBrief').at(-1)?.query).toEqual({
      scenario: 'conversation',
    });
  });

  it('lists write-only variables and reveals them after asking', async () => {
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a1?tab=runtime',
    );
    const section = await screen.findByRole('region', {
      name: 'envVars.title',
    });
    expect(
      await within(section).findByText('GITHUB_TOKEN'),
    ).toBeInTheDocument();
    expect(within(section).queryByText('ghp_secret')).toBeNull();
    fireEvent.click(
      within(section).getByRole('button', { name: 'envVars.reveal' }),
    );
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: 'envVars.reveal' }),
    );
    expect(await screen.findByText('ghp_secret')).toBeInTheDocument();
    expect(callsTo('POST', 'agents/variables/agent/a1/reveal')).toHaveLength(1);
  });

  it('draws a generated avatar and offers no avatar setting', async () => {
    const { container } = renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a1',
    );
    await screen.findByLabelText('agentForm.instructions');
    expect(screen.queryByLabelText('agentForm.avatar')).toBeNull();
    const avatar = container.querySelector('[data-slot="agent-avatar"]');
    expect(avatar?.textContent).toBe('R');
    expect(avatar).toHaveAttribute('data-tint');
  });

  it("opens a variable's access log from its row, and the scope's from the footer", async () => {
    resetApi(
      {
        'agents/a1': () => agents[0],
        'agents/runners': () => [],
        'agents/actions': () => [],
        'agents/skills': () => [],
        'agents/users': () => [],
        'agents/variables/agent/a1': () => [
          {
            name: 'API_KEY',
            updatedAt: AT,
            updatedById: 'u1',
            updatedByName: 'Alice',
          },
        ],
        'agents/variables/agent/a1/audits': () => [
          {
            id: 'v1',
            at: AT,
            action: 'reveal',
            names: ['API_KEY', 'OTHER'],
            userId: 'u1',
            userName: 'Alice',
            runId: null,
            jobId: null,
            runnerId: null,
          },
          {
            id: 'v2',
            at: AT,
            action: 'set',
            names: ['OTHER'],
            userId: 'u2',
            userName: 'Bob',
            runId: null,
            jobId: null,
            runnerId: null,
          },
        ],
      },
      MANAGE,
    );
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a1?tab=runtime',
    );
    const section = await screen.findByRole('region', {
      name: 'envVars.title',
    });
    expect(within(section).queryByText('envVars.auditsEmpty')).toBeNull();
    await userEvent.click(
      await within(section).findByRole('button', {
        name: 'envVars.actions(name=API_KEY)',
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'envVars.accessLog' }),
    );
    let log = await screen.findByRole('dialog', {
      name: 'envVars.accessLogOf(name=API_KEY)',
    });
    expect(await within(log).findByText('Alice')).toBeInTheDocument();
    expect(within(log).queryByText('Bob')).toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await userEvent.click(
      within(section).getByRole('button', { name: 'envVars.accessLogAll' }),
    );
    log = await screen.findByRole('dialog', { name: 'envVars.accessLog' });
    expect(await within(log).findByText('Bob')).toBeInTheDocument();
    expect(within(log).getByText('API_KEY, OTHER')).toBeInTheDocument();
  });

  it('says in the dialog when the server has no secrets key', async () => {
    resetApi(
      {
        'agents/a1': () => agents[0],
        'agents/runners': () => [],
        'agents/actions': () => [],
        'agents/skills': () => [],
        'agents/users': () => [],
        'agents/variables/agent/a1': () => [],
        'agents/variables/agent/a1/audits': () => [],
        'PUT agents/variables/agent/a1/API_KEY': () => {
          throw new FakeApiError(503, 'SECRETS_KEY_MISSING');
        },
      },
      MANAGE,
    );
    renderRoute(
      <AgentDetailPage />,
      '/agents/:agentId',
      '/agents/a1?tab=runtime',
    );
    const section = await screen.findByRole('region', {
      name: 'envVars.title',
    });
    fireEvent.click(
      within(section).getByRole('button', { name: 'envVars.add' }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('envVars.name'), {
      target: { value: 'API_KEY' },
    });
    fireEvent.change(within(dialog).getByLabelText('envVars.value'), {
      target: { value: 'k-1' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'actions.save' }),
    );
    expect(
      await within(dialog).findByText('errors.SECRETS_KEY_MISSING'),
    ).toBeInTheDocument();
  });

  it('shows an agent read-only to those the server says may not change it', async () => {
    resetApi(
      {
        'agents/a1': () => ({ ...agents[0], canEdit: false, canCopy: false }),
        'agents/runners': () => [],
        'agents/actions': () => [],
        'agents/skills': () => [],
        'agents/users': () => [],
        'agents/variables/agent/a1': () => [],
      },
      ['agents.agents/read'],
    );
    renderRoute(<AgentDetailPage />, '/agents/:agentId', '/agents/a1');
    expect(await screen.findByText('agentDetail.readOnly')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'actions.save' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'agents.archive' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'agentDetail.copyAsMine' }),
    ).toBeNull();
  });
});
