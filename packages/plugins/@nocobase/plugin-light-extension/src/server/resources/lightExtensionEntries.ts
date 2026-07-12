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
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';
import {
  createTypedResourceAction,
  getServiceContext,
  type LightExtensionResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const lightExtensionEntryActionNames = ['list', 'get', 'listSelectable'] as const;

type LightExtensionEntryActionName = (typeof lightExtensionEntryActionNames)[number];
type ResourceActionRunner = (
  services: LightExtensionEntryActionServices,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

interface LightExtensionEntryActionServices {
  entryService: LightExtensionEntryService;
  runtimeResolveService: RuntimeResolveService;
}

const resourceActionRunners: Record<LightExtensionEntryActionName, ResourceActionRunner> = {
  list: (services, input, currentUser) => services.entryService.listEntries(requireRepoId(input), currentUser),
  get: (services, input, currentUser) => services.entryService.getEntry(requireEntryId(input), currentUser),
  listSelectable: (services, input, currentUser) =>
    services.runtimeResolveService.listSelectableEntries(
      {
        repoId: optionalString(input, 'repoId'),
        kind: optionalString(input, 'kind'),
      },
      currentUser,
    ),
};

export function createLightExtensionEntriesResource(
  entryService: LightExtensionEntryService,
  runtimeResolveService: RuntimeResolveService,
): ResourceOptions {
  const services = {
    entryService,
    runtimeResolveService,
  };

  return {
    name: 'lightExtensionEntries',
    only: [...lightExtensionEntryActionNames],
    actions: Object.fromEntries(
      lightExtensionEntryActionNames.map((actionName) => [
        actionName,
        createLightExtensionEntryAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionEntryActionName, HandlerType>,
  };
}

function createLightExtensionEntryAction(
  services: LightExtensionEntryActionServices,
  run: ResourceActionRunner,
): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext: (ctx) => getEntryServiceContext(ctx),
  });
}

function getEntryServiceContext(ctx: LightExtensionResourceContext): LightExtensionServiceContext {
  return {
    ...getServiceContext(ctx),
    can: ctx.can,
  };
}

function requireRepoId(input: ResourceActionInput): string {
  return requireString(
    {
      repoId: input.repoId || input.filterByTk,
    },
    'repoId',
  );
}

function requireEntryId(input: ResourceActionInput): string {
  return requireString(
    {
      entryId: input.entryId || input.filterByTk,
    },
    'entryId',
  );
}

function optionalString(input: ResourceActionInput, key: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${key} must be a string`);
  }

  return value;
}

function requireString(input: ResourceActionInput, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${key} is required`);
  }

  return value.trim();
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}
