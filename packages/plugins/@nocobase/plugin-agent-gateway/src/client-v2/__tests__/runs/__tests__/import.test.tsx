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

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import { RequestConfig, apiUrl, renderAgentGatewayPage, setupRunsPageTestHooks } from '../testUtils';
import AgentGatewayRunsPage from '../../../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs import', () => {
  setupRunsPageTestHooks();

  it('imports an external run from pasted agent logs and opens the run details', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.importExternalRun)) {
        return {
          data: {
            data: {
              runId: 'run-id-imported',
              runCode: 'external-codex-import',
              run: {
                id: 'run-id-imported',
                runCode: 'external-codex-import',
                status: 'succeeded',
                taskTitle: 'Imported Codex log',
                provider: 'codex',
                agentGatewayActionPermissionsJson: {},
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-imported')) {
        return {
          data: {
            data: {
              id: 'run-id-imported',
              runCode: 'external-codex-import',
              status: 'succeeded',
              taskTitle: 'Imported Codex log',
              provider: 'codex',
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('Import external run'));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Imported Codex log' },
    });
    fireEvent.change(screen.getByLabelText('Prompt'), {
      target: { value: 'Import a build task that was started outside Agent Gateway' },
    });
    fireEvent.change(screen.getByLabelText('External run key'), {
      target: { value: 'codex-thread-imported' },
    });
    fireEvent.change(screen.getByLabelText('Raw log'), {
      target: {
        value: [
          JSON.stringify({ type: 'thread.started', thread_id: 'codex-thread-imported' }),
          JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'done' } }),
        ].join('\n'),
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.importExternalRun),
          method: 'post',
          data: expect.objectContaining({
            provider: 'codex',
            title: 'Imported Codex log',
            instruction: 'Import a build task that was started outside Agent Gateway',
            status: 'succeeded',
            externalRunKey: 'codex-thread-imported',
            logs: [
              expect.objectContaining({
                format: 'codex-jsonl',
                contentText: expect.stringContaining('codex-thread-imported'),
              }),
            ],
          }),
        }),
      );
    });
    expect(await screen.findAllByText('Imported Codex log')).not.toHaveLength(0);
  });
});
