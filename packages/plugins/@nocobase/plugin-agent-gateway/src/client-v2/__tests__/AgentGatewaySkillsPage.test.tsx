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
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AgentGatewaySkillsPage from '../pages/AgentGatewaySkillsPage';

interface FlowContextWithDefineProperty {
  defineProperty(name: string, descriptor: { value: unknown }): void;
}

interface RequestConfig {
  url: string;
  method: 'get' | 'post';
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

function renderSkillsPage(request: (config: RequestConfig) => Promise<unknown>) {
  const app = new Application();
  const context = app.flowEngine.context as unknown as FlowContextWithDefineProperty;
  context.defineProperty('api', { value: { request } });
  context.defineProperty('message', { value: { success: vi.fn(), error: vi.fn() } });

  render(
    <FlowEngineProvider engine={app.flowEngine}>
      <AntdApp>
        <AgentGatewaySkillsPage />
      </AntdApp>
    </FlowEngineProvider>,
  );
}

describe('AgentGatewaySkillsPage', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/admin/settings/agent-gateway/skills');
    Object.defineProperty(globalThis.window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens skill upload with NB OpenCode UI Batch defaults', async () => {
    const request = vi.fn(async () => ({ data: { data: [] } }));

    renderSkillsPage(request);

    fireEvent.click(await screen.findByText('Upload skill'));

    expect(screen.getByLabelText('Skill key')).toHaveValue('nb-opencode-ui-batch');
    expect(screen.getByLabelText('Display name')).toHaveValue('NB OpenCode UI Batch');
    expect(screen.getByLabelText('Version label')).toHaveValue('local');
  });

  it('paginates skill versions and loads detail through the dedicated endpoint', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agentGatewayApi:listSkillVersions') {
        return {
          data: {
            data: [
              {
                id: 'skill-version-id-1',
                skillKey: 'nb-opencode-ui-batch',
                displayName: 'NB OpenCode UI Batch',
                versionLabel: 'local',
                status: 'active',
                skillStatus: 'active',
                sourceType: 'zip',
                sourceSha256: 'abcdef0123456789',
                updatedAt: '2026-07-05T10:00:00.000Z',
              },
            ],
            meta: { count: 1, page: 1, pageSize: 20, totalPage: 1 },
          },
        };
      }
      if (config.url === 'agentGatewayApi:getSkillVersion/skill-version-id-1') {
        return {
          data: {
            data: {
              id: 'skill-version-id-1',
              skillVersionId: 'skill-version-id-1',
              skillId: 'skill-id-1',
              skillKey: 'nb-opencode-ui-batch',
              displayName: 'NB OpenCode UI Batch',
              versionLabel: 'local',
              status: 'active',
              skillStatus: 'active',
              sourceType: 'zip',
              sourceSha256: 'abcdef0123456789',
              updatedAt: '2026-07-05T10:00:00.000Z',
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderSkillsPage(request);

    expect(await screen.findByText('NB OpenCode UI Batch')).toBeTruthy();
    expect(await screen.findByText('zip / abcdef01...')).toBeTruthy();
    fireEvent.click(await screen.findByText('NB OpenCode UI Batch'));
    expect(await screen.findByText('skill-version-id-1')).toBeTruthy();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agentGatewayApi:listSkillVersions',
        method: 'get',
        params: { page: 1, pageSize: 20 },
      }),
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agentGatewayApi:getSkillVersion/skill-version-id-1',
        method: 'get',
      }),
    );
  });

  it('opens skill details from the skillVersionId query parameter', async () => {
    window.history.pushState({}, '', '/admin/settings/agent-gateway/skills?skillVersionId=skill-version-id-1');
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agentGatewayApi:listSkillVersions') {
        return {
          data: {
            data: [],
            meta: { count: 0, page: 1, pageSize: 20, totalPage: 0 },
          },
        };
      }
      if (config.url === 'agentGatewayApi:getSkillVersion/skill-version-id-1') {
        return {
          data: {
            data: {
              id: 'skill-version-id-1',
              skillVersionId: 'skill-version-id-1',
              skillId: 'skill-id-1',
              skillKey: 'nb-opencode-ui-batch',
              displayName: 'NB OpenCode UI Batch',
              versionLabel: 'local',
              status: 'active',
              skillStatus: 'active',
              sourceType: 'zip',
              sourceSha256: 'abcdef0123456789',
              sourceSizeBytes: 1024,
              sourceUploadedAt: '2026-07-05T09:00:00.000Z',
              createdAt: '2026-07-05T09:00:00.000Z',
              updatedAt: '2026-07-05T10:00:00.000Z',
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderSkillsPage(request);

    expect(await screen.findByText('Skill version ID')).toBeTruthy();
    expect(await screen.findByText('skill-version-id-1')).toBeTruthy();
    expect(await screen.findByText('skill-id-1')).toBeTruthy();
  });
});
