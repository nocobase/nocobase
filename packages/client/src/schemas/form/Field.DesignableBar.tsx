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
import { Button, Dropdown, Menu, Space, Switch } from 'antd';
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
import { RandomNameContext } from '.';
import { useCollectionContext, useDisplayedMapContext } from '../../constate';
import SwitchMenuItem from '../../components/SwitchMenuItem';

export const FieldDesignableBar = observer((props) => {
  const field = useField();
  const { schema, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  const randomName = useContext(RandomNameContext);
  const displayed = useDisplayedMapContext();
  const fieldName = schema['x-component-props']?.['fieldName'];
  const { getField } = useCollectionContext();

  const collectionField = getField(fieldName);

  console.log({ collectionField });

  const realField = field
    .query(field.address.concat(randomName, fieldName))
    .take();

  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={'small'}>
          <AddNew.FormItem defaultAction={'insertAfter'} ghost />
          {dragRef && <DragOutlined ref={dragRef} />}
          <Dropdown
            placement={'bottomRight'}
            trigger={['click']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.Item
                  key={'update'}
                  onClick={async () => {
                    const values = await FormDialog('修改字段名称', () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                fieldName: {
                                  type: 'string',
                                  title: '原字段名称',
                                  'x-read-pretty': true,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                title: {
                                  type: 'string',
                                  title: '自定义名称',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    }).open({
                      initialValues: {
                        fieldName: collectionField?.uiSchema?.title,
                        title: schema['title'],
                      },
                    });
                    const title = values.title || null;
                    field
                      .query(field.address.concat(randomName, fieldName))
                      .take((f) => {
                        f.title = title || collectionField?.uiSchema?.title;
                      });
                    schema['title'] = title;
                    await updateSchema({
                      key: schema['key'],
                      title,
                    });
                  }}
                >
                  修改字段名称
                </Menu.Item>
                <Menu.Item
                  style={{ minWidth: 150 }}
                  onClick={async () => {
                    const values = await FormDialog('编辑描述', () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                description: {
                                  type: 'string',
                                  'x-component': 'Input.TextArea',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    }).open({
                      initialValues: {
                        description: schema['description'],
                      },
                    });
                    const description = values.description || null;
                    realField.description = description || collectionField?.uiSchema?.description;
                    schema['description'] = description;
                    await updateSchema({
                      key: schema['key'],
                      description,
                    });
                  }}
                >
                  编辑描述
                </Menu.Item>
                <SwitchMenuItem
                  title={'必填'}
                  checked={schema.required as boolean}
                  onChange={(checked) => {
                    field
                      .query(field.address.concat(randomName, fieldName))
                      .take((f: any) => {
                        f.required = checked;
                        schema.required = checked;
                        updateSchema(schema);
                      });
                  }}
                />
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    const removed = deepRemove();
                    const fieldName =
                      schema['x-component-props']?.['fieldName'];
                    console.log({ schema, removed, fieldName });
                    const last = removed.pop();
                    displayed.remove(fieldName);
                    if (isGridRowOrCol(last)) {
                      await removeSchema(last);
                    }
                  }}
                >
                  移除
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
