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

const FILTER_FORM_FLOW_KEYS = ['filterFormItemSettings'];

const getLegacyFilterFormItemInitialValue = createLegacyValueExtractor(FILTER_FORM_FLOW_KEYS);
const clearLegacyFilterFormItemInitialValue = createLegacyClearer(FILTER_FORM_FLOW_KEYS);

export function collectLegacyDefaultValueRulesFromFilterFormModel(filterFormModel: any): FieldAssignRuleItem[] {
  return collectLegacyDefaultValueRules(filterFormModel, getLegacyFilterFormItemInitialValue);
}

export function clearLegacyDefaultValuesFromFilterFormModel(filterFormModel: any): any[] {
  return clearLegacyDefaultValues(
    filterFormModel,
    getLegacyFilterFormItemInitialValue,
    clearLegacyFilterFormItemInitialValue,
  );
}

export { mergeAssignRulesWithLegacyDefaults };
