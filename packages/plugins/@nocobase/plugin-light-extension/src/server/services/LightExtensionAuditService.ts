/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import type { VscPermissionHookInput, VscPermissionRequestMetadata } from '@nocobase/plugin-vsc-file';
import { randomUUID } from 'crypto';

import { LIGHT_EXTENSION_OWNER_TYPE } from '../../constants';

export interface LightExtensionRawResourceDeniedAuditInput {
  permission: VscPermissionHookInput;
  denyReason: string;
  requestId?: string;
}

export interface LightExtensionRawResourceDeniedPayload {
  action: 'rawResourceDenied';
  result: 'denied';
  level: 'warn';
  ownerType: typeof LIGHT_EXTENSION_OWNER_TYPE;
  ownerId?: string;
  repoId?: string;
  actorUserId?: string;
  rawResource?: string;
  rawResourceAction: string;
  requestId: string;
  requestSource?: string;
  denyReason: string;
  message: string;
  details: Record<string, unknown>;
}

export interface LightExtensionLifecycleAuditInput {
  repoId: string;
  action: 'repoCreate' | 'repoLifecycleChange' | 'repoDelete';
  result: 'success' | 'blocked';
  requestId: string;
  actorUserId?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  message: string;
  reasonCode?: string;
  details?: Record<string, unknown>;
  transaction?: Transaction;
}

export interface LightExtensionFileWriteAuditInput {
  repoId: string;
  action: 'sourceCreate' | 'sourcePush';
  result: 'success' | 'blocked';
  requestId: string;
  actorUserId?: string | null;
  baseCommitId?: string | null;
  commitId?: string | null;
  message: string;
  reasonCode?: string;
  files: Array<{
    path: string;
    operation?: string;
    size?: number;
    language?: string;
  }>;
  details?: Record<string, unknown>;
  transaction?: Transaction;
}

export class LightExtensionAuditService {
  constructor(private readonly db: Database) {}

  async recordRawResourceDenied(input: LightExtensionRawResourceDeniedAuditInput): Promise<void> {
    const payload = this.buildRawResourceDeniedPayload(input);

    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        repoId: payload.repoId,
        level: payload.level,
        action: payload.action,
        result: payload.result,
        requestId: payload.requestId,
        actorUserId: payload.actorUserId,
        rawResource: payload.rawResource,
        rawResourceAction: payload.rawResourceAction,
        denyReason: payload.denyReason,
        message: payload.message,
        details: payload.details,
        createdAt: new Date(),
      },
    });
  }

  async recordLifecycleEvent(input: LightExtensionLifecycleAuditInput): Promise<void> {
    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        repoId: input.repoId,
        level: input.result === 'blocked' ? 'warn' : 'info',
        action: input.action,
        result: input.result,
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: sanitizeText(input.message),
        details: compactObject({
          fromStatus: sanitizeText(input.fromStatus),
          toStatus: sanitizeText(input.toStatus),
          ...(input.details ? sanitizeDetails(input.details) : {}),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordFileWrite(input: LightExtensionFileWriteAuditInput): Promise<void> {
    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        repoId: input.repoId,
        level: input.result === 'blocked' ? 'warn' : 'info',
        action: input.action,
        result: input.result,
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: sanitizeText(input.message),
        details: compactObject({
          baseCommitId: sanitizeText(input.baseCommitId),
          commitId: sanitizeText(input.commitId),
          fileCount: input.files.length,
          files: input.files.map((file) =>
            compactObject({
              path: sanitizeText(file.path),
              operation: sanitizeText(file.operation),
              size: file.size,
              language: sanitizeText(file.language),
            }),
          ),
          ...(input.details ? sanitizeDetails(input.details) : {}),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  buildRawResourceDeniedPayload(
    input: LightExtensionRawResourceDeniedAuditInput,
  ): LightExtensionRawResourceDeniedPayload {
    const permission = input.permission;
    const request = permission.request || {};
    const rawResource = request.resourceName;
    const rawResourceAction = buildRawResourceAction(request, permission.action);
    const requestId = input.requestId || request.requestId || randomUUID();
    const denyReason = sanitizeText(input.denyReason) || 'raw_resource_forbidden';
    const lightExtensionRepoId = permission.repository?.ownerId;
    const claimedOwnerId =
      permission.ownerId && permission.ownerId !== lightExtensionRepoId ? permission.ownerId : undefined;

    return {
      action: 'rawResourceDenied',
      result: 'denied',
      level: 'warn',
      ownerType: LIGHT_EXTENSION_OWNER_TYPE,
      ownerId: lightExtensionRepoId || claimedOwnerId,
      repoId: lightExtensionRepoId,
      actorUserId: permission.userId || undefined,
      rawResource,
      rawResourceAction,
      requestId,
      requestSource: request.requestSource,
      denyReason,
      message: 'Raw light-extension resource access denied',
      details: sanitizeDetails(
        compactObject({
          ownerType: LIGHT_EXTENSION_OWNER_TYPE,
          ownerId: lightExtensionRepoId,
          claimedOwnerId,
          repoId: lightExtensionRepoId,
          rawResource,
          rawResourceAction,
          vscAction: permission.action,
          targetCommitId: permission.targetCommitId,
          sourceCommitId: permission.sourceCommitId,
          refName: permission.refName,
          requestId,
          requestSource: request.requestSource,
          path: request.path,
          method: request.method,
          dataSource: request.dataSource,
          roleName: request.roleName,
          roles: request.roles,
          denyReason,
        }),
      ),
    };
  }
}

function buildRawResourceAction(request: VscPermissionRequestMetadata, fallbackAction: string): string {
  if (request.resourceName && request.actionName) {
    return `${request.resourceName}:${request.actionName}`;
  }
  return request.actionName || fallbackAction;
}

function sanitizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.replace(/[\r\n\t]+/g, ' ').trim();
  return normalized ? normalized.slice(0, 512) : undefined;
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'undefined')) as T;
}

function sanitizeDetails(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => typeof value !== 'undefined')
      .map(([key, value]) => [key, sanitizeDetailValue(value)]),
  );
}

function sanitizeDetailValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeDetailValue);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  return sanitizeDetails(value as Record<string, unknown>);
}
