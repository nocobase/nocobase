/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  collectLegacyDefaultValueRules,
  clearLegacyDefaultValues,
  createLegacyClearer,
  createLegacyValueExtractor,
  mergeAssignRulesWithLegacyDefaults,
} from '../shared/legacyDefaultValueMigrationBase';
import type { FieldAssignRuleItem } from '../../../components/FieldAssignRulesEditor';

const FORM_FLOW_KEYS = ['editItemSettings', 'formItemSettings'];

const getLegacyFieldInitialValue = createLegacyValueExtractor(FORM_FLOW_KEYS);
const clearLegacyFieldInitialValue = createLegacyClearer(FORM_FLOW_KEYS);

export function collectLegacyDefaultValueRulesFromFormModel(formModel: any): FieldAssignRuleItem[] {
  return collectLegacyDefaultValueRules(formModel, getLegacyFieldInitialValue);
}

export function clearLegacyDefaultValuesFromFormModel(formModel: any): any[] {
  return clearLegacyDefaultValues(formModel, getLegacyFieldInitialValue, clearLegacyFieldInitialValue);
}

export { mergeAssignRulesWithLegacyDefaults };
