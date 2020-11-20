import React from 'react';
// @ts-ignore
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import { MenuOutlined } from '@ant-design/icons';
import arrayMove from 'array-move';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import './style.less';

export const SortableItem = sortableElement(props => <tr {...props} />);
export const SortableContainer = sortableContainer(props => <tbody {...props} />);

export const DragHandle = sortableHandle(() => (
  <MenuOutlined style={{ cursor: 'pointer', color: '#999' }} />
));

export const components = ({data = {}, mutate}: {data: any, mutate: any}) => {
  return {
    body: {
      wrapper: props => (
        <SortableContainer
          useDragHandle
          helperClass="row-dragging"
          onSortEnd={({ oldIndex, newIndex }) => {
            if (oldIndex !== newIndex) {
              const list = arrayMove([].concat(data.list), oldIndex, newIndex).filter(el => !!el);
              mutate({
                ...data,
                list,
              });
            }
          }}
          {...props}
        />
      ),
      row: ({ className, style, ...restProps }) => {
        // function findIndex base on Table rowKey props and should always be a right array index
        const index = findIndex(data.list, (x: any) => x.id === restProps['data-row-key']);
        return <SortableItem index={index} {...restProps} />;
      },
    },
  };
};

export function fields2columns(fields) {
  const columns: any[] = fields.map(field => {
    const type = get(field, 'component.type');
    if (type === 'sort') {
      field.render = () => <DragHandle/>;
    }
    return {
      ...field,
      ...(field.component||{}),
    }
  });
  return columns;
}
