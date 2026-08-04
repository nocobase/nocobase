/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateUsageListInput, JsTemplateUsageRebuildInput } from '../../shared/types';
import { JsTemplateUsageService } from '../services/JsTemplateUsageService';
import { normalizeUsageOwnerLocator } from '../services/JsTemplateUsageOwnerRegistry';
import type { JsTemplateServiceContext } from '../services/JsTemplateProjectService';
import {
  createTypedResourceAction,
  getServiceContext,
  type JsTemplateResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const jsTemplateUsageActionNames = ['listUsages', 'rebuildUsages'] as const;

type JsTemplateUsageActionName = (typeof jsTemplateUsageActionNames)[number];
type ResourceActionRunner = (
  services: JsTemplateUsageActionServices,
  input: ResourceActionInput,
  currentUser: ReturnType<typeof getJsTemplateUsageServiceContext>,
) => Promise<unknown>;

interface JsTemplateUsageActionServices {
  usageService: JsTemplateUsageService;
}

const resourceActionRunners: Record<JsTemplateUsageActionName, ResourceActionRunner> = {
  listUsages: (services, input, currentUser) =>
    services.usageService.listUsages(normalizeListInput(input), currentUser),
  rebuildUsages: (services, input, currentUser) =>
    services.usageService.rebuildUsages(normalizeRebuildInput(input), currentUser),
};

export function createJsTemplateUsagesResource(usageService: JsTemplateUsageService): ResourceOptions {
  const services = {
    usageService,
  };

  return {
    name: 'jsTemplateUsages',
    only: [...jsTemplateUsageActionNames],
    actions: Object.fromEntries(
      jsTemplateUsageActionNames.map((actionName) => [
        actionName,
        createJsTemplateUsageAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<JsTemplateUsageActionName, HandlerType>,
  };
}

function createJsTemplateUsageAction(services: JsTemplateUsageActionServices, run: ResourceActionRunner): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext: getJsTemplateUsageServiceContext,
  });
}

function getJsTemplateUsageServiceContext(ctx: JsTemplateResourceContext): JsTemplateServiceContext & {
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
} {
  return {
    ...getServiceContext(ctx),
    can: ctx.can,
    currentUser: ctx.auth?.user,
    state: ctx.state,
    timezone: ctx.timezone,
  };
}

function normalizeListInput(input: ResourceActionInput): JsTemplateUsageListInput {
  return {
    projectId: optionalString(input, 'projectId'),
    templateId: optionalString(input, 'templateId'),
    ownerLocator: normalizeOwnerLocator(input.ownerLocator),
  };
}

function normalizeRebuildInput(input: ResourceActionInput): JsTemplateUsageRebuildInput {
  return {
    rootUid: optionalString(input, 'rootUid') || optionalString(input, 'uid'),
    projectId: optionalString(input, 'projectId'),
    ownerLocator: normalizeOwnerLocator(input.ownerLocator),
    dryRun: optionalBoolean(input, 'dryRun'),
  };
}

function normalizeOwnerLocator(value: unknown): JsTemplateUsageListInput['ownerLocator'] {
  const normalized = normalizeUsageOwnerLocator(value);
  if (normalized) {
    return normalized;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const modelUid = optionalString(value as ResourceActionInput, 'modelUid');
  return modelUid ? { modelUid } : undefined;
}

function optionalString(input: ResourceActionInput, key: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined' || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${key} must be a string`);
  }
  return value.trim() || undefined;
}

function optionalBoolean(input: ResourceActionInput, key: string): boolean | undefined {
  const value = input[key];
  if (typeof value === 'undefined' || value === null) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw invalidInput(`${key} must be a boolean`);
  }
  return value;
}

function invalidInput(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message);
}
