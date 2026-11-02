import { describe, expect, it } from 'vitest';
import { MESSAGE_CONTENT_MAX } from '../shared/conversations.js';
import {
  resendMessage,
  resendOptions,
} from '../server/online/agent/messages/resend.js';
import type { NativeMessage } from '../server/online/agent/types.js';

describe('resend input preservation', () => {
  const original: NativeMessage = {
    id: 'user',
    role: 'user',
    metadata: {
      conversationId: 'conversation',
      revision: 1,
      seq: 3,
      createdAt: '2026-10-01T00:00:00Z',
      inputFiles: [1],
      clientId: 'original-client',
      context: { ui: { route: '/original', items: [] } },
    },
    parts: [
      { type: 'text', text: 'first' },
      { type: 'file', mediaType: 'text/plain', url: 'gs://private/file' },
      { type: 'text', text: 'second' },
      { type: 'file', mediaType: 'text/plain', url: '/api/attachment' },
    ],
  };
  it('replaces multiple text parts on a detached original and remaps private file indices', () => {
    const before = structuredClone(original);
    const changed = resendMessage(original, { input: { text: 'edited' } });
    expect(changed.parts).toEqual([
      { type: 'text', text: 'edited' },
      original.parts[1],
      original.parts[3],
    ]);
    expect(changed.metadata).toEqual(original.metadata);
    expect(original).toEqual(before);
    const leadingFiles: NativeMessage = {
      ...original,
      parts: [
        original.parts[1],
        original.parts[0],
        original.parts[2],
        original.parts[3],
      ],
      metadata: { ...original.metadata!, inputFiles: [0] },
    };
    expect(
      resendMessage(leadingFiles, { input: { text: 'edited' } }),
    ).toMatchObject({
      parts: [
        original.parts[1],
        { type: 'text', text: 'edited' },
        original.parts[3],
      ],
      metadata: { inputFiles: [0] },
    });
    const severalTexts: NativeMessage = {
      ...original,
      parts: [
        original.parts[0],
        original.parts[2],
        original.parts[1],
        original.parts[3],
      ],
      metadata: { ...original.metadata!, inputFiles: [2] },
    };
    expect(
      resendMessage(severalTexts, { input: { text: 'edited' } }).metadata
        ?.inputFiles,
    ).toEqual([1]);
  });
  it('keeps an original resend unchanged and supports file-only or whitespace-plus-file edits', () => {
    expect(resendMessage(original, {})).toEqual(original);
    const files: NativeMessage = {
      ...original,
      parts: [original.parts[1]],
      metadata: { ...original.metadata!, inputFiles: [0] },
    };
    expect(resendMessage(files, { input: { text: ' ' } })).toMatchObject({
      parts: [{ type: 'text', text: ' ' }, original.parts[1]],
      metadata: { inputFiles: [1] },
    });
    expect(resendMessage(files, {}).parts).toEqual(files.parts);
    expect(() =>
      resendMessage({ ...original, parts: [] }, { input: { text: ' ' } }),
    ).toThrow('valid user input');
  });
  it('counts Unicode code points and snapshots options instead of retaining caller-owned objects', () => {
    const options = { input: { text: '😀'.repeat(MESSAGE_CONTENT_MAX) } };
    expect(
      resendMessage(original, resendOptions(options)).parts[0],
    ).toMatchObject({ text: options.input.text });
    const snapshot = resendOptions(options);
    options.input.text = 'mutated';
    expect(snapshot.input?.text).not.toBe('mutated');
    expect(() =>
      resendOptions({ input: { text: '😀'.repeat(MESSAGE_CONTENT_MAX + 1) } }),
    ).toThrow('valid user message');
  });
});
