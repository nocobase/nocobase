/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
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

  buildRawResourceDeniedPayload(
    input: LightExtensionRawResourceDeniedAuditInput,
  ): LightExtensionRawResourceDeniedPayload {
    const permission = input.permission;
    const request = permission.request || {};
    const rawResource = request.resourceName;
    const rawResourceAction = buildRawResourceAction(request, permission.action);
    const requestId = input.requestId || request.requestId || randomUUID();
    const denyReason = sanitizeText(input.denyReason) || 'raw_resource_forbidden';

    return {
      action: 'rawResourceDenied',
      result: 'denied',
      level: 'warn',
      ownerType: LIGHT_EXTENSION_OWNER_TYPE,
      ownerId: permission.ownerId,
      repoId: permission.repoId || permission.repository?.id,
      actorUserId: permission.userId || undefined,
      rawResource,
      rawResourceAction,
      requestId,
      requestSource: request.requestSource,
      denyReason,
      message: 'Raw light-extension resource access denied',
      details: compactObject({
        ownerType: LIGHT_EXTENSION_OWNER_TYPE,
        ownerId: permission.ownerId,
        repoId: permission.repoId || permission.repository?.id,
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
