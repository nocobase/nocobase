import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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

describe('AgentPicker', () => {
  it('keeps disabled choices and their reasons visible while skipping pointer and keyboard selection', async () => {
    const onSelect = vi.fn();
    render(
      <AgentPicker
        agents={AGENTS}
        value='assistant'
        onSelect={onSelect}
        disabledReason={(agent) =>
          agent.id === 'coder' ? 'Available to everyone only' : null
        }
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Agent: Assistant, Online' }),
    );
    const blocked = await screen.findByRole('menuitem', {
      name: /Coding agent/,
    });
    expect(blocked).toHaveAttribute('aria-disabled', 'true');
    expect(blocked).toHaveAttribute('title', 'Available to everyone only');
    expect(
      within(blocked).getByText('Available to everyone only'),
    ).toBeVisible();
    await userEvent.keyboard('{Home}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /Assistant/ })).toHaveFocus(),
    );
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /Mine/ })).toHaveFocus(),
    );
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('mine');
    onSelect.mockClear();
    await userEvent.click(
      screen.getByRole('button', { name: 'Agent: Assistant, Online' }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Coding agent/ }),
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

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
