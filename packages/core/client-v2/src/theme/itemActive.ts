/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { GlobalToken } from 'antd';
import type { CustomToken } from './type';

/**
 * 取「选中项」的底色与文字色。
 *
 * antd 只有 `controlItemBgActive` 一个背景 token，没有配对的文字色，页面各自写背景、
 * 文字色照旧，底色一被主题改深就成了深底深字。这里统一读 `colorBgItemActive` /
 * `colorTextItemActive` 这一对自定义 token，没设置时回落到 antd 的默认表现，
 * 于是同一段代码在默认主题和设置中心的黑白主题下都对。
 *
 * @param {GlobalToken} token antd token
 * @returns {{ bg: string; color: string | undefined }} 选中项底色，以及需要显式指定的文字色（回落时为 undefined）
 */
export function getItemActiveColors(token: GlobalToken) {
  const customToken = token as Partial<CustomToken>;

  return {
    bg: customToken.colorBgItemActive || token.controlItemBgActive,
    color: customToken.colorTextItemActive || undefined,
  };
}
