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

  const registerBuiltins = (version: 'v1' | 'v2') => {
    RunJSContextRegistry.register(version, '*', FlowRunJSContext);
    RunJSContextRegistry.register(version, 'JSBlockModel', JSBlockRunJSContext, { scenes: ['block'] });
    RunJSContextRegistry.register(version, 'JSFieldModel', JSFieldRunJSContext, { scenes: ['detail'] });
    RunJSContextRegistry.register(version, 'JSEditableFieldModel', JSEditableFieldRunJSContext, { scenes: ['form'] });
    RunJSContextRegistry.register(version, 'JSItemModel', JSItemRunJSContext, { scenes: ['form'] });
    RunJSContextRegistry.register(version, 'JSColumnModel', JSColumnRunJSContext, { scenes: ['table'] });
    RunJSContextRegistry.register(version, 'FormJSFieldItemModel', FormJSFieldItemRunJSContext, { scenes: ['form'] });
    RunJSContextRegistry.register(version, 'JSRecordActionModel', JSRecordActionRunJSContext, { scenes: ['table'] });
    RunJSContextRegistry.register(version, 'JSCollectionActionModel', JSCollectionActionRunJSContext, {
      scenes: ['table'],
    });
  };

  const versions: Array<'v1' | 'v2'> = ['v1', 'v2'];
  for (const version of versions) {
    registerBuiltins(version);
    await applyRunJSContextContributions(version);
    markRunJSContextsSetupDone(version);
  }

  done = true;
}
