/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'printTemplate',
  fields: [
    {
      type: 'string',
      name: 'templateName',
    },
    {
      type: 'string',
      name: 'templateType',
    },
    {
      type: 'text',
      name: 'templateRemark',
    },
    {
      type: 'string',
      name: 'supportTable',
    },
    // printTemplate 表主键 id 和 attachments 外键 printTemplateId 相连
    // 如果涉及到分库分表的话，外键就不合适了
    // {
    //   type: 'hasOne',
    //   name: 'templateFile',
    //   target: 'attachments',
    //   sourceKey: 'id',      // print-template 表主键
    //   foreignKey: 'printTemplateId', // 外键在 profiles 表
    // },
    // 弱关联
    {
      type: 'string',
      name: 'attachmentsId',
    },
  ],
});
