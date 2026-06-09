/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AIPluginFeatureManager,
  AIPluginFeatures,
  VectorDatabaseProviderFeature,
  VectorStoreProviderFeature,
} from '../features';
import { BasePluginFeatureManager } from '../features/feature-manager';

export class AIPluginFeatureManagerImpl
  extends BasePluginFeatureManager<AIPluginFeatures>
  implements AIPluginFeatureManager
{
  get vectorDatabaseProvider(): VectorDatabaseProviderFeature {
    if (!this.features.vectorDatabaseProvider) {
      throw this.featureNotSupportedError('vectorDatabaseProvider');
    }
    return this.features.vectorDatabaseProvider;
  }

  get vectorStoreProvider(): VectorStoreProviderFeature {
    if (!this.features.vectorStoreProvider) {
      throw this.featureNotSupportedError('vectorStoreProvider');
    }
    return this.features.vectorStoreProvider;
  }

  private featureNotSupportedError(featureName: string) {
    return new Error(`${featureName} is not supported`);
  }
}
