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

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';
import { isJsTemplateError, JsTemplateError } from '../../shared/errors';

const JS_TEMPLATE_SOURCE_OPERATION_STALE_AFTER_MS = 15 * 60 * 1000;

export interface JsTemplateSourceOperationReservation {
  identityHash: string;
  attemptId: string;
}

export interface JsTemplateSourceOperationDescriptor<TResult> {
  action: string;
  idempotencyKey: string;
  request: unknown;
  parseResult: (value: unknown) => TResult;
}

export interface JsTemplateSourceOperationResolution<TResult> {
  reservation?: JsTemplateSourceOperationReservation;
  replayResult?: TResult;
}

export class JsTemplateSourceOperationStore {
  constructor(
    private readonly db: Database,
    private readonly applicationName: string,
  ) {}

  async inspect<TResult>(
    descriptor: JsTemplateSourceOperationDescriptor<TResult>,
  ): Promise<JsTemplateSourceOperationResolution<TResult>> {
    const identity = this.resolveIdentity(descriptor);
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.sourceOperations).model.findOne({
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
    if (status !== 'failed' && !isJsTemplateSourceOperationStale(record.get('updatedAt'))) {
      throw sourceOperationInProgress();
    }
    return {};
  }

  async claim<TResult>(
    descriptor: JsTemplateSourceOperationDescriptor<TResult>,
  ): Promise<JsTemplateSourceOperationResolution<TResult>> {
    const identity = this.resolveIdentity(descriptor);
    const attemptId = randomUUID();
    const operationRepository = this.db.getRepository(JS_TEMPLATE_COLLECTIONS.sourceOperations);
    const [record, created] = await operationRepository.model.findOrCreate({
      where: { identityHash: identity.identityHash },
      defaults: {
        id: `jtso_${uid()}`,
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
    if (status !== 'failed' && !isJsTemplateSourceOperationStale(record.get('updatedAt'))) {
      throw sourceOperationInProgress();
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
      throw sourceOperationInProgress();
    }
    return { reservation: { identityHash: identity.identityHash, attemptId } };
  }

  async complete<TResult>(
    operation: JsTemplateSourceOperationReservation | undefined,
    result: TResult,
    transaction: Transaction,
  ): Promise<void> {
    if (!operation) {
      return;
    }
    const [completed] = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.sourceOperations).model.update(
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
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'JS Template source operation could not persist its completed result',
      );
    }
  }

  async fail(operation: JsTemplateSourceOperationReservation | undefined, error: unknown): Promise<void> {
    if (!operation) {
      return;
    }
    try {
      await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.sourceOperations).model.update(
        {
          status: 'failed',
          errorCode: getJsTemplateSourceOperationErrorCode(error),
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
      // Preserve the original source operation failure if the best-effort status update also fails.
    }
  }

  private resolveIdentity<TResult>(descriptor: JsTemplateSourceOperationDescriptor<TResult>): {
    applicationName: string;
    identityHash: string;
    requestHash: string;
  } {
    const applicationName = this.applicationName.trim();
    if (!applicationName) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Application identity is required');
    }
    return {
      applicationName,
      identityHash: hashJsTemplateSourceOperation({
        action: descriptor.action,
        applicationName,
        idempotencyKey: descriptor.idempotencyKey,
      }),
      requestHash: hashJsTemplateSourceOperation(descriptor.request),
    };
  }

  private assertRequestMatches(record: Model, requestHash: string): void {
    if (readModelString(record, 'requestHash') !== requestHash) {
      throw new JsTemplateError(
        'JS_TEMPLATE_IDEMPOTENCY_CONFLICT',
        'JS Template source operation idempotency key was already used with a different request',
      );
    }
  }
}

function hashJsTemplateSourceOperation(value: unknown): string {
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

function isJsTemplateSourceOperationStale(updatedAt: unknown): boolean {
  const timestamp = updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(String(updatedAt || ''));
  return Number.isFinite(timestamp) && Date.now() - timestamp >= JS_TEMPLATE_SOURCE_OPERATION_STALE_AFTER_MS;
}

function sourceOperationInProgress(): JsTemplateError {
  return new JsTemplateError(
    'JS_TEMPLATE_IDEMPOTENCY_IN_PROGRESS',
    'JS Template source operation with this idempotency key is still in progress; retry the same request',
  );
}

function getJsTemplateSourceOperationErrorCode(error: unknown): string {
  if (isJsTemplateError(error) || isVscError(error)) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return 'UNKNOWN_ERROR';
}
