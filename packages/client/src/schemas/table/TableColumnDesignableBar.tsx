import React, { useContext, useState } from 'react';
import { useField } from '@formily/react';
import { Select, Dropdown, Menu, Space } from 'antd';
import { set } from 'lodash';
import cls from 'classnames';
import { MenuOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout, Submit } from '@formily/antd';
import { useTranslation } from 'react-i18next';
import { SchemaField } from '../../components/schema-renderer';
import { useCollectionsContext, useDisplayedMapContext, useClient } from '../../constate';
import { DragHandle } from '../../components/Sortable';
import { useDesignable } from '..';
import { useCompile } from '../../hooks/useCompile';
import { useTable } from './hooks/useTable';
import { CollectionFieldContext } from './context';

export const TableColumnDesignableBar = () => {
  const field = useField();
  const { t } = useTranslation();
  const compile = useCompile();
  const { service, refresh: refreshTable } = useTable();
  // const fieldSchema = useFieldSchema();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const { getFieldsByCollection } = useCollectionsContext();
  const collectionField = useContext(CollectionFieldContext);
  const { createSchema, removeSchema, updateSchema } = useClient();
  console.log('displayed.map', displayed.map);
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space>
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.Item
                  onClick={async (e) => {
                    setVisible(false);
                    const values = await FormDialog(t('Custom name'), () => {
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
                    field.title = title;
                    schema.title = title;
                    refresh();
                    await updateSchema({
                      key: schema['key'],
                      title: title,
                    });
                  }}
                >
                  {t('Custom column name')}
                </Menu.Item>
                {collectionField?.interface === 'linkTo' && (
                  <Menu.Item>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      {t('Label field')}{' '}
                      <Select
                        value={schema?.['x-component-props']?.['fieldNames']?.['label']}
                        placeholder={t('Default is the ID field')}
                        onChange={async (value) => {
                          set(schema['x-component-props'], 'fieldNames.label', value);
                          await updateSchema({
                            key: schema['key'],
                            'x-component-props': {
                              fieldNames: {
                                label: value,
                              },
                            },
                          });
                          refreshTable();
                          // await service.refresh();
                        }}
                        bordered={false}
                        size={'small'}
                        style={{ marginLeft: 16, minWidth: 120 }}
                        options={getFieldsByCollection(collectionField.target)
                          .filter((f) => f?.uiSchema?.title)
                          .map((field) => ({
                            label: compile(field?.uiSchema?.title || field.name),
                            value: field.name,
                          }))}
                      />
                    </div>
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item
                  onClick={async () => {
                    const fieldName = schema['x-component-props']?.['fieldName'];
                    displayed.remove(fieldName);
                    schema['x-hidden'] = true;
                    refresh();
                    await updateSchema({
                      key: schema['key'],
                      ['x-hidden']: true,
                    });
                    // const s = remove();
                    // await removeSchema(s);
                  }}
                >
                  {t('Hide')}
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
};
