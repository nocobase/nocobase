import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { FieldContext, FormContext, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Spin, Empty } from 'antd';
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
    <FieldContext.Provider value={null}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'} {...others}>
          <RecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties />
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const List = (props) => {
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

export const Column = observer(
  (props: any) => {
    const { ind, data, getColumnDatas } = props;
    const {
      service,
      params: { appends },
    } = useBlockRequestContext();
    const { groupField, form, targetColumn } = useKanbanV2BlockContext();
    const params = service?.params?.[0] || {};
    const fieldSchema = useFieldSchema();
    const { t } = useTranslation();
    const [disabledCardDrag, setDisableCardDrag] = useState(false);
    const {
      data: result,
      loading,
      loadMore,
      reload,
    } = useInfiniteScroll((d) => getLoadMoreList(d?.nextId, 10), {
      target: document.getElementById(`scrollableDiv${ind}`),
      isNoMore: (d) => d?.nextId === undefined,
      reloadDeps: [targetColumn === data.value, params, appends.length],
    });
    useEffect(() => {
      if (Array.isArray(targetColumn) && targetColumn?.includes(data.value)) {
        reload();
      }
    }, [targetColumn]);
    const getLoadMoreList = async (nextId: string | undefined, limit: number): Promise<any> => {
      const res = await getColumnDatas(data, ind, params, appends, nextId + 1, () => {});
      return {
        ...res,
        list: uniqBy(res.cards, 'id'),
        nextId: res?.meta?.count > res.cards.length ? Math.ceil(res.cards.length / 10) : undefined,
      };
    };
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
                {result?.nextId && result?.list?.length > 0 ? <span onClick={loadMore}>{'Loading more...'}</span> : ''}
                {!result?.nextId && !loading && result?.list?.length > 0 && (
                  <span>{t('All loaded, nothing more')}</span>
                )}
                {!result?.nextId && !loading && result?.list?.length === 0 && <Empty />}
              </div>
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    );
  },
  { displayName: 'Column' },
);
