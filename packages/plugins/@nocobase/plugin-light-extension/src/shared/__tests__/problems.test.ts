/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  computeLightExtensionProblemFingerprint,
  createLightExtensionProblem,
  createLightExtensionProblemFactory,
  sanitizeLightExtensionProblemDetails,
  sanitizeLightExtensionProblemStack,
  stableSerializeLightExtensionProblemValue,
  uniqueLightExtensionProblems,
} from '../problems';

describe('light-extension problems', () => {
  it('creates a versioned problem with a one-based original-source range', () => {
    const createProblem = createLightExtensionProblemFactory({
      snapshotId: 'snapshot-1',
      requestId: 'request-1',
      source: 'validator',
      phase: 'policy',
    });

    expect(
      createProblem({
        code: 'import_not_allowed',
        severity: 'error',
        message: 'Import is not allowed',
        path: './src/client/js-blocks/demo/index.tsx',
        range: { start: { line: 0, column: -2 }, end: { line: 2, column: 8 } },
      }),
    ).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        phase: 'policy',
        source: 'validator',
        snapshotId: 'snapshot-1',
        requestId: 'request-1',
        path: 'src/client/js-blocks/demo/index.tsx',
        range: { start: { line: 1, column: 1 }, end: { line: 2, column: 8 } },
        fingerprint: expect.stringMatching(/^problem-v1:fnv1a-[a-f0-9]{8}$/u),
      }),
    );
  });

  it('keeps fingerprints stable across snapshots, requests, sources, and property order', () => {
    const base = {
      phase: 'compile' as const,
      severity: 'error' as const,
      code: 'compile_failed',
      message: 'Compilation failed',
      path: 'src/client/js-pages/demo/index.tsx',
      range: { start: { line: 4, column: 2 } },
      kind: 'js-page',
      entryName: 'demo',
      fixHint: 'Fix the invalid call',
    };
    const first = createLightExtensionProblem({
      ...base,
      source: 'esbuild',
      snapshotId: 'snapshot-1',
      requestId: 'request-1',
      details: { beta: 2, alpha: { second: true, first: false } },
    });
    const second = createLightExtensionProblem({
      ...base,
      source: 'runjs-compiler',
      snapshotId: 'snapshot-2',
      requestId: 'request-2',
      details: { alpha: { first: false, second: true }, beta: 2 },
    });

    expect(second.fingerprint).toBe(first.fingerprint);
    expect(computeLightExtensionProblemFingerprint(second)).toBe(first.fingerprint);
  });

  it('does not merge problems with different messages or details', () => {
    const createProblem = createLightExtensionProblemFactory({
      snapshotId: 'snapshot-1',
      requestId: 'request-1',
      source: 'validator',
      phase: 'schema',
    });
    const first = createProblem({
      code: 'schema_invalid',
      severity: 'error',
      message: 'Expected string',
      details: { expected: 'string' },
    });
    const differentMessage = createProblem({ ...first, message: 'Expected number' });
    const differentDetails = createProblem({ ...first, details: { expected: 'number' } });

    expect(new Set([first.fingerprint, differentMessage.fingerprint, differentDetails.fingerprint])).toHaveLength(3);
  });

  it('redacts secrets, request bodies, absolute paths, raw errors, and oversized text', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const details = sanitizeLightExtensionProblemDetails({
      authorization: 'Bearer secret',
      Cookie: 'session=secret',
      requestBody: { password: 'secret' },
      error: new Error('Failed at /root/work/nocobase/private.ts'),
      location: 'C:\\Users\\alice\\secret.ts and /root/work/nocobase/source.ts',
      circular,
      long: 'x'.repeat(3_000),
    });
    const stack = sanitizeLightExtensionProblemStack(
      'Error: boom\n    at run (/root/work/nocobase/private.ts:1:2)\nAuthorization: Bearer secret',
    );

    expect(details).toEqual(
      expect.objectContaining({
        authorization: '[REDACTED]',
        Cookie: '[REDACTED]',
        requestBody: '[REDACTED]',
        error: { name: 'Error', message: 'Failed at [REDACTED_PATH]' },
        circular: { self: '[CIRCULAR]' },
      }),
    );
    expect(String(details?.location)).not.toContain('/root/work');
    expect(String(details?.location)).not.toContain('C:\\Users');
    expect(String(details?.long)).toHaveLength(2 * 1024);
    expect(stack).not.toContain('/root/work');
    expect(stack).not.toContain('secret');
  });

  it('caps aggregate details without collapsing distinct oversized payloads', () => {
    const first = sanitizeLightExtensionProblemDetails({
      values: Array.from({ length: 100 }, () => 'a'.repeat(2_048)),
    });
    const second = sanitizeLightExtensionProblemDetails({
      values: Array.from({ length: 100 }, () => 'b'.repeat(2_048)),
    });

    expect(stableSerializeLightExtensionProblemValue(first).length).toBeLessThanOrEqual(16 * 1024);
    expect(first).toEqual(expect.objectContaining({ truncated: true }));
    expect(first?.contentFingerprint).not.toBe(second?.contentFingerprint);
  });

  it('deduplicates by fingerprint while preserving source provenance', () => {
    const first = createLightExtensionProblem({
      phase: 'compile',
      source: 'esbuild',
      severity: 'error',
      code: 'compile_failed',
      message: 'Compilation failed',
      snapshotId: 'snapshot-1',
      requestId: 'request-1',
    });
    const second = createLightExtensionProblem({
      ...first,
      source: 'runjs-compiler',
      snapshotId: 'snapshot-2',
      requestId: 'request-2',
    });

    const problems = uniqueLightExtensionProblems([second, first]);

    expect(problems).toHaveLength(1);
    expect(problems[0].provenance).toEqual([
      { source: 'runjs-compiler', phase: 'compile', requestId: 'request-2' },
      { source: 'esbuild', phase: 'compile', requestId: 'request-1' },
    ]);
  });

  it('serializes nested values with stable object-key ordering', () => {
    expect(stableSerializeLightExtensionProblemValue({ second: 2, first: { beta: true, alpha: false } })).toBe(
      '{"first":{"alpha":false,"beta":true},"second":2}',
    );
  });
});
