/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, DefaultStructure, escapeT, FlowModel } from '@nocobase/flow-engine';

// null 表示不支持任何字段接口，* 表示支持所有字段接口
export type SupportedFieldInterfaces = string[] | '*' | null;

export class FieldModel<T = DefaultStructure> extends FlowModel<T> {
  collectionField: CollectionField;
  fieldPath: string;
  public static readonly supportedFieldInterfaces: SupportedFieldInterfaces = null;
}

FieldModel.registerFlow({
  key: 'fieldSettings',
  auto: true,
  title: escapeT('Field settings'),
  steps: {
    init: {
      handler(ctx, params) {
        if (!ctx.currentBlockModel) {
          throw new Error('Current block model is not set in shared context');
        }
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey || !collectionName || !fieldPath) {
          throw new Error('dataSourceKey, collectionName, and fieldPath are required parameters');
        }
        if (!ctx.model.parent) {
          throw new Error('FieldModel must have a parent model');
        }
        const collectionField = ctx.dataSourceManager.getCollectionField(
          `${dataSourceKey}.${collectionName}.${fieldPath}`,
        ) as CollectionField;
        if (!collectionField) {
          throw new Error(`Collection field not found for path: ${params.fieldPath}`);
        }
        ctx.model.collectionField = collectionField;
        ctx.model.fieldPath = fieldPath;
        ctx.currentBlockModel.addAppends(fieldPath);
      },
    },
  },
});
