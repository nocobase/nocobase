/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  VscPermissionAction,
  VscPermissionDenyResult,
  VscPermissionHook,
  VscPermissionHookInput,
  VscPermissionHookResult,
  VscPermissionRequestMetadata,
} from '@nocobase/plugin-vsc-file';
import { randomUUID } from 'crypto';

import { LIGHT_EXTENSION_OWNER_TYPE, type LightExtensionAclAction } from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import { LightExtensionAuditService } from './LightExtensionAuditService';

const LIGHT_EXTENSION_INTERNAL_VSC_CONTEXT = Symbol('@nocobase/plugin-light-extension/internal-vsc-context');

export interface LightExtensionInternalVscContextInput {
  requestId: string;
  reason: string;
  allowedActions: readonly VscPermissionAction[];
  actorUserId?: string | null;
  lightExtensionRepoId?: string;
  aclAction?: LightExtensionAclAction;
  requestSource?: string;
}

export type LightExtensionCanFunction = (input: { resource: string; action: string }) => unknown | Promise<unknown>;

export interface LightExtensionActionPermissionContext {
  can?: LightExtensionCanFunction;
}

export interface LightExtensionAssertActionAllowedInput {
  action: LightExtensionAclAction;
  ctx?: LightExtensionActionPermissionContext;
}

interface LightExtensionInternalVscContext extends LightExtensionInternalVscContextInput {
  ownerType: typeof LIGHT_EXTENSION_OWNER_TYPE;
  accessToken: symbol;
}

export class LightExtensionPermissionService {
  private readonly internalAccessToken = Symbol('@nocobase/plugin-light-extension/internal-vsc-access-token');

  constructor(private readonly auditService: LightExtensionAuditService) {}

  createVscPermissionHook(): VscPermissionHook {
    return (input) => this.handleVscPermission(input);
  }

  async assertActionAllowed(input: LightExtensionAssertActionAllowedInput): Promise<void> {
    if (!input.ctx?.can) {
      return;
    }

    const permission = await input.ctx.can({
      resource: 'lightExtension',
      action: input.action,
    });
    if (isAllowedPermissionResult(permission)) {
      return;
    }

    throw new LightExtensionError(
      'LIGHT_EXTENSION_PERMISSION_DENIED',
      `Light extension ${input.action} permission is required`,
      {
        details: {
          action: input.action,
        },
      },
    );
  }

  createInternalVscRequestContext(input: LightExtensionInternalVscContextInput): VscPermissionRequestMetadata {
    const request: VscPermissionRequestMetadata = {
      requestId: input.requestId,
      requestSource: input.requestSource || 'internal',
    };
    const context: LightExtensionInternalVscContext = {
      ...input,
      ownerType: LIGHT_EXTENSION_OWNER_TYPE,
      accessToken: this.internalAccessToken,
    };

    Object.defineProperty(request, LIGHT_EXTENSION_INTERNAL_VSC_CONTEXT, {
      value: context,
      enumerable: false,
    });

    return request;
  }

  async handleVscPermission(input: VscPermissionHookInput): Promise<VscPermissionHookResult> {
    if (!isLightExtensionOwner(input)) {
      return;
    }

    const internalContext = this.getInternalVscContext(input.request);
    if (internalContext && isInternalActionAllowed(input, internalContext)) {
      return {
        allowed: true,
        ownerType: LIGHT_EXTENSION_OWNER_TYPE,
      };
    }

    const denyReason = internalContext ? 'internal_action_not_allowed' : 'raw_resource_forbidden';
    const requestId = internalContext?.requestId || input.request?.requestId || randomUUID();
    await this.recordRawResourceDeniedBestEffort(input, denyReason, requestId);

    return denyLightExtensionRawAccess(input, denyReason, requestId);
  }

  private async recordRawResourceDeniedBestEffort(
    input: VscPermissionHookInput,
    denyReason: string,
    requestId: string,
  ): Promise<void> {
    try {
      await this.auditService.recordRawResourceDenied({
        permission: input,
        denyReason,
        requestId,
      });
    } catch {
      // Permission denial must not depend on audit persistence availability.
    }
  }

  private getInternalVscContext(request?: VscPermissionRequestMetadata): LightExtensionInternalVscContext | null {
    if (!request || typeof request !== 'object') {
      return null;
    }

    const value = (request as Record<PropertyKey, unknown>)[LIGHT_EXTENSION_INTERNAL_VSC_CONTEXT];
    if (!value || typeof value !== 'object') {
      return null;
    }

    const context = value as Partial<LightExtensionInternalVscContext>;
    if (
      context.ownerType !== LIGHT_EXTENSION_OWNER_TYPE ||
      context.accessToken !== this.internalAccessToken ||
      typeof context.requestId !== 'string' ||
      typeof context.reason !== 'string' ||
      !isAllowedActionsValue(context.allowedActions)
    ) {
      return null;
    }

    return context as LightExtensionInternalVscContext;
  }
}

function isAllowedPermissionResult(value: unknown): boolean {
  return value !== false && value !== null && typeof value !== 'undefined';
}

function isLightExtensionOwner(input: VscPermissionHookInput): boolean {
  return input.repository?.ownerType === LIGHT_EXTENSION_OWNER_TYPE || input.ownerType === LIGHT_EXTENSION_OWNER_TYPE;
}

function isInternalActionAllowed(input: VscPermissionHookInput, context: LightExtensionInternalVscContext): boolean {
  if (context.ownerType !== LIGHT_EXTENSION_OWNER_TYPE) {
    return false;
  }
  if (context.lightExtensionRepoId && context.lightExtensionRepoId !== input.ownerId) {
    return false;
  }

  return context.allowedActions.includes(input.action);
}

function isAllowedActionsValue(value: unknown): value is LightExtensionInternalVscContext['allowedActions'] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function denyLightExtensionRawAccess(
  input: VscPermissionHookInput,
  denyReason: string,
  requestId?: string,
): VscPermissionDenyResult {
  const request = input.request || {};
  const rawResourceAction =
    request.resourceName && request.actionName ? `${request.resourceName}:${request.actionName}` : input.action;

  return {
    allowed: false,
    reason: 'Light-extension repositories must be accessed through plugin-light-extension APIs',
    details: {
      ownerType: LIGHT_EXTENSION_OWNER_TYPE,
      rawResourceAction,
      result: 'denied',
      denyReason,
      requestId: requestId || request.requestId,
    },
  };
}
