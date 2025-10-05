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
import './contexts/base';
import { JSBlockRunJSContext } from './contexts/JSBlockRunJSContext';
import { JSFieldRunJSContext } from './contexts/JSFieldRunJSContext';
import { JSItemRunJSContext } from './contexts/JSItemRunJSContext';
import { FormJSFieldItemRunJSContext } from './contexts/FormJSFieldItemRunJSContext';
import { JSRecordActionRunJSContext } from './contexts/JSRecordActionRunJSContext';
import { JSCollectionActionRunJSContext } from './contexts/JSCollectionActionRunJSContext';
import { LinkageRunJSContext } from './contexts/LinkageRunJSContext';

let done = false;
export function setupRunJSContexts() {
  if (done) return;
  const v1: any = 'v1';
  RunJSContextRegistry.register(v1, '*', FlowRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSBlockModel', JSBlockRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSFieldModel', JSFieldRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSItemModel', JSItemRunJSContext as any);
  RunJSContextRegistry.register(v1, 'FormJSFieldItemModel', FormJSFieldItemRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSRecordActionModel', JSRecordActionRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSCollectionActionModel', JSCollectionActionRunJSContext as any);
  RunJSContextRegistry.register(v1, 'LinkageModel', LinkageRunJSContext as any);
  done = true;
}
