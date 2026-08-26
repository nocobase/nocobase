/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PluginFeatureManager } from './feature-manager';
import type { VectorDatabaseProviderFeature } from './vector-database-provider';
import type { VectorStoreProviderFeature } from './vector-store-provider';

export type AIPluginFeatures = {
  vectorDatabaseProvider: VectorDatabaseProviderFeature;
  vectorStoreProvider: VectorStoreProviderFeature;
};

export interface AIPluginFeatureManager extends PluginFeatureManager<AIPluginFeatures> {
  get vectorDatabaseProvider(): VectorDatabaseProviderFeature;
  get vectorStoreProvider(): VectorStoreProviderFeature;
}

export type { PluginFeatureManager } from './feature-manager';
export type { VectorDatabaseProviderFeature, VectorDatabaseProviderComponents } from './vector-database-provider';
export type {
  VectorStoreProviderFeature,
  VectorStoreProvider,
  VectorStoreProp,
  VectorStorePropFormValues,
  VectorStorePropField,
} from './vector-store-provider';
