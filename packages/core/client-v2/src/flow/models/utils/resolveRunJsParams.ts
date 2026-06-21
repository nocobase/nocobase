/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext } from '@nocobase/flow-engine';

/**
 * 统一解析预览模式的 code/version：
 * - 优先读取 ctx.inputArgs.preview.{code,version}
 * - 其次读取 params.{code,version}
 * - 最后回退到 defaults
 */
export function resolveRunJsParams(ctx: FlowContext, params?: Record<string, any>): { code: string; version: string } {
  const preview = ctx.inputArgs?.preview || {};
  const version = preview?.version ?? params?.version ?? 'v1';
  const codeFromPreview = typeof preview?.code === 'string' ? preview.code : undefined;
  const code = codeFromPreview ?? params?.code ?? '';
  return { code, version };
}
