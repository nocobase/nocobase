/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AGENT_GATEWAY_API_ACTIONS, createActionContract } from './common';

export const terminalContracts = {
  [AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket]: createActionContract(
    AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket,
    ['purpose'] as const,
  ),
  [AGENT_GATEWAY_API_ACTIONS.sendTerminalInput]: createActionContract(AGENT_GATEWAY_API_ACTIONS.sendTerminalInput, [
    'contentText',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.interruptTerminal]: createActionContract(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, [
    'reason',
    'idempotencyKey',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.terminateTerminal]: createActionContract(AGENT_GATEWAY_API_ACTIONS.terminateTerminal, [
    'reason',
    'idempotencyKey',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.updateRunTerminal]: createActionContract(AGENT_GATEWAY_API_ACTIONS.updateRunTerminal, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'terminalBackend',
    'terminalSessionName',
    'terminalStatus',
    'terminalExitCode',
    'terminalStartedAt',
    'terminalEndedAt',
    'terminalLastActivityAt',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.ackControlRequest]: createActionContract(AGENT_GATEWAY_API_ACTIONS.ackControlRequest, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'requestId',
    'status',
    'reason',
    'resultMessage',
  ] as const),
} as const;
