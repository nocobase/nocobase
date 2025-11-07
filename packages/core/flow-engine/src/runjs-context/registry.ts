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

export type RunJSVersion = 'v1' | (string & {});
export type RunJSContextCtor = new (delegate: any) => any;
export type RunJSContextMeta = {
  scenes?: string[];
};

export class RunJSContextRegistry {
  private static map = new Map<string, { ctor: RunJSContextCtor; meta?: RunJSContextMeta }>();
  static register(version: RunJSVersion, modelClass: string, ctor: RunJSContextCtor, meta?: RunJSContextMeta) {
    this.map.set(`${version}:${modelClass}`, { ctor, meta });
  }
  static resolve(version: RunJSVersion, modelClass: string) {
    return this.map.get(`${version}:${modelClass}`)?.ctor || this.map.get(`${version}:*`)?.ctor;
  }
  static getMeta(version: RunJSVersion, modelClass: string): RunJSContextMeta | undefined {
    return this.map.get(`${version}:${modelClass}`)?.meta || this.map.get(`${version}:*`)?.meta;
  }
}

export function getModelClassName(ctx: any): string {
  return ctx?.model?.constructor?.name || '*';
}
