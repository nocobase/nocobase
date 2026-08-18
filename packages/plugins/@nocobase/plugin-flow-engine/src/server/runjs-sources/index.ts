/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { RunJSSourceAdapter } from '@nocobase/runjs/workspace/server';

import { createFlowModelRunJSSourceAdapters } from './flow-model-adapters';

export interface RunJSSourceAdapterRegistrar {
  registerRunJSSourceAdapter(adapter: RunJSSourceAdapter): () => void;
}

export function registerFlowModelRunJSSourceAdapters(db: Database, registrar: RunJSSourceAdapterRegistrar): () => void {
  const unregisterAdapters = createFlowModelRunJSSourceAdapters(db).map((adapter) =>
    registrar.registerRunJSSourceAdapter(adapter),
  );

  return () => {
    unregisterAdapters.forEach((unregister) => unregister());
  };
}
