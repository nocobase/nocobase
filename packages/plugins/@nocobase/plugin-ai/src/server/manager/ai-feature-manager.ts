/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AIPluginFeatureManager,
  AIPluginFeatures,
  VectorDatabaseFeature,
  VectorDatabaseProviderFeature,
} from '../features';
import { BasePluginFeatureManager } from '../features/feature-manager';

export class AIPluginFeatureManagerImpl
  extends BasePluginFeatureManager<AIPluginFeatures>
  implements AIPluginFeatureManager
{
  get vectorDatabase(): VectorDatabaseFeature {
    if (!this.features.vectorDatabase) {
      throw this.featureNotSupportedError('vectorDatabase');
    }
    return this.features.vectorDatabase;
  }

  get vectorDatabaseProvider(): VectorDatabaseProviderFeature {
    if (!this.features.vectorDatabaseProvider) {
      throw this.featureNotSupportedError('vectorDatabaseProvider');
    }
    return this.features.vectorDatabaseProvider;
  }

  private featureNotSupportedError(featureName: string) {
    return new Error(`${featureName} is not supported`);
  }
}
