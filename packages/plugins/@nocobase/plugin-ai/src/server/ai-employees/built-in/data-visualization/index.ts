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
      // 了解数据结构
      { name: 'getDataSources', autoCall: true },
      { name: 'getCollectionNames', autoCall: true },
      { name: 'getCollectionMetadata', autoCall: true },
    ],
  },
};
