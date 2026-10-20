import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';
import type { ModelService } from '@nocobase/app-plugin-agents/shared/models';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AgentComposer } from '../../registry/agents/agent-composer';
import {
  AgentIdentity,
  AgentPicker,
  AgentTag,
} from '../../registry/agents/agent-picker';

// The avatar comes from the plugin's chat entry; the preview's stand-in renders it without a server.
vi.mock(
  '@nocobase/app-plugin-agents/client/chat',
  () => import('../../website/demo/agents/agents-chat-client'),
);

const online = { online: true, reason: null, onlineRunners: 1 } as const;

function agent(overrides: Partial<ChatAgent> & Pick<ChatAgent, 'id'>) {
  return {
    name: overrides.id,
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: false,
    isMyDefault: false,
    availability: online,
    personalOnly: false,
    runnerNames: [],
    ...overrides,
  } satisfies ChatAgent;
}

const AGENTS: readonly ChatAgent[] = [
  agent({
    id: 'assistant',
    name: 'Assistant',
    description: 'Everyday coding',
    isMyDefault: true,
  }),
  agent({ id: 'coder', name: 'Coding agent', isSystemDefault: true }),
  agent({
    id: 'mine',
    name: 'Mine',
    personalOnly: true,
  }),
  agent({
    id: 'reviewer',
    name: 'Reviewer',
    availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
  }),
];

const SERVICES: readonly ModelService[] = [
  {
    name: 'team',
    title: 'Team gateway',
    provider: 'openai-compatible',
    models: [
      { value: 'chat-v1', label: 'Chat One', kind: 'chat', dimensions: null },
      { value: 'raw-chat', label: '', kind: 'chat', dimensions: null },
      { value: 'embed', label: 'Embedding', kind: 'embedding', dimensions: 3 },
    ],
  },
  {
    name: 'personal',
    title: 'Personal gateway',
    provider: 'openai-compatible',
    models: [
      { value: 'chat-v1', label: 'Chat One', kind: 'chat', dimensions: null },
    ],
  },
];

const modelValue = { modelService: 'team', model: 'chat-v1' } as const;

function checkIn(row: HTMLElement) {
  return row.querySelector('svg.lucide-check');
}

describe('AgentPicker models', () => {
  it('keeps every Runner row element, tags, offline reason, dot and selection check', async () => {
    render(
      <AgentPicker
        agents={AGENTS}
        value='assistant'
        onSelect={vi.fn()}
        appearance='toolbar'
        models={{ services: SERVICES, value: null, onSelect: vi.fn() }}
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Models')).toBeVisible();
    expect(within(menu).getByText('Agents')).toBeVisible();
    const assistant = within(menu).getByRole('menuitem', { name: /Assistant/ });
    expect(assistant.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(assistant).toHaveTextContent('Everyday coding');
    expect(assistant).toHaveTextContent('My default');
    expect(
      within(assistant).getByRole('img', { name: 'Online' }),
    ).toBeVisible();
    expect(checkIn(assistant)).not.toBeNull();
    expect(
      within(menu).getByRole('menuitem', { name: /Coding agent/ }),
    ).toHaveTextContent('System default');
    expect(
      within(menu).getByRole('menuitem', { name: /Mine/ }),
    ).toHaveTextContent('Personal runners only');
    const reviewer = within(menu).getByRole('menuitem', { name: /Reviewer/ });
    expect(reviewer).toHaveAttribute('aria-disabled', 'true');
    expect(reviewer).toHaveTextContent('No runner online, cannot be chosen');
    expect(
      within(reviewer).getByRole('img', {
        name: 'No runner online, cannot be chosen',
      }),
    ).toBeVisible();
    expect(
      within(menu).getByText(
        'Choose an online model or an Agent on a runner to chat with.',
      ),
    ).toBeVisible();
  });

  it('groups chat models by actual service title without repeating the service in each row', async () => {
    render(
      <AgentPicker
        agents={[]}
        value={null}
        onSelect={vi.fn()}
        appearance='toolbar'
        models={{ services: SERVICES, value: modelValue, onSelect: vi.fn() }}
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Chatting with Chat One (Team gateway); choose a model or agent',
    });
    expect(trigger).toHaveClass('max-w-44', '@md:max-w-64');
    expect(trigger.querySelector('svg.lucide-sparkles')).not.toBeNull();
    expect(within(trigger).queryByRole('img')).toBeNull();
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    const team = within(menu).getByRole('group', { name: 'Team gateway' });
    const personal = within(menu).getByRole('group', {
      name: 'Personal gateway',
    });
    const rows = within(menu).getAllByRole('menuitem');
    expect(rows).toHaveLength(3);
    expect(within(team).getAllByRole('menuitem')).toHaveLength(2);
    expect(within(personal).getAllByRole('menuitem')).toHaveLength(1);
    expect(within(menu).getAllByText('Team gateway')).toHaveLength(1);
    expect(within(menu).getAllByText('Personal gateway')).toHaveLength(1);
    expect(rows[0]?.children[0]).toHaveTextContent('Chat One');
    expect(rows[0]).not.toHaveTextContent('Team gateway');
    expect(rows[0]).toHaveClass('pl-4');
    expect(rows[0]?.lastElementChild).toHaveClass('size-3.5', 'shrink-0');
    expect(rows[1]?.lastElementChild).toHaveClass('size-3.5', 'shrink-0');
    expect(checkIn(rows[0]!)).not.toBeNull();
    expect(rows[1]?.querySelector('svg')).toBeNull();
    expect(within(menu).getByText('raw-chat')).toBeVisible();
    expect(within(menu).queryByText('openai-compatible')).toBeNull();
    expect(within(menu).queryByText('Embedding')).toBeNull();
    expect(within(menu).queryByText('Models')).toBeNull();
    expect(within(menu).queryByText('Agents')).toBeNull();
    expect(
      within(menu).getByText('Choose an online model to chat with.'),
    ).toBeVisible();
  });

  it('scrolls only the choices vertically while keeping search and hints outside the scroll area', async () => {
    render(
      <AgentPicker
        agents={AGENTS}
        value={null}
        onSelect={vi.fn()}
        appearance='toolbar'
        models={{ services: SERVICES, value: modelValue, onSelect: vi.fn() }}
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    const menu = await screen.findByRole('menu');
    const options = menu.querySelector<HTMLElement>(
      '[data-slot="agent-picker-options"]',
    )!;
    expect(options).toHaveClass(
      'min-h-0',
      'overflow-x-hidden',
      'overflow-y-auto',
    );
    expect(options).toHaveClass('[&_[data-slot=dropdown-menu-separator]]:mx-0');
    expect(menu).toHaveClass('flex', 'flex-col', 'overflow-hidden');
    expect(within(options).getAllByRole('menuitem')).toHaveLength(7);
    expect(options).not.toContainElement(within(menu).getByRole('searchbox'));
    expect(options).not.toContainElement(
      within(menu).getByText(
        'Choose an online model or an Agent on a runner to chat with.',
      ),
    );
    const label = within(menu).getByText('Team gateway');
    expect(label).toHaveClass('truncate');
    expect(label).toHaveAttribute('title', 'Team gateway');
  });

  it('keeps distinct services separate even when their titles are identical and skips services without chat models', async () => {
    render(
      <AgentPicker
        agents={[]}
        value={null}
        onSelect={vi.fn()}
        models={{
          services: [
            ...SERVICES.map((service) => ({
              ...service,
              title: 'Shared title',
            })),
            {
              name: 'empty',
              title: 'Empty service',
              provider: 'openai',
              models: [],
            },
            {
              name: 'embedding-only',
              title: 'Embedding service',
              provider: 'openai',
              models: [
                {
                  value: 'embed',
                  label: 'Embedding',
                  kind: 'embedding',
                  dimensions: 3,
                },
              ],
            },
          ],
          value: modelValue,
          onSelect: vi.fn(),
        }}
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    const menu = await screen.findByRole('menu');
    const groups = within(menu).getAllByRole('group', { name: 'Shared title' });
    expect(groups).toHaveLength(2);
    expect(within(groups[0]!).getAllByRole('menuitem')).toHaveLength(2);
    expect(within(groups[1]!).getAllByRole('menuitem')).toHaveLength(1);
    expect(within(groups[0]!).getAllByRole('menuitem')[0]).toHaveAttribute(
      'data-model-service',
      'team',
    );
    expect(within(groups[1]!).getByRole('menuitem')).toHaveAttribute(
      'data-model-service',
      'personal',
    );
    expect(within(menu).queryByText('Empty service')).toBeNull();
    expect(within(menu).queryByText('Embedding service')).toBeNull();
  });

  it('distinguishes the same model id at different services and calls only the model callback with its pair', async () => {
    const onModel = vi.fn();
    const onAgent = vi.fn();
    render(
      <AgentPicker
        agents={AGENTS}
        value={null}
        onSelect={onAgent}
        appearance='toolbar'
        models={{
          services: SERVICES,
          value: { modelService: 'personal', model: 'chat-v1' },
          onSelect: onModel,
        }}
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    const menu = await screen.findByRole('menu');
    const team = within(menu).getByRole('menuitem', {
      name: 'Chat One Team gateway',
    });
    const personal = within(menu).getByRole('menuitem', {
      name: 'Chat One Personal gateway',
    });
    expect(checkIn(team)).toBeNull();
    expect(checkIn(personal)).not.toBeNull();
    await userEvent.click(team);
    expect(onModel).toHaveBeenCalledExactlyOnceWith(modelValue);
    expect(onAgent).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('agent-picker'));
    await userEvent.click(
      await screen.findByRole('menuitem', {
        name: 'Chat One Personal gateway',
      }),
    );
    expect(onModel).toHaveBeenLastCalledWith({
      modelService: 'personal',
      model: 'chat-v1',
    });
  });

  it('disables only models while leaving online Runner agents selectable', async () => {
    const onModel = vi.fn();
    const onAgent = vi.fn();
    render(
      <AgentPicker
        agents={AGENTS}
        value={null}
        onSelect={onAgent}
        appearance='toolbar'
        models={{
          services: SERVICES,
          value: modelValue,
          onSelect: onModel,
          disabled: true,
        }}
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    const menu = await screen.findByRole('menu');
    const model = within(menu).getByRole('menuitem', {
      name: 'Chat One Team gateway',
    });
    expect(model).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(model);
    expect(onModel).not.toHaveBeenCalled();
    const runner = within(menu).getByRole('menuitem', { name: /Mine/ });
    expect(runner).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(runner);
    expect(onAgent).toHaveBeenCalledWith('mine');
  });

  it('keeps search focus after clicks bubble through a composer toolbar portal', async () => {
    const user = userEvent.setup();
    render(
      <AgentComposer
        onSend={() => true}
        attachments={{ upload: vi.fn() }}
        toolbar={
          <AgentPicker
            agents={AGENTS}
            value={null}
            onSelect={vi.fn()}
            appearance='toolbar'
            models={{ services: SERVICES, value: null, onSelect: vi.fn() }}
          />
        }
      />,
    );
    await user.click(screen.getByTestId('agent-picker'));
    const search = await screen.findByRole('searchbox');
    await user.click(search);
    await user.keyboard('Personal');
    expect(search).toHaveFocus();
    expect(search).toHaveValue('Personal');
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.getByRole('menuitem')).toHaveTextContent('Chat One');
    expect(
      screen.getByRole('group', { name: 'Personal gateway' }),
    ).toContainElement(screen.getByRole('menuitem'));
    expect(screen.queryByRole('group', { name: 'Team gateway' })).toBeNull();
    expect(screen.getByTestId('chat-attach-input')).not.toHaveFocus();
  });

  it('searches models, service titles and Runner descriptions, translates empty results and resets on reopen', async () => {
    const user = userEvent.setup();
    render(
      <AgentPicker
        agents={AGENTS}
        value={null}
        onSelect={vi.fn()}
        appearance='toolbar'
        labels={{ search: 'Find choices', noResults: 'Nothing matches' }}
        models={{ services: SERVICES, value: null, onSelect: vi.fn() }}
      />,
    );
    await user.click(screen.getByTestId('agent-picker'));
    const search = await screen.findByRole('searchbox', {
      name: 'Find choices',
    });
    await user.type(search, ' PERSONAL GATEWAY ');
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.getByRole('menuitem')).toHaveTextContent('Chat One');
    expect(
      screen.getByRole('group', { name: 'Personal gateway' }),
    ).toContainElement(screen.getByRole('menuitem'));
    expect(screen.queryByRole('group', { name: 'Team gateway' })).toBeNull();
    await user.clear(search);
    await user.type(search, 'everyday');
    expect(screen.getByRole('menuitem')).toHaveTextContent('Assistant');
    await user.clear(search);
    await user.type(search, 'no match');
    expect(screen.getByText('Nothing matches')).toBeVisible();
    expect(
      screen
        .queryAllByRole('menuitem')
        .filter((row) => row.getAttribute('aria-disabled') !== 'true'),
    ).toHaveLength(0);
    await user.keyboard('{Escape}');
    await user.click(screen.getByTestId('agent-picker'));
    expect(await screen.findByRole('searchbox')).toHaveValue('');
    expect(screen.getAllByRole('menuitem')).toHaveLength(7);
  });

  it('supports keyboard search, arrow navigation, Enter selection and Escape focus return', async () => {
    const user = userEvent.setup();
    const onModel = vi.fn();
    render(
      <AgentPicker
        agents={[]}
        value={null}
        onSelect={vi.fn()}
        appearance='toolbar'
        models={{ services: SERVICES, value: null, onSelect: onModel }}
      />,
    );
    const trigger = screen.getByTestId('agent-picker');
    trigger.focus();
    await user.keyboard('{Enter}');
    const search = await screen.findByRole('searchbox');
    await waitFor(() => expect(search).toHaveFocus());
    await user.type(search, 'Personal');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onModel).toHaveBeenCalledWith({
      modelService: 'personal',
      model: 'chat-v1',
    });
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('shows a translated model placeholder while the catalog is loading and labels Runner-only groups', async () => {
    const { rerender } = render(
      <AgentPicker
        agents={[]}
        value={null}
        onSelect={vi.fn()}
        appearance='toolbar'
        labels={{
          modelPlaceholder: 'Choose a model now',
          modelSwitch: '{name} from {service}',
        }}
        models={{ services: [], value: modelValue, onSelect: vi.fn() }}
      />,
    );
    expect(screen.getByTestId('agent-picker')).toHaveTextContent(
      'Choose a model now',
    );
    rerender(
      <AgentPicker
        agents={AGENTS}
        value='assistant'
        onSelect={vi.fn()}
        appearance='toolbar'
        models={{ services: [], value: null, onSelect: vi.fn() }}
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    expect(await screen.findByText('Agents')).toBeVisible();
    expect(screen.queryByText('Models')).toBeNull();
  });

  it('takes model-aware group titles, hints and accessible pair names from labels', async () => {
    render(
      <AgentPicker
        agents={AGENTS}
        value={null}
        onSelect={vi.fn()}
        appearance='toolbar'
        labels={{
          models: 'Chat models',
          runnerAgents: 'Task runners',
          modelSwitch: '{name} via {service}',
          mixedHint: 'Choose either kind',
        }}
        models={{ services: SERVICES, value: modelValue, onSelect: vi.fn() }}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Chat One via Team gateway' }),
    );
    expect(await screen.findByText('Chat models')).toBeVisible();
    expect(screen.getByText('Task runners')).toBeVisible();
    expect(screen.getByText('Choose either kind')).toBeVisible();
  });

  it('has no group titles or selectable entries with an empty model-only catalog, and honors showHint', async () => {
    render(
      <AgentPicker
        agents={[]}
        value={null}
        onSelect={vi.fn()}
        appearance='toolbar'
        showHint={false}
        labels={{ noResults: 'No choices yet' }}
        models={{ services: [], value: null, onSelect: vi.fn() }}
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    const menu = await screen.findByRole('menu');
    expect(menu.querySelector('[data-slot="dropdown-menu-label"]')).toBeNull();
    expect(
      within(menu).getByRole('menuitem', { name: 'No choices yet' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(menu).queryByText('Choose an online model to chat with.'),
    ).toBeNull();
  });

  it('keeps bound hints and suppresses selection checks when choosing starts a conversation', async () => {
    render(
      <AgentPicker
        agents={AGENTS}
        value='assistant'
        onSelect={vi.fn()}
        appearance='toolbar'
        bound
        models={{ services: SERVICES, value: modelValue, onSelect: vi.fn() }}
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    const menu = await screen.findByRole('menu');
    expect(
      within(menu).getByText('Start a new conversation with'),
    ).toBeVisible();
    expect(
      within(menu).getByText(
        'A conversation stays with its agent; choosing another starts a new conversation.',
      ),
    ).toBeVisible();
    expect(menu.querySelector('svg.lucide-check')).toBeNull();
  });
});

describe('AgentPicker', () => {
  it('shows the chosen agent with its availability, and lists every agent with its tags and why it cannot answer', async () => {
    const onSelect = vi.fn();
    render(
      <AgentPicker
        agents={AGENTS}
        value='assistant'
        onSelect={onSelect}
        appearance='toolbar'
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Chatting with Assistant, Online; choose another agent',
    });
    expect(within(trigger).getByRole('img', { name: 'Online' })).toBeVisible();
    // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(
      within(menu).getByRole('menuitem', { name: /Assistant/ }),
    ).toHaveTextContent('Everyday coding');
    expect(
      within(menu).getByRole('menuitem', { name: /Coding agent/ }),
    ).toHaveTextContent('System default');
    expect(
      within(menu).getByRole('menuitem', { name: /Mine/ }),
    ).toHaveTextContent('Personal runners only');
    const reviewer = within(menu).getByRole('menuitem', { name: /Reviewer/ });
    expect(reviewer).toHaveTextContent('No runner online, cannot be chosen');
    expect(reviewer).toHaveAttribute('aria-disabled', 'true');
    expect(within(menu).getByText(/Answers run on a runner/)).toBeVisible();
    fireEvent.click(within(menu).getByRole('menuitem', { name: /Mine/ }));
    expect(onSelect).toHaveBeenCalledWith('mine');
  });

  it('starts a new conversation when bound, and shows what the conversation has', async () => {
    render(
      <AgentPicker
        agents={AGENTS}
        value='coder'
        bound
        shown={{ name: 'Gone agent', temporary: true }}
        appearance='toolbar'
        onSelect={() => undefined}
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Chatting with Gone agent; choose another agent',
    });
    expect(trigger).toHaveTextContent('Temporary');
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(
      within(menu).getByText('Start a new conversation with'),
    ).toBeVisible();
    expect(
      within(menu).getByText(
        'A conversation stays with its agent; choosing another starts a new conversation.',
      ),
    ).toBeVisible();
  });

  it('offers no agent first when the form allows it, checked while nothing is chosen', async () => {
    const none = vi.fn();
    const onSelect = vi.fn();
    render(
      <AgentPicker
        id='default-agent'
        agents={AGENTS}
        value={null}
        onSelect={onSelect}
        noneOption={{ label: 'System default', onSelect: none }}
        labels={{ none: 'System default' }}
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Agent: System default',
    });
    expect(trigger).toHaveAttribute('id', 'default-agent');
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    const [first] = within(menu).getAllByRole('menuitem');
    expect(first).toHaveTextContent('System default');
    expect(first?.querySelector('svg')).not.toBeNull();
    fireEvent.click(first!);
    expect(none).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('fits a composer’s toolbar: the dot on the avatar', () => {
    render(
      <AgentPicker
        agents={AGENTS}
        value='reviewer'
        onSelect={() => undefined}
        appearance='toolbar'
      />,
    );
    // The availability the dot shows is in the accessible name.
    const trigger = screen.getByRole('button', {
      name: 'Chatting with Reviewer, No runner online, cannot be chosen; choose another agent',
    });
    expect(trigger).toHaveClass('max-w-44', '@md:max-w-64');
    const dot = within(trigger).getByRole('img', {
      name: 'No runner online, cannot be chosen',
    });
    expect(dot).toHaveClass('absolute');
    // Placed on the avatar's corner, the two sharing one positioned box.
    expect(dot.parentElement).toHaveClass('relative');
    expect(dot.previousElementSibling).not.toBeNull();
  });

  it('looks like a select as a field: the dot on the avatar, no tags on the trigger', async () => {
    render(
      <AgentPicker
        id='rule-agent'
        agents={AGENTS}
        value='coder'
        onSelect={() => undefined}
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Agent: Coding agent, Online',
    });
    expect(trigger).toHaveAttribute('id', 'rule-agent');
    expect(trigger).toHaveAttribute('data-appearance', 'field');
    expect(trigger).toHaveClass('h-8', 'w-full', 'border-input', 'rounded-lg');
    const dot = within(trigger).getByRole('img', { name: 'Online' });
    expect(dot).toHaveClass('absolute');
    expect(trigger).not.toHaveTextContent('System default');
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(AGENTS.length);
    // No hint under a field's menu.
    expect(within(menu).queryByText(/Answers run on a runner/)).toBeNull();
  });

  it('shows its placeholder as a field while nothing is chosen', async () => {
    const onSelect = vi.fn();
    render(
      <AgentPicker
        agents={AGENTS}
        value={null}
        placeholder='Choose a rule agent'
        onSelect={onSelect}
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Agent: Choose a rule agent',
    });
    expect(within(trigger).getByText('Choose a rule agent')).toHaveClass(
      'text-muted-foreground',
    );
    expect(within(trigger).queryByRole('img')).toBeNull();
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    fireEvent.click(
      within(menu).getByRole('menuitem', { name: /Coding agent/ }),
    );
    expect(onSelect).toHaveBeenCalledWith('coder');
  });

  it('names an agent the list does not hold, or what `shown` says, and can be disabled', () => {
    const { rerender } = render(
      <AgentPicker
        agents={AGENTS}
        value='gone'
        onSelect={() => undefined}
        labels={{ unknown: 'An agent you cannot see' }}
        disabled
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Agent: An agent you cannot see',
    });
    expect(trigger).toBeDisabled();
    rerender(
      <AgentPicker
        agents={AGENTS}
        value='gone'
        shown={{ name: 'Archived helper' }}
        onSelect={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Agent: Archived helper' }),
    ).toBeVisible();
  });

  it('keeps the legacy heading and selected-offline-agent exception without adding search', async () => {
    const onSelect = vi.fn();
    render(
      <AgentPicker
        agents={AGENTS}
        value='reviewer'
        onSelect={onSelect}
        appearance='toolbar'
      />,
    );
    await userEvent.click(screen.getByTestId('agent-picker'));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Chat with')).toBeVisible();
    expect(within(menu).queryByRole('searchbox')).toBeNull();
    const reviewer = within(menu).getByRole('menuitem', { name: /Reviewer/ });
    expect(reviewer).not.toHaveAttribute('aria-disabled', 'true');
    expect(checkIn(reviewer)).not.toBeNull();
    await userEvent.click(reviewer);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('reviewer');
  });

  it('draws an agent as one row: avatar, dot and name', () => {
    render(
      <AgentIdentity
        name='Reviewer'
        availability={{ online: false, reason: 'noRunner', onlineRunners: 0 }}
        ringClassName='ring-popover'
      />,
    );
    const dot = screen.getByRole('img', {
      name: 'No runner online, cannot be chosen',
    });
    expect(dot).toHaveClass('absolute', 'ring-popover');
    expect(screen.getByText('Reviewer')).toBeVisible();
  });

  it('takes its words from labels', () => {
    render(
      <AgentPicker
        agents={[]}
        value={null}
        onSelect={() => undefined}
        labels={{ placeholder: '选择 Agent', field: '默认 Agent：{name}' }}
      />,
    );
    expect(
      screen.getByRole('button', { name: '默认 Agent：选择 Agent' }),
    ).toBeVisible();
    render(<AgentTag tone='violet'>仅个人运行器</AgentTag>);
    expect(screen.getByText('仅个人运行器')).toBeVisible();
  });
});
