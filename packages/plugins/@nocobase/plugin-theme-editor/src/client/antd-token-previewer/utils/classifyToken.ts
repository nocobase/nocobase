import type { GlobalToken } from 'antd/es/theme/interface';
import type { TokenValue } from '../interface';

function defineTokenType<T extends string>(types: T[]) {
  return types;
}

export const TOKEN_SORTS = defineTokenType([
  'seed',
  'colorCommon',
  'colorText',
  'colorBg',
  'colorFill',
  'colorSplit',
  'font',
  'radius',
  'space',
  'screen',
  'line',
  'motion',
  'control',
  'others',
]);

export type TokenType = (typeof TOKEN_SORTS)[number];

export function getTypeOfToken(tokenName: string): TokenType {
  if (tokenName.startsWith('color')) {
    if (
      tokenName.startsWith('colorLink') ||
      tokenName.startsWith('colorText') ||
      tokenName.startsWith('colorIcon') ||
      tokenName.startsWith('colorPlaceholder') ||
      tokenName.startsWith('colorIcon')
    ) {
      return 'colorText';
    }
    if (tokenName.startsWith('colorBg') || tokenName.startsWith('colorPopupBg')) {
      return 'colorBg';
    }
    if (tokenName.startsWith('colorBorder') || tokenName.startsWith('colorSplit')) {
      return 'colorSplit';
    }
    if (tokenName.startsWith('colorFill')) {
      return 'colorFill';
    }
    return 'colorCommon';
  }
  if (tokenName.startsWith('font')) {
    return 'font';
  }
  if (tokenName.startsWith('screen')) {
    return 'screen';
  }
  if (tokenName.startsWith('line')) {
    return 'line';
  }
  if (tokenName.startsWith('motion')) {
    return 'motion';
  }
  if (tokenName.startsWith('borderRadius')) {
    return 'radius';
  }
  if (tokenName.startsWith('control')) {
    return 'control';
  }
  if (tokenName.startsWith('margin') || tokenName.startsWith('padding')) {
    return 'space';
  }
  return 'others';
}

export const classifyToken = (token: Record<string, TokenValue>): Record<string, string[]> => {
  const groupedToken: Record<string, string[]> = {};
  Object.keys(token || {})
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      const type = getTypeOfToken(key as keyof GlobalToken);
      if (!groupedToken[type]) {
        groupedToken[type] = [];
      }
      groupedToken[type].push(key);
    });
  return groupedToken;
};
