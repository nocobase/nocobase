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
import { applyRunJSContextContributions, markRunJSContextsSetupDone } from './contributions';

let done = false;
export async function setupRunJSContexts() {
  if (done) return;
  defineBaseContextMeta();

  // Lazy import to avoid circular dependencies during module initialization
  const [
    { JSBlockRunJSContext },
    { JSFieldRunJSContext },
    { JSEditableFieldRunJSContext },
    { JSItemRunJSContext },
    { JSColumnRunJSContext },
    { FormJSFieldItemRunJSContext },
    { JSRecordActionRunJSContext },
    { JSCollectionActionRunJSContext },
  ] = await Promise.all([
    import('./contexts/JSBlockRunJSContext'),
    import('./contexts/JSFieldRunJSContext'),
    import('./contexts/JSEditableFieldRunJSContext'),
    import('./contexts/JSItemRunJSContext'),
    import('./contexts/JSColumnRunJSContext'),
    import('./contexts/FormJSFieldItemRunJSContext'),
    import('./contexts/JSRecordActionRunJSContext'),
    import('./contexts/JSCollectionActionRunJSContext'),
  ]);

  const v1 = 'v1';
  RunJSContextRegistry.register(v1, '*', FlowRunJSContext);
  RunJSContextRegistry.register(v1, 'JSBlockModel', JSBlockRunJSContext, { scenes: ['block'] });
  RunJSContextRegistry.register(v1, 'JSFieldModel', JSFieldRunJSContext, { scenes: ['detail'] });
  RunJSContextRegistry.register(v1, 'JSEditableFieldModel', JSEditableFieldRunJSContext, { scenes: ['form'] });
  RunJSContextRegistry.register(v1, 'JSItemModel', JSItemRunJSContext, { scenes: ['form'] });
  RunJSContextRegistry.register(v1, 'JSColumnModel', JSColumnRunJSContext, { scenes: ['table'] });
  RunJSContextRegistry.register(v1, 'FormJSFieldItemModel', FormJSFieldItemRunJSContext, { scenes: ['form'] });
  RunJSContextRegistry.register(v1, 'JSRecordActionModel', JSRecordActionRunJSContext, { scenes: ['table'] });
  RunJSContextRegistry.register(v1, 'JSCollectionActionModel', JSCollectionActionRunJSContext, { scenes: ['table'] });
  await applyRunJSContextContributions(v1);
  done = true;
  markRunJSContextsSetupDone(v1);
}
