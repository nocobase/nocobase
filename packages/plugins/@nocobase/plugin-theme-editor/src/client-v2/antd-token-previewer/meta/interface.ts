/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ComponentTokenMap } from 'antd/es/theme/interface';

export interface TokenMeta {
  type: string;

  // Name
  name: string;
  nameEn: string;

  // Description
  desc: string;
  descEn: string;

  // Source
  source: 'seed' | 'map' | 'alias' | 'custom' | keyof ComponentTokenMap;
}

export type TokenMetaMap = Record<string, TokenMeta>;

// 二级分类，如品牌色、中性色等
export type TokenGroup<T> = {
  key: string;

  // Group name
  name: string;
  nameEn: string;

  // Description
  desc: string;
  descEn: string;

  // Type
  type?: string;

  // Seed token
  seedToken?: T[];
  /** make seedToken can be alpha */
  seedTokenAlpha?: boolean;
  mapToken?: T[];
  aliasToken?: T[];

  // Children Group
  groups?: TokenGroup<T>[];

  // Extra
  mapTokenGroups?: string[];
  aliasTokenDescription?: string;
};

// 一级分类，如颜色、尺寸等
export type TokenCategory<T> = {
  // Category name
  name: string;
  nameEn: string;

  // Description
  desc: string;
  descEn: string;

  groups: TokenGroup<T>[];
};

export type TokenTree<T extends string = string> = TokenCategory<T>[];
