import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { FieldContext, FormContext, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { memo, useContext, useEffect, useState, useRef } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { useInfiniteScroll } from 'ahooks';
import {
  BlockItem,
  KanbanCardBlockProvider,
  KanbanCardContext,
  useBlockRequestContext,
  useKanbanV2BlockContext,
} from '../../../../';
import { useProps } from '../../../hooks/useProps';
import { uniqBy } from 'lodash';

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
  const display = displayLable ? 'none' : 'flex';
  return (
    <form>
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
          .nb-grid-row {
            overflow-x: inherit;
          }
        `}
      >
        <FormComponent form={form} {...others} />
      </div>
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
    targetColumn,
  } = useKanbanV2BlockContext();
  const params = service?.params?.[0] || {};
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const [disabledCardDrag, setDisableCardDrag] = useState(false);
  const { data: result, loading, loadMore, loadingMore, mutate } = useInfiniteScroll(
    (d) => getLoadMoreList(d?.nextId, 10),
    {
      target: document.getElementById(`scrollableDiv${ind}`),
      isNoMore: (d) => d?.nextId === undefined,
    },
  );
  const getLoadMoreList = async (nextId: string | undefined, limit: number): Promise<any> => {
    const res = await getColumnDatas(data, ind, params, appends, nextId + 1, () => {});
    return {
      ...res,
      list: uniqBy(res.cards, 'id'),
      nextId: res?.meta?.count > res.cards.length ? Math.ceil(res.cards.length / 10) : undefined,
    };
  };
  useEffect(() => {
    if (targetColumn === data.value) {
      getColumnDatas(data, ind, params, appends, 1, () => {}).then((res) => {
        mutate({
          ...res,
          list: res.cards,
          nextId: res?.meta?.count > res.cards.length ? Math.ceil(res.cards.length / 10) : undefined,
        });
      }).catch;
    }
  }, [targetColumn]);

  useEffect(() => {
    mutate({
      list: cards,
      nextId: data?.meta?.count > cards?.length ? Math.ceil(cards?.length / 10) : undefined,
    });
  }, [cards]);

  const displayLable = fieldSchema['x-label-disabled'];
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
  console.log(result?.list, cards);
  return (
    <Droppable key={ind} droppableId={`${data.value}`}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} style={getListStyle()} {...provided.droppableProps} id={`scrollableDiv${ind}`}>
          <div key={ind}>
            <Spin spinning={loading}>
              {result?.list?.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={`item-${item.id}`}
                  index={index}
                  isDragDisabled={disabledCardDrag}
                >
                  {(provided, snapshot) => (
                    <BlockItem>
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
                    </BlockItem>
                  )}
                </Draggable>
              ))}
            </Spin>
            <div style={{ marginTop: 8 }}>
              {result?.nextId && result?.list?.length > 0 && (
                <span onClick={loadMore}>{loadingMore ? 'Loading more...' : 'Click to load more'}</span>
              )}

              {!result?.nextId && <span>{t('All loaded, nothing more')}</span>}
            </div>
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
});
