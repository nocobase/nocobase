/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaManifest } from '@nocobase/flow-engine';
import { aclCheckSchemaManifest } from './aclCheck';
import { aclCheckRefreshSchemaManifest } from './aclCheckRefresh';
import { actionLinkageRulesSchemaManifest } from './actionLinkageRules';
import { confirmSchemaManifest } from './confirm';
import { customVariableSchemaManifest } from './customVariable';
import { dataScopeSchemaManifest } from './dataScope';
import { detailsFieldLinkageRulesSchemaManifest } from './detailsFieldLinkageRules';
import { fieldLinkageRulesSchemaManifest } from './fieldLinkageRules';
import { filterFormDefaultValuesSchemaManifest } from './filterFormDefaultValues';
import { formAssignRulesSchemaManifest } from './formAssignRules';
import { layoutSchemaManifest } from './layout';
import { linkageRulesRefreshSchemaManifest } from './linkageRulesRefresh';
import { navigateToURLSchemaManifest } from './navigateToURL';
import { openViewSchemaManifest } from './openView';
import { refreshTargetBlocksSchemaManifest } from './refreshTargetBlocks';
import { runjsSchemaManifest } from './runjs';
import { setTargetDataScopeSchemaManifest } from './setTargetDataScope';
import { showMessageSchemaManifest } from './showMessage';
import { showNotificationSchemaManifest } from './showNotification';
import { sortingRuleSchemaManifest } from './sortingRule';

export {
  aclCheckSchemaManifest,
  aclCheckRefreshSchemaManifest,
  actionLinkageRulesSchemaManifest,
  confirmSchemaManifest,
  customVariableSchemaManifest,
  dataScopeSchemaManifest,
  detailsFieldLinkageRulesSchemaManifest,
  fieldLinkageRulesSchemaManifest,
  filterFormDefaultValuesSchemaManifest,
  formAssignRulesSchemaManifest,
  layoutSchemaManifest,
  linkageRulesRefreshSchemaManifest,
  navigateToURLSchemaManifest,
  openViewSchemaManifest,
  refreshTargetBlocksSchemaManifest,
  runjsSchemaManifest,
  setTargetDataScopeSchemaManifest,
  showMessageSchemaManifest,
  showNotificationSchemaManifest,
  sortingRuleSchemaManifest,
};

export const flowSchemaActionManifests: FlowActionSchemaManifest[] = [
  layoutSchemaManifest,
  dataScopeSchemaManifest,
  sortingRuleSchemaManifest,
  formAssignRulesSchemaManifest,
  fieldLinkageRulesSchemaManifest,
  actionLinkageRulesSchemaManifest,
  detailsFieldLinkageRulesSchemaManifest,
  aclCheckSchemaManifest,
  aclCheckRefreshSchemaManifest,
  linkageRulesRefreshSchemaManifest,
  openViewSchemaManifest,
  confirmSchemaManifest,
  filterFormDefaultValuesSchemaManifest,
  showMessageSchemaManifest,
  showNotificationSchemaManifest,
  navigateToURLSchemaManifest,
  refreshTargetBlocksSchemaManifest,
  setTargetDataScopeSchemaManifest,
  customVariableSchemaManifest,
  runjsSchemaManifest,
];
