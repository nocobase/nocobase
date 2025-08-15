/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelContext } from '@nocobase/flow-engine';
import React from 'react';

export interface VectorDatabaseProviderFeature {
  registerComponent(providerComponents: VectorDatabaseProviderComponents): void;
  getComponents(providerName: string): VectorDatabaseProviderComponents;
}

export type VectorDatabaseProviderComponents = {
  name: string;
  formComponent: (ctx: FlowModelContext, record?: unknown) => React.JSX.Element;
};
