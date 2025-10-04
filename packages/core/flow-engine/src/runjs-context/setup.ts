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
import {
  JSBlockRunJSContext,
  JSFieldRunJSContext,
  JSItemRunJSContext,
  FormJSFieldItemRunJSContext,
  JSRecordActionRunJSContext,
  JSCollectionActionRunJSContext,
  LinkageRunJSContext,
} from './flowRunJSContext';
import './docs';

let done = false;
export function setupRunJSContexts() {
  if (done) return;
  const v1: any = 'v1';
  const latest: any = 'latest';
  RunJSContextRegistry.register(v1, '*', FlowRunJSContext as any);
  RunJSContextRegistry.register(latest, '*', FlowRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSBlockModel', JSBlockRunJSContext as any);
  RunJSContextRegistry.register(latest, 'JSBlockModel', JSBlockRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSFieldModel', JSFieldRunJSContext as any);
  RunJSContextRegistry.register(latest, 'JSFieldModel', JSFieldRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSItemModel', JSItemRunJSContext as any);
  RunJSContextRegistry.register(latest, 'JSItemModel', JSItemRunJSContext as any);
  RunJSContextRegistry.register(v1, 'FormJSFieldItemModel', FormJSFieldItemRunJSContext as any);
  RunJSContextRegistry.register(latest, 'FormJSFieldItemModel', FormJSFieldItemRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSRecordActionModel', JSRecordActionRunJSContext as any);
  RunJSContextRegistry.register(latest, 'JSRecordActionModel', JSRecordActionRunJSContext as any);
  RunJSContextRegistry.register(v1, 'JSCollectionActionModel', JSCollectionActionRunJSContext as any);
  RunJSContextRegistry.register(latest, 'JSCollectionActionModel', JSCollectionActionRunJSContext as any);
  RunJSContextRegistry.register(v1, 'LinkageModel', LinkageRunJSContext as any);
  RunJSContextRegistry.register(latest, 'LinkageModel', LinkageRunJSContext as any);
  done = true;
}
