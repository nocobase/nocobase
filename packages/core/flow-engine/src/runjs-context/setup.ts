/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * RunJS context registration entry. No side-effects by default.
 */
import { RunJSContextRegistry } from './registry';
import { FlowRunJSContext } from '../flowContext';
import { defineBaseContextMeta } from './contexts/base';

let done = false;
export async function setupRunJSContexts() {
  if (done) return;
  defineBaseContextMeta();

  // Lazy import to avoid circular dependencies during module initialization
  const [
    { JSBlockRunJSContext },
    { JSFieldRunJSContext },
    { JSItemRunJSContext },
    { JSColumnRunJSContext },
    { FormJSFieldItemRunJSContext },
    { JSRecordActionRunJSContext },
    { JSCollectionActionRunJSContext },
    { LinkageRunJSContext },
  ] = await Promise.all([
    import('./contexts/JSBlockRunJSContext'),
    import('./contexts/JSFieldRunJSContext'),
    import('./contexts/JSItemRunJSContext'),
    import('./contexts/JSColumnRunJSContext'),
    import('./contexts/FormJSFieldItemRunJSContext'),
    import('./contexts/JSRecordActionRunJSContext'),
    import('./contexts/JSCollectionActionRunJSContext'),
    import('./contexts/LinkageRunJSContext'),
  ]);

  const v1 = 'v1';
  RunJSContextRegistry.register(v1, '*', FlowRunJSContext);
  RunJSContextRegistry.register(v1, 'JSBlockModel', JSBlockRunJSContext);
  RunJSContextRegistry.register(v1, 'JSFieldModel', JSFieldRunJSContext);
  RunJSContextRegistry.register(v1, 'JSItemModel', JSItemRunJSContext);
  RunJSContextRegistry.register(v1, 'JSColumnModel', JSColumnRunJSContext);
  RunJSContextRegistry.register(v1, 'FormJSFieldItemModel', FormJSFieldItemRunJSContext);
  RunJSContextRegistry.register(v1, 'JSRecordActionModel', JSRecordActionRunJSContext);
  RunJSContextRegistry.register(v1, 'JSCollectionActionModel', JSCollectionActionRunJSContext);
  RunJSContextRegistry.register(v1, 'LinkageModel', LinkageRunJSContext);
  done = true;
}
