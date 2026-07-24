/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { describe, expect, it } from 'vitest';

import { RemoteSyncError } from '../../RemoteSyncAdapter';
import { RemoteCredentialResolver } from '../RemoteCredentialResolver';

describe('RemoteCredentialResolver', () => {
  it('validates a secret record and reads the current decrypted value for every resolution', async () => {
    const variables: Record<string, unknown> = {
      GITHUB_PAT: 'first-secret-value',
    };
    const resolver = new RemoteCredentialResolver({
      db: createDatabase({ GITHUB_PAT: 'secret' }),
      environment: {
        getVariables: () => variables,
      },
    });

    await expect(resolver.validate('{{ $env.GITHUB_PAT }}')).resolves.toEqual({
      expression: '{{ $env.GITHUB_PAT }}',
      name: 'GITHUB_PAT',
    });
    await expect(resolver.resolve('{{ $env.GITHUB_PAT }}')).resolves.toBe('first-secret-value');

    variables.GITHUB_PAT = 'rotated-secret-value';
    await expect(resolver.resolve('{{ $env.GITHUB_PAT }}')).resolves.toBe('rotated-secret-value');
  });

  it('rejects a direct literal credential without reading Variables and secrets', async () => {
    const resolver = new RemoteCredentialResolver({
      db: createDatabase({}, false),
      environment: { getVariables: () => ({}) },
    });

    await expect(resolver.validate('github_pat_test_direct_123')).rejects.toMatchObject({ code: 'AUTH_REF_INVALID' });
    await expect(resolver.resolve('github_pat_test_direct_123')).rejects.toMatchObject({ code: 'AUTH_REF_INVALID' });
  });

  it('allows an omitted optional credential but rejects an omitted required credential', async () => {
    const resolver = new RemoteCredentialResolver({
      db: createDatabase({}),
      environment: { getVariables: () => ({}) },
    });

    await expect(resolver.resolve(null, 'optional')).resolves.toBeNull();
    await expect(resolver.resolve(null, 'required')).rejects.toMatchObject({
      code: 'CREDENTIAL_UNAVAILABLE',
      details: { reasonCode: 'credential-required' },
    });
  });

  it.each([
    ['mixed expression', 'Bearer {{ $env.GITHUB_PAT }}'],
    ['ordinary variable', '{{ $env.PUBLIC_VALUE }}'],
    ['missing record', '{{ $env.MISSING }}'],
  ])('rejects %s without exposing a credential value', async (_caseName, authRef) => {
    const token = 'github_pat_012345678901234567890123456789';
    const resolver = new RemoteCredentialResolver({
      db: createDatabase({ PUBLIC_VALUE: 'default' }),
      environment: {
        getVariables: () => ({
          PUBLIC_VALUE: token,
          MISSING: token,
        }),
      },
    });

    const error = await captureError(() => resolver.resolve(authRef));
    expect(error).toBeInstanceOf(RemoteSyncError);
    expect(JSON.stringify(toResponseBody(error))).not.toContain(token);
  });

  it('fails safely when Variables and secrets is unavailable or the loaded value is invalid', async () => {
    const unavailable = new RemoteCredentialResolver({
      db: createDatabase({}, false),
      environment: { getVariables: () => ({}) },
    });
    await expect(unavailable.resolve('{{ $env.GITHUB_PAT }}')).rejects.toMatchObject({
      code: 'CREDENTIAL_UNAVAILABLE',
      details: { reasonCode: 'environment-variables-unavailable' },
    });

    const invalidValue = new RemoteCredentialResolver({
      db: createDatabase({ GITHUB_PAT: 'secret' }),
      environment: { getVariables: () => ({ GITHUB_PAT: 123 }) },
    });
    await expect(invalidValue.resolve('{{ $env.GITHUB_PAT }}')).rejects.toMatchObject({
      code: 'CREDENTIAL_UNAVAILABLE',
      details: { reasonCode: 'credential-value-invalid' },
    });
  });
});

function createDatabase(records: Record<string, string>, available = true): Database {
  return {
    hasCollection: (name: string) => available && name === 'environmentVariables',
    getRepository: () => ({
      collection: {
        existsInDb: async () => available,
      },
      findOne: async (options: { filterByTk?: string }) => {
        const name = options.filterByTk;
        const type = name ? records[name] : undefined;
        if (!name || !type) {
          return null;
        }
        return {
          get: (field: string) => (field === 'name' ? name : type),
        };
      },
    }),
  } as unknown as Database;
}

async function captureError(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected operation to fail');
}

function toResponseBody(error: unknown): unknown {
  return error instanceof RemoteSyncError ? error.toResponseBody() : error;
}
