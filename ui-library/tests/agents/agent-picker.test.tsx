import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AgentIdentity,
  AgentPicker,
  ModeTag,
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
    type: 'online',
    models: [],
    personal: false,
    isSystemDefault: false,
    isMyDefault: false,
    fallbackAgentId: null,
    availability: online,
    ...overrides,
  } satisfies ChatAgent;
}

const AGENTS: readonly ChatAgent[] = [
  agent({ id: 'assistant', name: 'Assistant', isMyDefault: true }),
  agent({
    id: 'coder',
    name: 'Coding agent',
    type: 'runner',
    isSystemDefault: true,
  }),
  agent({
    id: 'reviewer',
    name: 'Reviewer',
    type: 'runner',
    personal: true,
    availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
  }),
];

describe('AgentPicker', () => {
  it('shows the chosen agent with its availability and mode, and lists the agents grouped by mode', async () => {
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
    expect(trigger).toHaveTextContent('Online');
    // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Online agents')).toBeVisible();
    expect(within(menu).getByText('Runner agents')).toBeVisible();
    const reviewer = within(menu).getByRole('menuitem', { name: /Reviewer/ });
    expect(reviewer).toHaveTextContent('Only me');
    expect(
      within(reviewer).getByRole('img', { name: 'No runner online' }),
    ).toBeVisible();
    expect(
      within(menu).getByRole('menuitem', { name: /Coding agent/ }),
    ).toHaveTextContent('System default');
    fireEvent.click(reviewer);
    expect(onSelect).toHaveBeenCalledWith('reviewer');
  });

  it('starts a new conversation when bound, and shows what the conversation has', async () => {
    render(
      <AgentPicker
        agents={AGENTS}
        value='coder'
        bound
        shown={{ name: 'Gone agent', mode: 'runner', temporary: true }}
        appearance='toolbar'
        onSelect={() => undefined}
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Chatting with Gone agent; choose another agent',
    });
    expect(trigger).toHaveTextContent('Temporary');
    expect(trigger).toHaveTextContent('Runner');
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

  it('fits a composer’s toolbar: the dot on the avatar, the mode only where the container is wide', () => {
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
      name: 'Chatting with Reviewer, No runner online; choose another agent',
    });
    expect(trigger).toHaveClass('max-w-44', '@md:max-w-64');
    const dot = within(trigger).getByRole('img', { name: 'No runner online' });
    expect(dot).toHaveClass('absolute');
    // Placed on the avatar's corner, the two sharing one positioned box.
    expect(dot.parentElement).toHaveClass('relative');
    expect(dot.previousElementSibling).not.toBeNull();
    const mode = within(trigger).getByText('Runner').closest('[title]');
    expect(mode).toHaveClass('hidden', '@md:inline-flex');
  });

  it('looks like a select as a field: the dot on the avatar, no mode or tags on the trigger', async () => {
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
    expect(trigger).not.toHaveTextContent('Runner');
    expect(trigger).not.toHaveTextContent('System default');
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Online agents')).toBeVisible();
    expect(within(menu).getByText('Runner agents')).toBeVisible();
    // No hint under a field's menu.
    expect(within(menu).queryByText(/Online answers on the server/)).toBeNull();
  });

  it('offers only one type as a field, with its placeholder while nothing is chosen', async () => {
    const onSelect = vi.fn();
    render(
      <AgentPicker
        agents={AGENTS}
        value={null}
        type='runner'
        placeholder='Choose a runner agent'
        onSelect={onSelect}
      />,
    );
    const trigger = screen.getByRole('button', {
      name: 'Agent: Choose a runner agent',
    });
    expect(within(trigger).getByText('Choose a runner agent')).toHaveClass(
      'text-muted-foreground',
    );
    expect(within(trigger).queryByRole('img')).toBeNull();
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(within(menu).queryByText('Online agents')).toBeNull();
    expect(
      within(menu).queryByRole('menuitem', { name: /Assistant/ }),
    ).toBeNull();
    fireEvent.click(within(menu).getByRole('menuitem', { name: /Reviewer/ }));
    expect(onSelect).toHaveBeenCalledWith('reviewer');
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

  it('draws an agent as one row: avatar, dot and name', () => {
    render(
      <AgentIdentity
        name='Reviewer'
        availability={{ online: false, reason: 'noRunner', onlineRunners: 0 }}
        ringClassName='ring-popover'
      />,
    );
    const dot = screen.getByRole('img', { name: 'No runner online' });
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
    render(
      <ModeTag
        mode='runner'
        labels={{ mode: { online: '在线', runner: '运行器' } }}
      />,
    );
    expect(screen.getByText('运行器')).toBeVisible();
  });
});
