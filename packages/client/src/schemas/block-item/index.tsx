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
import { GridBlockContext } from '../grid';
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

const DraggableBlock = (props) => {
  const { children, ...others } = props;
  const { DesignableBar } = useDesignable();
  const { isDragging, dragRef, previewRef, isOver, onTopHalf, dropRef } =
    useBlockDragAndDrop();
  const schema = useFieldSchema();
  const [active, setActive] = useState(false);
  return (
    <DraggableBlockContext.Provider value={{ dragRef }}>
      <div
        onMouseEnter={(e) => {
          setActive(true);
          // console.log('e.onMouseEnter', new Date().toString());
        }}
        onMouseMove={(event) => {
          let dropElement = document.elementFromPoint(
            event.clientX,
            event.clientY,
          );
          const dropIds = [];
          while (dropElement) {
            if (!dropElement.getAttribute) {
              dropElement = dropElement.parentNode as HTMLElement;
              continue;
            }
            const dropId = dropElement.getAttribute('data-drop-id');
            if (dropId) {
              dropIds.push(dropId);
            }
            // if (dropId && dropId !== schema.name) {
            //   setActive(false);
            //   break;
            // }
            dropElement = dropElement.parentNode as HTMLElement;
          }
          if (dropIds.length > 0) {
            setActive(dropIds[0] === schema.name);
          }
          // console.log('e.onMouseMove', dropIds, schema.name);
        }}
        onMouseLeave={(e) => {
          setActive(false);
          // console.log('e.onMouseLeave', new Date().toString());
        }}
        ref={mergeRefs([previewRef, dropRef])}
        className={cls('nb-grid-block', 'designable-form-item', {
          'top-half': onTopHalf,
          hover: isOver,
          active,
          dragging: isDragging,
        })}
        style={{ marginBottom: 24 }}
      >
        {children}
        <DesignableBar />
      </div>
    </DraggableBlockContext.Provider>
  );
};

const Block = (props) => {
  const { DesignableBar } = useDesignable();
  const [active, setActive] = useState(false);
  return (
    <div
      onMouseEnter={(e) => {
        setActive(true);
        // console.log('e.onMouseEnter', new Date().toString());
      }}
      onMouseLeave={(e) => {
        setActive(false);
        // console.log('e.onMouseLeave', new Date().toString());
      }}
      className={cls('nb-grid-block', 'designable-form-item', { active })}
    >
      {props.children}
      <DesignableBar />
    </div>
  );
};

export const BlockItem: any = observer((props) => {
  const uid = useDragDropUID();
  return React.createElement(uid ? DraggableBlock : Block, props);
});

BlockItem.DesignableBar = () => {
  const field = useField();
  const { schema, refresh } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  return (
    <div className={classNames('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={classNames('designable-bar-actions', { active: visible })}
      >
        <Space size={'small'}>
          <AddNew.BlockItem defaultAction={'insertAfter'} ghost />
          {dragRef && <DragOutlined ref={dragRef} />}
          <Dropdown
            trigger={['click']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.Item
                  onClick={(e) => {
                    const title = uid();
                    schema.title = title;
                    field.title = title;
                    setVisible(false);
                    refresh();
                  }}
                >
                  点击修改按钮文案
                </Menu.Item>
              </Menu>
            }
          >
            <MenuOutlined />
          </Dropdown>
        </Space>
      </span>
    </div>
  );
};
