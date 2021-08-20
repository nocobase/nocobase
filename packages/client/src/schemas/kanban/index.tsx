import React, { useEffect, useRef } from 'react';
import {
  observer,
  RecursionField,
  Schema,
  useField,
  useForm,
} from '@formily/react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './style.less';
import { useState } from 'react';
import { groupBy } from 'lodash';
import cls from 'classnames';
import { Button, Card, Drawer, Tag } from 'antd';
import {
  SchemaRenderer,
  useDesignable,
} from '../../components/schema-renderer';
import { createContext } from 'react';
import { useContext } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { DesignableBar } from './DesignableBar';
import { CollectionProvider, useCollectionContext } from '../../constate';
import { Resource } from '../../resource';
import { useRequest } from 'ahooks';
import { Action } from '../action';
import { Form } from '../form';
import { CardDesignableBar } from './CardDesignableBar';
import { VisibleContext } from '../../context';

export function SortableItem(props) {
  const nodeRef = useRef<any>();
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: props.id,
    data: {
      type: props.type,
      nodeRef,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={cls({ isDragging }, props.className)}
      ref={(el) => {
        setNodeRef(el);
        nodeRef.current = el;
      }}
      style={style}
      {...attributes}
      {...listeners}
    >
      {props.children}
    </div>
  );
}

const useColumns = () => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const { getField } = useCollectionContext();
  let groupField = field.componentProps.groupField;
  const groupName = field.componentProps.groupName;
  const collectionField = getField(groupName);
  if (collectionField) {
    groupField = collectionField?.uiSchema;
  }
  const values = field.value;
  const columns = groupField?.enum?.map((group) => {
    return {
      ...group,
      items: values?.filter((item) => item[groupName] === group.value) || [],
    };
  });
  console.log('useColumns', { values, columns });
  return { values, columns };
};

interface KanbanCardContextProps {
  index: number;
  record?: any;
  viewSchema: Schema;
}

const KanbanCardContext = createContext<KanbanCardContextProps>(null);

export const KanbanContext = createContext<any>(null);
export const KanbanColumnContext = createContext<any>(null);

export const useKanban = () => {
  return useContext(KanbanContext);
};

const InternalKanban = observer((props: any) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const groupName = field.componentProps.groupName;
  const { values, columns } = useColumns();
  const { schema } = useDesignable();
  const { collectionName } = props;
  const cardSchema = schema.reduceProperties((prev, current) => {
    if (current['x-component'] === 'Kanban.Card') {
      return current;
    }
    return prev;
  }, null);
  const cardViewSchema = schema.reduceProperties((prev, current) => {
    if (current['x-component'] === 'Kanban.Card.View') {
      return current;
    }
    return prev;
  }, null);
  const addCardSchema = schema.reduceProperties((prev, current) => {
    if (current['x-component'] === 'Kanban.Card.AddNew') {
      return current;
    }
    return prev;
  }, null);
  const resource = Resource.make(collectionName);
  const service = useRequest(
    (params) => {
      if (!collectionName) {
        return Promise.resolve([]);
      }
      return resource.list({
        ...params,
        perPage: -1,
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
      sort: 'sort',
    });
  }, [props.defaultFilter]);
  const [dragOverlayContent, setDragOverlayContent] = useState('');
  const [style, setStyle] = useState({});
  const containerRef = useRef<HTMLDivElement>();
  console.log({ style })
  return (
    <KanbanContext.Provider value={{ field, resource, service, props }}>
      <div>
        {/* <div>
        <Button>筛选</Button>
      </div> */}
        <div className={'kanban'}>
          <div ref={containerRef} className={'kanban-container'}>
            <DndContext
              onDragStart={(event) => {
                const el = event?.active?.data?.current?.nodeRef
                  ?.current as HTMLElement;
                console.log(event, el);
                setDragOverlayContent(el?.outerHTML);
                setStyle({ width: el.clientWidth, height: containerRef.current?.clientHeight });
              }}
              // collisionDetection={closestCorners}
              onDragEnd={({ active, over }) => {
                const source = values.find((item) => item.id === active?.id);
                const target = values.find((item) => item.id === over?.id);
                if (source && target) {
                  const fromIndex = values.findIndex(
                    (item) => item.id === active?.id,
                  );
                  const toIndex = values.findIndex(
                    (item) => item.id === over?.id,
                  );
                  // setValues((items) => {
                  //   const fromIndex = items.findIndex(
                  //     (item) => item.id === active?.id,
                  //   );
                  //   const toIndex = items.findIndex(
                  //     (item) => item.id === over?.id,
                  //   );
                  //   return arrayMove(items, fromIndex, toIndex);
                  // });
                  field.move(fromIndex, toIndex);
                }
              }}
              onDragOver={({ active, over }) => {
                if (!over) {
                  return;
                }
                if (active?.id === over?.id) {
                  return;
                }
                const source = values.find((item) => item.id === active?.id);
                if (source && over?.data?.current?.type === 'column') {
                  source[groupName] = over.id;
                  return;
                }
                console.log('active.id', active.id, over?.data?.current);
                const target = values.find((item) => item.id === over?.id);
                if (source && target) {
                  if (source[groupName] !== target[groupName]) {
                    source[groupName] = target[groupName];
                  }
                }
              }}
            >
              <DragOverlay
              // style={{ pointerEvents: 'none' }}
              >
                <div
                  className={'nb-kanban-drag-overlay'}
                  style={{
                    ...style,
                  }}
                  dangerouslySetInnerHTML={{ __html: dragOverlayContent }}
                />
              </DragOverlay>

              <SortableContext
                strategy={horizontalListSortingStrategy}
                items={
                  columns?.map((column) => ({
                    ...column,
                    id: column.value,
                  })) || []
                }
              >
                {columns?.map((column) => (
                  <SortableItem
                    id={column.value}
                    key={column.value}
                    type={'column'}
                    className={'column'}
                  >
                    <KanbanColumnContext.Provider value={column}>
                      <div className={'column-title'}>
                        <Tag color={column.color}>{column.label}</Tag>
                      </div>
                      <SortableContext
                        strategy={verticalListSortingStrategy}
                        items={column.items}
                      >
                        {column.items.map((item) => {
                          const index = values.findIndex(
                            (value) => value.id === item.id,
                          );
                          return (
                            <SortableItem
                              key={item.id}
                              className={'item'}
                              id={item.id}
                              type={'item'}
                            >
                              <KanbanCardContext.Provider
                                value={{
                                  index: index,
                                  record: item,
                                  viewSchema: cardViewSchema,
                                }}
                              >
                                <RecursionField
                                  name={index}
                                  schema={cardSchema}
                                />
                              </KanbanCardContext.Provider>
                            </SortableItem>
                          );
                        })}
                      </SortableContext>
                      <RecursionField
                        name={addCardSchema?.name}
                        schema={addCardSchema}
                      />
                      {/* <Button
                    type={'text'}
                    icon={<PlusOutlined />}
                    onClick={() => {
                      field.push({
                        id: uid(),
                        title: uid(),
                        [groupName]: column.value,
                      });
                    }}
                  >
                    添加卡片
                  </Button> */}
                    </KanbanColumnContext.Provider>
                  </SortableItem>
                ))}
                <div
                  id={'addColumn'}
                  key={'addColumn'}
                  // type={'column'}
                  className={'column add-column'}
                >
                  {/* <span className={'add-column-plus'}/> */}
                  <span>
                    <PlusOutlined /> 添加列表
                  </span>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
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
  const groupName = props.groupName;
  const form = useForm();
  return {
    async run() {
      await resource.create({
        ...form.values,
        [groupName]: column.value,
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

Kanban.useResource = ({ onSuccess }) => {
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
  const { index, viewSchema } = useContext(KanbanCardContext);
  const { DesignableBar } = useDesignable();
  const { children, ...others } = props;
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Card
        onClick={(e) => {
          setVisible(true);
        }}
        bordered={false}
        {...others}
      >
        {children}
        <DesignableBar />
      </Card>
      <RecursionField name={index} schema={viewSchema} />
    </VisibleContext.Provider>
  );
});

Kanban.Card.View = Action.Drawer;
Kanban.Card.AddNew = Action;
Kanban.DesignableBar = DesignableBar;
Kanban.Card.DesignableBar = CardDesignableBar;
