/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import type { Converters, ContextSelectorItem } from '../types';
import { createDefaultConverters } from '../utils';

export const useVariableConverters = (
  propConverters?: Converters | ((contextSelectorItem: ContextSelectorItem | null) => Converters),
  currentContextSelectorItem?: ContextSelectorItem | null,
): Converters => {
  return useMemo(() => {
    const defaultConverters = createDefaultConverters();

    if (!propConverters) {
      return defaultConverters;
    }

    if (typeof propConverters === 'function') {
      const dynamicConverters = propConverters(currentContextSelectorItem || null);
      return { ...defaultConverters, ...dynamicConverters };
    }

    return { ...defaultConverters, ...propConverters };
  }, [propConverters, currentContextSelectorItem]);
};
