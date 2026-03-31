/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginFeatureManager } from './feature-manager';
import type { VectorDatabaseProviderFeature } from './vector-database-provider';

export type AIPluginFeatures = {
  vectorDatabaseProvider: VectorDatabaseProviderFeature;
};

export interface AIPluginFeatureManager extends PluginFeatureManager<AIPluginFeatures> {
  get vectorDatabaseProvider(): VectorDatabaseProviderFeature;
}

export type { VectorDatabaseProviderFeature, VectorDatabaseProviderComponents } from './vector-database-provider';
