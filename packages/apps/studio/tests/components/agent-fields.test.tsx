import { render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useExecutorAgent } from '../../client/agents/executor-agent';
import { pickerAgent } from '../fixtures/picker-agents';

const AGENTS = [
  pickerAgent('coder', 'Coder'),
  pickerAgent('reviewer', 'Reviewer', {
    availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
  }),
];

vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  useAgentOptions: () => ({
    loading: false,
    failed: false,
    options: [],
    agents: AGENTS,
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
