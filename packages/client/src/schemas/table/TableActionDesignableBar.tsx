import React, { useState } from 'react';
import { Select, Dropdown, Menu, Switch, Space } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useField } from '@formily/react';
import { FormDialog, FormLayout } from '@formily/antd';
import cls from 'classnames';
import { Trans, useTranslation } from 'react-i18next';
import { useDesignable } from '..';
import { useDisplayedMapContext, useClient } from '../../constate';
import { DragHandle } from '../../components/Sortable';
import { SchemaField } from '../../components/schema-renderer';

export const TableActionDesignableBar = () => {
  const { t } = useTranslation();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const isPopup = Object.keys(schema.properties || {}).length > 0;
  const popupSchema = Object.values(schema.properties || {}).shift();
  const inActionBar = schema.parent['x-component'] === 'Table.ActionBar';
  const displayed = useDisplayedMapContext();
  const field = useField();
  const { createSchema, removeSchema, updateSchema } = useClient();
  const popupComponent = popupSchema?.['x-component'] || 'Action.Drawer';
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
                {isPopup && (
                  <Menu.Item>
                    <Trans t={t}>
                      Open in
                      <Select
                        bordered={false}
                        size={'small'}
                        defaultValue={popupComponent}
                        style={{ width: 100 }}
                        onChange={async (value) => {
                          const s = Object.values(schema.properties).shift();
                          s['x-component'] = value;
                          refresh();
                          await updateSchema(s);
                          window.location.reload();
                          // const f = field.query(getSchemaPath(s)).take()
                          // console.log('fffffff', { schema, f });
                        }}
                      >
                        <Select.Option value={'Action.Modal'}>Modal</Select.Option>
                        <Select.Option value={'Action.Drawer'}>Drawer</Select.Option>
                        <Select.Option disabled value={'Action.Window'}>
                          Window
                        </Select.Option>
                      </Select>
                    </Trans>
                  </Menu.Item>
                )}
                {!inActionBar && (
                  <Menu.Item>
                    {t('Triggered when the row is clicked')} &nbsp;&nbsp;
                    <Switch size={'small'} defaultChecked />
                  </Menu.Item>
                )}
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
