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
import { Button, Dropdown, Menu, Space } from 'antd';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { FormLayout } from '@formily/antd';
import './style.less';
import AddNew from '../add-new';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { isGridRowOrCol } from '../grid';
import constate from 'constate';
import { useEffect } from 'react';
import { uid } from '@formily/shared';
import { getSchemaPath } from '../../components/schema-renderer';
import { RandomNameContext } from '.';
import { useDisplayedMapContext } from '../../constate';

export const FieldDesignableBar = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { designable, schema, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  const randomName = useContext(RandomNameContext);
  const displayed = useDisplayedMapContext();
  const fieldName = schema['x-component-props']?.['fieldName'];
  if (!designable) {
    return null;
  }
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
                    const title = uid();
                    field
                      .query(field.address.concat(randomName, fieldName))
                      .take((f) => {
                        f.title = title;
                      });
                    console.log(
                      'fieldfieldfieldfieldfield',
                      field.address.concat(randomName, fieldName).entire,
                      schema,
                    );
                    schema['title'] = title;
                    await updateSchema({
                      key: schema['key'],
                      title,
                    });
                  }}
                >
                  修改字段配置
                </Menu.Item>
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
                  删除当前字段
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
