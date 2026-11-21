import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorJsonOf } from '../src/lib/envelope.ts';
import { asCliError } from '../src/lib/command.ts';
import { ApiClient, AppApiError } from '../src/lib/http.ts';

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
    expect(asCliError(failure).message).toBe(
      'INVALID_FIELDS: The request contains invalid fields.\nname: Must not be empty\nexpiresAt: Must be in the future',
    );
  });

  it.each([
    undefined,
    { suggestions: [] },
    { suggestions: 'invalid' },
    {
      suggestions: [
        {
          message: 'Check the field requirements',
          run: { command: 'acme', args: ['project', 'create', '--help'] },
        },
      ],
    },
  ])(
    'keeps field errors alongside API recovery suggestions (%j)',
    (metadata) => {
      const fieldViolations = [
        { field: 'project.name', description: 'Must not be empty' },
        { field: 'members[0].email', description: 'Must be a valid email' },
      ];
      const error = new AppApiError(
        400,
        'INVALID_FIELDS',
        'The request contains invalid fields.',
        metadata,
        'INVALID_ARGUMENT',
        fieldViolations,
      );
      const suggestions =
        metadata && Array.isArray(metadata.suggestions)
          ? metadata.suggestions
          : [];

      expect(errorJsonOf(error)).toMatchObject({
        code: 'INVALID_FIELDS',
        message: error.message,
        details: {
          httpStatus: 400,
          status: 'INVALID_ARGUMENT',
          fieldViolations,
        },
        suggestions: [
          ...suggestions,
          ...fieldViolations.map(({ field, description }) => ({
            message: `${field}: ${description}`,
          })),
        ],
      });
      expect(asCliError(error)).toMatchObject({
        message: [
          'INVALID_FIELDS: The request contains invalid fields.',
          'project.name: Must not be empty',
          'members[0].email: Must be a valid email',
          ...suggestions.map(
            ({ message, run }) =>
              `${message} (${[run.command, ...run.args].join(' ')})`,
          ),
        ].join('\n'),
        oclif: { exit: 5 },
      });
      expect(error.exitCode).toBe(5);
    },
  );
});
