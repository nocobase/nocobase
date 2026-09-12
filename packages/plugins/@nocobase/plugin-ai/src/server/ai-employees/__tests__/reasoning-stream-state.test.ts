/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { isReasoningFinishChunk, ReasoningStreamState } from '../reasoning-stream-state';

const mainConversation = { sessionId: 'main', from: 'main-agent', username: 'main' };
const subConversation = { sessionId: 'sub', from: 'sub-agent', username: 'sub' };

describe('ReasoningStreamState', () => {
  it('keeps reasoning phases isolated by conversation and stops each phase once', () => {
    const state = new ReasoningStreamState();
    state.start(mainConversation);
    state.start(subConversation);

    expect(state.stop(mainConversation)).toBe(true);
    expect(state.stop(mainConversation)).toBe(false);
    expect(state.drain()).toEqual([subConversation]);
    expect(state.drain()).toEqual([]);
  });

  it('allows a new phase after a tool loop completes', () => {
    const state = new ReasoningStreamState();
    state.start(mainConversation);
    expect(state.stop(mainConversation)).toBe(true);
    state.start(mainConversation);
    expect(state.stop(mainConversation)).toBe(true);
  });
});

describe('isReasoningFinishChunk', () => {
  it.each([
    [{ response_metadata: { finish_reason: 'stop' } }, true],
    [{ response_metadata: { finishReason: 'tool_calls' } }, true],
    [{ response_metadata: { status: 'completed' } }, true],
    [{ response_metadata: { status: 'incomplete' } }, true],
    [{ response_metadata: { status: 'failed' } }, true],
    [{ response_metadata: { status: 'in_progress' } }, false],
    [{ response_metadata: {} }, false],
  ])('detects model finish metadata for %j', (chunk, expected) => {
    expect(isReasoningFinishChunk(chunk)).toBe(expected);
  });
});
