/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  TERMINAL_PROTOCOL,
  createTerminalDataFrame,
  decodeTerminalPayload,
  parseTerminalFrame,
  parseTerminalFrameJson,
} from '../../shared/terminalStreamProtocol';
import { invalidTerminalStreamFrames, validTerminalStreamFrames } from './fixtures/terminalStreamFrames';

describe('terminal stream protocol contract', () => {
  it('accepts every frozen terminal stream frame shape', () => {
    for (const frame of validTerminalStreamFrames) {
      const result = parseTerminalFrame(frame);

      expect(result).toMatchObject({
        ok: true,
      });
    }
  });

  it('rejects invalid frame fields without changing the protocol error shape', () => {
    for (const frame of invalidTerminalStreamFrames) {
      const result = parseTerminalFrame(frame);

      expect(result).toMatchObject({
        ok: false,
        error: {
          type: 'error',
          protocol: TERMINAL_PROTOCOL,
          code: 'TERMINAL_PROTOCOL_ERROR',
        },
      });
    }
  });

  it('preserves the offset gap error code for daemon reconnect responses', () => {
    const result = parseTerminalFrame({
      type: 'error',
      protocol: TERMINAL_PROTOCOL,
      requestId: 'snapshot-request-1',
      code: 'TERMINAL_OFFSET_GAP',
      message: 'Offset is outside daemon ring buffer',
      details: {
        claimToken: 'ag_claim_should_not_forward',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      frame: {
        code: 'TERMINAL_OFFSET_GAP',
      },
    });
    expect(result.ok ? Object.prototype.hasOwnProperty.call(result.frame, 'details') : true).toBe(false);
  });

  it('accepts stream-ticket browser auth error codes', () => {
    for (const code of ['TERMINAL_STREAM_TICKET_EXPIRED', 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH'] as const) {
      expect(
        parseTerminalFrame({
          type: 'error',
          protocol: TERMINAL_PROTOCOL,
          requestId: 'browser-subscribe-ticket',
          code,
          message: code,
        }),
      ).toMatchObject({
        ok: true,
        frame: {
          code,
        },
      });
    }
  });

  it('rejects browser subscribe frames carrying auth material aliases', () => {
    for (const field of [
      'ticket',
      'ticketProof',
      'authProof',
      'browserAuth',
      'token',
      'authToken',
      'bearerToken',
      'authorization',
      'authenticator',
      'role',
      'xAuthenticator',
      'x-authenticator',
      'xRole',
      'x-role',
    ]) {
      const result = parseTerminalFrame({
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: `subscribe-${field}`,
        runId: 'run-id',
        [field]: 'secret',
      });

      expect(result).toMatchObject({
        ok: false,
        error: {
          code: 'TERMINAL_PROTOCOL_ERROR',
          message: 'browser.subscribe auth material must use websocket subprotocols',
        },
      });
    }
  });

  it('encodes payloads as base64 utf8 and advances byte offsets', () => {
    const frame = createTerminalDataFrame({
      runId: 'run-id',
      sessionName: 'session-name',
      offsetStart: 4,
      text: '中文\n',
    });

    expect(frame.offsetEnd).toBe(11);
    expect(decodeTerminalPayload(frame.payload)).toBe('中文\n');
  });

  it('accepts empty snapshots for exact current-offset reconnects', () => {
    const result = parseTerminalFrame({
      type: 'terminal.snapshot',
      protocol: TERMINAL_PROTOCOL,
      requestId: 'snapshot-empty',
      runId: 'run-id',
      sessionName: 'session-name',
      offsetStart: 42,
      offsetEnd: 42,
      payloadEncoding: 'base64-utf8',
      payload: '',
    });

    expect(result).toMatchObject({
      ok: true,
      frame: {
        type: 'terminal.snapshot',
        offsetStart: 42,
        offsetEnd: 42,
        payload: '',
      },
    });
  });

  it('normalizes parsed frames and strips unknown fields before forwarding', () => {
    const result = parseTerminalFrame({
      type: 'terminal.data',
      protocol: TERMINAL_PROTOCOL,
      runId: 'run-id',
      sessionName: 'session-name',
      offsetStart: 0,
      offsetEnd: 6,
      payloadEncoding: 'base64-utf8',
      payload: createTerminalDataFrame({
        runId: 'run-id',
        sessionName: 'session-name',
        offsetStart: 0,
        text: 'hello\n',
      }).payload,
      claimToken: 'ag_claim_should_not_forward',
    });

    expect(result).toMatchObject({
      ok: true,
      frame: {
        type: 'terminal.data',
        runId: 'run-id',
      },
    });
    expect(result.ok ? Object.prototype.hasOwnProperty.call(result.frame, 'claimToken') : true).toBe(false);
  });

  it('rejects non-json websocket payloads', () => {
    const result = parseTerminalFrameJson('{');

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'TERMINAL_PROTOCOL_ERROR',
      },
    });
  });
});
