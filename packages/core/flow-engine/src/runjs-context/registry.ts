/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 为避免在模块初始化阶段引入 FlowContext（从而触发循环依赖），不要在顶层导入各类 RunJSContext。
// 在需要默认映射时（首次 resolve）再使用 createRequire 同步加载对应模块。
import { createRequire } from 'module';

export type RunJSVersion = 'v1' | (string & {});
export type RunJSContextCtor = new (delegate: any) => any;

export class RunJSContextRegistry {
  private static map = new Map<string, RunJSContextCtor>();
  static register(version: RunJSVersion, modelClass: string, ctor: RunJSContextCtor) {
    this.map.set(`${version}:${modelClass}`, ctor);
  }
  static resolve(version: RunJSVersion, modelClass: string) {
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
