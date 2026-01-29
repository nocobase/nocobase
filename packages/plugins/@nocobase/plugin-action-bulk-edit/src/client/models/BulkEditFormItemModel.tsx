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
import _ from 'lodash';

export class BulkEditFormItemModel extends FormItemModel {
  static defineChildren(ctx: any) {
    const fileds = ctx.collection.getFields();
    const children = FormItemModel.defineChildren(ctx) || [];
    return children
      .filter((child: any) => {
        const field = fileds.find((f) => f.name === child.key);
        const canEdit =
          field?.interface &&
          !field?.uiSchema?.['x-read-pretty'] &&
          field.interface !== 'snapshot' &&
          field.type !== 'sequence';

        return canEdit;
      })
      .map((child: any) => ({
        ...child,
        useModel: 'BulkEditFormItemModel',
        createModelOptions: () => {
          const options = child.createModelOptions();
          const field = options?.subModels?.field;
          const fieldWarp = {
            use: 'BulkEditFieldModel',
            subModels: {
              field,
            },
          };
          return {
            ...options,
            subModels: {
              field: fieldWarp,
            },
            use: 'BulkEditFormItemModel',
          };
        },
      }));
  }
}

BulkEditFormItemModel.define({
  label: tExpr('Bulk edit form item'),
});
