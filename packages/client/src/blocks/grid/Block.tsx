import React, { useState } from 'react';
import { useDrag, mergeRefs, useDrop } from './DND';
import classNames from 'classnames';
import { useField } from '@formily/react';
import { Dropdown, Menu } from 'antd';
import { useSchemaQuery } from '.';
import { MenuOutlined, ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined } from '@ant-design/icons';

export const Block = (props) => {
  const { children, title } = props;
  const field = useField<Formily.Core.Models.Field>();
  const { isDragging, dragRef, previewRef } = useDrag({
    type: 'grid',
    onDragStart() {
      // console.log('onDragStart');
    },
    onDragEnd(event) {
      console.log('onDragEnd', event);
    },
    onDrag(event) {
      // console.log('onDrag');
    },
    item: {
      path: field.address.segments,
    },
  });
  console.log('useDrag', 'previewElement', field.address.segments);
  const { isOver, onTopHalf, dropRef } = useDrop({
    accept: 'grid',
    data: {},
    canDrop: !isDragging,
  });
  const { addBlock } = useSchemaQuery();
  return (
    <div
      data-type={'block'}
      ref={mergeRefs([dropRef, previewRef])}
      className={classNames('block', { 'top-half': onTopHalf, hover: isOver })}
      // style={{ textAlign: 'center', lineHeight: '60px', background: '#f1f1f1' }}
    >
      <ActionBar dragRef={dragRef}/>
      <div
        style={{ textAlign: 'center', lineHeight: '60px', background: '#f1f1f1' }}
      >
        {children} {field.path.entire}
      </div>
    </div>
  );
};

const ActionBar = ({ dragRef }) => {
  const { addBlock, removeBlock } = useSchemaQuery();
  const [active, setActive] = useState(false);
  return (
    <div className={classNames('action-bar', { active })}>
      <Dropdown
        overlayStyle={{ minWidth: 200 }}
        trigger={['click']}
        visible={active}
        onVisibleChange={setActive}
        overlay={
          <Menu>
            <Menu.Item
              onClick={() => {
                addBlock({}, {
                  insertBefore: true,
                });
                setActive(false);
              }}
              icon={<ArrowUpOutlined />}
            >
              在上方插入区块
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                addBlock();
                setActive(false);
              }}
              icon={<ArrowDownOutlined />}
            >
              在下方插入区块
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              onClick={() => {
                removeBlock();
                setActive(false);
              }}
              icon={<DeleteOutlined />}
            >
              删除区块
            </Menu.Item>
          </Menu>
        }
      >
        <MenuOutlined className={'draggable'} ref={dragRef} />
      </Dropdown>
    </div>
  );
};

export default Block;
