import { describe, expect, it } from 'vitest';

import { fillRequest, type RequestParameter } from '../src/request.ts';

const p = (field: string, at: RequestParameter['in']): RequestParameter => ({
  field,
  in: at,
});

describe('fillRequest', () => {
  it('fills the path, repeats arrays in the query, and lays fields over the base body', () => {
    expect(
      fillRequest(
        { method: 'POST', path: '/api/issues/{issueId}/comments' },
        [
          [p('issueId', 'path'), 'PM 1'],
          [p('label', 'query'), ['a', 'b']],
          [p('content', 'body'), 'Hi'],
          [p('skipped', 'body'), undefined],
          [p('attach', 'file'), ['x']],
        ],
        { content: 'from file', draft: true },
      ),
    ).toEqual({
      method: 'POST',
      path: '/api/issues/PM%201/comments?label=a&label=b',
      fields: { content: 'Hi', draft: true },
    });
  });
});
