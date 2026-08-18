/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { useCallback } from 'react';

import { NAMESPACE } from '../constants';

type TranslationOptions = Record<string, unknown>;

const exactTExpressionPattern = /^\s*\{\{\s*t\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*[^)]*)?\)\s*\}\}\s*$/;

export function useT() {
  const engine = useFlowEngine();

  return useCallback(
    (key: string, options?: TranslationOptions) => {
      const exactTExpression = exactTExpressionPattern.exec(key);
      const translationKey = exactTExpression?.[1] || key;

      return engine.context.t(translationKey, {
        ns: [NAMESPACE, 'client'],
        nsMode: 'fallback',
        ...options,
      });
    },
    [engine],
  );
}
