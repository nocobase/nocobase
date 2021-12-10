import React, { useContext, useState } from 'react';
import { observer } from '@formily/react';
import { Menu, Dropdown, Modal, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ISchema, useDesignable, useSchemaPath } from '../';
import { uid } from '@formily/shared';

import IconPicker from '../../components/icon-picker';
import { useCollectionContext, useClient } from '../../constate';
import { BlockSchemaContext } from '../../context';
import { useTranslation } from 'react-i18next';
import { isGridBlock, isGrid, generateCardItemSchema, generateGridBlock } from './utils';

export const PaneItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild } = useDesignable();
  const path = useSchemaPath();
  const [visible, setVisible] = useState(false);
  const blockSchema = useContext(BlockSchemaContext);
  const useResource = `{{ ${blockSchema['x-component']}.useResource }}`;
  console.log('AddNew.PaneItem.useResource', useResource);
  const { collection, fields } = useCollectionContext();
  const { createSchema } = useClient();
  const { t } = useTranslation();
  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlayStyle={{
        minWidth: 200,
      }}
      // placement={'bottomCenter'}
      overlay={
        <Menu>
          <Menu.ItemGroup title={t('Data blocks')}>
            <Menu.Item
              icon={<IconPicker type={'FileOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  type: 'void',
                  name: uid(),
                  'x-decorator': 'CardItem',
                  'x-component': 'Form',
                  'x-read-pretty': true,
                  'x-component-props': {
                    useResource,
                  },
                  'x-designable-bar': 'Form.DesignableBar',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Action.Bar',
                      'x-designable-bar': 'Action.Bar.DesignableBar',
                      'x-component-props': {},
                    },
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Grid',
                      'x-component-props': {
                        addNewComponent: 'AddNew.FormItem',
                      },
                    },
                  },
                };
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
                setVisible(false);
              }}
              style={{ minWidth: 150 }}
            >
              {t('Details')}
            </Menu.Item>
            <Menu.Item
              icon={<IconPicker type={'FormOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  type: 'void',
                  name: uid(),
                  'x-decorator': 'CardItem',
                  'x-component': 'Form',
                  'x-component-props': {
                    useResource,
                    showDefaultButtons: true,
                  },
                  'x-designable-bar': 'Form.DesignableBar',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Grid',
                      'x-component-props': {
                        addNewComponent: 'AddNew.FormItem',
                      },
                    },
                  },
                };
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
                setVisible(false);
              }}
            >
              {t('Form')}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup title={t('Relationship blocks')}>
            <Menu.Item
              style={{ minWidth: 150 }}
              icon={<IconPicker type={'HistoryOutlined'} />}
              onClick={async () => {
                let data: ISchema = generateCardItemSchema('Ref.ActionLogs');
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
                setVisible(false);
              }}
            >
              {t('Action logs')}
            </Menu.Item>
            {fields
              ?.filter((f) => f.interface === 'linkTo')
              ?.map((collectionField) => {
                return (
                  <Menu.Item
                    key={collectionField.name}
                    onClick={async () => {
                      const multiple = collectionField?.uiSchema?.['x-component-props']?.multiple;
                      let data = generateCardItemSchema(multiple ? 'Table' : 'Descriptions');
                      if (schema['key']) {
                        data['key'] = uid();
                      }
                      data['x-component-props'] = data['x-component-props'] || {};
                      data['x-component-props']['collectionName'] = collectionField?.target;
                      data['x-component-props']['resourceName'] = collectionField?.name;
                      data['x-component-props']['associatedName'] = collection?.name;
                      data['x-component-props']['useResource'] = '{{ Association.useResource }}';
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
                    {collectionField?.uiSchema?.title}
                  </Menu.Item>
                );
              })}
          </Menu.ItemGroup>
          <Menu.ItemGroup title={t('Media')}>
            <Menu.Item
              icon={<IconPicker type={'FileMarkdownOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  key: uid(),
                  type: 'void',
                  default: t('This is a demo text, **supports Markdown syntax**.'),
                  'x-designable-bar': 'Markdown.Void.DesignableBar',
                  'x-decorator': 'CardItem',
                  'x-read-pretty': true,
                  'x-component': 'Markdown.Void',
                };
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
                setVisible(false);
              }}
            >
              {t('Markdown')}
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button className={'designable-btn designable-btn-dash'} type={'dashed'} icon={<PlusOutlined />}>
          {t('Add block')}
        </Button>
      )}
    </Dropdown>
  );
});
