/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChinaRegionInterface } from '../interfaces/china-region-interface';

describe('ChinaRegionInterface', () => {
  const regions = [
    { name: '浙江省', level: 1, code: 'zhejiang' },
    { name: '杭州市', level: 2, code: 'hangzhou' },
    { name: '西湖区', level: 3, code: 'xihu' },
  ].map((region) => ({
    ...region,
    get(key: string) {
      return (this as any)[key];
    },
  }));

  const field = {
    database: {
      getRepository: () => ({
        find: async ({ filter: { name } }) => regions.filter((region) => name.includes(region.name)),
      }),
    },
    target: 'chinaRegions',
  };

  it('rejects incomplete paths when the last level is required', async () => {
    const interfaceInstance = new ChinaRegionInterface({
      uiSchema: {
        'x-component-props': {
          maxLevel: 3,
          changeOnSelectLast: true,
        },
      },
    });

    await expect(interfaceInstance.toValue('浙江省', { field })).rejects.toThrow('last level');
    await expect(interfaceInstance.toValue('浙江省/杭州市/西湖区', { field })).resolves.toHaveLength(3);
  });

  it('rejects paths deeper than the configured maximum level', async () => {
    const interfaceInstance = new ChinaRegionInterface({
      uiSchema: {
        'x-component-props': {
          maxLevel: 2,
          changeOnSelectLast: false,
        },
      },
    });

    await expect(interfaceInstance.toValue('浙江省/杭州市', { field })).resolves.toHaveLength(2);
    await expect(interfaceInstance.toValue('浙江省/杭州市/西湖区', { field })).rejects.toThrow('max level');
  });
});
