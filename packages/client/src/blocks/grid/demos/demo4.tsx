import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDrag, useDrop, DragDropProvider } from '../';
import { Button, Space } from 'antd';

function DropZone({ options, children }) {
  const { isOver, dropRef } = useDrop(options);
  return (
    <div
      ref={dropRef}
      style={{
        textAlign: 'center',
        lineHeight: '100px',
        margin: 24,
        border: isOver ? '1px solid red' : '1px solid #ddd',
      }}
    >
      {children}
    </div>
  );
}

function Dragable() {
  const { isDragging, dragRef, previewRef } = useDrag({
    type: 'box',
    onDragStart() {
      console.log('onDragStart');
    },
    onDragEnd(event) {
      console.log('onDragEnd', event.data);
    },
    onDrag(event) {
      // console.log('onDrag');
    },
  });
  return (
    <Button ref={mergeRefs<any>([dragRef, previewRef])}>拖拽1</Button>
  );
}

function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

function Dragable2() {
  const { isDragging, dragRef, previewRef } = useDrag({
    type: 'box2',
    onDragStart() {
      console.log('onDragStart');
    },
    onDragEnd(event) {
      console.log('onDragEnd', event.data);
    },
    onDrag(event) {
      // console.log('onDrag');
    },
  });
  return (
    <Button ref={mergeRefs<any>([dragRef, previewRef])}>拖拽2</Button>
  );
}

export default () => {
  return (
    <DragDropProvider>
      <Space style={{marginBottom: 12}}>
      <Dragable />
      <Dragable2 />
      </Space>
      <DropZone
        options={{
          accept: 'box',
          data: { a: 'a' },
          shallow: true,
        }}
      >
        Drop Zone1
        <DropZone
          options={{
            accept: 'box',
            data: { b: 'b' },
            // shallow: true,
          }}
        >
          Drop Zone2
        </DropZone>
        <DropZone
          options={{
            accept: 'box2',
            data: { c: 'c' },
            // shallow: true,
          }}
        >
          Drop Zone3
        </DropZone>
        Drop Zone1
      </DropZone>
    </DragDropProvider>
  );
};
