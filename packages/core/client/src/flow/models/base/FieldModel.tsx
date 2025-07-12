/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, DefaultStructure, escapeT, FlowModel } from '@nocobase/flow-engine';
import { DataBlockModel } from './BlockModel';

// null 表示不支持任何字段接口，* 表示支持所有字段接口
export type SupportedFieldInterfaces = string[] | '*' | null;

export class FieldModel<T = DefaultStructure> extends FlowModel<T> {
  onInit(options: any): void {
    this.context.defineProperty('collectionField', {
      get: () => {
        const params = this.getStepParams('fieldSettings', 'init');
        console.log('params', params);
        const collectionField = this.context.dataSourceManager.getCollectionField(
          `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`,
        ) as CollectionField;
        return collectionField;
      },
    });
  }

  get fieldPath(): string {
    return this.getStepParams('fieldSettings', 'init').fieldPath;
  }

  get collectionField() {
    return this.context.collectionField as CollectionField;
  }

  public static readonly supportedFieldInterfaces: SupportedFieldInterfaces = null;
}

FieldModel.registerFlow({
  key: 'fieldSettings',
  auto: true,
  title: escapeT('Field settings'),
  steps: {
    init: {
      handler(ctx, params) {
        const blockModel = ctx.blockModel as DataBlockModel;
        if (!blockModel) {
          throw new Error('Current block model is not set in model context');
        }
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey || !collectionName || !fieldPath) {
          throw new Error('dataSourceKey, collectionName, and fieldPath are required parameters');
        }
        if (!ctx.model.parent) {
          throw new Error('FieldModel must have a parent model');
        }
        blockModel.addAppends(fieldPath);
      },
    },
  },
});
