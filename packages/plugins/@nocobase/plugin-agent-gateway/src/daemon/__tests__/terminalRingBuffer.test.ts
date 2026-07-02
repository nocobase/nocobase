/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { decodeTerminalPayload } from '../../shared/terminalStreamProtocol';
import { TerminalRingBuffer } from '../terminalRingBuffer';

describe('terminal ring buffer', () => {
  it('assigns byte offsets and snapshots retained output', () => {
    const buffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
      maxBytes: 1024,
    });

    const first = buffer.appendText('hello\n');
    const second = buffer.appendText('世界\n');

    expect(first).toMatchObject({
      offsetStart: 0,
      offsetEnd: 6,
    });
    expect(second).toMatchObject({
      offsetStart: 6,
      offsetEnd: 13,
    });
    expect(buffer.currentOffset).toBe(13);

    const snapshot = buffer.createSnapshot('snapshot-1', 6);
    expect(snapshot.ok).toBe(true);
    if (snapshot.ok) {
      expect(snapshot.frame).toMatchObject({
        requestId: 'snapshot-1',
        offsetStart: 6,
        offsetEnd: 13,
      });
      expect(decodeTerminalPayload(snapshot.frame.payload)).toBe('世界\n');
    }
  });

  it('returns an empty snapshot when the requested offset is exactly current', () => {
    const buffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
      maxBytes: 1024,
    });

    const empty = buffer.createSnapshot('snapshot-empty', 0);
    expect(empty.ok).toBe(true);
    if (empty.ok) {
      expect(empty.frame).toMatchObject({
        offsetStart: 0,
        offsetEnd: 0,
        payload: '',
      });
    }

    buffer.appendText('hello\n');
    const current = buffer.createSnapshot('snapshot-current', 6);
    expect(current.ok).toBe(true);
    if (current.ok) {
      expect(current.frame).toMatchObject({
        offsetStart: 6,
        offsetEnd: 6,
        payload: '',
      });
    }
  });

  it('creates bounded data frames from retained offsets for reconnect replay', () => {
    const buffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
      maxBytes: 1024,
    });

    buffer.appendText('abc\n');
    buffer.appendText('def\n');

    const firstReplay = buffer.createDataFrameFromOffset(0, 5);
    expect(firstReplay.ok).toBe(true);
    if (firstReplay.ok) {
      expect(firstReplay.frame).toMatchObject({
        offsetStart: 0,
        offsetEnd: 5,
      });
      expect(decodeTerminalPayload(firstReplay.frame?.payload || '')).toBe('abc\nd');
    }

    const secondReplay = buffer.createDataFrameFromOffset(5, 5);
    expect(secondReplay.ok).toBe(true);
    if (secondReplay.ok) {
      expect(secondReplay.frame).toMatchObject({
        offsetStart: 5,
        offsetEnd: 8,
      });
      expect(decodeTerminalPayload(secondReplay.frame?.payload || '')).toBe('ef\n');
    }
  });

  it('returns deterministic offset gap metadata when requested data is no longer retained', () => {
    const buffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
      maxBytes: 5,
    });

    buffer.appendText('abc\n');
    buffer.appendText('def\n');

    expect(buffer.retainedOffsetStart).toBe(3);
    const snapshot = buffer.createSnapshot('snapshot-gap', 0);
    expect(snapshot.ok).toBe(false);
    if (!snapshot.ok) {
      expect(snapshot.frame).toMatchObject({
        code: 'TERMINAL_OFFSET_GAP',
        requestId: 'snapshot-gap',
        details: {
          requestedOffset: 0,
          retainedOffsetStart: 3,
          offsetEnd: 8,
        },
      });
    }
  });

  it('returns offset gap when a snapshot would exceed the single-frame budget', () => {
    const buffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
      maxBytes: 1024,
      maxSnapshotBytes: 8,
    });

    buffer.appendText('0123456789');

    const snapshot = buffer.createSnapshot('snapshot-too-large', 0);
    expect(snapshot.ok).toBe(false);
    if (!snapshot.ok) {
      expect(snapshot.frame).toMatchObject({
        code: 'TERMINAL_OFFSET_GAP',
        requestId: 'snapshot-too-large',
        details: {
          requestedOffset: 0,
          retainedOffsetStart: 0,
          offsetEnd: 10,
          maxSnapshotBytes: 8,
        },
      });
    }
  });

  it('retains the tail of a single oversized chunk', () => {
    const buffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
      maxBytes: 4,
    });

    buffer.appendText('0123456789');

    expect(buffer.retainedOffsetStart).toBe(6);
    expect(buffer.currentOffset).toBe(10);
    const snapshot = buffer.createSnapshot('snapshot-tail', 6);
    expect(snapshot.ok).toBe(true);
    if (snapshot.ok) {
      expect(decodeTerminalPayload(snapshot.frame.payload)).toBe('6789');
    }
  });

  it('does not split multibyte UTF-8 characters across reconnect replay frames', () => {
    const buffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
      maxBytes: 128 * 1024,
    });
    const prefix = 'a'.repeat(64 * 1024 - 1);
    const prefixBytes = Buffer.byteLength(prefix);
    buffer.appendText(`${prefix}世界\n`);

    const firstReplay = buffer.createDataFrameFromOffset(0, 64 * 1024);
    expect(firstReplay.ok).toBe(true);
    if (firstReplay.ok) {
      expect(firstReplay.frame).toMatchObject({
        offsetStart: 0,
        offsetEnd: prefixBytes,
      });
      expect(decodeTerminalPayload(firstReplay.frame?.payload || '')).toBe(prefix);
    }

    const secondReplay = buffer.createDataFrameFromOffset(prefixBytes, 64 * 1024);
    expect(secondReplay.ok).toBe(true);
    if (secondReplay.ok) {
      expect(decodeTerminalPayload(secondReplay.frame?.payload || '')).toBe('世界\n');
    }
  });
});
