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
  TerminalData,
  TerminalError,
  TerminalSnapshot,
} from '../shared/terminalStreamProtocol';

export interface TerminalRingBufferOptions {
  runId: string;
  sessionName: string;
  maxBytes?: number;
  maxSnapshotBytes?: number;
}

interface TerminalRingBufferChunk {
  offsetStart: number;
  offsetEnd: number;
  buffer: Buffer;
}

export type TerminalRingBufferSnapshotResult =
  | {
      ok: true;
      frame: TerminalSnapshot;
    }
  | {
      ok: false;
      frame: TerminalError;
    };

export type TerminalRingBufferDataResult =
  | {
      ok: true;
      frame: TerminalData | null;
    }
  | {
      ok: false;
      frame: TerminalError;
    };

const DEFAULT_MAX_BYTES = 512 * 1024;
const DEFAULT_MAX_SNAPSHOT_BYTES = 128 * 1024;

function getUtf8CodePointByteLength(startByte: number) {
  if (startByte <= 0x7f) {
    return 1;
  }
  if (startByte >= 0xc2 && startByte <= 0xdf) {
    return 2;
  }
  if (startByte >= 0xe0 && startByte <= 0xef) {
    return 3;
  }
  if (startByte >= 0xf0 && startByte <= 0xf4) {
    return 4;
  }
  return 0;
}

function getUtf8SafePrefixLength(buffer: Buffer) {
  if (buffer.byteLength === 0) {
    return 0;
  }

  let trailingContinuationBytes = 0;
  for (let index = buffer.byteLength - 1; index >= 0; index -= 1) {
    if ((buffer[index] & 0xc0) !== 0x80) {
      break;
    }
    trailingContinuationBytes += 1;
    if (trailingContinuationBytes >= 3) {
      break;
    }
  }

  const startIndex = buffer.byteLength - trailingContinuationBytes - 1;
  if (startIndex < 0) {
    return buffer.byteLength - trailingContinuationBytes;
  }

  const expectedLength = getUtf8CodePointByteLength(buffer[startIndex]);
  if (expectedLength <= 1) {
    return expectedLength === 1 ? buffer.byteLength : startIndex;
  }

  const actualLength = trailingContinuationBytes + 1;
  return actualLength >= expectedLength ? buffer.byteLength : startIndex;
}

export class TerminalRingBuffer {
  private readonly maxBytes: number;
  private readonly maxSnapshotBytes: number;
  private readonly chunks: TerminalRingBufferChunk[] = [];
  private offsetStart = 0;
  private offsetEnd = 0;

  constructor(private readonly options: TerminalRingBufferOptions) {
    this.maxBytes = Math.max(1, options.maxBytes || DEFAULT_MAX_BYTES);
    this.maxSnapshotBytes = Math.max(
      1,
      Math.min(options.maxSnapshotBytes || DEFAULT_MAX_SNAPSHOT_BYTES, this.maxBytes),
    );
  }

  get retainedOffsetStart() {
    return this.offsetStart;
  }

  get currentOffset() {
    return this.offsetEnd;
  }

  get retainedBytes() {
    return this.offsetEnd - this.offsetStart;
  }

  appendText(text: string): TerminalData | null {
    if (!text) {
      return null;
    }

    const buffer = Buffer.from(text, 'utf8');
    if (!buffer.byteLength) {
      return null;
    }

    const offsetStart = this.offsetEnd;
    const offsetEnd = offsetStart + buffer.byteLength;
    this.offsetEnd = offsetEnd;
    this.appendRetainedChunk({
      offsetStart,
      offsetEnd,
      buffer,
    });

    return {
      type: 'terminal.data',
      protocol: TERMINAL_PROTOCOL,
      runId: this.options.runId,
      sessionName: this.options.sessionName,
      offsetStart,
      offsetEnd,
      payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
      payload: buffer.toString('base64'),
    };
  }

  createSnapshot(requestId: string | undefined, fromOffset: number): TerminalRingBufferSnapshotResult {
    if (!Number.isInteger(fromOffset) || fromOffset < this.offsetStart || fromOffset > this.offsetEnd) {
      return {
        ok: false,
        frame: this.createOffsetGapError(requestId, fromOffset),
      };
    }

    const snapshot = this.readRetainedBytes(fromOffset);
    if (snapshot.byteLength > this.maxSnapshotBytes) {
      return {
        ok: false,
        frame: this.createOffsetGapError(requestId, fromOffset, {
          maxSnapshotBytes: this.maxSnapshotBytes,
        }),
      };
    }

    return {
      ok: true,
      frame: {
        type: 'terminal.snapshot',
        protocol: TERMINAL_PROTOCOL,
        requestId,
        runId: this.options.runId,
        sessionName: this.options.sessionName,
        offsetStart: fromOffset,
        offsetEnd: this.offsetEnd,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: snapshot.toString('base64'),
      },
    };
  }

  createDataFrameFromOffset(fromOffset: number, maxBytes: number): TerminalRingBufferDataResult {
    if (!Number.isInteger(fromOffset) || fromOffset < this.offsetStart || fromOffset > this.offsetEnd) {
      return {
        ok: false,
        frame: this.createOffsetGapError(undefined, fromOffset),
      };
    }
    if (fromOffset === this.offsetEnd) {
      return {
        ok: true,
        frame: null,
      };
    }

    let buffer = this.readRetainedBytes(fromOffset, Math.max(4, maxBytes));
    if (fromOffset + buffer.byteLength < this.offsetEnd) {
      const safePrefixLength = getUtf8SafePrefixLength(buffer);
      if (safePrefixLength > 0 && safePrefixLength < buffer.byteLength) {
        buffer = buffer.subarray(0, safePrefixLength);
      }
    }
    return {
      ok: true,
      frame: {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId: this.options.runId,
        sessionName: this.options.sessionName,
        offsetStart: fromOffset,
        offsetEnd: fromOffset + buffer.byteLength,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: buffer.toString('base64'),
      },
    };
  }

  private readRetainedBytes(fromOffset: number, maxBytes = this.maxBytes) {
    const buffers: Buffer[] = [];
    let remainingBytes = Math.max(1, maxBytes);
    for (const chunk of this.chunks) {
      if (chunk.offsetEnd <= fromOffset || remainingBytes <= 0) {
        continue;
      }
      const relativeStart = Math.max(0, fromOffset - chunk.offsetStart);
      const retained = chunk.buffer.subarray(relativeStart, relativeStart + remainingBytes);
      buffers.push(retained);
      remainingBytes -= retained.byteLength;
    }
    return Buffer.concat(buffers);
  }

  private appendRetainedChunk(chunk: TerminalRingBufferChunk) {
    if (chunk.buffer.byteLength > this.maxBytes) {
      const retained = chunk.buffer.subarray(chunk.buffer.byteLength - this.maxBytes);
      this.chunks.push({
        offsetStart: chunk.offsetEnd - retained.byteLength,
        offsetEnd: chunk.offsetEnd,
        buffer: retained,
      });
    } else {
      this.chunks.push(chunk);
    }

    this.trimRetainedChunks();
  }

  private trimRetainedChunks() {
    const minOffset = Math.max(0, this.offsetEnd - this.maxBytes);
    while (this.chunks.length && this.chunks[0].offsetEnd <= minOffset) {
      this.chunks.shift();
    }
    if (this.chunks.length && this.chunks[0].offsetStart < minOffset) {
      const first = this.chunks[0];
      const trimBytes = minOffset - first.offsetStart;
      this.chunks[0] = {
        offsetStart: minOffset,
        offsetEnd: first.offsetEnd,
        buffer: first.buffer.subarray(trimBytes),
      };
    }
    this.offsetStart = this.chunks[0]?.offsetStart ?? this.offsetEnd;
  }

  private createOffsetGapError(
    requestId: string | undefined,
    fromOffset: number,
    extraDetails: Record<string, unknown> = {},
  ): TerminalError {
    return {
      type: 'error',
      protocol: TERMINAL_PROTOCOL,
      requestId,
      code: 'TERMINAL_OFFSET_GAP',
      message: 'Offset is outside daemon ring buffer',
      details: {
        requestedOffset: fromOffset,
        retainedOffsetStart: this.offsetStart,
        offsetEnd: this.offsetEnd,
        ...extraDetails,
      },
    };
  }
}
