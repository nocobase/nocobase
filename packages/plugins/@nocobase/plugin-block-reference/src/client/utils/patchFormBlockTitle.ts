/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormBlockModel } from '@nocobase/client';
import { NAMESPACE } from '../locale';

const PATCH_FLAG = '__pluginBlockReference_patchedFieldTemplateTitle';

function getFieldTemplateTitleSuffix(model: FormBlockModel): { suffix: string; label: string } | null {
  const grid = (model as any)?.subModels?.grid;
  const gridUse = grid?.use || grid?.constructor?.name;
  if (gridUse !== 'ReferenceFormGridModel') return null;

  const target = grid?.getStepParams?.('referenceFormGridSettings', 'target');
  const templateName = (target?.templateName || '').toString().trim();
  const templateUid = (target?.templateUid || '').toString().trim();

  const label = (model as any)?.translate?.('Field template', { ns: [NAMESPACE, 'client'] }) || 'Field template';
  const name = templateName || templateUid;
  const suffix = name ? `(${label}: ${name})` : `(${label})`;
  return { suffix, label };
}

function getPrototypeTitleGetter(proto: object): (() => unknown) | undefined {
  let cur: any = proto;
  while (cur) {
    const desc = Object.getOwnPropertyDescriptor(cur, 'title');
    if (desc?.get) return desc.get;
    cur = Object.getPrototypeOf(cur);
  }
  return undefined;
}

export function patchFormBlockTitleForFieldTemplateReference() {
  const proto = FormBlockModel.prototype;
  const existing = Object.getOwnPropertyDescriptor(proto, 'title');
  if (existing?.get && (existing.get as any)[PATCH_FLAG]) return;

  const baseGet = getPrototypeTitleGetter(proto);
  if (!baseGet) {
    throw new Error('[block-reference] Failed to resolve base title getter for FormBlockModel.');
  }

  const patchedGet = function patchedTitle(this: any) {
    const baseTitle = baseGet.call(this) as any;
    if (typeof baseTitle !== 'string') return baseTitle;

    const resolved = getFieldTemplateTitleSuffix(this);
    if (!resolved) return baseTitle;

    if (baseTitle.includes(`(${resolved.label}`)) return baseTitle;
    return `${baseTitle}${resolved.suffix}`;
  };
  (patchedGet as any)[PATCH_FLAG] = true;

  Object.defineProperty(proto, 'title', {
    get: patchedGet,
    configurable: true,
    enumerable: existing?.enumerable ?? false,
  });
}
