import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrayField } from '@formily/core';
import {
  observer,
  RecursionField,
  Schema,
  useField,
  useForm,
} from '@formily/react';
import { Card, Spin, Tag } from 'antd';
import { groupBy } from 'lodash';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import cls from 'classnames';
import './style.less';
import { CollectionProvider, useCollectionContext } from '../../constate';
import { Resource } from '../../resource';
import { useRequest } from 'ahooks';
import { Action } from '../action';
import { CardDesignableBar } from './CardDesignableBar';
import { VisibleContext } from '../../context';
import { DesignableBar } from './DesignableBar';
import { useDesignable } from '../../components/schema-renderer';
import { Form } from '../form';
import { FieldDesignableBar } from './FieldDesignableBar';

function Droppable(props) {
  const { id, data, ...others } = props;
  const { setNodeRef } = useDroppable({
    id,
    data,
  });

  return <div ref={setNodeRef} {...others}></div>;
}

function SortableItem(props) {
  const { id, data, className, ...others } = props;
  const nodeRef = useRef<any>();
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    data: { ...data, nodeRef },
  });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      {...others}
      ref={(el) => {
        setNodeRef(el);
        nodeRef.current = el;
      }}
      style={style}
      className={cls(className, { isDragging })}
      {...attributes}
      {...listeners}
    >
      {props.children}
    </div>
  );
}

interface KanbanContextProps {
  props?: any;
  service?: any;
  resource?: Resource;
  [key: string]: any;
}

interface KanbanCardContextProps {
  record?: any;
  [key: string]: any;
}

interface KanbanColumnContextProps {
  [key: string]: any;
}

export const KanbanContext = createContext<KanbanContextProps>(null);
export const KanbanColumnContext =
  createContext<KanbanColumnContextProps>(null);
export const KanbanCardContext = createContext<KanbanCardContextProps>(null);

export const useKanban = () => {
  return useContext(KanbanContext);
};

const KanbanColumn = (props) => {
  const option = useContext(KanbanColumnContext);
  const { field, schemas } = useKanban();
  const { items } = props;
  return (
    <SortableContext
      // id={option.value}
      items={items || []}
      strategy={verticalListSortingStrategy}
    >
      {items?.map((item) => {
        const index = field.value?.findIndex((val) => val.id === item.id);
        return (
          <SortableItem
            className={'nb-kanban-item'}
            key={item.id}
            id={item.id}
            data={{ type: 'card', columnId: option.value }}
          >
            <KanbanCardContext.Provider
              value={{ index, schemas, record: item }}
            >
              {/* <Card bordered={false}>{item.id}</Card> */}
              <RecursionField
                name={index}
                schema={schemas.get('Kanban.Card')}
              />
            </KanbanCardContext.Provider>
          </SortableItem>
        );
      })}
    </SortableContext>
  );
};

const InternalKanban = observer((props: any) => {
  const { getField } = useCollectionContext();
  const collectionField = getField(props.groupField?.name);
  const groupField = {
    ...collectionField?.uiSchema,
    ...props.groupField,
  };
  const field = useField<ArrayField>();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );
  const groups = groupBy(field.value, groupField.name);
  const { collectionName } = props;
  const resource = Resource.make(collectionName);
  const service = useRequest(
    (params) => {
      if (!collectionName) {
        return Promise.resolve([]);
      }
      return resource.list({
        ...params,
        perPage: -1,
        sort: 'sort',
      });
    },
    {
      formatResult: (data) => data?.data,
      onSuccess(data) {
        field.setValue(data);
      },
      manual: true,
      // refreshDeps: [props.fieldNames],
    },
  );
  useEffect(() => {
    service.run({
      defaultFilter: props?.defaultFilter,
    });
  }, [props.defaultFilter]);
  const { schema } = useDesignable();
  const [schemas, setSchemas] = useState(() => {
    const schemas = new Map<string, Schema>();
    schema.reduceProperties((map, current) => {
      if (current['x-component'] === 'Kanban.Card') {
        map.set('Kanban.Card', current);
      }
      if (current['x-component'] === 'Kanban.Card.AddNew') {
        map.set('Kanban.Card.AddNew', current);
      }
      if (current['x-component'] === 'Kanban.Card.View') {
        map.set('Kanban.Card.View', current);
      }
      return map;
    }, schemas);
    return schemas;
  });
  const addNewCardSchema = schemas.get('Kanban.Card.AddNew');
  const [dragOverlayContent, setDragOverlayContent] = useState('');
  const [lastId, setLastId] = useState(null);
  console.log('field.value', schemas);
  return (
    <KanbanContext.Provider
      value={{ field, resource, service, schemas, props }}
    >
      <DndContext
        sensors={sensors}
        onDragStart={(event) => {
          const el = event?.active?.data?.current?.nodeRef
            ?.current as HTMLElement;
          setDragOverlayContent(el?.outerHTML);
        }}
        onDragMove={({ active, over }) => {
          const overId = over?.id;
          const activeId = active?.id;
          if (!overId || !activeId) {
            return;
          }
          if (overId === activeId) {
            return;
          }
          const overType = over?.data?.current?.type;
          const activeItem = field.value.find((item) => item.id === activeId);
          if (overType === 'column') {
            if (overId === activeItem?.[groupField.name]) {
              return;
            }
            const len = groups?.[overId]?.length;
            if (len > 0) {
              const last = groups?.[overId]?.[len - 1];
              setLastId(last.id);
              const activeIndex = field.value.findIndex(
                (item) => item.id === activeId,
              );
              const overIndex = field.value.findIndex(
                (item) => item.id === last.id,
              );
              console.log({ overId, last, overIndex, activeIndex });
              field.move(activeIndex, overIndex);
            }
            activeItem[groupField.name] = overId;
          } else {
            const overColumnId = over?.data?.current?.columnId;
            const activeColumnId = active?.data?.current?.columnId;
            if (!overColumnId || !activeColumnId) {
              return;
            }
            if (overColumnId !== activeColumnId) {
              activeItem[groupField.name] = overColumnId;
              const activeIndex = field.value.findIndex(
                (item) => item.id === activeId,
              );
              const overIndex = field.value.findIndex(
                (item) => item.id === overId,
              );
              console.log({ overId, overIndex, activeIndex });
              field.move(activeIndex, overIndex);
            }
          }
        }}
        onDragEnd={async ({ active, over }) => {
          console.log('onDragEnd', { lastId, active, over });
          const overId = over?.id;
          const activeId = active?.id;
          if (!overId || !activeId) {
            return;
          }
          if (overId === activeId) {
            const overColumnId = over?.data?.current?.columnId;
            await resource.save(
              {
                [groupField.name]: overColumnId,
              },
              {
                resourceKey: activeId,
              },
            );
            await resource.sort({
              resourceKey: activeId,
              field: 'sort',
              target: lastId
                ? {
                    id: lastId,
                  }
                : {},
            });
            setLastId(null);
            return;
          }
          const overType = over?.data?.current?.type;
          if (overType !== 'column') {
            const overColumnId = over?.data?.current?.columnId;
            const activeColumnId = active?.data?.current?.columnId;
            if (!overColumnId || !activeColumnId) {
              return;
            }
            if (overColumnId !== activeColumnId) {
              return;
            }
            const activeIndex = field.value.findIndex(
              (item) => item.id === activeId,
            );
            const overIndex = field.value.findIndex(
              (item) => item.id === overId,
            );
            field.move(activeIndex, overIndex);
            await resource.save(
              {
                [groupField.name]: overColumnId,
              },
              {
                resourceKey: activeId,
              },
            );
            await resource.sort({
              resourceKey: activeId,
              field: 'sort',
              target: {
                id: overId,
              },
            });
          } else {
            await resource.save(
              {
                [groupField.name]: overId,
              },
              {
                resourceKey: activeId,
              },
            );
            await resource.sort({
              resourceKey: activeId,
              field: 'sort',
              target: lastId
                ? {
                    id: lastId,
                  }
                : {},
            });
            setLastId(null);
          }
        }}
      >
        <DragOverlay>
          <div
            className={'nb-kanban-drag-overlay'}
            dangerouslySetInnerHTML={{ __html: dragOverlayContent }}
          />
        </DragOverlay>
        <Spin spinning={service.loading}>
          <div
            className={'nb-kanban-board'}
            style={{
              // display: 'flex',
              // flexDirection: 'row',
              userSelect: 'none',
            }}
          >
            <div className={'nb-kanban-container'}>
              {groupField?.enum?.map((option) => {
                const items = field.value?.filter(
                  (item) => item?.[groupField.name] === option.value,
                );
                return (
                  <Droppable
                    id={option.value}
                    data={{
                      type: 'column',
                    }}
                    className={'nb-kanban-column'}
                  >
                    <KanbanColumnContext.Provider value={option}>
                      <div className={'nb-kanban-column-header'}>
                        <Tag color={option.color}>{option.label}</Tag>
                      </div>
                      <KanbanColumn items={items} />
                      <RecursionField
                        name={addNewCardSchema.name}
                        schema={addNewCardSchema}
                      />
                    </KanbanColumnContext.Provider>
                  </Droppable>
                );
              })}
            </div>
          </div>
        </Spin>
      </DndContext>
    </KanbanContext.Provider>
  );
});

export const Kanban: any = observer((props: any) => {
  return (
    <CollectionProvider collectionName={props.collectionName}>
      <InternalKanban {...props} />
    </CollectionProvider>
  );
});

Kanban.useCreateAction = () => {
  const { service, resource, props } = useKanban();
  const column = useContext(KanbanColumnContext);
  const groupField = props.groupField;
  const form = useForm();
  return {
    async run() {
      await resource.create({
        ...form.values,
        [groupField.name]: column.value,
      });
      await form.reset();
      return service.refresh();
    },
  };
};

Kanban.useUpdateAction = () => {
  const { service, resource, props } = useKanban();
  const ctx = useContext(KanbanCardContext);
  const form = useForm();
  return {
    async run() {
      await resource.save(form.values, {
        resourceKey: ctx.record.id,
      });
      await service.refresh();
    },
  };
};

Kanban.useSingleResource = ({ onSuccess }) => {
  const { props } = useKanban();
  const { collection } = useCollectionContext();
  const ctx = useContext(KanbanCardContext);
  const resource = Resource.make({
    resourceName: collection?.name || props.collectionName,
    resourceKey: ctx?.record?.id,
  });
  console.log(
    'collection?.name || props.collectionName',
    collection?.name || props.collectionName,
  );
  const service = useRequest(
    (params?: any) => {
      return Promise.resolve(ctx.record);
    },
    {
      // formatResult: (result) => result?.data,
      onSuccess,
      refreshDeps: [ctx?.record],
      // manual,
    },
  );
  return { resource, service, initialValues: service.data, ...service };
};

Kanban.Card = observer((props) => {
  const [visible, setVisible] = useState(false);
  const { index, schemas } = useContext(KanbanCardContext);
  const { DesignableBar } = useDesignable();
  const { children, ...others } = props;
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Card
        onClick={(e) => {
          setVisible(true);
        }}
        hoverable
        bordered={false}
        {...others}
      >
        {children}
      </Card>
      <DesignableBar />
      <RecursionField name={index} schema={schemas.get('Kanban.Card.View')} />
    </VisibleContext.Provider>
  );
});

Kanban.Card.View = Action.Drawer;
Kanban.Card.AddNew = Action;
Kanban.DesignableBar = DesignableBar;
Kanban.Card.DesignableBar = CardDesignableBar;
Kanban.FieldDesignableBar = FieldDesignableBar;
