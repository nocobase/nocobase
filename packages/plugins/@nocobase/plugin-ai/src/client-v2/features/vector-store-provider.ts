/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FormInstance } from 'antd';
import type { ComponentType } from 'react';

export type VectorStorePropFormValues = Record<string, string | undefined>;

export interface VectorStoreProviderFeature {
  register(vsp: VectorStoreProvider): void;
  providerNames: string[];
  providerTitles: Map<string, string | undefined>;
  getComponents(name: string): VectorStoreProvider['components'];
}

export type VectorStoreProvider = {
  name: string;
  title?: string;
  components: Partial<{
    vectorStorePropForm: ComponentType<{ form: FormInstance<VectorStorePropFormValues> }>;
  }>;
};

export type VectorStoreProp = {
  name?: string;
  key: string;
  value: unknown;
};

export type VectorStorePropField = {
  label?: string;
  key: string;
  tooltip?: string;
  required?: boolean;
  password?: boolean;
};
