/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AGENT_GATEWAY_API_ACTIONS } from '../../shared/apiContract';
import { RequestConfig, apiUrl, renderAgentGatewayPage, setupRunsPageTestHooks } from './runs/testUtils';
import AgentGatewayRunsPage from '../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs page composition', () => {
  setupRunsPageTestHooks();

  it('paginates the runs table through the run list API', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        const page = Number(config.params?.page || 1);
        const pageSize = Number(config.params?.pageSize || 20);
        return {
          data: {
            data: [
              {
                id: `run-page-${page}`,
                runCode: `run-code-page-${page}`,
                status: 'queued',
                taskTitle: `Run page ${page}`,
                taskTemplateId: 'task-template-1',
                taskTemplateJson: {
                  id: 'task-template-1',
                  templateKey: 'ui-build',
                  displayName: 'UI Build',
                  skillVersionIds: ['skill-version-1'],
                  skills: [
                    {
                      id: 'skill-version-1',
                      skillId: 'skill-1',
                      skillKey: 'nb-opencode-ui-batch',
                      displayName: 'NB OpenCode UI Batch',
                      versionLabel: 'v1',
                      status: 'active',
                    },
                  ],
                },
                agentGatewayActionPermissionsJson: {},
              },
            ],
            meta: {
              count: 42,
              page,
              pageSize,
              totalPage: Math.ceil(42 / pageSize),
              taskTemplates: [
                {
                  id: 'task-template-1',
                  templateKey: 'ui-build',
                  displayName: 'UI Build',
                },
              ],
            },
          },
        };
      }
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-page-1')) {
        return {
          data: {
            data: {
              id: 'run-page-1',
              runCode: 'run-code-page-1',
              status: 'queued',
              taskTitle: 'Run page 1',
              taskTemplateId: 'task-template-1',
              taskTemplateJson: {
                id: 'task-template-1',
                templateKey: 'ui-build',
                displayName: 'UI Build',
                skillVersionIds: ['skill-version-1'],
                skills: [
                  {
                    id: 'skill-version-1',
                    skillId: 'skill-1',
                    skillKey: 'nb-opencode-ui-batch',
                    displayName: 'NB OpenCode UI Batch',
                    versionLabel: 'v1',
                    status: 'active',
                  },
                ],
              },
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('Run page 1')).toBeTruthy();
    expect(await screen.findByText('UI Build')).toBeTruthy();
    expect(await screen.findByText('NB OpenCode UI Batch / v1')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Filter$/ })).not.toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns),
          params: expect.objectContaining({
            page: 1,
            pageSize: 20,
          }),
        }),
      );
    });
    expect(await screen.findByText('Total 42 runs')).toBeTruthy();

    fireEvent.click(screen.getByText('Status'));
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns),
          params: expect.objectContaining({
            sort: 'status',
          }),
        }),
      );
    });

    fireEvent.click(screen.getByLabelText('View run details'));
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-page-1'),
        }),
      );
    });

    fireEvent.click(screen.getByTitle('2'));

    expect(await screen.findByText('Run page 2')).toBeTruthy();
    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns),
          params: expect.objectContaining({
            page: 2,
            pageSize: 20,
          }),
        }),
      );
    });
  });
});
