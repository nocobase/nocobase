import React, { memo, useState, useContext, useEffect } from 'react';
import { FormLayout } from '@formily/antd';
import { Spin, Skeleton, Divider } from 'antd';
import { css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FieldContext, FormContext, RecursionField, useField, useFieldSchema } from '@formily/react';
import { useProps } from '../../../hooks/useProps';
import {
  useBlockRequestContext,
  useKanbanV2BlockContext,
  KanbanCardBlockProvider,
  KanbanCardContext,
} from '../../../../';

const grid = 8;
const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  background: 'white',
  ...draggableStyle,
});
const getListStyle = () => ({
  background: '#f9f9f9',
  padding: grid,
  margin: 5,
  width: 330,
  marginTop: 0,
  paddingTop: 0,
  height: '100%',
  maxHeight: 600,
  overflowY: 'auto',
});

const FormComponent: React.FC<any> = (props) => {
  const { children, setDisableCardDrag, ...others } = props;
  const field = useField();
  const { form } = useContext(KanbanCardContext);
  const fieldSchema = useFieldSchema();
  const f = form.createVoidField({ ...field.props, basePath: '' });
  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'} {...others}>
          <RecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties />
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const List = (props) => {
  const field: any = useField();
  const { onCardClick, displayLable, form } = props;
  const { disabled, ...others } = useProps(props);
  const display = displayLable !== false ? 'flex' : 'none';
  return (
    <form>
      <Spin spinning={field.loading || false}>
        <div
          onClick={() => {
            onCardClick(props.item);
          }}
          className={css`
            width: 250px;
            .ant-formily-item-label {
              display: ${display};
            }
            .ant-formily-item {
              margin: 0;
            }
          `}
        >
          <FormComponent form={form} {...others} />
        </div>
      </Spin>
    </form>
  );
};

export const Column = memo((props: any) => {
  const { ind, data, cards, getColumnDatas } = props;
  const { service } = useBlockRequestContext();
  const {
    groupField,
    params: { appends },
    form,
  } = useKanbanV2BlockContext();
  const params = service?.params?.[0] || {};
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const [disabledCardDrag, setDisableCardDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  console.log('ind', ind);
  const displayLable = fieldSchema.parent['x-label-disabled'];
  const loadMoreData = (el, index) => {
    getColumnDatas(el, index, params, appends, el?.meta?.page + 1);
  };
  useEffect(() => {
    setLoading(true);
    getColumnDatas(data, ind, params, appends, 1).then(() => {
      setLoading(false);
    });
  }, [appends.length, params]);
  fieldSchema.properties.grid['x-component-props'] = {
    dndContext: {
      onDragStart: () => {
        setDisableCardDrag(true);
      },
      onDragEnd: () => {
        setDisableCardDrag(false);
      },
    },
  };
  return (
    <Droppable key={ind} droppableId={`${data.value}`}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} style={getListStyle()} {...provided.droppableProps} id={`scrollableDiv${ind}`}>
          <InfiniteScroll
            key={ind}
            dataLength={cards?.length || 0}
            next={() => loadMoreData(data, ind)}
            hasMore={cards?.length < data?.meta?.count}
            loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
            scrollableTarget={`scrollableDiv${ind}`}
            endMessage={
              cards?.length > 0 && (
                <Divider plain style={{ color: '#908d8d' }}>
                  {t('All loaded, nothing more')}
                </Divider>
              )
            }
          >
            <Spin spinning={loading || false}>
              {cards?.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={`item-${item.id}`}
                  index={index}
                  isDragDisabled={disabledCardDrag}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                    >
                      <KanbanCardBlockProvider item={item}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-around',
                          }}
                        >
                          <List
                            {...props}
                            form={form}
                            item={{ ...item, [groupField?.name]: data.value !== '__unknown__' ? data.value : null }}
                            displayLable={displayLable}
                            setDisableCardDrag={setDisableCardDrag}
                          />
                        </div>
                      </KanbanCardBlockProvider>
                    </div>
                  )}
                </Draggable>
              ))}
            </Spin>
            {provided.placeholder}
          </InfiniteScroll>
        </div>
      )}
    </Droppable>
  );
});
