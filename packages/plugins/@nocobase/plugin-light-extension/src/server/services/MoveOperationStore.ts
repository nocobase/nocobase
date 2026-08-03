/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { isVscError } from '../vsc-file/public-api';
import { uid } from '@nocobase/utils';
import { createHash, randomUUID } from 'crypto';

import { LIGHT_EXTENSION_COLLECTIONS } from '../../constants';
import { isLightExtensionError, LightExtensionError } from '../../shared/errors';

const MOVE_OPERATION_STALE_AFTER_MS = 15 * 60 * 1000;

export interface MoveOperationReservation {
  identityHash: string;
  attemptId: string;
}

export interface MoveOperationDescriptor<TResult> {
  action: string;
  idempotencyKey?: string;
  request: unknown;
  parseResult: (value: unknown) => TResult;
}

export interface MoveOperationResolution<TResult> {
  reservation?: MoveOperationReservation;
  replayResult?: TResult;
}

export class MoveOperationStore {
  constructor(
    private readonly db: Database,
    private readonly applicationName: string,
  ) {}

  async inspect<TResult>(descriptor: MoveOperationDescriptor<TResult>): Promise<MoveOperationResolution<TResult>> {
    const identity = this.resolveIdentity(descriptor);
    if (!identity) {
      return {};
    }
    const record = await this.db.getRepository(LIGHT_EXTENSION_COLLECTIONS.moveOperations).model.findOne({
      where: { identityHash: identity.identityHash },
    });
    if (!record) {
      return {};
    }
    this.assertRequestMatches(record, identity.requestHash);
    const status = readModelString(record, 'status');
    if (status === 'completed') {
      return { replayResult: descriptor.parseResult(record.get('result')) };
    }
    if (status !== 'failed' && !isMoveOperationStale(record.get('updatedAt'))) {
      throw moveOperationInProgress();
    }
    return {};
  }

  async claim<TResult>(descriptor: MoveOperationDescriptor<TResult>): Promise<MoveOperationResolution<TResult>> {
    const identity = this.resolveIdentity(descriptor);
    if (!identity) {
      return {};
    }
    const attemptId = randomUUID();
    const operationRepository = this.db.getRepository(LIGHT_EXTENSION_COLLECTIONS.moveOperations);
    const [record, created] = await operationRepository.model.findOrCreate({
      where: { identityHash: identity.identityHash },
      defaults: {
        id: `lemo_${uid()}`,
        identityHash: identity.identityHash,
        applicationName: identity.applicationName,
        idempotencyKey: descriptor.idempotencyKey,
        requestHash: identity.requestHash,
        attemptId,
        status: 'pending',
      },
    });
    if (created) {
      return { reservation: { identityHash: identity.identityHash, attemptId } };
    }
    this.assertRequestMatches(record, identity.requestHash);
    if (readModelString(record, 'status') === 'completed') {
      return { replayResult: descriptor.parseResult(record.get('result')) };
    }

    const storedAttemptId = readModelString(record, 'attemptId');
    const status = readModelString(record, 'status');
    if (status !== 'failed' && !isMoveOperationStale(record.get('updatedAt'))) {
      throw moveOperationInProgress();
    }
    const [claimed] = await operationRepository.model.update(
      {
        attemptId,
        status: 'pending',
        result: null,
        errorCode: null,
      },
      {
        where: {
          identityHash: identity.identityHash,
          attemptId: storedAttemptId,
          status,
        },
      },
    );
    if (claimed !== 1) {
      throw moveOperationInProgress();
    }
    return { reservation: { identityHash: identity.identityHash, attemptId } };
  }

  async complete<TResult>(
    operation: MoveOperationReservation | undefined,
    result: TResult,
    transaction: Transaction,
  ): Promise<void> {
    if (!operation) {
      return;
    }
    const [completed] = await this.db.getRepository(LIGHT_EXTENSION_COLLECTIONS.moveOperations).model.update(
      {
        status: 'completed',
        result,
        errorCode: null,
      },
      {
        where: {
          identityHash: operation.identityHash,
          attemptId: operation.attemptId,
          status: 'pending',
        },
        transaction,
      },
    );
    if (completed !== 1) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Move operation could not persist its completed result',
      );
    }
  }

  async fail(operation: MoveOperationReservation | undefined, error: unknown): Promise<void> {
    if (!operation) {
      return;
    }
    try {
      await this.db.getRepository(LIGHT_EXTENSION_COLLECTIONS.moveOperations).model.update(
        {
          status: 'failed',
          errorCode: getMoveOperationErrorCode(error),
        },
        {
          where: {
            identityHash: operation.identityHash,
            attemptId: operation.attemptId,
            status: 'pending',
          },
        },
      );
    } catch {
      // Preserve the original move failure if the best-effort operation status update also fails.
    }
  }

  private resolveIdentity<TResult>(descriptor: MoveOperationDescriptor<TResult>): {
    applicationName: string;
    identityHash: string;
    requestHash: string;
  } | null {
    if (!descriptor.idempotencyKey) {
      return null;
    }
    const applicationName = this.applicationName.trim();
    if (!applicationName) {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Application identity is required');
    }
    return {
      applicationName,
      identityHash: hashMoveOperation({
        action: descriptor.action,
        applicationName,
        idempotencyKey: descriptor.idempotencyKey,
      }),
      requestHash: hashMoveOperation(descriptor.request),
    };
  }

  private assertRequestMatches(record: Model, requestHash: string): void {
    if (readModelString(record, 'requestHash') !== requestHash) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_IDEMPOTENCY_CONFLICT',
        'Move operation idempotency key was already used with a different request',
      );
    }
  }
}

function hashMoveOperation(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortObjectKeys(value)))
    .digest('hex');
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => typeof entryValue !== 'undefined')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, sortObjectKeys(entryValue)]),
  );
}

function readModelString(record: Model, key: string): string {
  const value = record.get(key);
  return typeof value === 'string' ? value : '';
}

function isMoveOperationStale(updatedAt: unknown): boolean {
  const timestamp = updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(String(updatedAt || ''));
  return Number.isFinite(timestamp) && Date.now() - timestamp >= MOVE_OPERATION_STALE_AFTER_MS;
}

function moveOperationInProgress(): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_IDEMPOTENCY_IN_PROGRESS',
    'Move operation with this idempotency key is still in progress; retry the same request',
  );
}

function getMoveOperationErrorCode(error: unknown): string {
  if (isLightExtensionError(error) || isVscError(error)) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return 'UNKNOWN_ERROR';
}
