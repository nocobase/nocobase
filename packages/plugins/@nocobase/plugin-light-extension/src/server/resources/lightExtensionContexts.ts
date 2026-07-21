/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import type { LightExtensionContextPackInput } from '../../shared/context-pack';
import { LightExtensionError } from '../../shared/errors';
import { LightExtensionContextPackService } from '../services/LightExtensionContextPackService';
import { normalizeReferenceOwnerLocator } from '../services/ReferenceOwnerRegistry';
import {
  createTypedResourceAction,
  getServiceContext,
  type LightExtensionResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const lightExtensionContextActionNames = ['get'] as const;

export function createLightExtensionContextsResource(
  contextPackService: LightExtensionContextPackService,
): ResourceOptions {
  return {
    name: 'lightExtensionContexts',
    only: [...lightExtensionContextActionNames],
    actions: {
      get: createTypedResourceAction({
        services: { contextPackService },
        run: (services, input, currentUser) =>
          services.contextPackService.getContextPack(normalizeContextPackInput(input), currentUser),
        getServiceContext: getContextPackServiceContext,
      }),
    } as Record<(typeof lightExtensionContextActionNames)[number], HandlerType>,
  };
}

function getContextPackServiceContext(ctx: LightExtensionResourceContext) {
  return {
    ...getServiceContext(ctx),
    can: ctx.can,
    currentUser: ctx.auth?.user,
    state: ctx.state,
    timezone: ctx.timezone,
  };
}

function normalizeContextPackInput(input: ResourceActionInput): LightExtensionContextPackInput {
  const referenceId = optionalString(input, 'referenceId');
  const ownerLocator = normalizeReferenceOwnerLocator(input.ownerLocator) || undefined;
  if (referenceId && ownerLocator) {
    throw invalidInput('referenceId and ownerLocator cannot be supplied together');
  }
  return {
    repoId: requireString(input, 'repoId'),
    entryId: requireString(input, 'entryId'),
    ...(referenceId ? { referenceId } : {}),
    ...(ownerLocator ? { ownerLocator } : {}),
  };
}

function requireString(input: ResourceActionInput, key: string): string {
  const value = optionalString(input, key);
  if (!value) {
    throw invalidInput(`${key} is required`);
  }
  return value;
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

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}
