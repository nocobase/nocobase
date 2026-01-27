/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import profile from './profile';

export default {
  username: 'dara',
  description: 'Data visualization specialist',
  profile,
  skillSettings: {
    skills: [
      // 可视化工具：模式切换 + 运行查询
      { name: 'viz-switchModes', autoCall: true },
      { name: 'viz-runQuery', autoCall: true },
      // 查询数据源
      { name: 'dataSource-dataSourceCounting', autoCall: true },
      { name: 'dataSource-dataSourceQuery', autoCall: true },
      // 了解数据结构
      { name: 'dataModeling-getDataSources', autoCall: true },
      { name: 'dataModeling-getCollectionNames', autoCall: true },
      { name: 'dataModeling-getCollectionMetadata', autoCall: true },
    ],
  },
};
