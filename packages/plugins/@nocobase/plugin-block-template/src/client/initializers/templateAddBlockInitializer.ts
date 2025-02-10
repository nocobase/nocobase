/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer, Application } from '@nocobase/client';

export const createCustomAddBlockInitializer = (app: Application) => {
  // 获取原有的 page:addBlock initializer 的配置
  const pageAddBlock = app.schemaInitializerManager.get('page:addBlock');

  return new SchemaInitializer({
    ...pageAddBlock.options, // 继承所有配置
    name: 'template:addBlock', // 覆盖 name
    items: [...pageAddBlock.items].filter((item) => {
      // 屏蔽 Chart 区块
      if (item.Component === 'ChartV2BlockInitializer') {
        return false;
      }
      // 如果有子项，也需要过滤
      if (item.children) {
        item.children = item.children.filter((child) => child.Component !== 'ChartV2BlockInitializer');
      }
      return true;
    }),
  });
};

export const createCustomAddBlockInitializerMobile = (app: Application) => {
  const pageAddBlock = app.schemaInitializerManager.get('mobile:addBlock');
  return new SchemaInitializer({
    ...pageAddBlock.options,
    name: 'templateMobile:addBlock',
    items: [...pageAddBlock.items].filter((item) => {
      // 屏蔽 Chart 区块
      if (item.Component === 'ChartV2BlockInitializer') {
        return false;
      }
      if (item.children) {
        item.children = item.children.filter((child) => child.Component !== 'ChartV2BlockInitializer');
      }
      return true;
    }),
  });
};

// 导出一个函数用于注册 initializer
export const registerCustomAddBlockInitializer = (app) => {
  const customAddBlockInitializer = createCustomAddBlockInitializer(app);
  const customAddBlockInitializerMobile = createCustomAddBlockInitializerMobile(app);
  app.schemaInitializerManager.add(customAddBlockInitializer);
  app.schemaInitializerManager.add(customAddBlockInitializerMobile);
};
