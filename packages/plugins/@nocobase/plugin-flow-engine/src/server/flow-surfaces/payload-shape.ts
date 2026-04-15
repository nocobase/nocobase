/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from './errors';
import { FLOW_SURFACE_INTERNAL_META_KEY } from './planning/key-registry';

export function validateFlowSurfacePayloadShape(actionName: string, value: any, path: string) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateFlowSurfacePayloadShape(actionName, item, `${path}[${index}]`));
    return;
  }
  if (!_.isPlainObject(value)) {
    return;
  }
  if (
    _.isPlainObject(value.stepParams) &&
    Object.prototype.hasOwnProperty.call(value.stepParams, FLOW_SURFACE_INTERNAL_META_KEY)
  ) {
    throwBadRequest(`flowSurfaces ${actionName} ${path}.stepParams.${FLOW_SURFACE_INTERNAL_META_KEY} is reserved`);
  }
  if (
    _.isPlainObject(value.template) &&
    (Object.prototype.hasOwnProperty.call(value, 'mode') ||
      Object.prototype.hasOwnProperty.call(value, 'blocks') ||
      Object.prototype.hasOwnProperty.call(value, 'layout'))
  ) {
    throwBadRequest(`flowSurfaces ${actionName} ${path} cannot mix template with local popup content`);
  }
  Object.entries(value).forEach(([key, child]) => validateFlowSurfacePayloadShape(actionName, child, `${path}.${key}`));
}
