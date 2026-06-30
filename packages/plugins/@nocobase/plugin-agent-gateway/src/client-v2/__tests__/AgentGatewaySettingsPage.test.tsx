/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AgentGatewaySettingsPage from '../pages/AgentGatewaySettingsPage';
import PluginAgentGatewayClientV2 from '../plugin';

describe('PluginAgentGatewayClientV2', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('registers the Agent Gateway settings page', async () => {
    const app = new Application({
      plugins: [PluginAgentGatewayClientV2],
    });
    const addMenuItem = vi.spyOn(app.pluginSettingsManager, 'addMenuItem');
    const addPageTabItem = vi.spyOn(app.pluginSettingsManager, 'addPageTabItem');

    await app.load();

    expect(addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'agent-gateway',
        icon: 'ApiOutlined',
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'index',
      }),
    );
  });

  it('renders the placeholder settings page without console errors', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = new Application();

    render(
      <FlowEngineProvider engine={app.flowEngine}>
        <AgentGatewaySettingsPage />
      </FlowEngineProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Agent Gateway' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Nodes' })).toBeTruthy();
    expect(screen.getByText('No records yet')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
