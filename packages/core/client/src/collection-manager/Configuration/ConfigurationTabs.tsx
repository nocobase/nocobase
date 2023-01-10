import { Tabs, Modal, Badge, Card, Dropdown, Menu } from 'antd';
import React, { useState, useContext } from 'react';
import { RecursionField } from '@formily/react';
import { SchemaComponentOptions } from '../../schema-component';
import { uid } from '@formily/shared';
import { MenuOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
  useSensors,
  useSensor,
  MouseSensor,
} from '@dnd-kit/core';
import { CollectionCategroriesContext } from '../context';
import { useAPIClient } from '../../api-client';
import { SchemaComponent, useCompile } from '../../schema-component';
import { collectionTableSchema } from './schemas/collections';
import { useResourceActionContext } from '../ResourceActionProvider';

function Draggable(props) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: props.id,
    data: props.data,
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <div>{props.children}</div>
    </div>
  );
}

function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });
  const style = isOver
    ? {
        color: 'green',
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}

const TabTitle = observer(({ item }: { item: any }) => {
  return (
    <Droppable id={item.id.toString()} data={item}>
      <div>
        <Draggable id={item.id.toString()} data={item}>
          <TabBar item={item} />
        </Draggable>
      </div>
    </Droppable>
  );
});

const TabBar = ({ item }) => {
  const compile = useCompile();
  return (
    <span>
      <Badge color={item.color} />
      {compile(item.name)}
    </span>
  );
};
const DndProvider = observer((props) => {
  const [activeTab, setActiveId] = useState(null);
  const { refresh } = useContext(CollectionCategroriesContext);
  const { refresh: refreshCM } = useResourceActionContext();
  const api = useAPIClient();
  const onDragEnd = async (props: DragEndEvent) => {
    const { active, over } = props;
    setTimeout(() => {
      setActiveId(null);
    });
    if (over && over.id !== active.id) {
      await api.resource('collection_categories').move({
        sourceId: active.id,
        targetId: over.id,
      });
      await refresh();
      await refreshCM();
    }
  };

  function onDragStart(event) {
    setActiveId(event.active?.data.current);
  }

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const sensors = useSensors(mouseSensor);
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd} onDragStart={onDragStart}>
      {props.children}
      <DragOverlay>
        {activeTab ? <span style={{ whiteSpace: 'nowrap' }}>{<TabBar item={activeTab} />}</span> : null}
      </DragOverlay>
    </DndContext>
  );
});
export const ConfigurationTabs = () => {
  const { data, refresh } = useContext(CollectionCategroriesContext);
  const { refresh: refreshCM, run, defaultRequest, setState } = useResourceActionContext();
  const [key, setKey] = useState('all');
  const tabsItems = data
    .sort((a, b) => b.sort - a.sort)
    .concat()
    .map((v) => {
      return {
        ...v,
        schema: collectionTableSchema,
      };
    });
  !tabsItems.find((v) => v.id === 'all') &&
    tabsItems.unshift({
      name: '{{t("All collections")}}',
      id: 'all',
      sort: 0,
      closable: false,
      schema: collectionTableSchema,
    });
  const compile = useCompile();
  const [activeKey, setActiveKey] = useState('all');
  const api = useAPIClient();
  const onChange = (key: string) => {
    setActiveKey(key);
    setKey(uid());
    if (key !== 'all') {
      const prevFilter = defaultRequest?.params?.filter;
      const filter = { $and: [prevFilter, { 'category.id': key }] };
      run({ filter });
      setState?.({ category: [+key], params: [{ filter }] });
    } else {
      run();
      setState?.({ category: [], params: [] });
    }
  };

  const remove = (key: any) => {
    Modal.confirm({
      title: compile("{{t('Delete category')}}"),
      content: compile("{{t('Are you sure you want to delete it?')}}"),
      onOk: async () => {
        await api.resource('collection_categories').destroy({
          filter: {
            id: key,
          },
        });
        key === +activeKey && setActiveKey('all');
        await refresh();
        await refreshCM();
      },
    });
  };

  const loadCategories = async () => {
    return data.map((item: any) => ({
      label: compile(item.name),
      value: item.id,
    }));
  };
  const menu = (item) => (
    <Menu>
      <Menu.Item key={'edit'}>
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
      </Menu.Item>
      <Menu.Item key="delete" onClick={() => remove(item.id)}>
        {compile("{{t('Delete category')}}")}
      </Menu.Item>
    </Menu>
  );
  return (
    <DndProvider>
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
        defaultActiveKey="all"
        type="editable-card"
        destroyInactiveTabPane={true}
        tabBarStyle={{ marginBottom: '0px' }}
      >
        {tabsItems.map((item) => {
          return (
            <Tabs.TabPane
              tab={
                item.id !== 'all' ? (
                  <div data-no-dnd="true">
                    <TabTitle item={item} />
                  </div>
                ) : (
                  compile(item.name)
                )
              }
              key={item.id}
              closable={item.closable}
              closeIcon={
                <Dropdown overlay={menu(item)}>
                  <MenuOutlined />
                </Dropdown>
              }
            >
              <Card bordered={false}>
                <SchemaComponentOptions
                  inherit
                  scope={{ loadCategories, categoryVisible: item.id === 'all', categoryId: item.id }}
                >
                  <RecursionField name={key} schema={item.schema} onlyRenderProperties />
                </SchemaComponentOptions>
              </Card>
            </Tabs.TabPane>
          );
        })}
      </Tabs>
    </DndProvider>
  );
};
