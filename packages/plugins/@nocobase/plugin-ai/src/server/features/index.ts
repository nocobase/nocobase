/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PluginFeatureManager } from './feature-manager';
import { KnowledgeBaseFeature } from './knowledge-base';
import type { VectorDatabaseFeature } from './vector-database';
import type { VectorDatabaseProviderFeature } from './vector-database-provider';
import { VectorStoreProviderFeature } from './vector-store-provider';

export type AIPluginFeatures = {
  vectorDatabase: VectorDatabaseFeature;
  vectorDatabaseProvider: VectorDatabaseProviderFeature;
  vectorStoreProvider: VectorStoreProviderFeature;
  knowledgeBase: KnowledgeBaseFeature;
};

export interface AIPluginFeatureManager extends PluginFeatureManager<AIPluginFeatures> {
  get vectorDatabase(): VectorDatabaseFeature;
  get vectorDatabaseProvider(): VectorDatabaseProviderFeature;
  get vectorStoreProvider(): VectorStoreProviderFeature;
  get knowledgeBase(): KnowledgeBaseFeature;
}

export type { VectorDatabaseFeature, VectorDatabaseInfo } from './vector-database';
export type {
  VectorDatabaseProviderFeature,
  VectorDatabaseProviderInfo,
  VectorDatabaseProvider,
} from './vector-database-provider';
export type {
  VectorStoreProviderFeature,
  VectorStoreProvider,
  VectorStoreService,
  VectorStoreSearchOptions,
  DocumentSegmented,
  DocumentSegmentedWithScore,
} from './vector-store-provider';
export type { KnowledgeBaseFeature } from './knowledge-base';
export type { PluginFeatureKeys, PluginFeatureManager } from './feature-manager';
export { BasePluginFeatureManager } from './feature-manager';
