/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

export function withDynamicSchemaProps<T = any>(Component: React.ComponentType<T>, options?: { displayName?: string }) {
  if (options?.displayName) {
    Component.displayName = options.displayName;
  }

  return Component;
}

export function useCompile() {
  return (value: any) => value;
}
