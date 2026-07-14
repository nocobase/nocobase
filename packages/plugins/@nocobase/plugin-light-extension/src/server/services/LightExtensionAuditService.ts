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
import { createHash, randomUUID } from 'crypto';

import { LIGHT_EXTENSION_OWNER_TYPE } from '../../constants';
import type { LightExtensionDiagnostic } from '../../shared/types';
import { sortDiagnostics } from './LightExtensionValidator';

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
  action: 'repoCreate' | 'repoUpdate' | 'repoLifecycleChange' | 'repoDelete';
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

export interface LightExtensionCompileAuditInput {
  repoId?: string;
  entryId?: string | null;
  target?: string;
  kind?: string;
  name?: string;
  action: 'compilePreview' | 'runtimeCompile';
  result: 'success' | 'blocked';
  requestId: string;
  actorUserId?: string | null;
  entryPath?: string;
  surfaceStyle?: string;
  runtimeVersion?: string;
  diagnosticCount: number;
  errorCount: number;
  warningCount: number;
  diagnostics?: LightExtensionDiagnostic[];
  message: string;
  reasonCode?: string;
  details?: Record<string, unknown>;
  transaction?: Transaction;
}

export interface LightExtensionReferenceAuditInput {
  repoId?: string | null;
  entryId?: string | null;
  action:
    | 'referenceUpsert'
    | 'referenceRemove'
    | 'referenceRebuild'
    | 'referenceOwnerMissing'
    | 'referenceConflict'
    | 'readReferences';
  result: 'success' | 'partial_success' | 'blocked' | 'denied';
  requestId: string;
  actorUserId?: string | null;
  ownerKind?: string | null;
  ownerLocatorHash?: string | null;
  resolvedStatus?: string | null;
  settingsHash?: string | null;
  referenceCount?: number;
  reasonCode?: string;
  message: string;
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
          ...(input.details ? sanitizeReferenceAuditDetails(input.details) : {}),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordCompileEvent(input: LightExtensionCompileAuditInput): Promise<void> {
    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        repoId: input.repoId,
        entryId: input.entryId || undefined,
        level: input.result === 'blocked' ? 'warn' : 'info',
        target: sanitizeText(input.target),
        kind: sanitizeText(input.kind),
        name: sanitizeText(input.name),
        action: input.action,
        result: input.result,
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: sanitizeText(input.message),
        details: compactObject({
          entryPath: sanitizeText(input.entryPath),
          surfaceStyle: sanitizeText(input.surfaceStyle),
          runtimeVersion: sanitizeText(input.runtimeVersion),
          diagnosticCount: input.diagnosticCount,
          errorCount: input.errorCount,
          warningCount: input.warningCount,
          diagnostics: summarizeDiagnostics(input.diagnostics || []),
          ...(input.details ? sanitizeReferenceAuditDetails(input.details) : {}),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordReferenceEvent(input: LightExtensionReferenceAuditInput): Promise<void> {
    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        repoId: sanitizeText(input.repoId),
        entryId: sanitizeText(input.entryId),
        level: input.result === 'success' ? 'info' : 'warn',
        action: input.action,
        result: input.result,
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: sanitizeText(input.message),
        details: compactObject({
          ownerKind: sanitizeText(input.ownerKind),
          ownerLocatorHash: sanitizeText(input.ownerLocatorHash),
          resolvedStatus: sanitizeText(input.resolvedStatus),
          settingsHash: sanitizeText(input.settingsHash),
          referenceCount: input.referenceCount,
          ...(input.details ? sanitizeReferenceAuditDetails(input.details) : {}),
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

function summarizeDiagnostics(diagnostics: LightExtensionDiagnostic[]): Array<Record<string, unknown>> | undefined {
  if (!diagnostics.length) {
    return undefined;
  }

  return sortDiagnostics(diagnostics)
    .slice(0, 20)
    .map((item) =>
      compactObject({
        code: sanitizeText(item.code),
        severity: sanitizeText(item.severity),
        path: sanitizeText(item.path),
        kind: sanitizeText(item.kind),
        entryName: sanitizeText(item.entryName),
        line: item.line,
        column: item.column,
      }),
    );
}

function sanitizeDetails(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => typeof value !== 'undefined')
      .map(([key, value]) => [key, sanitizeDetailValue(value)]),
  );
}

function sanitizeReferenceAuditDetails(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => typeof value !== 'undefined')
      .flatMap(([key, value]) => sanitizeReferenceAuditDetailEntry(key, value)),
  );
}

function sanitizeReferenceAuditDetailEntry(key: string, value: unknown): Array<[string, unknown]> {
  if (isReferenceSensitiveDetailKey(key)) {
    return [[getReferenceSensitiveDetailHashKey(key), hashAuditValue(value)]];
  }
  return [[key, sanitizeReferenceAuditDetailValue(value)]];
}

function getReferenceSensitiveDetailHashKey(key: string): string {
  if (key === 'modelUid') {
    return 'modelUidHash';
  }
  return `${key}AuditHash`;
}

function sanitizeReferenceAuditDetailValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeReferenceAuditDetailValue);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return sanitizeReferenceAuditDetails(value as Record<string, unknown>);
}

function isReferenceSensitiveDetailKey(key: string): boolean {
  return ['modelUid', 'ownerLocator', 'settings', 'resolvedSettings', 'settingsDefaults', 'settingsSchema'].includes(
    key,
  );
}

function hashAuditValue(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableSerialize(value)).digest('hex')}`;
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

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}
