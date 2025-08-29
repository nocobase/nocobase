/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  FlowModel,
  escapeT,
  ModelRenderMode,
  FlowModelContext,
  buildWrapperFieldChildren,
} from '@nocobase/flow-engine';

export class AssociationFieldItemModel extends FlowModel {
  static defineChildren(ctx: FlowModelContext) {
    const toOneAssociationFields = ctx.model.context.blockModel.collection.getFields().filter((v) => {
      return ['oho', 'obo', 'm2o'].includes(v.interface);
    });
    return toOneAssociationFields.map((v) => {
      return {
        key: v.name + v.collectionName,
        label: ctx.t(v.title),
        children: async () => {
          return [
            {
              key: 'sub2-1',
              label: 'Sub2-1 Block',
              createModelOptions: {
                use: 'DetailItemModel',
                subModels: {
                  field: {
                    use: 'InputReadPrettyFieldModel',
                  },
                },
              },
            },
            {
              key: 'sub2-1',
              label: 'Sub2-1 Block',
              children: async () => {
                return [];
              },
            },
          ];
        },
      };
    });
  }
}

AssociationFieldItemModel.define({
  label: '{{t("Display association fields")}}',
  //   hide: true,
});
