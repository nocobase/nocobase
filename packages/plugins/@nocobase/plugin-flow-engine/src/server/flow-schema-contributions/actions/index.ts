/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '../../flow-schema-registry';
import { aclCheckSchemaContribution } from './aclCheck';
import { aclCheckRefreshSchemaContribution } from './aclCheckRefresh';
import { actionLinkageRulesSchemaContribution } from './actionLinkageRules';
import { confirmSchemaContribution } from './confirm';
import { customVariableSchemaContribution } from './customVariable';
import { dataScopeSchemaContribution } from './dataScope';
import { detailsFieldLinkageRulesSchemaContribution } from './detailsFieldLinkageRules';
import { fieldLinkageRulesSchemaContribution } from './fieldLinkageRules';
import { filterFormDefaultValuesSchemaContribution } from './filterFormDefaultValues';
import { formAssignRulesSchemaContribution } from './formAssignRules';
import { layoutSchemaContribution } from './layout';
import { linkageRulesRefreshSchemaContribution } from './linkageRulesRefresh';
import { navigateToURLSchemaContribution } from './navigateToURL';
import { openViewSchemaContribution } from './openView';
import { refreshTargetBlocksSchemaContribution } from './refreshTargetBlocks';
import { runjsSchemaContribution } from './runjs';
import { setTargetDataScopeSchemaContribution } from './setTargetDataScope';
import { showMessageSchemaContribution } from './showMessage';
import { showNotificationSchemaContribution } from './showNotification';
import { sortingRuleSchemaContribution } from './sortingRule';

export {
  aclCheckSchemaContribution,
  aclCheckRefreshSchemaContribution,
  actionLinkageRulesSchemaContribution,
  confirmSchemaContribution,
  customVariableSchemaContribution,
  dataScopeSchemaContribution,
  detailsFieldLinkageRulesSchemaContribution,
  fieldLinkageRulesSchemaContribution,
  filterFormDefaultValuesSchemaContribution,
  formAssignRulesSchemaContribution,
  layoutSchemaContribution,
  linkageRulesRefreshSchemaContribution,
  navigateToURLSchemaContribution,
  openViewSchemaContribution,
  refreshTargetBlocksSchemaContribution,
  runjsSchemaContribution,
  setTargetDataScopeSchemaContribution,
  showMessageSchemaContribution,
  showNotificationSchemaContribution,
  sortingRuleSchemaContribution,
};

export const flowSchemaActionContributions: FlowActionSchemaContribution[] = [
  layoutSchemaContribution,
  dataScopeSchemaContribution,
  sortingRuleSchemaContribution,
  formAssignRulesSchemaContribution,
  fieldLinkageRulesSchemaContribution,
  actionLinkageRulesSchemaContribution,
  detailsFieldLinkageRulesSchemaContribution,
  aclCheckSchemaContribution,
  aclCheckRefreshSchemaContribution,
  linkageRulesRefreshSchemaContribution,
  openViewSchemaContribution,
  confirmSchemaContribution,
  filterFormDefaultValuesSchemaContribution,
  showMessageSchemaContribution,
  showNotificationSchemaContribution,
  navigateToURLSchemaContribution,
  refreshTargetBlocksSchemaContribution,
  setTargetDataScopeSchemaContribution,
  customVariableSchemaContribution,
  runjsSchemaContribution,
];
