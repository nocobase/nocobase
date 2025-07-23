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
import { useTranslation } from 'react-i18next';
import { spliceArrayState } from '@formily/core/esm/shared/internals';
import { action } from '@formily/reactive';
import { CloseOutlined, MenuOutlined } from '@ant-design/icons';
import { ArrayField } from '@formily/core';
import { tval } from '@nocobase/utils/client';
import { Table, Card, Space } from 'antd';
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
        // model.addAppends(column.fieldPath, true);
      }}
    />
  );
};

export const SubTable = observer((props: any) => {
  const field = useField<ArrayField>();
  const model = useFlowModel();
  const { t } = useTranslation();
  const { allowAddNew, allowSelectExistingRecord } = props;
  const getColumns = () => {
    const baseColumns = model.mapSubModels('columns', (column: SubTableColumnModel) => column.getColumnProps());
    return [
      ...baseColumns,
      {
        key: 'empty',
      },
      {
        key: 'addColumn',
        fixed: 'right',
        width: 100,
        title: <AddFieldColumn model={model} />,
      },
      {
        title: '',
        key: 'delete',
        width: 60,
        align: 'center',
        fixed: 'right',
        render: (v, record, index) => {
          return (
            <div
              onClick={() => {
                return action(() => {
                  const fieldIndex = index;
                  if (!Array.isArray(field.value)) return;
                  const nextValue = [...field.value];
                  if (fieldIndex >= 0 && fieldIndex < nextValue.length) {
                    nextValue.splice(fieldIndex, 1);
                    spliceArrayState(field, {
                      startIndex: fieldIndex,
                      deleteCount: 1,
                    });
                    field.onInput(nextValue);
                  }
                });
              }}
            >
              <CloseOutlined style={{ cursor: 'pointer', color: 'gray' }} />
            </div>
          );
        },
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
  console.log(getColumns());
  return (
    <Card>
      <Table
        columns={getColumns()}
        scroll={{ x: 'max-content' }}
        tableLayout="fixed"
        dataSource={dataSource}
        pagination={false}
      />
      <Space
        style={{
          gap: 15,
        }}
      >
        {allowAddNew !== false && (
          <a onClick={handleAdd}>
            <PlusOutlined /> {t('Add new')}
          </a>
        )}
        {allowSelectExistingRecord && (
          <a onClick={handleAdd}>
            <PlusOutlined /> {t('Select record')}
          </a>
        )}
      </Space>
    </Card>
  );
});
