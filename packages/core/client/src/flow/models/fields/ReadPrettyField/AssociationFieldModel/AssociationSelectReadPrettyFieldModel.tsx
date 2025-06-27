/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { AssociationReadPrettyFieldModel } from './AssociationReadPrettyFieldModel';
import { FlowEngineProvider, reactive } from '@nocobase/flow-engine';
import { getUniqueKeyFromCollection } from '../../../../../collection-manager/interfaces/utils';
import { useCompile } from '../../../../../schema-component';
import { isTitleField } from '../../../../../data-source';

export class AssociationSelectReadPrettyFieldModel extends AssociationReadPrettyFieldModel {
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
  @reactive
  public render() {
    const { fieldNames } = this.props;
    const value = this.getValue();
    if (!this.collectionField || !value) {
      return;
    }
    const { target } = this.collectionField?.options || {};
    const collectionManager = this.collectionField.collection.collectionManager;
    const targetCollection = collectionManager.getCollection(target);
    const targetLabelField = targetCollection.getField(fieldNames.label);
    const fieldClasses = Array.from(this.flowEngine.filterModelClassByParent('ReadPrettyFieldModel').values())?.sort(
      (a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0),
    );
    const fieldInterfaceName = targetLabelField?.options?.interface;
    const fieldClass = fieldClasses.find((fieldClass) => {
      return fieldClass.supportedFieldInterfaces?.includes(fieldInterfaceName);
    });
    const model = this.flowEngine.createModel({
      use: fieldClass?.name || 'ReadPrettyFieldModel',
      stepParams: {
        default: {
          step1: {
            dataSourceKey: this.collectionField.collection.dataSourceKey,
            collectionName: target,
            fieldPath: fieldNames.label,
          },
        },
      },
      props: {
        dataSource: targetLabelField.enum,
        ...targetLabelField.getComponentProps(),
      },
    });
    model.setSharedContext({ ...this.ctx.shared, value: value?.[fieldNames.label] });
    model.setParent(this.parent);
    if (Array.isArray(value)) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {value.map((v, idx) => {
            const mol = model.createFork({}, `${idx}`);
            mol.setSharedContext({ index: idx, value: v?.[fieldNames.label], record: this.ctx.shared.record });
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span style={{ color: 'rgb(170, 170, 170)' }}>,</span>}
                <FlowEngineProvider engine={this.flowEngine}>
                  {v?.[fieldNames.label] ? mol.render() : 'N/A'}
                </FlowEngineProvider>
              </React.Fragment>
            );
          })}
        </div>
      );
    }
    return <FlowEngineProvider engine={this.flowEngine}>{model.render()}</FlowEngineProvider>;
  }
}

AssociationSelectReadPrettyFieldModel.registerFlow({
  key: 'fieldNames',
  title: 'Specific properties',
  auto: true,
  sort: 200,
  steps: {
    fieldNames: {
      use: 'titleField',
      title: 'Title field',
      handler(ctx, params) {
        const { target } = ctx.model.collectionField.options;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
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
