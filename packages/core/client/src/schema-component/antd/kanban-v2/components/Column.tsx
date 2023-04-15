import React, { memo, useState, useEffect } from 'react';
import { FormLayout } from '@formily/antd';
import { Spin } from 'antd';
import { css } from '@emotion/css';
import cls from 'classnames';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FieldContext, FormContext, useForm, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { useKanbanV2BlockContext, useCollection, useBlockRequestContext } from '../../../../';
import { isAssocField } from '../../../../filter-provider/utils';
import { useAPIClient } from '../../../../api-client';
import { useProps } from '../../../hooks/useProps';
import { createForm } from '@formily/core';

const grid = 8;
const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'white',

  // styles we need to apply on draggables
  ...draggableStyle,
});
const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? 'lightblue' : '#f9f9f9',
  padding: grid,
  margin: 5,
  width: 300,
});

const FormComponent: React.FC<any> = (props) => {
  console.log(props);
  const { children, ...others } = props;
  const field = useField();
  const form = createForm({
    readPretty: true,
    initialValues: props.item,
  });
  const fieldSchema = useFieldSchema();
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = form.createVoidField({ ...field.props, basePath: '' });
  console.log(fieldSchema);
  console.log(form.values);
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

export const Column = memo((props: any) => {
  const { setState, ind, el } = props;
  const { fixedBlock, groupField, associateCollectionField } = useKanbanV2BlockContext();
  const { name } = useCollection();
  const [cardData, setCardData] = useState(el?.cards || []);
  const isAssociationField = isAssocField(groupField);
  const { resource, service } = useBlockRequestContext();

  const api = useAPIClient();
  useEffect(() => {
    getColumnDatas();
  }, [groupField]);

  const getColumnDatas = () => {
    if (el.value !== '__unknown__') {
      const filter = isAssociationField
        ? {
            $and: [{ [groupField.name]: { [associateCollectionField[1]]: { $eq: el.value } } }],
          }
        : {
            $and: [{ [groupField.name]: { $eq: el.value } }],
          };
      api
        .resource(name)
        .list({
          ...service.params?.[0],
          filter: filter,
        })
        .then(({ data }) => {
          if (data) {
            setCardData(data?.data);
          }
        });
    }
  };
  console.log('ind', ind);
  const List = (props) => {
    const field: any = useField();
    const { form, disabled, ...others } = useProps(props);
    return (
      <form>
        <Spin spinning={field.loading || false}>
          <div
            className={cls(
              css`
                width: 250px;
                .nb-row-divider {
                  height: 16px;
                  margin-top: -16px;
                  &:last-child {
                    margin-top: 0;
                  }
                }
                .ant-description-input {
                  text-overflow: ellipsis;
                  width: 100%;
                  overflow: hidden;
                }
                .ant-description-textarea {
                  text-overflow: ellipsis;
                  width: 100%;
                  overflow: hidden;
                }
                .ant-formily-item {
                  margin-bottom: 12px;
                }
                .nb-grid-row:last-of-type {
                  .nb-grid-col {
                    .nb-form-item:last-of-type {
                      .ant-formily-item {
                        margin-bottom: 0;
                      }
                    }
                  }
                }
                .ant-formily-item-label {
                  display: none;
                }
              `,
              {
                'kanban-no-label': true,
              },
            )}
          >
            <FormComponent form={form} {...others} />
          </div>
        </Spin>
      </form>
    );
  };

  return (
    <Droppable key={ind} droppableId={`${ind}`}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)} {...provided.droppableProps}>
          {cardData?.map((item, index) => (
            <Draggable key={item.id} draggableId={`item-${item.id}`} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                    }}
                  >
                    <List {...props} item={item} />
                  </div>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
});
