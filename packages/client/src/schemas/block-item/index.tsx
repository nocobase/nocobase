import React, { createContext, useContext, useState } from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
  observer,
  SchemaOptionsContext,
  useField,
  useFieldSchema,
} from '@formily/react';
import { FormItem as FormilyFormItem } from '@formily/antd';
import { Dropdown, Menu, Space } from 'antd';
import classNames from 'classnames';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
import './style.less';
import get from 'lodash/get';
import { uid } from '@formily/shared';
import { useDesignable, useSchemaPath } from '../';
import { AddNew } from '../add-new';
import { Card } from 'antd';
import {
  mergeRefs,
  DraggableBlockContext,
  useBlockDragAndDrop,
  useDragDropUID,
} from '../../components/drag-and-drop';
import cls from 'classnames';
import { Droppable, SortableItem } from '../../components/Sortable';
import { useDndContext } from '@dnd-kit/core';
import { getSchemaPath } from '../../components/schema-renderer';
import { BlockSchemaContext } from '../../context';

const DraggableBlock = (props) => {
  const { className, children, ...others } = props;
  const { DesignableBar, schema } = useDesignable();
  return (
    <SortableItem
      id={schema.name}
      className={cls('nb-block-item', className)}
      data={{
        type: 'block',
        path: getSchemaPath(schema),
      }}
      {...others}
    >
      {children}
      <DesignableBar />
    </SortableItem>
  );
};

const Block = (props) => {
  const { DesignableBar } = useDesignable();
  const { className, children, ...others } = props;
  return (
    <div className={cls('nb-block-item', className)} {...others}>
      {children}
      <DesignableBar />
    </div>
  );
};

export const BlockItem: any = observer((props: any) => {
  const { draggable = true } = props;
  const ctx = useDndContext();
  const { schema } = useDesignable();
  return (
    <BlockSchemaContext.Provider value={schema}>
      {React.createElement(
        draggable && ctx.activators?.length > 0 ? DraggableBlock : Block,
        props,
      )}
    </BlockSchemaContext.Provider>
  );
});
