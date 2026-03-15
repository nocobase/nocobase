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
import { dataScopeSchemaManifest } from './dataScope';
import { detailsFieldLinkageRulesSchemaManifest } from './detailsFieldLinkageRules';
import { fieldLinkageRulesSchemaManifest } from './fieldLinkageRules';
import { filterFormDefaultValuesSchemaManifest } from './filterFormDefaultValues';
import { formAssignRulesSchemaManifest } from './formAssignRules';
import { layoutSchemaManifest } from './layout';
import { linkageRulesRefreshSchemaManifest } from './linkageRulesRefresh';
import { openViewSchemaManifest } from './openView';
import { sortingRuleSchemaManifest } from './sortingRule';

export {
  aclCheckSchemaManifest,
  aclCheckRefreshSchemaManifest,
  actionLinkageRulesSchemaManifest,
  confirmSchemaManifest,
  dataScopeSchemaManifest,
  detailsFieldLinkageRulesSchemaManifest,
  fieldLinkageRulesSchemaManifest,
  filterFormDefaultValuesSchemaManifest,
  formAssignRulesSchemaManifest,
  layoutSchemaManifest,
  linkageRulesRefreshSchemaManifest,
  openViewSchemaManifest,
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
];
