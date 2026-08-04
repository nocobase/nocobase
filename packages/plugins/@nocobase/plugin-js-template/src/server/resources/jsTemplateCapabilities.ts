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

import { JsTemplateValidator } from '../services/JsTemplateValidator';

export const jsTemplateCapabilitiesActionNames = ['get'] as const;

type JsTemplateCapabilitiesContext = Context & { body?: unknown };

export function createJsTemplateCapabilitiesResource(validator: JsTemplateValidator): ResourceOptions {
  return {
    name: 'jsTemplateCapabilities',
    only: [...jsTemplateCapabilitiesActionNames],
    actions: {
      get: createJsTemplateCapabilitiesGetAction(validator),
    },
  };
}

function createJsTemplateCapabilitiesGetAction(validator: JsTemplateValidator): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as JsTemplateCapabilitiesContext;
    resourceCtx.body = validator.getCapabilities();
    await next();
  };
}
