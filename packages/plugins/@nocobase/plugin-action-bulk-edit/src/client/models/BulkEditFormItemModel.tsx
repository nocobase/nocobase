/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItemModel, FieldModelRenderer, FormItem, FieldModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import { Select, Space } from 'antd';
import React, { useState } from 'react';
import { css } from '@emotion/css';
import _ from 'lodash';
import { useField } from '@formily/react';

/**
 * 批量编辑字段项模型
 * 在标准字段前添加编辑模式选择器：保持不变/修改为/清空
 */
export class BulkEditFormItemModel extends FormItemModel {
  static defineChildren(ctx: any) {
    // 调用父类方法获取子项定义
    const children = FormItemModel.defineChildren(ctx);
    // 修改 useModel 为 BulkEditFormItemModel
    return children?.map((child: any) => ({
      ...child,
      useModel: 'BulkEditFormItemModel',
      createModelOptions: () => {
        const options = child.createModelOptions();
        const field = options?.subModels?.field;
        const fieldWarp = {
          use: 'BulkEditFieldModel',
          // props: field.props,
          subModels: {
            field,
          },
        };
        return {
          ...options,
          subModels: {
            field: fieldWarp,
          },
          use: 'BulkEditFormItemModel', // 使用批量编辑字段项模型
        };
      },
    }));
  }
}

// 继承父类的基本配置
BulkEditFormItemModel.define({
  label: tExpr('Display fields'),
  sort: 100,
});
