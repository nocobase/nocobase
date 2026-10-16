import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  ComputersDialog,
  ConnectSteps,
  KeepConnected,
} from '../../client/components/computers-dialog.js';
import { AgentSessionsConfigContext } from '../../client/config.js';
import plugin from '../../client/plugin.js';

async function show(
  children: ReactNode,
  connectPrompt: ComponentType | null = null,
) {
  await renderWithApp(
    <QueryClientProvider client={new QueryClient()}>
      <AgentSessionsConfigContext.Provider
        value={{ cli: 'acme', connectPrompt, linkPanels: {} }}
      >
        {children}
      </AgentSessionsConfigContext.Provider>
    </QueryClientProvider>,
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(() => ({ data: [], meta: { total: 0 } })),
    },
  );
}

const Setup = () => (
  <button type='button'>Application setup instructions</button>
);

describe('computer setup customization', () => {
  it('keeps the default checklist when no application panel is supplied', async () => {
    await show(<ConnectSteps />);
    expect(screen.getByText(/acme login --server/u)).toBeInTheDocument();
    expect(screen.getByText('acme acp service install')).toBeInTheDocument();
    expect(screen.getByText('acme acp start')).toBeInTheDocument();
  });

  it('uses the application setup in the empty state', async () => {
    await show(<ConnectSteps />, Setup);
    expect(
      screen.getByRole('button', { name: 'Application setup instructions' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/acme login/u)).not.toBeInTheDocument();
  });

  it('uses the same application setup in My computers', async () => {
    await show(<ComputersDialog open onOpenChange={() => {}} />, Setup);
    expect(
      await screen.findByRole('button', {
        name: 'Application setup instructions',
      }),
    ).toBeInTheDocument();
  });

  it('only offers the background command when computers are offline', async () => {
    await show(<KeepConnected temporary={false} />, Setup);
    expect(screen.getByText('acme acp service install')).toBeInTheDocument();
    expect(screen.queryByText('acme acp start')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Application setup instructions' }),
    ).not.toBeInTheDocument();
  });
});
