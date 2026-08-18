/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import type { VscPermissionHookInput, VscPermissionRequestMetadata } from '@nocobase/runjs/workspace/server';
import { createHash, randomUUID } from 'crypto';

import { JS_TEMPLATE_COLLECTIONS, JS_TEMPLATE_OWNER_TYPE } from '../../constants';
import type { JsTemplateCreateSourceType, JsTemplateDiagnostic } from '../../shared/types';
import { sortDiagnostics } from './JsTemplateValidator';

export interface JsTemplateRawResourceDeniedAuditInput {
  permission: VscPermissionHookInput;
  denyReason: string;
  requestId?: string;
}

export interface JsTemplateRawResourceDeniedPayload {
  action: 'rawResourceDenied';
  result: 'denied';
  level: 'warn';
  ownerType: typeof JS_TEMPLATE_OWNER_TYPE;
  ownerId?: string;
  projectId?: string;
  actorUserId?: string;
  rawResource?: string;
  rawResourceAction: string;
  requestId: string;
  requestSource?: string;
  denyReason: string;
  message: string;
  details: Record<string, unknown>;
}

export interface JsTemplateLifecycleAuditInput {
  projectId: string;
  action:
    | 'projectCreate'
    | 'projectUpdate'
    | 'projectLifecycleChange'
    | 'projectDelete'
    | 'templateDelete'
    | 'saveAsJsTemplate'
    | 'detachJsTemplateToInline';
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

export interface JsTemplateCompileAuditInput {
  projectId?: string;
  templateId?: string | null;
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
  diagnostics?: JsTemplateDiagnostic[];
  message: string;
  reasonCode?: string;
  details?: Record<string, unknown>;
  transaction?: Transaction;
}

export interface JsTemplateUsageAuditInput {
  projectId?: string | null;
  templateId?: string | null;
  action: 'usageUpsert' | 'usageRemove' | 'usageRebuild' | 'usageOwnerMissing' | 'usageConflict' | 'listUsages';
  result: 'success' | 'partial_success' | 'blocked' | 'denied';
  requestId: string;
  actorUserId?: string | null;
  ownerKind?: string | null;
  ownerLocatorHash?: string | null;
  resolvedStatus?: string | null;
  settingsHash?: string | null;
  usageCount?: number;
  reasonCode?: string;
  message: string;
  details?: Record<string, unknown>;
  transaction?: Transaction;
}

export interface JsTemplateSyncAuditInput {
  projectId?: string;
  action:
    | 'syncConfigure'
    | 'syncDisconnect'
    | 'syncTestConnection'
    | 'syncPlan'
    | 'syncPull'
    | 'syncPush'
    | 'syncCreateFromGit'
    | 'syncConflict';
  result: 'success' | 'blocked';
  requestId: string;
  actorUserId?: string | null;
  provider?: string;
  remoteTargetVersion?: number;
  remoteRevision?: string | null;
  localCommitId?: string | null;
  state?: string;
  syncAction?: string;
  fileCount?: number;
  reasonCode?: string;
  message: string;
  transaction?: Transaction;
}

export interface JsTemplateCreateJobAuditInput {
  jobId: string;
  targetProjectId: string;
  sourceType: JsTemplateCreateSourceType;
  action: 'createJobEnqueue' | 'createJobStart' | 'createJobSucceed' | 'createJobFail' | 'createJobDismiss';
  result: 'success' | 'blocked';
  requestId?: string | null;
  actorUserId?: string | null;
  reasonCode?: string;
  durationMs?: number;
}

export class JsTemplateAuditService {
  constructor(private readonly db: Database) {}

  async recordRawResourceDenied(input: JsTemplateRawResourceDeniedAuditInput): Promise<void> {
    const payload = this.buildRawResourceDeniedPayload(input);

    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.logs).create({
      values: {
        projectId: payload.projectId,
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

  async recordLifecycleEvent(input: JsTemplateLifecycleAuditInput): Promise<void> {
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.logs).create({
      values: {
        projectId: input.projectId,
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

  async recordCompileEvent(input: JsTemplateCompileAuditInput): Promise<void> {
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.logs).create({
      values: {
        projectId: input.projectId,
        templateId: input.templateId || undefined,
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
          entryPathHash: hashAuditText(input.entryPath),
          surfaceStyle: sanitizeText(input.surfaceStyle),
          runtimeVersion: sanitizeText(input.runtimeVersion),
          diagnosticCount: input.diagnosticCount,
          errorCount: input.errorCount,
          warningCount: input.warningCount,
          diagnostics: summarizeDiagnostics(input.diagnostics || []),
          ...(input.details ? sanitizeUsageAuditDetails(input.details) : {}),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordUsageEvent(input: JsTemplateUsageAuditInput): Promise<void> {
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.logs).create({
      values: {
        projectId: sanitizeText(input.projectId),
        templateId: sanitizeText(input.templateId),
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
          usageCount: input.usageCount,
          ...(input.details ? sanitizeUsageAuditDetails(input.details) : {}),
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordSyncEvent(input: JsTemplateSyncAuditInput): Promise<void> {
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.logs).create({
      values: {
        projectId: input.projectId,
        level: input.result === 'blocked' ? 'warn' : 'info',
        action: input.action,
        result: input.result,
        requestId: input.requestId,
        actorUserId: input.actorUserId || undefined,
        reasonCode: sanitizeText(input.reasonCode),
        message: sanitizeText(input.message),
        details: compactObject({
          provider: sanitizeText(input.provider),
          remoteTargetVersion: input.remoteTargetVersion,
          remoteRevision: sanitizeText(input.remoteRevision),
          localCommitId: sanitizeText(input.localCommitId),
          state: sanitizeText(input.state),
          syncAction: sanitizeText(input.syncAction),
          fileCount: input.fileCount,
        }),
        createdAt: new Date(),
      },
      transaction: input.transaction,
    });
  }

  async recordCreateJobEvent(input: JsTemplateCreateJobAuditInput): Promise<void> {
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.logs).create({
      values: {
        projectId: input.action === 'createJobSucceed' ? input.targetProjectId : undefined,
        level: input.result === 'blocked' ? 'warn' : 'info',
        action: input.action,
        result: input.result,
        requestId: sanitizeText(input.requestId),
        actorUserId: sanitizeText(input.actorUserId),
        reasonCode: sanitizeText(input.reasonCode),
        message: `JS Template creation job ${input.action}`,
        details: compactObject({
          jobId: sanitizeText(input.jobId),
          targetProjectId: sanitizeText(input.targetProjectId),
          sourceType: sanitizeText(input.sourceType),
          durationMs: input.durationMs,
        }),
        createdAt: new Date(),
      },
    });
  }

  buildRawResourceDeniedPayload(input: JsTemplateRawResourceDeniedAuditInput): JsTemplateRawResourceDeniedPayload {
    const permission = input.permission;
    const request = permission.request || {};
    const rawResource = request.resourceName;
    const rawResourceAction = buildRawResourceAction(request, permission.action);
    const requestId = input.requestId || request.requestId || randomUUID();
    const denyReason = sanitizeText(input.denyReason) || 'raw_resource_forbidden';
    const jsTemplateProjectId = permission.repository?.ownerId;
    const claimedOwnerId =
      permission.ownerId && permission.ownerId !== jsTemplateProjectId ? permission.ownerId : undefined;

    return {
      action: 'rawResourceDenied',
      result: 'denied',
      level: 'warn',
      ownerType: JS_TEMPLATE_OWNER_TYPE,
      ownerId: jsTemplateProjectId || claimedOwnerId,
      projectId: jsTemplateProjectId,
      actorUserId: permission.userId || undefined,
      rawResource,
      rawResourceAction,
      requestId,
      requestSource: request.requestSource,
      denyReason,
      message: 'Raw js-template resource access denied',
      details: sanitizeDetails(
        compactObject({
          ownerType: JS_TEMPLATE_OWNER_TYPE,
          ownerId: jsTemplateProjectId,
          claimedOwnerId,
          projectId: jsTemplateProjectId,
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

function summarizeDiagnostics(diagnostics: JsTemplateDiagnostic[]): Array<Record<string, unknown>> | undefined {
  if (!diagnostics.length) {
    return undefined;
  }

  return sortDiagnostics(diagnostics)
    .slice(0, 20)
    .map((item) =>
      compactObject({
        code: sanitizeText(item.code),
        severity: sanitizeText(item.severity),
        pathHash: hashAuditText(item.path),
        kind: sanitizeText(item.kind),
        templateName: sanitizeText(item.templateName),
        line: item.line,
        column: item.column,
      }),
    );
}

function sanitizeDetails(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => typeof value !== 'undefined')
      .map(([key, value]) =>
        isSensitiveAuditDetailKey(key) ? [`${key}AuditHash`, hashAuditValue(value)] : [key, sanitizeDetailValue(value)],
      ),
  );
}

function sanitizeUsageAuditDetails(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => typeof value !== 'undefined')
      .flatMap(([key, value]) => sanitizeUsageAuditDetailEntry(key, value)),
  );
}

function sanitizeUsageAuditDetailEntry(key: string, value: unknown): Array<[string, unknown]> {
  if (isUsageSensitiveDetailKey(key)) {
    return [[getUsageSensitiveDetailHashKey(key), hashAuditValue(value)]];
  }
  return [[key, sanitizeUsageAuditDetailValue(value)]];
}

function getUsageSensitiveDetailHashKey(key: string): string {
  if (key === 'modelUid') {
    return 'modelUidHash';
  }
  return `${key}AuditHash`;
}

function sanitizeUsageAuditDetailValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeUsageAuditDetailValue);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return sanitizeUsageAuditDetails(value as Record<string, unknown>);
}

function isUsageSensitiveDetailKey(key: string): boolean {
  return (
    isSensitiveAuditDetailKey(key) ||
    [
      'binding',
      'modelUid',
      'ownerLocator',
      'resolvedSettings',
      'settings',
      'settingsDefaults',
      'settingsSchema',
      'sourceBinding',
    ].includes(key)
  );
}

function isSensitiveAuditDetailKey(key: string): boolean {
  return /(?:code|content|credential|env|password|path|secret|sourceMap|token)$/i.test(key);
}

function hashAuditText(value: unknown): string | undefined {
  const text = sanitizeText(value);
  return text ? hashAuditValue(text) : undefined;
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
