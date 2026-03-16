/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSchemaManifestContribution } from '@nocobase/flow-engine';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { FormulaField } from './formula-field';
import { flowSchemaManifestContribution } from './flow-schema-manifests';

export class PluginFieldFormulaServer extends Plugin {
  afterAdd() {}

  getFlowSchemaManifests(): FlowSchemaManifestContribution {
    return flowSchemaManifestContribution;
  }

  beforeLoad() {
    this.db.registerFieldTypes({
      formula: FormulaField,
    });

    this.db.addMigrations({
      namespace: this.name,
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
  }

  async load() {}

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldFormulaServer;
