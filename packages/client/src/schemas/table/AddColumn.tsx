import React, { useState } from 'react';
import { Dropdown, Menu, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { uid } from '@formily/shared';
import { FormDialog, FormLayout } from '@formily/antd';
import { useDesignable, createCollectionField, ISchema } from '..';
import { useCollectionContext, useCollectionsContext, useDisplayedMapContext, useClient } from '../../constate';
import { useTable } from './hooks/useTable';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { isAssociation, options } from '../database-field/interfaces';
import { getSchemaPath, SchemaField } from '../../components/schema-renderer';

export function AddColumn() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { appendChild, remove } = useDesignable();
  const { loadCollections } = useCollectionsContext();
  const { collection, fields, refresh } = useCollectionContext();
  const displayed = useDisplayedMapContext();
  const { service } = useTable();
  const { createSchema, removeSchema, updateSchema } = useClient();
  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.ItemGroup className={'display-fields'} title={t('Display fields')}>
            {fields.map((field) => (
              <SwitchMenuItem
                title={field?.uiSchema?.title}
                checked={displayed.has(field.name)}
                onChange={async (checked) => {
                  if (checked) {
                    console.log('SwitchMenuItem.field.name', field.dataType, service.params[0]);
                    const columnSchema: ISchema = {
                      type: 'void',
                      'x-component': 'Table.Column',
                      'x-component-props': {
                        fieldName: field.name,
                      },
                      'x-designable-bar': 'Table.Column.DesignableBar',
                    };
                    if (field.interface === 'linkTo') {
                      columnSchema.properties = {
                        options: {
                          type: 'void',
                          'x-decorator': 'Form',
                          'x-component': 'Select.Options.Drawer',
                          'x-component-props': {
                            useOkAction: '{{ Select.useOkAction }}',
                          },
                          title: "{{t('Select record')}}",
                          properties: {
                            table: {
                              type: 'array',
                              'x-designable-bar': 'Table.DesignableBar',
                              'x-decorator': 'BlockItem',
                              'x-decorator-props': {
                                draggable: false,
                              },
                              'x-component': 'Table',
                              default: [],
                              'x-component-props': {
                                rowKey: 'id',
                                useRowSelection: '{{ Select.useRowSelection }}',
                                useSelectedRowKeys: '{{ Select.useSelectedRowKeys }}',
                                onSelect: '{{ Select.useSelect() }}',
                                collectionName: field.target,
                                // dragSort: true,
                                // showIndex: true,
                                refreshRequestOnChange: true,
                                pagination: {
                                  pageSize: 10,
                                },
                              },
                              properties: {
                                [uid()]: {
                                  type: 'void',
                                  'x-component': 'Table.ActionBar',
                                  'x-designable-bar': 'Table.ActionBar.DesignableBar',
                                  properties: {
                                    [uid()]: {
                                      type: 'void',
                                      title: "{{t('Filter')}}",
                                      'x-decorator': 'AddNew.Displayed',
                                      'x-decorator-props': {
                                        displayName: 'filter',
                                      },
                                      'x-align': 'left',
                                      'x-component': 'Table.Filter',
                                      'x-designable-bar': 'Table.Filter.DesignableBar',
                                      'x-component-props': {
                                        fieldNames: [],
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        option: {
                          type: 'void',
                          'x-component': 'Select.OptionTag',
                          properties: {
                            [uid()]: {
                              type: 'void',
                              title: "{{t('View record')}}",
                              'x-component': 'Action.Drawer',
                              'x-component-props': {
                                bodyStyle: {
                                  background: '#f0f2f5',
                                },
                              },
                              properties: {
                                [uid()]: {
                                  type: 'void',
                                  'x-component': 'Tabs',
                                  'x-designable-bar': 'Tabs.DesignableBar',
                                  properties: {
                                    [uid()]: {
                                      type: 'void',
                                      title: "{{t('Details')}}",
                                      'x-designable-bar': 'Tabs.TabPane.DesignableBar',
                                      'x-component': 'Tabs.TabPane',
                                      'x-component-props': {},
                                      properties: {
                                        [uid()]: {
                                          type: 'void',
                                          'x-component': 'Grid',
                                          'x-component-props': {
                                            addNewComponent: 'AddNew.PaneItem',
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      };
                    }
                    const data = appendChild(columnSchema);
                    await createSchema(data);
                    if (isAssociation(field)) {
                      const defaultAppends = service.params[0]?.defaultAppends || [];
                      defaultAppends.push(field.name);
                      await service.run({
                        ...service.params[0],
                        defaultAppends,
                      });
                    }
                  } else {
                    const s: any = displayed.get(field.name);
                    const p = getSchemaPath(s);
                    const removed = remove(p);
                    await removeSchema(removed);
                    displayed.remove(field.name);
                    if (isAssociation(field)) {
                      const defaultAppends = service.params[0]?.defaultAppends || [];
                      const index = defaultAppends.indexOf(field.name);
                      if (index > -1) {
                        defaultAppends.splice(index, 1);
                      }
                      await service.run({
                        ...service.params[0],
                        defaultAppends,
                      });
                    }
                  }
                  // service.refresh();
                }}
              />
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu disabled popupClassName={'add-new-fields-popup'} title={t('Add field')}>
            {options.map((option) => (
              <Menu.ItemGroup title={option.label}>
                {option.children.map((item) => (
                  <Menu.Item
                    style={{ minWidth: 150 }}
                    key={item.name}
                    onClick={async () => {
                      setVisible(false);
                      const values = await FormDialog(t('Add field'), () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField scope={{ loadCollections }} schema={item} />
                          </FormLayout>
                        );
                      }).open({
                        initialValues: {
                          interface: item.name,
                          ...item.default,
                          key: uid(),
                          name: `f_${uid()}`,
                        },
                      });
                      await createCollectionField(collection?.name, values);
                      const data = appendChild({
                        type: 'void',
                        'x-component': 'Table.Column',
                        'x-component-props': {
                          fieldName: values.name,
                        },
                        'x-designable-bar': 'Table.Column.DesignableBar',
                      });
                      await createSchema(data);
                      await refresh();
                    }}
                  >
                    {item.title}
                  </Menu.Item>
                ))}
              </Menu.ItemGroup>
            ))}
          </Menu.SubMenu>
        </Menu>
      }
    >
      <Button type={'dashed'} className={'designable-btn designable-btn-dash'} icon={<SettingOutlined />}>
        {t('Configure fields')}
      </Button>
    </Dropdown>
  );
}
