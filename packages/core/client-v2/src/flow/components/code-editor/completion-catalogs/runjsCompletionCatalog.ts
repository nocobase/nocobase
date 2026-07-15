/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { GeneratedRunJSCompletionCatalogEntry } from './generated/antd';
import {
  loadGeneratedRunJSAntdCompletionCatalog,
  loadGeneratedRunJSAntdIconsCompletionCatalog,
} from './generated/loaders';

export type RunJSCompletionCatalogEntry = GeneratedRunJSCompletionCatalogEntry;
export type RunJSCompletionCatalogLibrary = 'antd' | 'antd-icons';

let antdCatalogPromise: Promise<readonly RunJSCompletionCatalogEntry[]> | undefined;
let antdIconsCatalogPromise: Promise<readonly RunJSCompletionCatalogEntry[]> | undefined;

export function loadRunJSCompletionCatalog(
  library: RunJSCompletionCatalogLibrary,
): Promise<readonly RunJSCompletionCatalogEntry[]> {
  if (library === 'antd') {
    antdCatalogPromise ??= loadGeneratedRunJSAntdCompletionCatalog();
    return antdCatalogPromise;
  }
  antdIconsCatalogPromise ??= loadGeneratedRunJSAntdIconsCompletionCatalog();
  return antdIconsCatalogPromise;
}
