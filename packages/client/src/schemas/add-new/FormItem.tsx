import React, { useState } from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import { observer } from '@formily/react';
import { Menu, Dropdown, Button } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { createCollectionField, ISchema, useDesignable, useSchemaPath } from '../';
import { uid } from '@formily/shared';
import { getSchemaPath, SchemaField } from '../../components/schema-renderer';
import { cloneDeep } from 'lodash';
import { options } from '../database-field/interfaces';

import { isGridRowOrCol } from '../grid';
import { useCollectionContext, useCollectionsContext, useDisplayedMapContext, useClient } from '../../constate';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { useTranslation } from 'react-i18next';
import { isGridBlock, isGrid, generateGridBlock } from './utils';

export const FormItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild, deepRemove } = useDesignable();
  const path = useSchemaPath();
  const { loadCollections } = useCollectionsContext();
  const { collection, fields, refresh } = useCollectionContext();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const { createSchema, removeSchema } = useClient();
  const { t } = useTranslation();

  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlayStyle={{
        minWidth: 200,
      }}
      overlay={
        <Menu>
          <Menu.ItemGroup className={'display-fields'} title={t('Display fields')}>
            {fields?.map((field) => (
              <SwitchMenuItem
                key={field.key}
                title={field?.uiSchema?.title}
                checked={displayed.has(field.name)}
                onChange={async (checked) => {
                  if (!checked) {
                    const s: any = displayed.get(field.name);
                    const p = getSchemaPath(s);
                    const removed = deepRemove(p);
                    if (!removed) {
                      console.log('getSchemaPath', p, removed);
                      return;
                    }
                    const last = removed.pop();
                    displayed.remove(field.name);
                    if (isGridRowOrCol(last)) {
                      await removeSchema(last);
                    }
                    return;
                  }
                  let data: ISchema = {
                    key: uid(),
                    type: 'void',
                    'x-decorator': 'Form.Field.Item',
                    'x-designable-bar': 'Form.Field.DesignableBar',
                    'x-component': 'Form.Field',
                    'x-component-props': {
                      fieldName: field.name,
                    },
                  };
                  if (field.interface === 'linkTo') {
                    data.properties = {
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
                              useSelectedRowKeys: '{{ Select.useSelectedRowKeys }}',
                              onSelect: '{{ Select.useSelect() }}',
                              useRowSelection: '{{ Select.useRowSelection }}',
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
                            title: "{{ t('View record') }}",
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
                  if (isGridBlock(schema)) {
                    path.pop();
                    path.pop();
                    data = generateGridBlock(data);
                  } else if (isGrid(schema)) {
                    data = generateGridBlock(data);
                  }
                  if (data) {
                    let s;
                    if (isGrid(schema)) {
                      s = appendChild(data, [...path]);
                    } else if (defaultAction === 'insertAfter') {
                      s = insertAfter(data, [...path]);
                    } else {
                      s = insertBefore(data, [...path]);
                    }
                    await createSchema(s);
                  }
                }}
              />
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu
            disabled
            popupClassName={'add-new-fields-popup'}
            className={'sub-menu-add-new-fields'}
            title={t('Add field')}
          >
            {options.map(
              (option) =>
                option.children.length > 0 && (
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
                          let data: ISchema = cloneDeep(values.uiSchema);
                          data['name'] = values.name;
                          data['referenceKey'] = data['key'];
                          data['key'] = uid();
                          if (isGridBlock(schema)) {
                            path.pop();
                            path.pop();
                            data = generateGridBlock(data);
                          } else if (isGrid(schema)) {
                            data = generateGridBlock(data);
                          }
                          if (data) {
                            let s;
                            if (isGrid(schema)) {
                              s = appendChild(data, [...path]);
                            } else if (defaultAction === 'insertAfter') {
                              s = insertAfter(data, [...path]);
                            } else {
                              s = insertBefore(data, [...path]);
                            }
                            await createSchema(s);
                          }
                          await refresh();
                        }}
                      >
                        {item.title}
                      </Menu.Item>
                    ))}
                  </Menu.ItemGroup>
                ),
            )}
          </Menu.SubMenu>
          {/* <Menu.Divider /> */}
          <Menu.Item
            onClick={async () => {
              let data: ISchema = {
                type: 'void',
                default: t('This is a demo text, **supports Markdown syntax**.'),
                'x-designable-bar': 'Markdown.Void.DesignableBar',
                'x-decorator': 'FormItem',
                'x-read-pretty': true,
                'x-component': 'Markdown.Void',
              };
              if (schema['key']) {
                data['key'] = uid();
              }
              if (isGridBlock(schema)) {
                path.pop();
                path.pop();
                data = generateGridBlock(data);
              } else if (isGrid(schema)) {
                data = generateGridBlock(data);
              }
              if (data) {
                let s;
                if (isGrid(schema)) {
                  s = appendChild(data, [...path]);
                } else if (defaultAction === 'insertAfter') {
                  s = insertAfter(data, [...path]);
                } else {
                  s = insertBefore(data, [...path]);
                }
                console.log('ISchema', schema, data, path);
                await createSchema(s);
              }
              setVisible(false);
            }}
          >
            {t('Add text')}
          </Menu.Item>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button type={'dashed'} className={'designable-btn designable-btn-dash'} icon={<SettingOutlined />}>
          {t('Configure fields')}
        </Button>
      )}
    </Dropdown>
  );
});
