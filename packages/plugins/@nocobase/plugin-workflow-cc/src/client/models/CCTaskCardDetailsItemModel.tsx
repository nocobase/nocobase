/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsItemModel } from '@nocobase/client';
import { Collection, CollectionField, FlowModelContext, tExpr } from '@nocobase/flow-engine';
import { NAMESPACE } from '../../common/constants';

// 排除的字段
const EXCLUDED_FIELDS = ['node', 'job', 'workflow', 'execution', 'user'];

export class CCTaskCardDetailsItemModel extends DetailsItemModel {
  static defineChildren(ctx: FlowModelContext) {
    const collection = ctx.collection as Collection;

    return collection
      .getFields()
      .map((field) => {
        const binding = this.getDefaultBindingByField(ctx, field, { fallbackToTargetTitleField: true });
        if (!binding) return null;
        if (EXCLUDED_FIELDS.includes(field.name)) return null;
        const fieldModel = binding.modelName;
        const fullName = ctx.prefixFieldPath ? `${ctx.prefixFieldPath}.${field.name}` : field.name;
        return {
          key: fullName,
          label: field.title,
          refreshTargets: ['DetailsCustomItemModel/DetailsJSFieldItemModel'],
          toggleable: (subModel) => {
            const fieldPath = subModel.getStepParams('fieldSettings', 'init')?.fieldPath;
            return fieldPath === fullName;
          },
          useModel: 'CCTaskCardDetailsItemModel',
          createModelOptions: () => ({
            use: 'CCTaskCardDetailsItemModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection.dataSourceKey,
                  collectionName: ctx.model.context.blockModel.collection.name,
                  fieldPath: fullName,
                },
              },
            },
            subModels: {
              field: {
                use: fieldModel,
                props:
                  typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, field) : binding.defaultProps,
              },
            },
          }),
        };
      })
      .filter(Boolean);
  }

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('collectionField', {
      get: () => {
        const params = this.getFieldSettingsInitParams();
        const collectionField = this.context.dataSourceManager.getCollectionField(
          `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`,
        ) as CollectionField;
        return collectionField;
      },
      cache: false,
    });
  }
}

CCTaskCardDetailsItemModel.define({
  label: tExpr('CC information', { ns: NAMESPACE }),
  sort: 100,
});
