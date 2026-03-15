/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSchemaManifestContribution } from '@nocobase/flow-engine';
import { Plugin } from '@nocobase/server';
import { flowSchemaManifestContribution } from './flow-schema-manifests';

export class PluginActionBulkEditServer extends Plugin {
  getFlowSchemaManifests(): FlowSchemaManifestContribution {
    return flowSchemaManifestContribution;
  }
}

export default PluginActionBulkEditServer;
