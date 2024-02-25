import { DndContext, DragEndEvent, DragOverlay, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { RecursionField, observer } from '@formily/react';
import { Badge, Card, Space } from 'antd';
import _ from 'lodash';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAPIClient,
  SchemaComponentOptions,
  useCompile,
  useResourceActionContext,
  CollectionCategroriesContext,
} from '@nocobase/client';
import { CollectionFields } from './CollectionFields';
import { CollectionName } from './components/CollectionName';
import { collectionTableSchema } from './schema/collections';

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
  const { data } = useContext(CollectionCategroriesContext);
  const compile = useCompile();

  if (!data) return null;

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

  const loadCategories = async () => {
    return data.map((item: any) => ({
      label: t(compile(item.name)),
      value: item.id,
    }));
  };

  return (
    <DndProvider>
      <Card bordered={false}>
        <SchemaComponentOptions
          components={{ CollectionFields, CollectionName }}
          inherit
          scope={{
            loadCategories,
          }}
        >
          <RecursionField schema={collectionTableSchema} onlyRenderProperties />
        </SchemaComponentOptions>
      </Card>
    </DndProvider>
  );
};
