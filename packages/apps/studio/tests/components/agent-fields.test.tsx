import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useExecutorAgent } from '../../client/agents/executor-agent';
import { RuleAgentField } from '../../client/agents/stage-rule-editors';
import { pickerAgent } from '../fixtures/picker-agents';

const AGENTS = [
  pickerAgent('coder', 'Coder'),
  pickerAgent('reviewer', 'Reviewer', {
    availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
  }),
];

vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  useAgentOptions: (filter: { type?: string } = {}) => ({
    loading: false,
    failed: false,
    options: [],
    agents: AGENTS.filter(
      (agent) => !filter.type || agent.type === filter.type,
    ),
    nameOf: (id: string) =>
      AGENTS.find((agent) => agent.id === id)?.name ?? null,
  }),
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));

const LABEL = 'studioAgents.stageRules.agent';

describe('a status rule’s agent', () => {
  it('is the agent picker as a field: the issue’s executor first, then the runner agents', async () => {
    const onChange = vi.fn();
    render(
      <RuleAgentField
        id='rule-agent'
        value=''
        allowCurrent
        onChange={onChange}
      />,
    );
    const trigger = screen.getByLabelText(LABEL);
    expect(trigger).toHaveAttribute('data-appearance', 'field');
    expect(trigger).toHaveTextContent(
      'studioAgents.stageRules.currentExecutor',
    );
    fireEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    const [current] = within(menu).getAllByRole('menuitem');
    expect(current).toHaveTextContent(
      'studioAgents.stageRules.currentExecutor',
    );
    expect(
      within(
        within(menu).getByRole('menuitem', { name: /Reviewer/u }),
      ).getByRole('img'),
    ).toHaveAttribute('data-online', 'false');
    fireEvent.click(within(menu).getByRole('menuitem', { name: /Coder/u }));
    expect(onChange).toHaveBeenCalledWith('coder');
  });

  it('shows the chosen agent with its availability, a placeholder, or an agent it cannot list', () => {
    const { rerender } = render(
      <RuleAgentField
        id='rule-agent'
        value='reviewer'
        allowCurrent={false}
        onChange={() => undefined}
      />,
    );
    const trigger = screen.getByLabelText(LABEL);
    expect(trigger).toHaveTextContent('Reviewer');
    expect(within(trigger).getByRole('img')).toHaveClass('absolute');
    rerender(
      <RuleAgentField
        id='rule-agent'
        value=''
        allowCurrent={false}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByLabelText(LABEL)).toHaveTextContent(
      'studioAgents.stageRules.chooseAgent',
    );
    rerender(
      <RuleAgentField
        id='rule-agent'
        value='gone'
        allowCurrent={false}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByLabelText(LABEL)).toHaveTextContent(
      'studioAgents.stageRules.unknownAgent',
    );
  });
});

function Executor({ id, name }: { id: string; name: string }): ReactElement {
  const executorAgent = useExecutorAgent();
  return <div data-testid='executor'>{executorAgent(id, name, 'trigger')}</div>;
}

describe('an agent executor', () => {
  it('reads as the agent picker’s row: avatar, availability dot and name', () => {
    render(<Executor id='reviewer' name='Reviewer' />);
    const row = screen.getByTestId('executor');
    expect(row).toHaveTextContent('Reviewer');
    const dot = within(row).getByRole('img');
    expect(dot).toHaveAttribute('data-online', 'false');
    expect(dot).toHaveClass('absolute', 'ring-card');
  });

  it('has no dot for an agent whose availability is unknown', () => {
    render(<Executor id='elsewhere' name='Elsewhere' />);
    expect(
      within(screen.getByTestId('executor')).queryByRole('img'),
    ).toBeNull();
  });
});
