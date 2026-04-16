/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { coerceForToOneField } from '../../../internal/utils/associationValueCoercion';

export const interfacesOfUnsupportedDefaultValue = [
  'o2o',
  'oho',
  'obo',
  'o2m',
  'attachment',
  'expression',
  'point',
  'lineString',
  'circle',
  'polygon',
  'sequence',
  'formula',
];

export function hasOwnInitialValueConfig(model: {
  getProps?: () => Record<string, any>;
  props?: Record<string, any>;
  getStepParams?: (flowKey: string, stepKey: string) => any;
}) {
  const props = typeof model?.getProps === 'function' ? model.getProps() : model?.props;
  if (props && Object.prototype.hasOwnProperty.call(props, 'initialValue')) {
    return true;
  }

  try {
    const fromEdit = model?.getStepParams?.('editItemSettings', 'initialValue');
    if (fromEdit && Object.prototype.hasOwnProperty.call(fromEdit, 'defaultValue')) {
      return true;
    }

    const fromLegacy = model?.getStepParams?.('formItemSettings', 'initialValue');
    if (fromLegacy && Object.prototype.hasOwnProperty.call(fromLegacy, 'defaultValue')) {
      return true;
    }
  } catch {
    // ignore legacy step access failures
  }

  return false;
}

export function resolveCollectionFieldInitialValue(collectionField: any) {
  const iface = collectionField?.interface;
  if (!collectionField || interfacesOfUnsupportedDefaultValue?.includes?.(iface)) {
    return undefined;
  }

  const defaultValue = collectionField.defaultValue;
  if (typeof defaultValue === 'undefined') {
    return undefined;
  }

  return coerceForToOneField(collectionField, defaultValue);
}
