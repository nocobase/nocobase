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
} from '@nocobase/runjs/workspace/server';
import { randomUUID } from 'crypto';

import { JS_TEMPLATE_OWNER_TYPE, type JsTemplateAclAction } from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import { JsTemplateAuditService } from './JsTemplateAuditService';

const JS_TEMPLATE_INTERNAL_VSC_CONTEXT = Symbol('@nocobase/plugin-js-template/internal-vsc-context');

export interface JsTemplateInternalVscContextInput {
  requestId: string;
  reason: string;
  allowedActions: readonly VscPermissionAction[];
  actorUserId?: string | null;
  jsTemplateProjectId?: string;
  aclAction?: JsTemplateAclAction;
  requestSource?: string;
}

export type JsTemplateCanFunction = (input: { resource: string; action: string }) => unknown | Promise<unknown>;

export interface JsTemplateActionPermissionContext {
  can?: JsTemplateCanFunction;
}

export interface JsTemplateAssertActionAllowedInput {
  action: JsTemplateAclAction;
  ctx?: JsTemplateActionPermissionContext;
}

interface JsTemplateInternalVscContext extends JsTemplateInternalVscContextInput {
  ownerType: typeof JS_TEMPLATE_OWNER_TYPE;
  accessToken: symbol;
}

export class JsTemplatePermissionService {
  private readonly internalAccessToken = Symbol('@nocobase/plugin-js-template/internal-vsc-access-token');

  constructor(private readonly auditService: JsTemplateAuditService) {}

  createVscPermissionHook(): VscPermissionHook {
    return (input) => this.handleVscPermission(input);
  }

  async assertActionAllowed(input: JsTemplateAssertActionAllowedInput): Promise<void> {
    if (!input.ctx?.can) {
      return;
    }

    const permission = await input.ctx.can({
      resource: 'jsTemplate',
      action: input.action,
    });
    if (isAllowedPermissionResult(permission)) {
      return;
    }

    throw new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', `JS Template ${input.action} permission is required`, {
      details: {
        action: input.action,
      },
    });
  }

  createInternalVscRequestContext(input: JsTemplateInternalVscContextInput): VscPermissionRequestMetadata {
    const request: VscPermissionRequestMetadata = {
      requestId: input.requestId,
      requestSource: input.requestSource || 'internal',
    };
    const context: JsTemplateInternalVscContext = {
      ...input,
      ownerType: JS_TEMPLATE_OWNER_TYPE,
      accessToken: this.internalAccessToken,
    };

    Object.defineProperty(request, JS_TEMPLATE_INTERNAL_VSC_CONTEXT, {
      value: context,
      enumerable: false,
    });

    return request;
  }

  async handleVscPermission(input: VscPermissionHookInput): Promise<VscPermissionHookResult> {
    if (!isJsTemplateOwner(input)) {
      return;
    }

    const internalContext = this.getInternalVscContext(input.request);
    if (internalContext && isInternalActionAllowed(input, internalContext)) {
      return {
        allowed: true,
        ownerType: JS_TEMPLATE_OWNER_TYPE,
      };
    }

    const denyReason = internalContext ? 'internal_action_not_allowed' : 'raw_resource_forbidden';
    const requestId = internalContext?.requestId || input.request?.requestId || randomUUID();
    await this.recordRawResourceDeniedBestEffort(input, denyReason, requestId);

    return denyJsTemplateRawAccess(input, denyReason, requestId);
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

  private getInternalVscContext(request?: VscPermissionRequestMetadata): JsTemplateInternalVscContext | null {
    if (!request || typeof request !== 'object') {
      return null;
    }

    const value = (request as Record<PropertyKey, unknown>)[JS_TEMPLATE_INTERNAL_VSC_CONTEXT];
    if (!value || typeof value !== 'object') {
      return null;
    }

    const context = value as Partial<JsTemplateInternalVscContext>;
    if (
      context.ownerType !== JS_TEMPLATE_OWNER_TYPE ||
      context.accessToken !== this.internalAccessToken ||
      typeof context.requestId !== 'string' ||
      typeof context.reason !== 'string' ||
      !isAllowedActionsValue(context.allowedActions)
    ) {
      return null;
    }

    return context as JsTemplateInternalVscContext;
  }
}

function isAllowedPermissionResult(value: unknown): boolean {
  return value !== false && value !== null && typeof value !== 'undefined';
}

function isJsTemplateOwner(input: VscPermissionHookInput): boolean {
  return input.repository?.ownerType === JS_TEMPLATE_OWNER_TYPE || input.ownerType === JS_TEMPLATE_OWNER_TYPE;
}

function isInternalActionAllowed(input: VscPermissionHookInput, context: JsTemplateInternalVscContext): boolean {
  if (context.ownerType !== JS_TEMPLATE_OWNER_TYPE) {
    return false;
  }
  if (context.jsTemplateProjectId && context.jsTemplateProjectId !== input.ownerId) {
    return false;
  }

  return context.allowedActions.includes(input.action);
}

function isAllowedActionsValue(value: unknown): value is JsTemplateInternalVscContext['allowedActions'] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function denyJsTemplateRawAccess(
  input: VscPermissionHookInput,
  denyReason: string,
  requestId?: string,
): VscPermissionDenyResult {
  const request = input.request || {};
  const rawResourceAction =
    request.resourceName && request.actionName ? `${request.resourceName}:${request.actionName}` : input.action;

  return {
    allowed: false,
    reason: 'JS Template projects must be accessed through plugin-js-template APIs',
    details: {
      ownerType: JS_TEMPLATE_OWNER_TYPE,
      rawResourceAction,
      result: 'denied',
      denyReason,
      requestId: requestId || request.requestId,
    },
  };
}
