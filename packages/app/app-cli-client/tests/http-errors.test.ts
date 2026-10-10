import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorJsonOf } from '../src/lib/envelope.ts';
import { ApiClient } from '../src/lib/http.ts';

describe('API field validation errors', () => {
  it('preserves field violations in JSON details and plain-text suggestions', async () => {
    const fieldViolations = [
      { field: 'name', description: 'Must not be empty', reason: 'required' },
      { field: 'expiresAt', description: 'Must be in the future' },
    ];
    const fetch = (async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 400,
            status: 'BAD_REQUEST',
            reason: 'INVALID_FIELDS',
            domain: 'api',
            message: 'The request contains invalid fields.',
            fieldViolations,
          },
        }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      )) as typeof globalThis.fetch;
    const client = new ApiClient({
      server: 'https://acme.example.com',
      headers: {},
      fetch,
    });
    const failure = await client
      .get('/', z.object({}))
      .catch((error: unknown) => error);

    expect(errorJsonOf(failure)).toMatchObject({
      code: 'INVALID_FIELDS',
      details: { httpStatus: 400, status: 'BAD_REQUEST', fieldViolations },
      suggestions: [
        { message: 'name: Must not be empty' },
        { message: 'expiresAt: Must be in the future' },
      ],
    });
  });
});
