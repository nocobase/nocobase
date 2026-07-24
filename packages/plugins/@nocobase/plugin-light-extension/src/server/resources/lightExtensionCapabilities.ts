/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { LightExtensionValidator } from '../services/LightExtensionValidator';

export const lightExtensionCapabilitiesActionNames = ['get'] as const;

type LightExtensionCapabilitiesContext = Context & {
  state?: {
    lightExtensionCapabilitiesAlias?: boolean;
  };
  withoutDataWrapping?: boolean;
  body?: unknown;
};

export function createLightExtensionCapabilitiesResource(validator: LightExtensionValidator): ResourceOptions {
  return {
    name: 'lightExtensionCapabilities',
    only: [...lightExtensionCapabilitiesActionNames],
    actions: {
      get: createLightExtensionCapabilitiesGetAction(validator),
    },
  };
}

function createLightExtensionCapabilitiesGetAction(validator: LightExtensionValidator): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as LightExtensionCapabilitiesContext;
    if (resourceCtx.state?.lightExtensionCapabilitiesAlias) {
      resourceCtx.withoutDataWrapping = true;
    }
    resourceCtx.body = validator.getCapabilities();
    await next();
  };
}
