// @vitest-environment jsdom
/** The ready-made System settings pages tell their pages where they are mounted, so links between them stay inside it. */
import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';

import { useAgentsMount } from '../../client/mount.js';

vi.mock('../../client/query.js', () => ({
  withAgents: (Page: ComponentType) => Page,
}));
vi.mock('../../client/pages/usage/index.js', () => ({
  default: function Usage(): ReactElement {
    return <p data-testid='agent-link'>{useAgentsMount().agentLink('a 1')}</p>;
  },
}));

const { agentsSettingsRoutes, usageRoute } =
  await import('../../client/routes.js');

function named(name: string): AppClientRouteDefinition {
  const found = agentsSettingsRoutes.routes.find(
    (route) => route.name === name,
  );
  if (!found) throw new Error(`no ${name}`);
  return found;
}

async function renderLoaded(route: AppClientRouteDefinition): Promise<void> {
  if (!route.componentLoader) throw new Error('not a page');
  const { default: Page } = await route.componentLoader();
  render(<Page />);
}

describe('agentsSettingsRoutes', () => {
  it('mounts the pages in the AI category and links an agent to the settings agents page', async () => {
    const usage = named('usage');
    expect(usage.parent).toBe('ai');
    await renderLoaded(usage);
    expect(screen.getByTestId('agent-link')).toHaveTextContent(
      '/settings/agents',
    );
  });

  it('keeps the business mount links for the plain route definitions', async () => {
    await renderLoaded(usageRoute);
    expect(screen.getByTestId('agent-link')).toHaveTextContent('/agents/a%201');
  });
});
