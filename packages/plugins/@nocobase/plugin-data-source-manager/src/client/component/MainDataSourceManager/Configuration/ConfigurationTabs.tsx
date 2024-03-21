import { MenuOutlined } from '@ant-design/icons';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { RecursionField, observer } from '@formily/react';
import { uid } from '@formily/shared';
import { App, Badge, Card, Dropdown, Space, Tabs } from 'antd';
import _ from 'lodash';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAPIClient,
  SchemaComponent,
  SchemaComponentOptions,
  useCompile,
  useResourceActionContext,
  CollectionCategroriesContext,
} from '@nocobase/client';
import { CollectionFields } from './CollectionFields';
import { collectionTableSchema } from './schemas/collections';

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

const TabTitle = observer(
  ({ item }: { item: any }) => {
    return (
      <Droppable id={item.id.toString()} data={item}>
        <div>
          <Draggable id={item.id.toString()} data={item}>
            <TabBar item={item} />
          </Draggable>
        </div>
      </Droppable>
    );
  },
  { displayName: 'TabTitle' },
);

const TabBar = ({ item }) => {
  const { t } = useTranslation();
  const compile = useCompile();
  return (
    <Space>
      <Badge color={item.color} />
      {t(compile(item.name))}
    </Space>
  );
};
const DndProvider = observer(
  (props) => {
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
        await api.resource('collectionCategories').move({
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
  },
  { displayName: 'DndProvider' },
);
export const ConfigurationTabs = () => {
  const { t } = useTranslation();
  const { data, refresh } = useContext(CollectionCategroriesContext);
  const { refresh: refreshCM, run, defaultRequest, setState } = useResourceActionContext();
  const [activeKey, setActiveKey] = useState({ tab: 'all' });
  const [key, setKey] = useState(activeKey.tab);
  const compile = useCompile();
  const api = useAPIClient();
  const { modal } = App.useApp();

  const tabsItems = useMemo(() => {
    if (!data) return [];
    const res = data
      .sort((a, b) => b.sort - a.sort)
      .concat()
      .map((v) => {
        return {
          ...v,
          schema: collectionTableSchema,
        };
      });
    !res.find((v) => v.id === 'all') &&
      res.unshift({
        name: '{{t("All collections")}}',
        id: 'all',
        sort: 0,
        closable: false,
        schema: collectionTableSchema,
      });
    return res;
  }, [data]);

  useEffect(() => {
    if (activeKey.tab !== 'all') {
      onChange(activeKey.tab);
    }
  }, []);

  const onChange = (key: string) => {
    setActiveKey({ tab: key });
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
    modal.confirm({
      title: compile("{{t('Delete category')}}"),
      content: compile("{{t('Are you sure you want to delete it?')}}"),
      onOk: async () => {
        await api.resource('collectionCategories').destroy({
          filter: {
            id: key,
          },
        });
        key === +activeKey.tab && setActiveKey({ tab: 'all' });
        await refresh();
        await refreshCM();
      },
    });
  };

  const loadCategories = async () => {
    return data.map((item: any) => ({
      label: t(compile(item.name)),
      value: item.id,
    }));
  };

  const menu = _.memoize((item) => {
    return {
      items: [
        {
          key: 'edit',
          label: (
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
          ),
        },
        {
          key: 'delete',
          label: compile("{{t('Delete category')}}"),
          onClick: () => remove(item.id),
        },
      ],
    };
  });
  if (!data) return null;
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
        defaultActiveKey={activeKey.tab || 'all'}
        type="editable-card"
        destroyInactiveTabPane={true}
        tabBarStyle={{ marginBottom: '0px' }}
        items={tabsItems.map((item) => {
          return {
            label:
              item.id !== 'all' ? (
                <div data-no-dnd="true">
                  <TabTitle item={item} />
                </div>
              ) : (
                compile(item.name)
              ),
            key: String(item.id),
            closable: item.closable,
            closeIcon: (
              <Dropdown menu={menu(item)}>
                {/* 这里的样式是为了扩大图标的点击范围，以使其更容易 Playwright 录制工具中被点中 */}
                <MenuOutlined role="button" aria-label={compile(item.name)} style={{ padding: 8, margin: '-8px' }} />
              </Dropdown>
            ),
            children: (
              <Card bordered={false}>
                <SchemaComponentOptions
                  components={{ CollectionFields }}
                  inherit
                  scope={{ loadCategories, categoryVisible: item.id === 'all', categoryId: item.id }}
                >
                  <RecursionField name={key} schema={item.schema} onlyRenderProperties />
                </SchemaComponentOptions>
              </Card>
            ),
          };
        })}
      />
    </DndProvider>
  );
};
