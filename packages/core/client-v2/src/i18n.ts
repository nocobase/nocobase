/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 提供字段接口模块初始化阶段所需的最小 i18n 能力。
 *
 * 这些接口类会在模块加载时注册校验规则，因此需要一个同步可用的 `t` 方法。
 * 真正的运行时翻译仍由 schema 中的 `{{t(...)}}` 表达式和应用级 i18n 负责。
 *
 * @example
 * ```typescript
 * i18n.t('Max length');
 * ```
 */
export const i18n = {
  t(text: string) {
    return text;
  },
};
