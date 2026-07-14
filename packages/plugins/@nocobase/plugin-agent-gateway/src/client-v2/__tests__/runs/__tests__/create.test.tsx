/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import {
  RequestConfig,
  apiUrl,
  getTaskTemplateSelectInput,
  renderAgentGatewayPage,
  setupRunsPageTestHooks,
} from '../testUtils';
import AgentGatewayRunsPage from '../../../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs create', () => {
  setupRunsPageTestHooks();

  it('does not allow creating a task run when all runners are offline', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunOptions)) {
        return {
          data: {
            data: {
              defaultProfileKey: 'codex',
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-id-offline',
                  nodeKey: 'local-codex',
                  displayName: 'Local Codex',
                  status: 'active',
                  online: false,
                  profiles: [
                    {
                      id: 'profile-id-offline',
                      nodeId: 'node-id-offline',
                      profileKey: 'codex',
                      displayName: 'Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
              ],
              skillVersions: [],
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('New task run'));

    expect(await screen.findByText('No online runner is available. Start or reconnect the daemon.')).toBeTruthy();
    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toBeDisabled();
    fireEvent.click(createButton);
    expect(request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun),
      }),
    );
  });

  it('creates a task run from the runs page and opens the run details', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunOptions)) {
        return {
          data: {
            data: {
              defaultProfileKey: 'codex',
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-id-offline',
                  nodeKey: 'old-codex',
                  displayName: 'Old Codex',
                  status: 'active',
                  online: false,
                  profiles: [
                    {
                      id: 'profile-id-offline',
                      nodeId: 'node-id-offline',
                      profileKey: 'codex',
                      displayName: 'Old Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
                {
                  id: 'node-id-1',
                  nodeKey: 'local-codex',
                  displayName: 'Local Codex',
                  status: 'active',
                  online: true,
                  profiles: [
                    {
                      id: 'profile-id-1',
                      nodeId: 'node-id-1',
                      profileKey: 'codex',
                      displayName: 'Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
              ],
              skillVersions: [
                {
                  id: 'skill-version-id-1',
                  skillKey: 'nb-opencode-ui-batch',
                  displayName: 'NB OpenCode UI Batch',
                  versionLabel: 'v1',
                  status: 'active',
                },
              ],
              taskTemplates: [
                {
                  id: 'task-template-opencode',
                  templateKey: 'opencode-ui-batch',
                  displayName: 'OpenCode UI batch harness',
                  defaultTitle: 'Batch evaluation',
                  defaultPrompt: '运行 nb-opencode-ui-batch harness 并汇总结果',
                  cwd: '.',
                  skillVersionIds: ['skill-version-id-1'],
                  artifactRoot: '../..',
                  artifacts: [
                    {
                      glob: 'runs/nb-opencode-ui-batch/*/report.html',
                      groupLabel: 'Reports',
                    },
                  ],
                },
              ],
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun)) {
        return {
          data: {
            data: {
              runId: 'run-id-created',
              runCode: 'run-ui-build-created',
              run: {
                id: 'run-id-created',
                runCode: 'run-ui-build-created',
                status: 'queued',
                resultSummaryJson: {
                  title: 'Batch evaluation',
                },
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-created')) {
        return {
          data: {
            data: {
              id: 'run-id-created',
              runCode: 'run-ui-build-created',
              status: 'queued',
              resultSummaryJson: {
                title: 'Batch evaluation',
              },
              requestedAt: '2026-07-04T10:00:00.000Z',
              nodeId: 'node-id-1',
              agentProfileId: 'profile-id-1',
              runnerStatusJson: {
                online: false,
                reason: 'heartbeat-stale',
                nodeKey: 'local-codex',
                profileKey: 'codex',
                lastHeartbeatAt: '2026-07-04T09:55:00.000Z',
              },
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('New task run'));
    expect(screen.getAllByLabelText('Title')).toHaveLength(1);
    fireEvent.mouseDown(getTaskTemplateSelectInput());
    fireEvent.click(await screen.findByText('OpenCode UI batch harness'));
    expect(screen.getByLabelText('Title')).toHaveValue('Batch evaluation');
    expect(screen.getByLabelText('Prompt')).toHaveValue('运行 nb-opencode-ui-batch harness 并汇总结果');
    expect(await screen.findByText('NB OpenCode UI Batch / v1')).toBeTruthy();
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun),
          method: 'post',
          data: expect.objectContaining({
            taskTemplateId: 'task-template-opencode',
            title: 'Batch evaluation',
            prompt: '运行 nb-opencode-ui-batch harness 并汇总结果',
            skillVersionIds: ['skill-version-id-1'],
            cwd: '.',
            artifactRoot: '../..',
            artifacts: [
              {
                glob: 'runs/nb-opencode-ui-batch/*/report.html',
                groupLabel: 'Reports',
              },
            ],
            nodeId: 'node-id-1',
            agentProfileId: 'profile-id-1',
          }),
        }),
      );
    });
    expect(await screen.findAllByText('Batch evaluation')).not.toHaveLength(0);
    expect(await screen.findByText('Queued: waiting for runner')).toBeTruthy();
    expect(await screen.findByText(/Runner heartbeat is stale; start or reconnect the daemon/)).toBeTruthy();
  });

  it('uploads a skill while creating a task run and submits the selected skill version ids', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunOptions)) {
        return {
          data: {
            data: {
              defaultProfileKey: 'codex',
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-id-1',
                  nodeKey: 'local-codex',
                  displayName: 'Local Codex',
                  status: 'active',
                  online: true,
                  profiles: [
                    {
                      id: 'profile-id-1',
                      nodeId: 'node-id-1',
                      profileKey: 'codex',
                      displayName: 'Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
              ],
              skillVersions: [],
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.initFileUpload)) {
        return {
          data: {
            data: {
              id: 'upload-custom-skill',
              chunkSize: 1024 * 1024,
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.appendFileUpload, 'upload-custom-skill')) {
        return {
          data: {
            data: {
              uploadId: 'upload-custom-skill',
              receivedBytes: 14,
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.completeFileUpload, 'upload-custom-skill')) {
        return {
          data: {
            data: {
              id: 'upload-custom-skill',
              status: 'completed',
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload)) {
        return {
          data: {
            data: {
              skillVersionId: 'uploaded-skill-version-id',
              skillKey: 'custom-skill',
              versionLabel: 'local',
              status: 'active',
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun)) {
        return {
          data: {
            data: {
              runId: 'run-id-created',
              runCode: 'run-created',
              run: {
                id: 'run-id-created',
                runCode: 'run-created',
                status: 'queued',
                taskTitle: 'Uploaded skill task',
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-created')) {
        return {
          data: {
            data: {
              id: 'run-id-created',
              runCode: 'run-created',
              status: 'queued',
              taskTitle: 'Uploaded skill task',
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return { data: { data: [] } };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('New task run'));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Uploaded skill task' },
    });
    fireEvent.change(screen.getByLabelText('Prompt'), {
      target: { value: 'Run with uploaded skill' },
    });
    fireEvent.click(await screen.findByText('Upload skill'));

    fireEvent.change(screen.getByLabelText('Skill key'), {
      target: { value: 'custom-skill' },
    });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    await act(async () => {
      fireEvent.change(fileInput as HTMLInputElement, {
        target: {
          files: [new File(['fake zip bytes'], 'custom-skill.zip', { type: 'application/zip' })],
        },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.initFileUpload),
          method: 'post',
          data: expect.objectContaining({
            purpose: 'skill-version',
            fileName: 'custom-skill.zip',
            sizeBytes: 14,
          }),
        }),
      );
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.appendFileUpload, 'upload-custom-skill'),
          method: 'post',
          data: expect.objectContaining({
            offset: 0,
            contentBase64: expect.any(String),
          }),
        }),
      );
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload),
          method: 'post',
          data: expect.objectContaining({
            uploadId: 'upload-custom-skill',
            skillKey: 'custom-skill',
            versionLabel: 'local',
          }),
        }),
      );
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun),
          method: 'post',
          data: expect.objectContaining({
            title: 'Uploaded skill task',
            prompt: 'Run with uploaded skill',
            skillVersionIds: ['uploaded-skill-version-id'],
          }),
        }),
      );
    });
  });

  it('creates a task run from a template without a skill version requirement', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunOptions)) {
        return {
          data: {
            data: {
              defaultProfileKey: 'codex',
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-id-1',
                  nodeKey: 'local-codex',
                  displayName: 'Local Codex',
                  status: 'active',
                  online: true,
                  profiles: [
                    {
                      id: 'profile-id-1',
                      nodeId: 'node-id-1',
                      profileKey: 'codex',
                      displayName: 'Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
              ],
              skillVersions: [],
              taskTemplates: [
                {
                  id: 'task-template-opencode',
                  templateKey: 'opencode-ui-batch',
                  displayName: 'OpenCode UI batch harness',
                  defaultPrompt: '',
                  cwd: '.',
                  skillVersionIds: [],
                  artifacts: [],
                },
              ],
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun)) {
        return {
          data: {
            data: {
              runId: 'run-id-no-skill-template',
              runCode: 'run-no-skill-template',
              run: {
                id: 'run-id-no-skill-template',
                runCode: 'run-no-skill-template',
                status: 'queued',
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-no-skill-template')) {
        return {
          data: {
            data: {
              id: 'run-id-no-skill-template',
              runCode: 'run-no-skill-template',
              status: 'queued',
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('New task run'));
    fireEvent.mouseDown(getTaskTemplateSelectInput());
    fireEvent.click(await screen.findByText('OpenCode UI batch harness'));
    fireEvent.change(screen.getByLabelText('Prompt'), {
      target: { value: '运行 nb-opencode-ui-batch harness 并汇总结果' },
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun),
          method: 'post',
          data: expect.objectContaining({
            taskTemplateId: 'task-template-opencode',
            prompt: '运行 nb-opencode-ui-batch harness 并汇总结果',
            cwd: '.',
            nodeId: 'node-id-1',
            agentProfileId: 'profile-id-1',
          }),
        }),
      );
    });
  });
});
