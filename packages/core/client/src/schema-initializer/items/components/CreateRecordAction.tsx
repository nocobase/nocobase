import React, { useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { RecursionField, Schema } from '@formily/react';
import { Dropdown, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCollectionManager, useCollection, CollectionProvider } from '../../../collection-manager';
import { ActionContext, useCompile } from '../../../schema-component';

const schema = {
  type: 'void',
  title: '{{ t("Add new") }}',
  'x-action': 'create',
  'x-designer': 'Action.Designer',
  'x-component': 'Action',
  'x-component-props': {
    icon: 'PlusOutlined',
    openMode: 'drawer',
    type: 'primary',
  },
  properties: {
    drawer: {
      type: 'void',
      title: '{{ t("Add record") }}',
      'x-component': 'Action.Container',
      'x-component-props': {
        className: 'nb-action-popup',
      },
      properties: {
        tabs: {
          type: 'void',
          'x-component': 'Tabs',
          'x-component-props': {},
          'x-initializer': 'TabPaneInitializersForCreateFormBlock',
          properties: {
            tab1: {
              type: 'void',
              title: '{{t("Add new")}}',
              'x-component': 'Tabs.TabPane',
              'x-designer': 'Tabs.Designer',
              'x-component-props': {},
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'CreateFormBlockInitializers',
                  properties: {},
                },
              },
            },
          },
        },
      },
    },
  },
} as unknown as Schema;

const createSchema = {
  type: 'void',
  //   'x-component': 'Action',
  properties: {
    drawer: {
      type: 'void',
      title: '{{ t("Add record") }}',
      'x-component': 'Action.Drawer',
      'x-component-props': {
        className: 'nb-action-popup',
      },
      properties: {
        tabs: {
          type: 'void',
          'x-component': 'Tabs',
          'x-component-props': {},
          'x-initializer': 'TabPaneInitializersForCreateFormBlock',
          properties: {
            tab1: {
              type: 'void',
              title: '{{t("Add new")}}',
              'x-component': 'Tabs.TabPane',
              'x-designer': 'Tabs.Designer',
              'x-component-props': {},
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'CreateFormBlockInitializers',
                  properties: {},
                },
              },
            },
          },
        },
      },
    },
  },
} as unknown as Schema;

export const CreateRecordAction = () => {
  const [visible, setVisible] = useState(false);
  const collection = useCollection();
  const { getChildrenCollections, refreshCM } = useCollectionManager();
  const inheritsCollections = getChildrenCollections(collection.name);
  const [currentCollection, setCurrentCollection] = useState(collection.name);
  const compile = useCompile();
  const { t } = useTranslation();
  const menu = (
    <Menu>
      {inheritsCollections.map((option) => {
        return (
          <Menu.Item
            key={option.name}
            onClick={(info) => {
              setVisible(true);
              setCurrentCollection(option.name);
            }}
          >
            {compile(option.title)}
          </Menu.Item>
        );
      })}
    </Menu>
  );
  return inheritsCollections?.length > 0 ? (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown.Button
        type="primary"
        icon={<DownOutlined />}
        buttonsRender={([leftButton, rightButton]) => [
          leftButton,
          React.cloneElement(rightButton as React.ReactElement<any, string>, { loading: false }),
        ]}
        overlay={menu}
        onClick={(info) => {
          console.log(info);
          setVisible(true);
          setCurrentCollection(collection.name);
        }}
      >
        {t('Add new')}
      </Dropdown.Button>
      <CollectionProvider name={currentCollection}>
        <RecursionField schema={createSchema} name="creste" />
      </CollectionProvider>
    </ActionContext.Provider>
  ) : (
    <RecursionField schema={schema} name={'create'} />
  );
};
