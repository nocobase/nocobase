/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TerminalFrame,
  encodeTerminalPayload,
} from '../../../shared/terminalStreamProtocol';

export const terminalStreamRunId = '11111111-1111-4111-8111-111111111111';
export const terminalStreamNodeId = '22222222-2222-4222-8222-222222222222';
export const terminalStreamSessionName = 'agw_11111111_1111_4111_8111_111111111111';

export const validTerminalStreamFrames: TerminalFrame[] = [
  {
    type: 'browser.subscribe',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'browser-subscribe-1',
    runId: terminalStreamRunId,
    lastOffset: 0,
  },
  {
    type: 'daemon.register',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'daemon-register-1',
    nodeId: terminalStreamNodeId,
    capabilities: {
      terminalStream: true,
    },
  },
  {
    type: 'daemon.bindRun',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'daemon-bind-1',
    runId: terminalStreamRunId,
    sessionName: terminalStreamSessionName,
    startOffset: 0,
    claimToken: 'ag_claim_test',
    claimAttempt: 1,
    leaseVersion: 1,
  },
  {
    type: 'daemon.snapshotRequest',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'snapshot-request-1',
    runId: terminalStreamRunId,
    fromOffset: 0,
  },
  {
    type: 'terminal.data',
    protocol: TERMINAL_PROTOCOL,
    runId: terminalStreamRunId,
    sessionName: terminalStreamSessionName,
    offsetStart: 0,
    offsetEnd: 6,
    payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
    payload: encodeTerminalPayload('hello\n'),
  },
  {
    type: 'terminal.snapshot',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'snapshot-request-1',
    runId: terminalStreamRunId,
    sessionName: terminalStreamSessionName,
    offsetStart: 0,
    offsetEnd: 6,
    payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
    payload: encodeTerminalPayload('hello\n'),
  },
  {
    type: 'terminal.end',
    protocol: TERMINAL_PROTOCOL,
    runId: terminalStreamRunId,
    sessionName: terminalStreamSessionName,
    offsetEnd: 6,
    reason: 'completed',
  },
  {
    type: 'ack',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'ack-1',
  },
  {
    type: 'error',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'snapshot-request-1',
    code: 'TERMINAL_OFFSET_GAP',
    message: 'Offset is outside daemon ring buffer',
  },
];

export const invalidTerminalStreamFrames = [
  {
    type: 'browser.subscribe',
    protocol: 'wrong-protocol',
    requestId: 'bad-protocol',
    runId: terminalStreamRunId,
  },
  {
    type: 'browser.subscribe',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'bad-offset',
    runId: terminalStreamRunId,
    lastOffset: -1,
  },
  {
    type: 'daemon.register',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'bad-capabilities',
    nodeId: terminalStreamNodeId,
    capabilities: {},
  },
  {
    type: 'daemon.bindRun',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'bad-claim',
    runId: terminalStreamRunId,
    sessionName: terminalStreamSessionName,
    startOffset: 0,
    claimAttempt: 1,
    leaseVersion: 1,
  },
  {
    type: 'daemon.snapshotRequest',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'bad-snapshot-request',
    runId: terminalStreamRunId,
    fromOffset: -1,
  },
  {
    type: 'terminal.data',
    protocol: TERMINAL_PROTOCOL,
    runId: terminalStreamRunId,
    sessionName: terminalStreamSessionName,
    offsetStart: 10,
    offsetEnd: 6,
    payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
    payload: encodeTerminalPayload('hello\n'),
  },
  {
    type: 'terminal.snapshot',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'bad-snapshot',
    runId: terminalStreamRunId,
    sessionName: terminalStreamSessionName,
    offsetStart: 0,
    offsetEnd: 6,
    payloadEncoding: 'plain',
    payload: encodeTerminalPayload('hello\n'),
  },
  {
    type: 'terminal.end',
    protocol: TERMINAL_PROTOCOL,
    runId: terminalStreamRunId,
    sessionName: terminalStreamSessionName,
    offsetEnd: 6,
    reason: 'unknown',
  },
  {
    type: 'ack',
    protocol: TERMINAL_PROTOCOL,
  },
  {
    type: 'error',
    protocol: TERMINAL_PROTOCOL,
    code: 'UNKNOWN',
    message: 'Unknown error',
  },
];
