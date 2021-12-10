import React from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import { observer } from '@formily/react';
import { Menu, Dropdown, Button } from 'antd';
import { PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { ISchema, useDesignable, useSchemaPath } from '../';
import { uid } from '@formily/shared';
import { SchemaField } from '../../components/schema-renderer';

import IconPicker from '../../components/icon-picker';
import { useCollectionsContext, useClient } from '../../constate';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks/useCompile';
import { isGridBlock, isGrid, generateCardItemSchema, generateGridBlock } from './utils';

export const CardItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild } = useDesignable();
  const path = useSchemaPath();
  const { collections = [], loading, refresh } = useCollectionsContext();
  const { createSchema } = useClient();
  const { t } = useTranslation();
  const compile = useCompile();
  return (
    <Dropdown
      trigger={['hover']}
      overlayStyle={{
        minWidth: 200,
      }}
      onVisibleChange={(visible) => {
        console.log('onVisibleChange', visible);
      }}
      overlay={
        <Menu
          onClick={async (info) => {
            if (info.key.startsWith('Calendar.')) {
              return;
            }
            if (info.key.startsWith('Kanban.')) {
              return;
            }
            let data: ISchema;
            let collectionName = null;
            let isNew = false;
            if (['addNewTable', 'addNewForm'].includes(info.key)) {
              // const values = await FormDialog(`创建数据表`, () => {
              //   return (
              //     <FormLayout layout={'vertical'}>
              //       <SchemaField schema={dbSchema} />
              //     </FormLayout>
              //   );
              // }).open({
              //   initialValues: {
              //     name: `t_${uid()}`,
              //     fields: [],
              //   },
              // });
              // await createOrUpdateCollection(values);
              // isNew = true;
              // data = generateCardItemSchema(
              //   info.key === 'addNewTable' ? 'Table' : 'Form',
              // );
              // collectionName = values.name;
            } else if (info.key.startsWith('collection.')) {
              const keys = info.key.split('.');
              const component = keys.pop();
              const tableName = keys.pop();
              collectionName = tableName;
              data = generateCardItemSchema(component);
              console.log('info.keyPath', component, tableName);
            } else {
              data = generateCardItemSchema(info.key);
              console.log('generateCardItemSchema', data, info.key);
            }
            if (schema['key']) {
              data['key'] = uid();
            }
            if (collectionName) {
              data['x-component-props'] = data['x-component-props'] || {};
              data['x-component-props']['resource'] = collectionName;
              data['x-component-props']['collectionName'] = collectionName;
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
            if (isNew) {
              await refresh();
            }
          }}
        >
          <Menu.ItemGroup title={t('Data blocks')}>
            {[
              { key: 'Table', title: t('Table'), icon: 'TableOutlined' },
              { key: 'Form', title: t('Form'), icon: 'FormOutlined' },
            ].map((view) => (
              <Menu.SubMenu
                icon={<IconPicker type={view.icon} />}
                // disabled={view.disabled}
                key={view.key}
                title={view.title}
              >
                <Menu.ItemGroup className={'display-fields'} key={`${view.key}-select`} title={t('Select data source')}>
                  {collections?.map((item) => (
                    <Menu.Item style={{ minWidth: 150 }} key={`collection.${item.name}.${view.key}`}>
                      {compile(item.title)}
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
                {/* <Menu.Divider></Menu.Divider> */}
                {/* <Menu.Item icon={<PlusOutlined />} key={`addNew${view.key}`}>
                  创建数据表
                </Menu.Item> */}
              </Menu.SubMenu>
            ))}
            {[
              {
                key: 'Calendar',
                title: t('Calendar'),
                icon: 'CalendarOutlined',
                // disabled: true,
              },
            ].map((view) => (
              <Menu.SubMenu
                icon={<IconPicker type={view.icon} />}
                // disabled={view.disabled}
                key={view.key}
                title={view.title}
              >
                <Menu.ItemGroup className={'display-fields'} key={`${view.key}-select`} title={t('Select data source')}>
                  {collections?.map((item) => (
                    <Menu.Item
                      style={{ minWidth: 150 }}
                      key={`Calendar.collection.${item.name}.${view.key}`}
                      onClick={async () => {
                        const values = await FormDialog(t('Configure calendar'), () => {
                          return (
                            <FormLayout layout={'vertical'}>
                              <SchemaField
                                schema={{
                                  type: 'object',
                                  properties: {
                                    title: {
                                      type: 'string',
                                      title: t('Title field'),
                                      required: true,
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Select',
                                      enum: item?.generalFields?.map((field) => {
                                        return {
                                          label: field?.uiSchema.title,
                                          value: field?.name,
                                        };
                                      }),
                                    },
                                    start: {
                                      title: t('Start date field'),
                                      required: true,
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Select',
                                      enum: item?.generalFields
                                        ?.filter((field) => field.dataType === 'date')
                                        ?.map((field) => {
                                          return {
                                            label: field?.uiSchema.title,
                                            value: field?.name,
                                          };
                                        }),
                                    },
                                    end: {
                                      title: t('End date field'),
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Select',
                                      enum: item?.generalFields
                                        ?.filter((field) => field.dataType === 'date')
                                        ?.map((field) => {
                                          return {
                                            label: field?.uiSchema.title,
                                            value: field?.name,
                                          };
                                        }),
                                    },
                                  },
                                }}
                              />
                            </FormLayout>
                          );
                        }).open({});
                        let data = generateCardItemSchema('Calendar');
                        const collectionName = item.name;
                        if (schema['key']) {
                          data['key'] = uid();
                        }
                        console.log('fieldNames', values);
                        if (collectionName) {
                          data['x-component-props'] = data['x-component-props'] || {};
                          data['x-component-props']['resource'] = collectionName;
                          data['x-component-props']['collectionName'] = collectionName;
                          data['x-component-props']['fieldNames'] = values;
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
                    >
                      {compile(item.title)}
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
                {/* <Menu.Divider></Menu.Divider> */}
                {/* <Menu.Item icon={<PlusOutlined />} key={`addNew${view.key}`}>
                  创建数据表
                </Menu.Item> */}
              </Menu.SubMenu>
            ))}
            {[
              {
                key: 'Kanban',
                title: t('Kanban'),
                icon: 'CreditCardOutlined',
                // disabled: true,
              },
            ].map((view) => (
              <Menu.SubMenu
                icon={<IconPicker type={view.icon} />}
                // disabled={view.disabled}
                key={view.key}
                title={view.title}
              >
                <Menu.ItemGroup className={'display-fields'} key={`${view.key}-select`} title={t('Select data source')}>
                  {collections?.map((item) => (
                    <Menu.SubMenu
                      // style={{ minWidth: 150 }}
                      key={`collection.${item.name}.${view.key}`}
                      title={compile(item.title)}
                    >
                      <Menu.ItemGroup title={t('Select group field')}>
                        {item?.generalFields
                          ?.filter((item) => {
                            return item?.uiSchema?.enum;
                          })
                          ?.map((field) => {
                            return (
                              <Menu.Item
                                style={{ minWidth: 150 }}
                                key={`Kanban.collection.${field.name}.${view.key}`}
                                onClick={async () => {
                                  let data = generateCardItemSchema('Kanban');
                                  const collectionName = item.name;
                                  if (schema['key']) {
                                    data['key'] = uid();
                                  }
                                  if (collectionName) {
                                    data['x-component-props'] = data['x-component-props'] || {};
                                    data['x-component-props']['resource'] = collectionName;
                                    data['x-component-props']['collectionName'] = collectionName;
                                    data['x-component-props']['groupField'] = {
                                      name: field.name,
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
                              >
                                {compile(field?.uiSchema?.title)}
                              </Menu.Item>
                            );
                          })}
                      </Menu.ItemGroup>
                    </Menu.SubMenu>
                    // <Menu.Item
                    //   style={{ minWidth: 150 }}
                    //   key={`collection.${item.name}.${view.key}`}
                    // >
                    //   {item.title}
                    // </Menu.Item>
                  ))}
                </Menu.ItemGroup>
                {/* <Menu.Divider></Menu.Divider>
                <Menu.Item icon={<PlusOutlined />} key={`addNew${view.key}`}>
                  创建数据表
                </Menu.Item> */}
              </Menu.SubMenu>
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.ItemGroup title={t('Media')}>
            <Menu.Item key={'Markdown.Void'} icon={<IconPicker type={'FileMarkdownOutlined'} />}>
              {t('Markdown')}
            </Menu.Item>
            <Menu.Item disabled key={'Wysiwyg.Void'} icon={<IconPicker type={'FileTextOutlined'} />}>
              {t('Wysiwyg')}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.ItemGroup title={t('Charts')}>
            <Menu.Item key={'Chart.Column'} icon={<IconPicker type={'BarChartOutlined'} />}>
              {t('Column chart')}
            </Menu.Item>
            <Menu.Item key={'Chart.Bar'} icon={<IconPicker type={'BarChartOutlined'} />}>
              {t('Bar chart')}
            </Menu.Item>
            <Menu.Item disabled key={'Chart.Line'} icon={<IconPicker type={'LineChartOutlined'} />}>
              {t('Line chart')}
            </Menu.Item>
            <Menu.Item disabled key={'Chart.Pie'} icon={<IconPicker type={'PieChartOutlined'} />}>
              {t('Pie chart')}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu key={'Ref'} icon={<LinkOutlined />} title={t('Templates')}>
            <Menu.ItemGroup key={'form-select'} title={t('Select template')}>
              <Menu.Item key={'Ref.ActionLogs'}>{t('Action logs')}</Menu.Item>
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item disabled key={'addNewRef'}>
              {t('Create template')}
            </Menu.Item>
          </Menu.SubMenu>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button type={'dashed'} className={'designable-btn designable-btn-dash'} icon={<PlusOutlined />}>
          {t('Add block')}
        </Button>
      )}
    </Dropdown>
  );
});
