import React, { memo } from 'react';
import { FormLayout } from '@formily/antd';
import { Spin } from 'antd';
import { css } from '@emotion/css';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FieldContext, FormContext, RecursionField, useField, useFieldSchema } from '@formily/react';
import { useCollection } from '../../../../';
import { useProps } from '../../../hooks/useProps';
import { createForm } from '@formily/core';

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
  width: 300,
  marginTop: 0,
  paddingTop: 0,
  height: '100%',
  maxHeight: 600,
  overflowY: 'auto',
});

const FormComponent: React.FC<any> = (props) => {
  const { children, ...others } = props;
  const field = useField();
  const form = createForm({
    readPretty: true,
    initialValues: props.item,
  });
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

export const Column = memo((props: any) => {
  const { ind, data } = props;
  console.log('ind', ind);
  const List = (props) => {
    const field: any = useField();
    const { form, disabled, ...others } = useProps(props);
    return (
      <form>
        <Spin spinning={field.loading || false}>
          <div
            className={css`
              width: 250px;
              .ant-formily-item-label {
                display: none;
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

  return (
    <Droppable key={ind} droppableId={`${data.value}`}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} style={getListStyle()} {...provided.droppableProps}>
          {data?.cards?.map((item, index) => (
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
