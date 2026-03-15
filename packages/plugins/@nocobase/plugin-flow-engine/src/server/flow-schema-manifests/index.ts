/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSchemaManifestContribution } from '@nocobase/flow-engine';
import { flowSchemaActionManifests } from './actions';
import { flowSchemaModelManifests } from './models';

export * from './actions';
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

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  actions: flowSchemaActionManifests,
  models: flowSchemaModelManifests,
  inventory: {
    publicModels: publicFlowModelUses,
    publicActions: publicFlowActionNames,
  },
  defaults: {
    source: 'official',
  },
};
