/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import type { LightExtensionRuntimeResolveInput } from '../../shared/types';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';
import { createTypedResourceAction, getServiceContext, type ResourceActionInput } from './resourceAction';

export const lightExtensionRuntimeActionNames = ['resolve'] as const;

type LightExtensionRuntimeActionName = (typeof lightExtensionRuntimeActionNames)[number];
type ResourceActionRunner = (
  service: RuntimeResolveService,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

const resourceActionRunners: Record<LightExtensionRuntimeActionName, ResourceActionRunner> = {
  resolve: (service, input, currentUser) =>
    service.resolve(input as unknown as LightExtensionRuntimeResolveInput, currentUser),
};

export function createLightExtensionRuntimeResource(service: RuntimeResolveService): ResourceOptions {
  return {
    name: 'lightExtensionRuntime',
    only: [...lightExtensionRuntimeActionNames],
    actions: Object.fromEntries(
      lightExtensionRuntimeActionNames.map((actionName) => [
        actionName,
        createLightExtensionRuntimeAction(service, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionRuntimeActionName, HandlerType>,
  };
}

function createLightExtensionRuntimeAction(service: RuntimeResolveService, run: ResourceActionRunner): HandlerType {
  return createTypedResourceAction({
    services: service,
    run,
    getServiceContext,
  });
}
