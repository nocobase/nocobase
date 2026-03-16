/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSchemaManifestContribution } from '@nocobase/flow-engine';
import { coreFieldBindingContextManifests, coreFieldBindingManifests, coreFieldModelManifests } from './field-models';
import { flowSchemaActionManifests } from './actions';
import { flowSchemaModelManifests } from './models';
import { publicBlockRootUses } from './shared';

export * from './actions';
export * from './field-models';
export * from './models';

const publicFlowModelUses = [
  'ActionModel',
  'CreateFormModel',
  'DetailsBlockModel',
  'EditFormModel',
  'FilterFormBlockModel',
  'PageModel',
  'RootPageModel',
  'RouteModel',
  'TableBlockModel',
  'UpdateRecordActionModel',
];

const publicFlowActionNames = Array.from(
  new Set([...flowSchemaActionManifests.map((manifest) => manifest.name)]),
).sort();

const coreDescendantModelUses = Array.from(
  new Set([
    ...coreFieldModelManifests.map((manifest) => manifest.use),
    'AddChildActionModel',
    'AddNewActionModel',
    'AssignFormGridModel',
    'AssignFormItemModel',
    'AssignFormModel',
    'BasePageTabModel',
    'BlockGridModel',
    'BulkDeleteActionModel',
    'DeleteActionModel',
    'DetailsGridModel',
    'DetailsItemModel',
    'EditActionModel',
    'ExpandCollapseActionModel',
    'FilterActionModel',
    'FilterFormCollapseActionModel',
    'FilterFormCustomFieldModel',
    'FilterFormGridModel',
    'FilterFormItemModel',
    'FilterFormJSActionModel',
    'FilterFormResetActionModel',
    'FilterFormSubmitActionModel',
    'FormAssociationItemModel',
    'FormGridModel',
    'FormItemModel',
    'JSCollectionActionModel',
    'JSFormActionModel',
    'JSRecordActionModel',
    'FormSubmitActionModel',
    'JSColumnModel',
    'LinkActionModel',
    'PageTabModel',
    'PopupCollectionActionModel',
    'RefreshActionModel',
    'RootPageTabModel',
    'TableActionsColumnModel',
    'TableColumnModel',
    'TableCustomColumnModel',
    'ViewActionModel',
  ]),
).sort();

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  actions: flowSchemaActionManifests,
  models: [...flowSchemaModelManifests, ...coreFieldModelManifests],
  fieldBindingContexts: coreFieldBindingContextManifests,
  fieldBindings: coreFieldBindingManifests,
  inventory: {
    publicModels: publicFlowModelUses,
    publicActions: publicFlowActionNames,
    publicTreeRoots: Array.from(new Set(publicBlockRootUses)).sort(),
    expectedDescendantModels: coreDescendantModelUses,
    expectedDescendantActions: publicFlowActionNames,
  },
  defaults: {
    source: 'official',
  },
};
