/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { isArr, toArr } from '@formily/shared';
import { getDefaultFormat, str2moment } from '@nocobase/utils/client';
import { Tag } from 'antd';
import React from 'react';
import { getUniqueKeyFromCollection } from '../../../../../../collection-manager/interfaces/utils';
import { useCompile } from '../../../../../../schema-component/hooks';
import { loadTitleFieldOptions } from '../../../../common/utils';
import { TableColumnModel } from '../../TableColumnModel';

export function transformNestedData(inputData) {
  const resultArray = [];

  function recursiveTransform(data) {
    if (data?.parent) {
      const { parent } = data;
      recursiveTransform(parent);
    }
    const { parent, ...other } = data;
    resultArray.push(other);
  }
  if (inputData) {
    recursiveTransform(inputData);
  }
  return resultArray;
}

const toValue = (value, placeholder) => {
  if (value === null || value === undefined) {
    return placeholder;
  }
  return value;
};
const getDatePickerLabels = (props): string => {
  const format = getDefaultFormat(props) as string;
  const m = str2moment(props.value, props);
  const labels = m && m.isValid() ? m.format(format) : props.value;
  return isArr(labels) ? labels.join('~') : labels;
};

const getLabelFormatValue = (labelUiSchema, value: any, isTag = false): any => {
  const options = labelUiSchema?.enum;
  if (Array.isArray(options) && value) {
    const values = toArr(value).map((val) => {
      const opt: any = options.find((option: any) => option.value === val);
      if (isTag) {
        return React.createElement(Tag, { color: opt?.color }, opt?.label);
      }
      return opt?.label;
    });
    return isTag ? values : values.join(', ');
  }
  switch (labelUiSchema?.['x-component']) {
    case 'DatePicker':
      return getDatePickerLabels({ ...labelUiSchema?.['x-component-props'], value });
    default:
      return value;
  }
};

const getLabelUiSchema = (collectionManager, target, label) => {
  const targetCollection = collectionManager.getCollection(target);
  const targetLabelField = targetCollection.getField(label);
  return targetLabelField.options.uiSchema;
};

const AssociationSelectReadPretty = (props) => {
  const { value, fieldNames, collectionField, ellipsis, cm } = props;
  const compile = useCompile();
  const targetCollection = cm.getCollection(collectionField?.target);
  const isTreeCollection = targetCollection?.template === 'tree';

  const labelUiSchema = getLabelUiSchema(cm, collectionField?.target, fieldNames?.label);

  const items = toArr(value)
    .map((record, index) => {
      if (!record) return null;

      let rawLabel = record?.[fieldNames?.label || 'label'];

      // 树形结构下转换为路径形式
      if (isTreeCollection) {
        const pathLabels = transformNestedData(record).map((o) => o?.[fieldNames?.label || 'label']);
        rawLabel = pathLabels.join(' / ');
      } else if (typeof rawLabel === 'object' && rawLabel !== null) {
        rawLabel = JSON.stringify(rawLabel);
      }

      const compiledLabel = toValue(compile(rawLabel), 'N/A');
      const text = getLabelFormatValue(compile(labelUiSchema), compiledLabel, true);
      return (
        <React.Fragment key={record?.[fieldNames.value] ?? index}>
          {index > 0 && ','}
          {text}
        </React.Fragment>
      );
    })
    .filter(Boolean);

  return <span style={ellipsis ? null : { whiteSpace: 'normal' }}>{items}</span>;
};

export class AssociationSelectReadPrettyFieldModel extends TableColumnModel {
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
  render() {
    return (value, record, index) => {
      return (
        <>
          {
            <AssociationSelectReadPretty
              {...this.getComponentProps()}
              collectionField={this.collectionField.options}
              value={value}
              cm={this.collectionField.collection.dataSource.collectionManager}
            />
          }
          {this.renderQuickEditButton(record)}
        </>
      );
    };
  }
}

// //附加关系数据
// AssociationSelectReadPrettyFieldModel.registerFlow({
//   key: 'appendsAssociationFields',
//   auto: true,
//   sort: 100,
//   steps: {
//     step1: {
//       handler(ctx) {
//         const resource = ctx.model.parent.resource;
//         const { name } = ctx.model.field.options;
//         resource.addAppends(name);
//         console.log(ctx.model.parent.resource, name);
//         resource.refresh();
//       },
//     },
//   },
// });

//标题字段设置 todo 复用
AssociationSelectReadPrettyFieldModel.registerFlow({
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
        const { target } = ctx.model.field.options;
        const collectionManager = ctx.model.field.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        return {
          label: ctx.model.getComponentProps().fieldNames?.label || targetCollection.options.titleField,
        };
      },
      handler(ctx, params) {
        const { target } = ctx.model.field.options;
        const collectionManager = ctx.model.field.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        ctx.model.flowEngine.flowSettings.registerScopes({
          loadTitleFieldOptions,
          collectionField: ctx.model.field,
          dataSourceManager: ctx.app.dataSourceManager,
        });
        const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
        const newFieldNames = {
          value: filterKey,
          label: params.label || targetCollection.options.titleField || filterKey,
        };
        ctx.model.setComponentProps({ fieldNames: newFieldNames });
      },
    },
  },
});
