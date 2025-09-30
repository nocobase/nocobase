/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSVersion, RunJSContextCtor } from './contexts/FlowRunJSContext';
import { FlowRunJSContext } from './contexts/FlowRunJSContext';
import { JSBlockRunJSContext } from './contexts/JSBlockRunJSContext';
import { JSFieldRunJSContext } from './contexts/JSFieldRunJSContext';
import { JSItemRunJSContext } from './contexts/JSItemRunJSContext';
import { FormJSFieldItemRunJSContext } from './contexts/FormJSFieldItemRunJSContext';
import { JSRecordActionRunJSContext } from './contexts/JSRecordActionRunJSContext';
import { JSCollectionActionRunJSContext } from './contexts/JSCollectionActionRunJSContext';

export class RunJSContextRegistry {
  private static map = new Map<string, RunJSContextCtor>();
  private static defaultsRegistered = false;
  private static ensureDefaults() {
    if (this.defaultsRegistered) return;
    // v1 默认映射（延迟注册：首次访问时再注册）
    const v = 'v1' as RunJSVersion;
    try {
      const ensure = (model: string, ctor: RunJSContextCtor) => {
        const key = `${v}:${model}`;
        if (!this.map.has(key)) this.map.set(key, ctor);
      };
      ensure('JSBlockModel', JSBlockRunJSContext as any);
      ensure('JSFieldModel', JSFieldRunJSContext as any);
      ensure('JSItemModel', JSItemRunJSContext as any);
      ensure('FormJSFieldItemModel', FormJSFieldItemRunJSContext as any);
      ensure('JSRecordActionModel', JSRecordActionRunJSContext as any);
      ensure('JSCollectionActionModel', JSCollectionActionRunJSContext as any);
      ensure('*', FlowRunJSContext as any);
    } finally {
      this.defaultsRegistered = true;
    }
  }
  static register(version: RunJSVersion, modelClass: string, ctor: RunJSContextCtor) {
    this.map.set(`${version}:${modelClass}`, ctor);
  }
  static resolve(version: RunJSVersion, modelClass: string) {
    this.ensureDefaults();
    return this.map.get(`${version}:${modelClass}`) || this.map.get(`${version}:*`);
  }
}

export function getModelClassName(ctx: any): string {
  const model = ctx?.model;
  if (!model) return '*';
  // 1) 优先使用类 meta 中声明的 createModelOptions.use（构建后稳定，不受构造函数名压缩影响）
  try {
    const Ctor = model.constructor as any;
    const use = Ctor?.meta?.createModelOptions?.use;
    if (typeof use === 'string' && use) return use;
  } catch (_) {
    // ignore
  }
  // 2) 回退到构造函数名（开发模式可靠，生产模式可能被压缩）
  const byName = model?.constructor?.name;
  return byName || '*';
}
