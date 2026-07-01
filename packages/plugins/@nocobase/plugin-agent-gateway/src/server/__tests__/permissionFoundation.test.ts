/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

import { auditMutatingAgentAction, auditReadAgentAction, createAgentActionAudit } from '../audit/agentActionAudit';
import { AGENT_GATEWAY_ACTIONS, AGENT_GATEWAY_PERMISSION_DEFINITIONS, AGENT_GATEWAY_PERMISSIONS } from '../security';

function createAuditContext(options: { failCreate?: boolean } = {}) {
  const creates: unknown[] = [];
  const warnings: unknown[] = [];
  const ctx = {
    app: {
      logger: {
        warn(message: string, meta: Record<string, unknown>) {
          warnings.push({ message, meta });
        },
      },
    },
    db: {
      getRepository(name: string) {
        if (name !== 'agAgentActionAudits') {
          throw new Error(`Unexpected repository ${name}`);
        }
        return {
          async create(payload: unknown) {
            if (options.failCreate) {
              throw new Error('audit store unavailable');
            }
            creates.push(payload);
            return payload;
          },
        };
      },
    },
  } as unknown as Context;
  return {
    ctx,
    creates,
    warnings,
  };
}

describe('agent gateway permission foundation', () => {
  it('defines stable permission snippets and resource actions for session control phases', () => {
    expect(AGENT_GATEWAY_ACTIONS).toMatchObject({
      readRuns: 'readRuns',
      readRunDetails: 'readRunDetails',
      readSessionMessages: 'readSessionMessages',
      readTerminal: 'readTerminal',
      resumeAgentSession: 'resumeAgentSession',
      messageAgentSession: 'messageAgentSession',
      interruptRun: 'interruptRun',
      terminateRun: 'terminateRun',
      readArtifacts: 'readArtifacts',
      readRawLogs: 'readRawLogs',
      writeTerminalRaw: 'writeTerminalRaw',
    });
    expect(Object.values(AGENT_GATEWAY_PERMISSIONS)).toEqual(
      expect.arrayContaining([
        'agentGateway.readRuns',
        'agentGateway.readSessionMessages',
        'agentGateway.readTerminal',
        'agentGateway.resumeAgentSession',
        'agentGateway.messageAgentSession',
        'agentGateway.interruptRun',
        'agentGateway.terminateRun',
        'agentGateway.readArtifacts',
        'agentGateway.readRawLogs',
        'agentGateway.writeTerminalRaw',
      ]),
    );
  });

  it('keeps legacy read and cancel snippets compatible without granting raw terminal write', () => {
    const manage = AGENT_GATEWAY_PERMISSION_DEFINITIONS.find(
      (definition) => definition.name === AGENT_GATEWAY_PERMISSIONS.manage,
    );
    const readRuns = AGENT_GATEWAY_PERMISSION_DEFINITIONS.find(
      (definition) => definition.name === AGENT_GATEWAY_PERMISSIONS.readRuns,
    );
    const readRun = AGENT_GATEWAY_PERMISSION_DEFINITIONS.find(
      (definition) => definition.name === AGENT_GATEWAY_PERMISSIONS.readRun,
    );
    const readDetails = AGENT_GATEWAY_PERMISSION_DEFINITIONS.find(
      (definition) => definition.name === AGENT_GATEWAY_PERMISSIONS.readRunDetails,
    );
    const cancelRun = AGENT_GATEWAY_PERMISSION_DEFINITIONS.find(
      (definition) => definition.name === AGENT_GATEWAY_PERMISSIONS.cancelRun,
    );
    const rawWrite = AGENT_GATEWAY_PERMISSION_DEFINITIONS.find(
      (definition) => definition.name === AGENT_GATEWAY_PERMISSIONS.writeTerminalRaw,
    );

    expect(manage?.actions).toEqual(
      expect.arrayContaining(['agentGateway:readRuns', 'agentGateway:readArtifacts', 'agentGateway:readRawLogs']),
    );
    expect(readRuns?.actions).toEqual(expect.arrayContaining(['agentGateway:readRuns', 'agRuns:list']));
    expect(readRuns?.actions).not.toContain('agRuns:get');
    expect(readRun?.actions).toEqual(
      expect.arrayContaining(['agentGateway:readRun', 'agentGateway:readRuns', 'agRuns:list', 'agRuns:get']),
    );
    expect(readRun?.actions).not.toContain('agentGateway:readRawLogs');
    expect(readDetails?.actions).toEqual(
      expect.arrayContaining([
        'agentGateway:readRun',
        'agentGateway:readRuns',
        'agentGateway:readRunDetails',
        'agentGateway:readSessionMessages',
        'agRuns:list',
        'agRuns:get',
      ]),
    );
    expect(readDetails?.actions).not.toContain('agentGateway:readTerminal');
    expect(readDetails?.actions).not.toContain('agentGateway:readRawLogs');
    expect(cancelRun?.actions).toEqual(
      expect.arrayContaining(['agentGateway:interruptRun', 'agentGateway:terminateRun']),
    );
    expect(rawWrite?.actions).toEqual([]);
  });
});

describe('agent gateway action audit foundation', () => {
  it('writes audit records with the expected normalized shape', async () => {
    const { ctx, creates } = createAuditContext();

    await createAgentActionAudit(ctx, {
      action: 'readTerminal',
      runId: '11111111-1111-4111-8111-111111111111',
      sessionId: '22222222-2222-4222-8222-222222222222',
      permissionKey: AGENT_GATEWAY_PERMISSIONS.readTerminal,
      resultStatus: 'succeeded',
      provider: 'codex',
      metadataJson: {
        lines: 200,
      },
    });

    expect(creates).toHaveLength(1);
    expect(creates[0]).toMatchObject({
      values: {
        action: 'readTerminal',
        runId: '11111111-1111-4111-8111-111111111111',
        sessionId: '22222222-2222-4222-8222-222222222222',
        permissionKey: AGENT_GATEWAY_PERMISSIONS.readTerminal,
        resultStatus: 'succeeded',
        provider: 'codex',
        metadataJson: {
          lines: 200,
        },
      },
    });
  });

  it('fails closed when mutating action audit creation fails', async () => {
    const { ctx } = createAuditContext({ failCreate: true });

    await expect(
      auditMutatingAgentAction(ctx, {
        action: 'resume',
        permissionKey: AGENT_GATEWAY_PERMISSIONS.resumeAgentSession,
        resultStatus: 'accepted',
      }),
    ).rejects.toThrow('audit store unavailable');
  });

  it('keeps read action audit best-effort and logs without sensitive payloads', async () => {
    const { ctx, warnings } = createAuditContext({ failCreate: true });

    const result = await auditReadAgentAction(ctx, {
      action: 'readRawLogs',
      permissionKey: AGENT_GATEWAY_PERMISSIONS.readRawLogs,
      resultStatus: 'failed',
      redactedPreview: 'token=must-not-render',
    });

    expect(result).toBeNull();
    expect(warnings).toEqual([
      {
        message: 'Agent Gateway read audit write failed',
        meta: {
          action: 'readRawLogs',
          permissionKey: AGENT_GATEWAY_PERMISSIONS.readRawLogs,
          resultStatus: 'failed',
          errorName: 'Error',
        },
      },
    ]);
    expect(JSON.stringify(warnings)).not.toContain('must-not-render');
  });
});
