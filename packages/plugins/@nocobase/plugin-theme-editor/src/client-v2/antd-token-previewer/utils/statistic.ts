/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import tokenStatistic from 'antd/es/version/token.json';

const tokenRelatedComponents: {
  [key in string]?: string[];
} = {};

const getRelatedComponentsSingle = (token: string): string[] => {
  if (!tokenRelatedComponents[token]) {
    tokenRelatedComponents[token] = Object.entries(tokenStatistic)
      .filter(([, tokens]) => {
        return (tokens.global as string[]).includes(token);
      })
      .map(([component]) => component);
  }
  return tokenRelatedComponents[token] ?? [];
};

export const getRelatedComponents = (token: string | string[]): string[] => {
  const mergedTokens = Array.isArray(token) ? token : [token];
  return Array.from(
    new Set(
      mergedTokens.reduce<string[]>((result, item) => {
        return result.concat(getRelatedComponentsSingle(item));
      }, []),
    ),
  );
};

export const getComponentToken = (component: string) => (tokenStatistic as any)[component];
