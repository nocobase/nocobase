/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildFieldItems, useFlowModel, AddFieldButton, useFlowEngine, DndProvider } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';
import { DragEndEvent } from '@dnd-kit/core';
import { CloseOutlined } from '@ant-design/icons';
import { Table, Card, Space, Form } from 'antd';
import { castArray } from 'lodash';
import { PlusOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import React, { useMemo, useEffect } from 'react';
import { SubTableColumnModel } from './SubTableColumnModel';
import { EditFormModel } from '../../../../data-blocks/form/EditFormModel';

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
    'FormFieldModel',
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
        const currentBlockModel = model.context.blockModel;
        if (currentBlockModel instanceof EditFormModel) {
          currentBlockModel.addAppends(`${model.fieldPath}.${column.fieldPath}`, true);
        }
      }}
    />
  );
};

export const SubTable = observer((props: any) => {
  const { allowAddNew, enableIndexColumn, form, name, editable } = props;
  const value: any[] = form.getFieldValue(name) || [];
  const model: any = useFlowModel();
  const { t } = useTranslation();
  const getColumns = (remove) => {
    const baseColumns = model.mapSubModels('columns', (column: SubTableColumnModel) => column.getColumnProps());
    return [
      enableIndexColumn && {
        title: '',
        key: '__index__',
        width: 48,
        align: 'center',
        fixed: 'left',
        render: (_: any, __: any, index: number) => index + 1,
      },
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
      editable && {
        title: '',
        key: 'delete',
        width: 60,
        align: 'center',
        fixed: 'right',
        render: (v, record, index) => {
          return (
            <div
              onClick={() => {
                remove(index);
              }}
            >
              <CloseOutlined style={{ cursor: 'pointer', color: 'gray' }} />
            </div>
          );
        },
      },
    ].filter(Boolean) as any;
  };

  const watchedValue = Form.useWatch(name, form);
  const dataSource = useMemo(() => {
    return castArray(watchedValue || []).map((item, index) => ({
      key: index,
      ...item,
    }));
  }, [watchedValue]);
  const handleAdd = () => {
    const next = [...value, {}];
    form.setFieldsValue({ [name]: next });
  };
  const HeaderWrapperComponent = React.memo((props) => {
    const engine = useFlowEngine();

    const onDragEnd = ({ active, over }: DragEndEvent) => {
      if (active.id && over?.id && active.id !== over.id) {
        engine.moveModel(active.id as string, over.id as string);
      }
    };

    return (
      <DndProvider onDragEnd={onDragEnd}>
        <thead {...props} />
      </DndProvider>
    );
  });
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => {
        console.log(fields);
        return (
          <Card>
            <Table
              columns={getColumns(remove)}
              tableLayout="fixed"
              scroll={{ x: 'max-content' }}
              dataSource={dataSource}
              pagination={false}
              locale={{
                emptyText: <span> {editable ? t('Please add or select record') : t('No data')}</span>,
              }}
              components={{
                header: {
                  wrapper: HeaderWrapperComponent,
                },
              }}
            />
            <Space
              style={{
                gap: 15,
              }}
            >
              {editable && allowAddNew !== false && (
                <a onClick={add}>
                  <PlusOutlined /> {t('Add new')}
                </a>
              )}
            </Space>
          </Card>
        );
      }}
    </Form.List>
  );
});
