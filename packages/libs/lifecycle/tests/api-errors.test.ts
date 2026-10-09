// How a lifecycle refusal becomes the standard error body a plugin's routes answer.
import { describe, expect, it } from 'vitest';

import { LifecycleError, lifecycleErrorFields } from '../src/index.js';

describe('lifecycleErrorFields', () => {
  it('maps every refusal a caller can act on to a standard status', () => {
    const statuses = Object.fromEntries(
      (
        [
          'UNKNOWN_LIFECYCLE',
          'RECORD_NOT_FOUND',
          'UNKNOWN_TRANSITION',
          'INVALID_INPUT',
          'REQUEST_REUSED',
          'INVALID_REQUEST_ID',
          'GUARD_REJECTED',
          'NOT_MANUAL',
          'INVALID_STATE',
          'UNKNOWN_EFFECT',
          'RUN_SETTLED',
          'CONFLICT',
        ] as const
      ).map((code) => [
        code,
        lifecycleErrorFields(new LifecycleError(code, 'No.'))?.status,
      ]),
    );
    expect(statuses).toEqual({
      UNKNOWN_LIFECYCLE: 'NOT_FOUND',
      RECORD_NOT_FOUND: 'NOT_FOUND',
      UNKNOWN_TRANSITION: 'INVALID_ARGUMENT',
      INVALID_INPUT: 'INVALID_ARGUMENT',
      REQUEST_REUSED: 'INVALID_ARGUMENT',
      INVALID_REQUEST_ID: 'INVALID_ARGUMENT',
      GUARD_REJECTED: 'PERMISSION_DENIED',
      NOT_MANUAL: 'PERMISSION_DENIED',
      INVALID_STATE: 'FAILED_PRECONDITION',
      UNKNOWN_EFFECT: 'FAILED_PRECONDITION',
      RUN_SETTLED: 'FAILED_PRECONDITION',
      CONFLICT: 'ABORTED',
    });
  });

  it('leaves the server’s own faults to the application’s 500', () => {
    for (const code of [
      'INVALID_DEFINITION',
      'INVALID_ROUTE',
      'INVALID_SET',
    ] as const)
      expect(lifecycleErrorFields(new LifecycleError(code, 'Bug.'))).toBe(
        undefined,
      );
  });

  it('carries the blockers, and names each input problem where it sits in the body', () => {
    const refused = new LifecycleError('GUARD_REJECTED', 'Not yours.', {
      blockers: [
        {
          source: 'guard',
          kind: 'permission',
          code: 'notYourLine',
          message: 'Not yours.',
        },
      ],
    });
    expect(lifecycleErrorFields(refused)).toEqual({
      status: 'PERMISSION_DENIED',
      reason: 'GUARD_REJECTED',
      message: 'Not yours.',
      metadata: { blockers: refused.blockers, problems: [] },
    });
    const invalid = new LifecycleError(
      'INVALID_INPUT',
      'Pick a line; Say why.',
      {
        problems: [
          { field: 'line', message: 'Pick a line.' },
          { message: 'Say why.' },
        ],
      },
    );
    expect(
      lifecycleErrorFields(invalid, { inputField: 'input' }),
    ).toMatchObject({
      status: 'INVALID_ARGUMENT',
      fieldViolations: [
        { field: 'input.line', description: 'Pick a line.' },
        { field: 'input', description: 'Say why.' },
      ],
      metadata: { problems: invalid.problems },
    });
    // A creation's values are the body itself; a problem with no field names none.
    expect(lifecycleErrorFields(invalid)?.fieldViolations).toEqual([
      { field: 'line', description: 'Pick a line.' },
    ]);
  });

  it('names the body field a request id or a transition refusal is about', () => {
    expect(
      lifecycleErrorFields(new LifecycleError('REQUEST_REUSED', 'Spent.'))
        ?.fieldViolations,
    ).toEqual([{ field: 'requestId', description: 'Spent.' }]);
    expect(
      lifecycleErrorFields(new LifecycleError('INVALID_REQUEST_ID', 'Ours.'))
        ?.fieldViolations,
    ).toEqual([{ field: 'requestId', description: 'Ours.' }]);
    expect(
      lifecycleErrorFields(new LifecycleError('UNKNOWN_TRANSITION', 'None.'))
        ?.fieldViolations,
    ).toEqual([{ field: 'transition', description: 'None.' }]);
  });

  it('answers a guard refusal whose every blocker is a precondition as a failed precondition', () => {
    const refusal = (...kinds: ('permission' | 'precondition')[]) =>
      lifecycleErrorFields(
        new LifecycleError('GUARD_REJECTED', 'No.', {
          blockers: kinds.map((kind, index) => ({
            source: 'guard',
            kind,
            code: `blocker${index}`,
            message: 'No.',
          })),
        }),
      )?.status;
    expect(refusal('precondition')).toBe('FAILED_PRECONDITION');
    expect(refusal('precondition', 'precondition')).toBe('FAILED_PRECONDITION');
    expect(refusal('precondition', 'permission')).toBe('PERMISSION_DENIED');
    expect(refusal('permission')).toBe('PERMISSION_DENIED');
    // Without a blocker to say otherwise, a guard refusal is about permission.
    expect(refusal()).toBe('PERMISSION_DENIED');
  });

  it('answers a refused continuation as a failed precondition, keeping its code as the reason', () => {
    const guarded = new LifecycleError(
      'GUARD_REJECTED',
      'The order is blocked.',
      {
        blockers: [
          {
            source: 'guard',
            kind: 'permission',
            code: 'ORDER_BLOCKED',
            message: 'The order is blocked.',
          },
        ],
      },
    );
    for (const error of [
      guarded,
      new LifecycleError('UNKNOWN_TRANSITION', 'No "finish".'),
      new LifecycleError('INVALID_SET', 'May not set "status".'),
      new LifecycleError('INVALID_INPUT', 'Bad.', {
        problems: [{ field: 'reference', message: 'Required.' }],
      }),
      new LifecycleError('INVALID_STATE', 'Moved on.'),
      // Raised inside the continuation, such as by a parent its
      // onTransition fires: the route has already found the record and the
      // run the URL names, so these are not a missing resource.
      new LifecycleError('RECORD_NOT_FOUND', 'No orders record "9".'),
      new LifecycleError('UNKNOWN_LIFECYCLE', 'No lifecycle "orders".'),
    ])
      expect(lifecycleErrorFields(error, { continuation: true })).toEqual({
        status: 'FAILED_PRECONDITION',
        reason: error.code,
        message: error.message,
        metadata: { blockers: error.blockers, problems: error.problems },
      });
    for (const [code, status] of [
      ['NO_CONTINUATION', 'FAILED_PRECONDITION'],
      ['CONFLICT', 'ABORTED'],
    ] as const)
      expect(
        lifecycleErrorFields(new LifecycleError(code, 'No.'), {
          continuation: true,
        }),
      ).toMatchObject({ status, reason: code });
  });
});
