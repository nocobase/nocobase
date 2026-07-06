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

export interface LightExtensionScanAuditInput {
  repoId: string;
  action: 'scan';
  result: 'success' | 'blocked';
  requestId: string;
  actorUserId?: string | null;
  commitId?: string | null;
  entryCount: number;
  diagnosticCount: number;
  errorCount: number;
  warningCount: number;
  diagnostics?: LightExtensionDiagnostic[];
  message: string;
  reasonCode?: string;
  transaction?: Transaction;
}

export interface LightExtensionCompileAuditInput {
  repoId?: string;
  entryId?: string | null;
  target?: string;
  kind?: string;
  name?: string;
  action: 'compilePreview';
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

export interface LightExtensionPublicationReadDeniedAuditInput {
  publicationId: string;
  requestId: string;
  actorUserId?: string | null;
  reasonCode: string;
  requestSource?: string;
  transaction?: Transaction;
}

export type LightExtensionPublicationUseDeniedAuditInput = LightExtensionPublicationReadDeniedAuditInput;

export interface LightExtensionPublishAuditInput {
  repoId: string;
  action: 'publish';
  result: 'success' | 'partial_success' | 'blocked';
  requestId: string;
  actorUserId?: string | null;
  commitId: string;
  clientRequestId: string;
  entryResults: Array<{
    entryId: string;
    status: string;
    reasonCode?: string;
    publicationId?: string;
  }>;
  diagnosticCount: number;
  errorCount: number;
  warningCount: number;
  diagnostics?: LightExtensionDiagnostic[];
  message: string;
  reasonCode?: string;
  transaction?: Transaction;
}

export interface LightExtensionActivationAuditInput {
  repoId: string;
  entryId: string;
  publicationId?: string | null;
  action: 'activatePublication' | 'emergencyRollback';
  result: 'success' | 'blocked';
  requestId: string;
  actorUserId?: string | null;
  expectedCurrentPublicationId?: string | null;
  oldPublicationId?: string | null;
  newPublicationId?: string | null;
  reason?: string | null;
  reasonCode?: string;
  message: string;
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

  async recordScanEvent(input: LightExtensionScanAuditInput): Promise<void> {
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
          commitId: sanitizeText(input.commitId),
          entryCount: input.entryCount,
          diagnosticCount: input.diagnosticCount,
          errorCount: input.errorCount,
          warningCount: input.warningCount,
          diagnostics: summarizeDiagnostics(input.diagnostics || []),
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
          ...(input.details ? sanitizeDetails(input.details) : {}),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordPublicationReadDenied(input: LightExtensionPublicationReadDeniedAuditInput): Promise<void> {
    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        level: 'warn',
        action: 'readPublication',
        result: 'denied',
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: 'Light extension publication read denied',
        details: compactObject({
          publicationId: sanitizeText(input.publicationId),
          requestSource: sanitizeText(input.requestSource),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordPublicationUseDenied(input: LightExtensionPublicationUseDeniedAuditInput): Promise<void> {
    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        publicationId: sanitizeText(input.publicationId),
        level: 'warn',
        action: 'usePublication',
        result: 'denied',
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: 'Light extension publication use denied',
        details: compactObject({
          publicationId: sanitizeText(input.publicationId),
          requestSource: sanitizeText(input.requestSource),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordPublishEvent(input: LightExtensionPublishAuditInput): Promise<void> {
    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        repoId: input.repoId,
        level: input.result === 'success' ? 'info' : 'warn',
        action: input.action,
        result: input.result,
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: sanitizeText(input.message),
        details: compactObject({
          commitId: sanitizeText(input.commitId),
          clientRequestId: sanitizeText(input.clientRequestId),
          diagnosticCount: input.diagnosticCount,
          errorCount: input.errorCount,
          warningCount: input.warningCount,
          entryResults: input.entryResults.map((entry) =>
            compactObject({
              entryId: sanitizeText(entry.entryId),
              status: sanitizeText(entry.status),
              reasonCode: sanitizeText(entry.reasonCode),
              publicationId: sanitizeText(entry.publicationId),
            }),
          ),
          diagnostics: summarizeDiagnostics(input.diagnostics || []),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordActivationEvent(input: LightExtensionActivationAuditInput): Promise<void> {
    await this.db.getRepository('lightExtensionLogs').create({
      values: {
        repoId: input.repoId,
        entryId: input.entryId,
        publicationId: input.publicationId || undefined,
        level: input.result === 'success' ? 'info' : 'warn',
        action: input.action,
        result: input.result,
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: sanitizeText(input.message),
        details: compactObject({
          expectedCurrentPublicationId: sanitizeText(input.expectedCurrentPublicationId),
          oldPublicationId: sanitizeText(input.oldPublicationId),
          newPublicationId: sanitizeText(input.newPublicationId),
          sanitizedReason: sanitizeText(input.reason),
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
