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

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  actions: flowSchemaActionManifests,
  models: flowSchemaModelManifests,
  defaults: {
    source: 'official',
  },
};
