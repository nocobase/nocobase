/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { TableFieldModel } from './TableFieldModel';
import { loadTitleFieldOptions } from '../../../common/utils';
import { getUniqueKeyFromCollection } from '../../../../../collection-manager/interfaces/utils';

export class TableAssociationSelectFieldModel extends TableFieldModel {
  public static readonly supportedFieldInterfaces = [
    'm2m',
    'm2o',
    'o2o',
    'o2m',
    'oho',
    'obo',
    'updatedBy',
    'createdBy',
  ];
  public render() {
    const { fieldNames } = this.props;
    const value = this.getValue();
    if (!this.collectionField) {
      return null;
    }
    const { target } = this.collectionField.options;
    const collectionManager = this.collectionField.collection.collectionManager;
    const targetCollection = collectionManager.getCollection(target);
    const targetLabelField = targetCollection.getField(fieldNames.label);
    const fieldClasses = Array.from(this.flowEngine.filterModelClassByParent('TableFieldModel').values())?.sort(
      (a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0),
    );
    const fieldInterfaceName = targetLabelField?.options?.interface;
    const fieldClass = fieldClasses.find((fieldClass) => {
      return fieldClass.supportedFieldInterfaces?.includes(fieldInterfaceName);
    });
    const model: any = this.flowEngine.createModel({
      use: fieldClass?.name || 'TableFieldModel',
    });
    model.collectionField = targetLabelField;
    if (Array.isArray(value)) {
      return (
        <>
          {value.map((v, idx) => {
            const mol = model.createFork({}, { index: idx });
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span>,</span>}
                <FlowModelRenderer model={mol} sharedContext={{ ...this.ctx.shared, value: v?.[fieldNames.label] }} />
              </React.Fragment>
            );
          })}
        </>
      );
    }
    return <FlowModelRenderer model={model} sharedContext={{ ...this.ctx.shared, value: value?.[fieldNames.label] }} />;
  }
}

TableAssociationSelectFieldModel.registerFlow({
  key: 'fieldNames',
  auto: true,
  sort: 200,
  steps: {
    fieldNames: {
      title: 'Title field',
      uiSchema: {
        label: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          'x-reactions': ['{{loadTitleFieldOptions(collectionField, dataSourceManager)}}'],
        },
      },
      defaultParams: (ctx) => {
        const { target } = ctx.model.collectionField.options;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        return {
          label: ctx.model.props.fieldNames?.label || targetCollection.options.titleField,
        };
      },
      handler(ctx, params) {
        const { target } = ctx.model.collectionField.options;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        ctx.model.flowEngine.flowSettings.registerScopes({
          loadTitleFieldOptions,
          collectionField: ctx.model.collectionField,
          dataSourceManager: ctx.app.dataSourceManager,
        });
        const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
        const newFieldNames = {
          value: filterKey,
          label: params.label || targetCollection.options.titleField || filterKey,
        };
        ctx.model.setProps({ fieldNames: newFieldNames });
      },
    },
  },
});
