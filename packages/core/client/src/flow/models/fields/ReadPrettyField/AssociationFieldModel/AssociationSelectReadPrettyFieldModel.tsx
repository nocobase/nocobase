import React from 'react';
import { AssociationReadPrettyFieldModel } from './AssociationReadPrettyFieldModel';
import { Select } from 'antd';
import { FlowModelRenderer, FlowEngineProvider, useStepSettingContext } from '@nocobase/flow-engine';
import { useCompile } from '../../../../../schema-component';
import { getUniqueKeyFromCollection } from '../../../../../collection-manager/interfaces/utils';
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
    const model: any = this.flowEngine.createModel({
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
    });
    model.collectionField = targetLabelField;
    model.setParent(this.parent);
    if (Array.isArray(value)) {
      return (
        <>
          {value.map((v, idx) => {
            const mol = model.createFork({}, { index: idx });
            mol.setSharedContext({ index: idx, value: v?.[fieldNames.label], record: this.ctx.shared.record });
            mol.collectionField = targetLabelField;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span>,</span>}
                <FlowEngineProvider engine={this.flowEngine}>{mol.render()}</FlowEngineProvider>
              </React.Fragment>
            );
          })}
        </>
      );
    }
    return <FlowModelRenderer model={model} sharedContext={{ ...this.ctx.shared, value: value?.[fieldNames.label] }} />;
  }
}

const SelectOptions = (props) => {
  const {
    model: { collectionField },
    app,
  } = useStepSettingContext();
  const compile = useCompile();
  const collectionManager = collectionField?.collection?.collectionManager;
  const dataSourceManager = app.dataSourceManager;
  const target = collectionField?.options?.target;
  if (!collectionManager || !target) return;
  const targetCollection = collectionManager.getCollection(target);
  const targetFields = targetCollection?.getFields?.() ?? [];
  const options = targetFields
    .filter((field) => isTitleField(dataSourceManager, field.options))
    .map((field) => ({
      value: field.name,
      label: compile(field.options.uiSchema?.title) || field.name,
    }));
  return <Select {...props} options={options} />;
};

AssociationSelectReadPrettyFieldModel.registerFlow({
  key: 'fieldNames',
  auto: true,
  sort: 200,
  steps: {
    fieldNames: {
      title: 'Title field',
      uiSchema: {
        label: {
          'x-component': SelectOptions,
          'x-decorator': 'FormItem',
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
