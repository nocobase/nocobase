// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CommentMessageSchema } from '../../server/domains/comments/comment.message.js';

describe('generic comment message envelope', () => {
  it.each([
    'example.notice',
    'acme-app.event2.Finished',
    `a.${'b'.repeat(98)}`,
  ])('accepts application-defined names: %s', (type) => {
    expect(CommentMessageSchema.parse({ type, params: {} })).toEqual({
      type,
      params: {},
    });
  });
  it('preserves primitive values at the exact size boundaries and strips private envelope fields', () => {
    const params = {
      text: ' '.repeat(500),
      count: 0,
      negative: -1.25,
      enabled: false,
      empty: '',
      a: true,
      b: 1,
      c: 'C',
      d: false,
      e: 2,
    };
    expect(
      CommentMessageSchema.parse({
        type: 'example.notice',
        params,
        runId: 'private',
        origin: { private: true },
      }),
    ).toEqual({ type: 'example.notice', params });
  });
  it.each([
    '',
    'notice',
    'Example.notice',
    '1app.notice',
    'app.',
    '.notice',
    'app.bad-name',
    'app.1notice',
    'app..notice',
    ' app.notice',
    'app.notice ',
    'app.not!ce',
    `a.${'b'.repeat(99)}`,
  ])('rejects an invalid name: %s', (type) => {
    expect(CommentMessageSchema.safeParse({ type, params: {} }).success).toBe(
      false,
    );
  });
  it.each([
    null,
    [],
    undefined,
    'text',
    { nested: { a: 'value' } },
    { list: ['value'] },
    { value: null },
    { value: undefined },
    { value: new String('value') },
    { value: new Date() },
    { value: NaN },
    { value: Infinity },
    { value: -Infinity },
    { value: 'x'.repeat(501) },
    Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`p${i}`, i])),
  ])('rejects invalid parameters without coercing them: %j', (params) => {
    expect(
      CommentMessageSchema.safeParse({ type: 'example.notice', params })
        .success,
    ).toBe(false);
  });
});
