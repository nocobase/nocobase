import React, { useContext, useMemo, useRef, useState } from 'react';
import { createForm } from '@formily/core';
import {
  SchemaOptionsContext,
  Schema,
  useFieldSchema,
  observer,
  SchemaExpressionScopeContext,
  FormProvider,
  ISchema,
  useField,
  useForm,
  RecursionField,
} from '@formily/react';
import {
  useSchemaPath,
  SchemaField,
  useDesignable,
  removeSchema,
  updateSchema,
} from '../';
import get from 'lodash/get';
import { Button, Dropdown, Menu, Modal, Space } from 'antd';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { FormDialog, FormLayout } from '@formily/antd';
import './style.less';
import AddNew from '../add-new';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { isGridRowOrCol } from '../grid';
import constate from 'constate';
import { useEffect } from 'react';
import { uid } from '@formily/shared';
import { getSchemaPath } from '../../components/schema-renderer';
import { useCollection, useCollectionContext } from '../../constate';
import { useTable } from '../table';
import { DragHandle } from '../../components/Sortable';
import { fieldsToFilterColumns } from '../calendar';

export const DesignableBar = observer((props) => {
  const field = useField();
  const { designable, schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  const { props: tableProps } = useTable();
  const collectionName =
    field.componentProps?.collectionName || tableProps?.collectionName;
  const { collection, fields } = useCollection({ collectionName });
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <div className={'designable-info'}>
        {collection?.title || collection?.name}
      </div>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={2}>
          <AddNew.CardItem defaultAction={'insertAfter'} ghost />
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            // visible={visible}
            // onVisibleChange={(visible) => {
            //   setVisible(visible);
            // }}
            overlay={
              <Menu>
                {/* <Menu.Item
                  key={'update'}
                  onClick={() => {
                    field.readPretty = true;
                  }}
                >
                  编辑表单配置
                </Menu.Item> */}
                <Menu.Item
                  key={'defaultFilter'}
                  onClick={async () => {
                    const { defaultFilter } = await FormDialog(
                      '设置数据范围',
                      () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField
                              schema={{
                                type: 'object',
                                properties: {
                                  defaultFilter: {
                                    type: 'object',
                                    'x-component': 'Filter',
                                    properties: fieldsToFilterColumns(fields),
                                  },
                                },
                              }}
                            />
                          </FormLayout>
                        );
                      },
                    ).open({
                      initialValues: {
                        defaultFilter:
                          field?.componentProps?.defaultFilter || {},
                      },
                    });
                    schema['x-component-props']['defaultFilter'] =
                      defaultFilter;
                    field.componentProps.defaultFilter = defaultFilter;
                    await updateSchema(schema);
                  }}
                >
                  设置数据范围
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    Modal.confirm({
                      title: '删除区块',
                      content: '删除后无法恢复，确定要删除吗？',
                      onOk: async () => {
                        const removed = deepRemove();
                        // console.log({ removed })
                        const last = removed.pop();
                        await removeSchema(last);
                      },
                    });
                  }}
                >
                  删除
                </Menu.Item>
              </Menu>
            }
          >
            <MenuOutlined />
          </Dropdown>
        </Space>
      </span>
    </div>
  );
});
