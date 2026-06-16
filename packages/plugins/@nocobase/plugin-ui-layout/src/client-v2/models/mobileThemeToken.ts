/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ThemeConfig } from 'antd';

export type MobileLayoutThemeToken = {
  colorSettings?: string;
  colorTextHeaderMenu?: string;
};

export type MobileLayoutCompactThemeToken = NonNullable<ThemeConfig['token']> &
  MobileLayoutThemeToken & {
    borderRadiusBlock?: number;
    marginBlock?: number;
    marginSM?: number;
    paddingLG?: number;
    paddingPageHorizontal?: number;
    paddingPageVertical?: number;
    paddingSM?: number;
    paddingXS?: number;
  };

export function toMobileCompactThemeToken(
  token?: Partial<MobileLayoutCompactThemeToken>,
): MobileLayoutCompactThemeToken {
  return {
    ...(token || {}),
    borderRadiusBlock: 8,
    fontSize: 16,
    marginBlock: 12,
    marginSM: 8,
    paddingLG: 16,
    paddingPageHorizontal: 8,
    paddingPageVertical: 8,
    paddingSM: 8,
    paddingXS: 8,
  } as MobileLayoutCompactThemeToken;
}
