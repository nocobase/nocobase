/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionReferenceListInput, LightExtensionReferenceRebuildInput } from '../../shared/types';
import { ReferenceService } from '../services/ReferenceService';
import { normalizeReferenceOwnerLocator } from '../services/ReferenceOwnerRegistry';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import {
  createTypedResourceAction,
  getServiceContext,
  type LightExtensionResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const lightExtensionReferenceActionNames = ['readReferences', 'rebuildIndex'] as const;

type LightExtensionReferenceActionName = (typeof lightExtensionReferenceActionNames)[number];
type ResourceActionRunner = (
  services: LightExtensionReferenceActionServices,
  input: ResourceActionInput,
  currentUser: ReturnType<typeof getReferenceServiceContext>,
) => Promise<unknown>;

interface LightExtensionReferenceActionServices {
  referenceService: ReferenceService;
}

const resourceActionRunners: Record<LightExtensionReferenceActionName, ResourceActionRunner> = {
  readReferences: (services, input, currentUser) =>
    services.referenceService.readReferences(normalizeListInput(input), currentUser),
  rebuildIndex: (services, input, currentUser) =>
    services.referenceService.rebuildIndex(normalizeRebuildInput(input), currentUser),
};

export function createLightExtensionReferencesResource(referenceService: ReferenceService): ResourceOptions {
  const services = {
    referenceService,
  };

  return {
    name: 'lightExtensionReferences',
    only: [...lightExtensionReferenceActionNames],
    actions: Object.fromEntries(
      lightExtensionReferenceActionNames.map((actionName) => [
        actionName,
        createLightExtensionReferenceAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionReferenceActionName, HandlerType>,
  };
}

function createLightExtensionReferenceAction(
  services: LightExtensionReferenceActionServices,
  run: ResourceActionRunner,
): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext: getReferenceServiceContext,
  });
}

function getReferenceServiceContext(ctx: LightExtensionResourceContext): LightExtensionServiceContext & {
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

function normalizeListInput(input: ResourceActionInput): LightExtensionReferenceListInput {
  return {
    repoId: optionalString(input, 'repoId'),
    entryId: optionalString(input, 'entryId'),
    ownerLocator: normalizeOwnerLocator(input.ownerLocator),
  };
}

function normalizeRebuildInput(input: ResourceActionInput): LightExtensionReferenceRebuildInput {
  return {
    rootUid: optionalString(input, 'rootUid') || optionalString(input, 'uid'),
    repoId: optionalString(input, 'repoId'),
    ownerLocator: normalizeOwnerLocator(input.ownerLocator),
    dryRun: optionalBoolean(input, 'dryRun'),
  };
}

function normalizeOwnerLocator(value: unknown): LightExtensionReferenceListInput['ownerLocator'] {
  const normalized = normalizeReferenceOwnerLocator(value);
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

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}
