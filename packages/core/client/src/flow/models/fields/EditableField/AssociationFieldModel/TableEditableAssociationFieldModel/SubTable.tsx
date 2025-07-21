/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps, mapReadPretty } from '@formily/react';
import {
  escapeT,
  FlowModel,
  buildFieldItems,
  useFlowModel,
  FlowModelRenderer,
  AddFieldButton,
} from '@nocobase/flow-engine';
import { ArrayField } from '@formily/core';
import { tval } from '@nocobase/utils/client';
import { Table, Card } from 'antd';
import { PlusOutlined, ZoomInOutlined } from '@ant-design/icons';
import { useField, observer } from '@formily/react';
import React, { useMemo } from 'react';
import { SubTableColumnModel } from './SubTableColumnModel';

const transformItem = (use: string) => {
  const selectGroup = ['CheckboxGroupEditableFieldModel', 'RadioGroupEditableFieldModel'];
  if (selectGroup.includes(use)) {
    return 'SelectEditableFieldModel';
  }
  return use;
};

const AddFieldColumn = ({ model }) => {
  const items = buildFieldItems(
    model.collection.getFields(),
    model,
    'EditableFieldModel',
    'columns',
    ({ defaultOptions, fieldPath }) => {
      return {
        use: 'SubTableColumnModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: model.collection.dataSourceKey,
              collectionName: model.collection.name,
              fieldPath,
            },
          },
        },
        subModels: {
          field: {
            use: transformItem(defaultOptions.use),
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: model.collection.dataSourceKey,
                  collectionName: model.collection.name,
                  fieldPath,
                },
              },
              formItemSettings: {
                showLabel: {
                  showLabel: false,
                },
              },
            },
          },
        },
      };
    },
  );
  return (
    <AddFieldButton
      model={model}
      subModelKey={'columns'}
      subModelBaseClass="TableCustomColumnModel"
      items={items}
      onModelCreated={async (column: SubTableColumnModel) => {
        await column.applyAutoFlows();
      }}
      onSubModelAdded={async (column: SubTableColumnModel) => {
        console.log(model);
        // model.addAppends(column.fieldPath, true);
      }}
    />
  );
};

export const SubTable = observer(() => {
  const field = useField<ArrayField>();
  const model = useFlowModel();
  const getColumns = () => {
    const baseColumns = model.mapSubModels('columns', (column: SubTableColumnModel) => column.getColumnProps());

    return [
      ...baseColumns,
      { key: 'empty' },
      {
        key: 'addColumn',
        fixed: 'right',
        width: 200,
        title: <AddFieldColumn model={model} />,
      },
    ] as any;
  };

  const handleAdd = () => {
    const next = [...(field.value || []), {}];
    field.onInput(next);
  };
  const dataSource = useMemo(
    () => (field.value || []).map((item, index) => ({ key: item.id || index, ...item })),
    [field.value],
  );

  return (
    <Card>
      <Table columns={getColumns()} scroll={{ x: 'max-content' }} dataSource={dataSource} />
      <a onClick={handleAdd}>
        <PlusOutlined /> Add new
      </a>
    </Card>
  );
});
