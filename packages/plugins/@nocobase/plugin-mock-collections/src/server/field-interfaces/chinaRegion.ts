/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';

export const chinaRegion = {
  options: (options) => ({
    type: 'belongsToMany',
    target: 'chinaRegions',
    targetKey: 'code',
    sortBy: 'level',
    through: options.through || `t_${uid()}`,
    foreignKey: options.foreignKey || `f_${uid()}`,
    otherKey: options.otherKey || `f_${uid()}`,
    sourceKey: options.sourceKey || 'id',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Cascader',
      'x-component-props': {
        useDataSource: '{{ useChinaRegionDataSource }}',
        useLoadData: '{{ useChinaRegionLoadData }}',
        changeOnSelectLast: options?.uiSchema?.['x-component-props']?.changeOnSelectLast || false,
        labelInValue: true,
        maxLevel: options?.uiSchema?.['x-component-props']?.maxLevel || 3,
        fieldNames: {
          label: 'name',
          value: 'code',
          children: 'children',
        },
      },
    },
  }),
};
