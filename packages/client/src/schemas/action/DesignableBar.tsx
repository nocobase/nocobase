import React, { useState } from 'react';
import { useField } from '@formily/react';
import { Dropdown, Menu, Space, Select } from 'antd';
import { useDesignable, updateSchema, removeSchema } from '..';
import cls from 'classnames';
import { MenuOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaField } from '../../components/schema-renderer';
import { DragHandle } from '../../components/Sortable';
import { useDisplayedMapContext } from '../../constate';
import { Trans, useTranslation } from 'react-i18next';

export const DesignableBar = (props: any) => {
  const { t } = useTranslation();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const isPopup = Object.keys(schema.properties || {}).length > 0;
  const displayed = useDisplayedMapContext();
  const field = useField();
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={2}>
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
                    <Trans>
                      Open in
                      <Select
                        bordered={false}
                        size={'small'}
                        defaultValue={'Action.Modal'}
                        onChange={(value) => {
                          const s = Object.values(schema.properties).shift();
                          s['x-component'] = value;
                          refresh();
                          updateSchema(s);
                        }}
                      >
                        <Select.Option value={'Action.Modal'}>Modal</Select.Option>
                        <Select.Option value={'Action.Drawer'}>Drawer</Select.Option>
                        <Select.Option value={'Action.Window'}>Window</Select.Option>
                      </Select>
                    </Trans>
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
