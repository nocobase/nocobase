import { Button, Tabs, Modal, Input } from 'antd';
import React, { useRef, useState, useContext, useEffect } from 'react';
import { SchemaOptionsContext } from '@formily/react';
import { CollectionCategroriesContext } from '../context';
import { useAPIClient } from '../../api-client';
import { SchemaComponent, SchemaComponentContext, useCompile } from '../../schema-component';
import { collectionTableSchema } from './schemas/collections';

interface EditTabTitleProps {
  title: React.ReactNode;
  handleSave: (args) => void;
  editable: boolean;
}

const EditTabTitle: React.FC<EditTabTitleProps> = ({ title, handleSave, editable }) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (editing) {
      inputRef.current!.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
  };

  const save = async () => {
    try {
      const name = inputRef.current.input.value;
      toggleEdit();
      name && handleSave({ name });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };
  if (editable) {
    return editing ? (
      <Input ref={inputRef} onPressEnter={save} onBlur={save} defaultValue={title as string} />
    ) : (
      <div style={{ paddingRight: 24 }} onDoubleClick={toggleEdit}>
        {title}
      </div>
    );
  }
  return <span>{title}</span>;
};

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
          filter: {
            id: targetKey,
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
  const saveCategory = async (data) => {
    await api.resource('collection_categories').update({
      filter: {
        id: data.id,
      },
      values: {
        ...data,
      },
    });
    await refresh();
  };
  const loadCategories = async () => {
    return tabsItems.map((item: any) => ({
      label: compile(item.name),
      value: item.id,
    }));
  };
  const ctx = useContext(SchemaComponentContext);
  const scopeCxt = useContext(SchemaOptionsContext);
  return (
    <Tabs hideAdd onChange={onChange} activeKey={activeKey} type="editable-card" onEdit={onEdit}>
      {tabsItems.map((item) => {
        return (
          <Tabs.TabPane
            tab={
              <EditTabTitle
                title={compile(item.label || item.name)}
                handleSave={(args) => {
                  saveCategory({ ...item, ...args });
                }}
                editable={item.id}
              />
            }
            key={item.key || item.id}
            closable={item.closable}
          >
            <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
              <SchemaComponent schema={collectionTableSchema} scope={{ ...scopeCxt, loadCategories }} />
            </SchemaComponentContext.Provider>
          </Tabs.TabPane>
        );
      })}
    </Tabs>
  );
};
