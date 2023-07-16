import type { AliasToken, MapToken, SeedToken } from 'antd/es/theme/interface';
import defaultMap from 'antd/es/theme/themes/default';
import seedToken from 'antd/es/theme/themes/seed';
import formatToken from 'antd/es/theme/util/alias';

export type PureAliasToken = Omit<AliasToken, keyof MapToken>;

type SeedRelatedMap = {
  [key in keyof SeedToken]?: (keyof MapToken)[];
};

type SeedRelatedAlias = {
  [key in keyof SeedToken]?: (keyof PureAliasToken)[];
};

type MapRelatedAlias = {
  [key in keyof MapToken]?: (keyof PureAliasToken)[];
};

// Alias Token 优先级排序，数字小的排在前面，在 map 中的优先级比不在 map 中的优先级高，都不在 map 中的按字母顺序排序
const tokenOrder: {
  [key in keyof AliasToken]?: number;
} = {
  // example
  // 0-20 留给 text
  colorTextHeading: 1,
  colorTextLabel: 2,
  colorTextDescription: 3,
  colorTextDisabled: 4,
  colorTextPlaceholder: 5,
  colorIcon: 10,
  colorIconHover: 11,
  // 21-40 留给 border
  colorBorderBg: 21,
  controlTmpOutline: 22,
  // 41-60 留给 fill
  colorFillAlter: 41,
  colorFillContent: 42,
  colorFillContentHover: 43,

  // 61-80 留给 bg
  controlItemBgActive: 61,
  controlItemBgActiveHover: 62,
  controlItemBgHover: 63,
};

export function sortToken<T extends (keyof AliasToken)[]>(arr: T): T {
  if (!arr) {
    return arr;
  }
  return arr.sort((a, b) => {
    if (tokenOrder[a] && !tokenOrder[b]) {
      return -1;
    }
    if (!tokenOrder[a] && tokenOrder[b]) {
      return 1;
    }
    if (tokenOrder[a] && tokenOrder[b]) {
      return tokenOrder[a]! - tokenOrder[b]!;
    }
    return a.localeCompare(b);
  });
}

export const seedRelatedMap: SeedRelatedMap = {
  colorPrimary: [
    'colorPrimaryBg',
    'colorPrimaryBgHover',
    'colorPrimaryBorder',
    'colorPrimaryBorderHover',
    'colorPrimaryHover',
    'colorPrimary',
    'colorPrimaryActive',
    'colorPrimaryTextHover',
    'colorPrimaryText',
    'colorPrimaryTextActive',
  ],
  colorError: [
    'colorErrorBg',
    'colorErrorBgHover',
    'colorErrorBorder',
    'colorErrorBorderHover',
    'colorErrorHover',
    'colorError',
    'colorErrorActive',
    'colorErrorTextHover',
    'colorErrorText',
    'colorErrorTextActive',
  ],
  colorWarning: [
    'colorWarningBg',
    'colorWarningBgHover',
    'colorWarningBorder',
    'colorWarningBorderHover',
    'colorWarningHover',
    'colorWarning',
    'colorWarningActive',
    'colorWarningTextHover',
    'colorWarningText',
    'colorWarningTextActive',
  ],
  colorSuccess: [
    'colorSuccessBg',
    'colorSuccessBgHover',
    'colorSuccessBorder',
    'colorSuccessBorderHover',
    'colorSuccessHover',
    'colorSuccess',
    'colorSuccessActive',
    'colorSuccessTextHover',
    'colorSuccessText',
    'colorSuccessTextActive',
  ],
  colorInfo: [
    'colorInfoBg',
    'colorInfoBgHover',
    'colorInfoBorder',
    'colorInfoBorderHover',
    'colorInfoHover',
    'colorInfo',
    'colorInfoActive',
    'colorInfoTextHover',
    'colorInfoText',
    'colorInfoTextActive',
  ],
  colorTextBase: ['colorText', 'colorTextSecondary', 'colorTextTertiary', 'colorTextQuaternary'],
  colorBgBase: [
    'colorBgContainer',
    'colorBgElevated',
    'colorBgLayout',
    'colorBgSpotlight',
    'colorBgMask',
    'colorBorder',
    'colorBorderSecondary',
    'colorFill',
    'colorFillSecondary',
    'colorFillTertiary',
    'colorFillQuaternary',
  ],
};

const getMapRelatedAlias = () => {
  const mapRelatedAlias: any = {};
  const mapFn = defaultMap;
  const mapToken = mapFn({ ...seedToken });
  const aliasToken = formatToken({ ...mapToken, override: {} });
  Object.keys(mapToken).forEach((mapKey) => {
    delete (aliasToken as any)[mapKey];
  });

  Object.keys(mapToken).forEach((mapKey) => {
    const newAlias = formatToken({
      ...mapToken,
      [mapKey]: 'changed',
      override: {},
    });
    Object.keys(aliasToken).forEach((aliasKey) => {
      if ((aliasToken as any)[aliasKey] !== (newAlias as any)[aliasKey]) {
        if (!mapRelatedAlias[mapKey]) {
          mapRelatedAlias[mapKey] = [];
        }
        mapRelatedAlias[mapKey].push(aliasKey);
      }
    });
    mapRelatedAlias[mapKey] = sortToken(mapRelatedAlias[mapKey]);
  });

  return mapRelatedAlias;
};

export const mapRelatedAlias: MapRelatedAlias = getMapRelatedAlias();

const getSeedRelatedAlias = (): SeedRelatedAlias => {
  const result: SeedRelatedAlias = {};
  Object.keys(seedToken).forEach((key) => {
    const seedKey = key as keyof SeedToken;
    const arr = mapRelatedAlias[seedKey] || [];
    seedRelatedMap[seedKey]?.forEach((mapKey) => {
      arr.push(...(mapRelatedAlias[mapKey] ?? []));
    });
    if (arr.length) {
      (result as any)[key] = sortToken(Array.from(new Set(arr)));
    }
  });
  return result;
};

export const seedRelatedAlias = getSeedRelatedAlias();
