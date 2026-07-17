/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';

import { RemoteSyncError } from '../RemoteSyncAdapter';
import { parseVscRemoteAuthRef, type VscRemoteAuthRef } from '../credentialRef';

export type RemoteCredentialMode = 'required' | 'optional';

export interface RemoteCredentialEnvironment {
  getVariables(): unknown;
}

export interface RemoteCredentialResolverOptions {
  db: Database;
  environment: RemoteCredentialEnvironment;
}

export class RemoteCredentialResolver {
  private readonly db: Database;

  private readonly environment: RemoteCredentialEnvironment;

  constructor(options: RemoteCredentialResolverOptions) {
    this.db = options.db;
    this.environment = options.environment;
  }

  async validate(authRef: unknown): Promise<VscRemoteAuthRef> {
    const parsed = parseVscRemoteAuthRef(authRef);
    if ('name' in parsed) {
      await this.requireSecretRecord(parsed.name);
    }
    return parsed;
  }

  async resolve(authRef: unknown, mode: RemoteCredentialMode = 'required'): Promise<string | null> {
    if (authRef === null || authRef === undefined) {
      if (mode === 'optional') {
        return null;
      }
      throw credentialUnavailable('Remote credential is required', 'credential-required');
    }

    const parsed = parseVscRemoteAuthRef(authRef);
    if ('value' in parsed) {
      return parsed.value;
    }
    await this.requireSecretRecord(parsed.name);

    let variables: unknown;
    try {
      variables = this.environment.getVariables();
    } catch {
      throw credentialUnavailable(`Credential "${parsed.name}" is unavailable`, 'credential-value-unavailable');
    }
    if (!isRecord(variables) || !Object.prototype.hasOwnProperty.call(variables, parsed.name)) {
      throw credentialUnavailable(`Credential "${parsed.name}" is unavailable`, 'credential-value-unavailable');
    }

    const value = variables[parsed.name];
    if (typeof value !== 'string' || !value.trim()) {
      throw credentialUnavailable(`Credential "${parsed.name}" is unavailable`, 'credential-value-invalid');
    }
    return value;
  }

  private async requireSecretRecord(name: string): Promise<void> {
    if (!this.db.hasCollection('environmentVariables')) {
      throw credentialUnavailable('Variables and secrets is unavailable', 'environment-variables-unavailable');
    }

    let record: Model | null;
    try {
      const repository = this.db.getRepository('environmentVariables');
      if (!(await repository.collection.existsInDb())) {
        throw credentialUnavailable('Variables and secrets is unavailable', 'environment-variables-unavailable');
      }
      record = (await repository.findOne({
        filterByTk: name,
        fields: ['name', 'type'],
      })) as Model | null;
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw error;
      }
      throw credentialUnavailable('Variables and secrets is unavailable', 'environment-variables-unavailable');
    }

    if (!record) {
      throw credentialUnavailable(`Credential "${name}" is unavailable`, 'credential-record-missing');
    }
    if (record.get('name') !== name || record.get('type') !== 'secret') {
      throw credentialUnavailable(`Credential "${name}" must reference a secret`, 'secret-variable-required');
    }
  }
}

function credentialUnavailable(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('CREDENTIAL_UNAVAILABLE', message, {
    details: {
      reasonCode,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
