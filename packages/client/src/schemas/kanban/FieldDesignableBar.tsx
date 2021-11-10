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
import { Button, Dropdown, Menu, Modal, Space, Switch } from 'antd';
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
import { RandomNameContext } from '../form';
import { useCollectionContext, useDisplayedMapContext } from '../../constate';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { DragHandle } from '../../components/Sortable';
import { useTranslation } from 'react-i18next';

export const FieldDesignableBar = observer((props) => {
  const field = useField();
  const { t } = useTranslation();
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
        <Space size={2}>
          {/* <AddNew.FormItem defaultAction={'insertAfter'} ghost />
          <DragHandle /> */}
          <Dropdown
            placement={'bottomRight'}
            trigger={['hover']}
            // visible={visible}
            // onVisibleChange={(visible) => {
            //   setVisible(visible);
            // }}
            overlay={
              <Menu>
                <Menu.Item
                  key={'update'}
                  onClick={async () => {
                    const values = await FormDialog(t('Custom field display name'), () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                fieldName: {
                                  type: 'string',
                                  title: t('Original name'),
                                  'x-read-pretty': true,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                title: {
                                  type: 'string',
                                  title: t('Custom name'),
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
                  {t('Custom field display name')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    Modal.confirm({
                      title: t('Delete block'),
                      content: t('Are you sure you want to delete it?'),
                      onOk: async () => {
                        const removed = deepRemove();
                        const fieldName =
                          schema['x-component-props']?.['fieldName'];
                        const last = removed.pop();
                        displayed.remove(fieldName);
                        await removeSchema(last);
                      },
                    });
                  }}
                >
                  {t('Delete')}
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
