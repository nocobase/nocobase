/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

function normalizeTemplateRefText(value: any) {
  return typeof value === 'string' ? value.trim() : String(value || '').trim();
}

export function hasFlowSurfaceTemplateDocument(template: any) {
  return _.isPlainObject(template) && !!normalizeTemplateRefText(template.uid);
}

export function hasFlowSurfaceTemplateReference(template: any) {
  return (
    _.isPlainObject(template) &&
    (!!normalizeTemplateRefText(template.uid) || !!normalizeTemplateRefText(template.local))
  );
}
