import { Button, Tabs, Modal } from 'antd';
import React, { useRef, useState, useContext } from 'react';
import { SchemaOptionsContext } from '@formily/react';
import { CollectionCategroriesContext } from '../context';
import { useAPIClient } from '../../api-client';
import { SchemaComponent, SchemaComponentContext, useCompile } from '../../schema-component';
import { collectionTableSchema } from './schemas/collections';

export const ConfigurationTabs = () => {
  const { data, refresh } = useContext(CollectionCategroriesContext);
  const tabsItems = data.sort((a, b) => a.sort - b.sort);
  !tabsItems.find((v) => v.key === 'all') &&
    tabsItems.unshift({
      label: '{{t("All collections")}}',
      key: 'all',
      sort: 0,
      closable: false,
    });
  const compile = useCompile();
  const [activeKey, setActiveKey] = useState('all');
  const api = useAPIClient();
  const newTabIndex = useRef(0);
  const onChange = (key: string) => {
    setActiveKey(key);
  };

  const remove = (targetKey: string) => {
    Modal.confirm({
      title: compile("{{t('Delete category')}}"),
      content: compile("{{t('Are you sure you want to delete it?')}}"),
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        await api.resource('collection_categories').destroy({
          //   filterByTk: targetKey,
          filter: {
            id: targetKey,
          },
        });
        await refresh();
      },
    });
    const targetIndex = tabsItems.findIndex((pane) => pane.key === targetKey);
    const newPanes = tabsItems.filter((pane) => pane.key !== targetKey);
    if (newPanes.length && targetKey === activeKey) {
      const { key } = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex];
      setActiveKey(key);
    }
  };
  const onEdit = (targetKey: string, action: 'add' | 'remove') => {
    if (action === 'add') {
    } else {
      remove(targetKey);
    }
  };
  const loadCategories = async () => {
    return tabsItems.map((item: any) => ({
      label: compile(item.name),
      value: item.id,
    }));
  };
  const ctx = useContext(SchemaComponentContext);
  const scopeCxt = useContext(SchemaOptionsContext);
  console.log(tabsItems, data);
  return (
    <Tabs hideAdd onChange={onChange} activeKey={activeKey} type="editable-card" onEdit={onEdit}>
      {tabsItems.map((item) => {
        return (
          <Tabs.TabPane tab={compile(item.label || item.name)} key={item.key || item.id} closable={item.closable}>
            <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
              <SchemaComponent schema={collectionTableSchema} scope={{ ...scopeCxt, loadCategories }} />
            </SchemaComponentContext.Provider>
          </Tabs.TabPane>
        );
      })}
    </Tabs>
  );
};
