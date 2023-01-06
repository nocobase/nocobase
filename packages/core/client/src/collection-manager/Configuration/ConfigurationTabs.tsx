import { Tabs, Modal } from 'antd';
import { UpOutlined } from '@ant-design/icons';
import React, { useState, useContext } from 'react';
import { SchemaOptionsContext } from '@formily/react';
import { uid } from '@formily/shared';
import { CollectionCategroriesContext } from '../context';
import { useAPIClient } from '../../api-client';
import { SchemaComponent, useCompile } from '../../schema-component';
import { collectionTableSchema } from './schemas/collections';
import { useResourceActionContext } from '../ResourceActionProvider';

export const ConfigurationTabs = () => {
  const { data, refresh } = useContext(CollectionCategroriesContext);
  const tabsItems = data.sort((a, b) => b.sort - a.sort).concat();
  !tabsItems.find((v) => v.id === 'all') &&
    tabsItems.unshift({
      name: '{{t("All collections")}}',
      id: 'all',
      sort: 0,
      closable: false,
    });
  const compile = useCompile();
  const [activeKey, setActiveKey] = useState('all');
  const api = useAPIClient();
  const { run, defaultRequest, setState } = useResourceActionContext();
  const onChange = (key: string) => {
    setActiveKey(key);
    if (key !== 'all') {
      const prevFilter = defaultRequest?.params?.filter;
      const filter = { $and: [prevFilter, { 'category.id': key }] };
      run({ filter });
      setState?.({ category: [+key] });
    } else {
      run();
      setState?.({ category: [] });
    }
  };

  const remove = (key: string) => {
    Modal.confirm({
      title: compile("{{t('Delete category')}}"),
      content: compile("{{t('Are you sure you want to delete it?')}}"),
      onOk: async () => {
        console.log(key);
        await api.resource('collection_categories').destroy({
          filter: {
            id: key,
          },
        });
        await refresh();
      },
    });
  };
  const onEdit = (targetKey: string, action: 'add' | 'remove') => {
    if (action === 'add') {
    } else {
      remove(targetKey);
    }
  };
  const loadCategories = async () => {
    return data.map((item: any) => ({
      label: compile(item.name),
      value: item.id,
    }));
  };
  const scopeCxt = useContext(SchemaOptionsContext);
  return (
    <Tabs
      addIcon={
        <SchemaComponent
          schema={{
            type: 'void',
            properties: {
              addCategories: {
                type: 'void',
                title: '{{ t("Add category") }}',
                'x-component': 'AddCategory',
                'x-component-props': {
                  type: 'primary',
                },
              },
            },
          }}
        />
      }
      onChange={onChange}
      activeKey={activeKey}
      type="editable-card"
      onEdit={onEdit}
      destroyInactiveTabPane={true}
    >
      {tabsItems.map((item) => {
        return (
          <Tabs.TabPane
            tab={
              <SchemaComponent
                schema={{
                  type: 'void',
                  properties: {
                    [uid()]: {
                      'x-component': 'EditCategory',
                      'x-component-props': {
                        item: item,
                      },
                    },
                  },
                }}
              />
            }
            key={item.id}
            closable={item.closable}
          >
            <SchemaComponent
              schema={collectionTableSchema}
              scope={{ ...scopeCxt, loadCategories, categoryVisible: item.id === 'all' }}
            />
          </Tabs.TabPane>
        );
      })}
    </Tabs>
  );
};
