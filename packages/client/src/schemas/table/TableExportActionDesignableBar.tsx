import React, { useState } from 'react';
import { Dropdown, Menu, Space } from 'antd';
import { useField } from '@formily/react';
import { FormDialog, FormLayout } from '@formily/antd';
import { MenuOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { Trans, useTranslation } from 'react-i18next';
import { DragHandle } from '../../components/Sortable';
import { useDesignable } from '..';
import { useCollectionContext, useDisplayedMapContext, useClient } from '../../constate';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { SchemaField } from '../../components/schema-renderer';

export const TableExportActionDesignableBar = () => {
  const { t } = useTranslation();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const { fields } = useCollectionContext();
  const field = useField();
  const { createSchema, removeSchema, updateSchema } = useClient();
  let fieldNames = field.componentProps.fieldNames || [];
  if (fieldNames.length === 0) {
    fieldNames = fields.map((field) => field.name);
  }
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
                <Menu.ItemGroup title={t('Export fields')}>
                  {fields.map((collectionField) => (
                    <SwitchMenuItem
                      title={collectionField?.uiSchema?.title}
                      checked={fieldNames.includes(collectionField.name)}
                      onChange={async (checked) => {
                        if (checked) {
                          fieldNames.push(collectionField.name);
                        } else {
                          const index = fieldNames.indexOf(collectionField.name);
                          if (index > -1) {
                            fieldNames.splice(index, 1);
                          }
                        }
                        console.log({ fieldNames, field });
                        schema['x-component-props']['fieldNames'] = fieldNames;
                        field.componentProps.fieldNames = fieldNames;
                        updateSchema(schema);
                      }}
                    />
                  ))}
                </Menu.ItemGroup>
                <Menu.Divider />
                <Menu.Item
                  onClick={async (e) => {
                    setVisible(false);
                    const values = await FormDialog(t('Edit button'), () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                title: {
                                  type: 'string',
                                  title: t('Display name'),
                                  required: true,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                icon: {
                                  type: 'string',
                                  title: t('Icon'),
                                  'x-decorator': 'FormItem',
                                  'x-component': 'IconPicker',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    }).open({
                      initialValues: {
                        title: schema['title'],
                        icon: schema['x-component-props']?.['icon'],
                      },
                    });
                    schema['title'] = values.title;
                    schema['x-component-props']['icon'] = values.icon;
                    field.componentProps.icon = values.icon;
                    field.title = values.title;
                    updateSchema(schema);
                    refresh();
                  }}
                >
                  {t('Edit button')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={async () => {
                    const displayName = schema?.['x-decorator-props']?.['displayName'];
                    const data = remove();
                    await removeSchema(data);
                    if (displayName) {
                      displayed.remove(displayName);
                    }
                    setVisible(false);
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
