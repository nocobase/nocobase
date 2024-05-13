/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme } from 'antd';
import _ from 'lodash';
import { ThemeItem } from '../../types';

/**
 * 把算法函数由字符串转换为函数
 * 注: 之所以要保存为字符串, 是因为 JSON 无法保存函数
 */
export function changeAlgorithmFromStringToFunction(themeConfig: ThemeItem) {
  themeConfig = _.cloneDeep(themeConfig);
  if (_.isString(themeConfig.config.algorithm)) {
    themeConfig.config.algorithm = theme[themeConfig.config.algorithm];
  }
  if (Array.isArray(themeConfig.config?.algorithm)) {
    themeConfig.config.algorithm = themeConfig.config.algorithm.map((item) => {
      if (_.isString(item)) {
        return theme[item];
      }
      return item;
    });
  }
  return themeConfig;
}
