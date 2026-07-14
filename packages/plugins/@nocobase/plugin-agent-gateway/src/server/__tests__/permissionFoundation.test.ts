/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AGENT_GATEWAY_ACTIONS, AGENT_GATEWAY_PERMISSION_DEFINITIONS, AGENT_GATEWAY_PERMISSIONS } from '../security';
import {
  AGENT_GATEWAY_API_ACTIONS,
  AGENT_GATEWAY_MACHINE_API_ACTIONS,
  getAgentGatewayApiActionName,
} from '../../shared/apiContract';

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

  it('keeps granular read and cancel snippets isolated from raw terminal write', () => {
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
        'agRuns:list',
        'agRuns:get',
      ]),
    );
    expect(readDetails?.actions).not.toContain('agentGateway:readSessionMessages');
    expect(readDetails?.actions).not.toContain('agentGateway:readTerminal');
    expect(readDetails?.actions).not.toContain('agentGateway:readRawLogs');
    expect(manage?.actions).toEqual(
      expect.arrayContaining(['agentGateway:cancelRun', 'agentGateway:interruptRun', 'agentGateway:terminateRun']),
    );
    expect(cancelRun?.actions).toEqual([
      'agentGateway:cancelRun',
      'agRuns:get',
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.cancelRun),
    ]);
    expect(cancelRun?.actions).not.toContain('agentGateway:interruptRun');
    expect(cancelRun?.actions).not.toContain('agentGateway:terminateRun');
    expect(rawWrite?.actions).toEqual([getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.sendTerminalInput)]);
  });

  it('assigns every API action to machine authentication or an ACL snippet', () => {
    const machineActions = new Set(AGENT_GATEWAY_MACHINE_API_ACTIONS);
    const aclActions = new Set(AGENT_GATEWAY_PERMISSION_DEFINITIONS.flatMap((definition) => definition.actions));
    const unassignedActions = Object.values(AGENT_GATEWAY_API_ACTIONS).filter(
      (action) =>
        !machineActions.has(action as (typeof AGENT_GATEWAY_MACHINE_API_ACTIONS)[number]) &&
        !aclActions.has(getAgentGatewayApiActionName(action)),
    );

    expect(unassignedActions).toEqual([]);
  });
});
