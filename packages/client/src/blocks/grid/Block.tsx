import React, { useState, useContext, createContext } from 'react';
import { useDrag, mergeRefs, useDrop } from './DND';
import classNames from 'classnames';
import {
  useField,
  observer,
  RecursionField,
  Schema,
  SchemaOptionsContext,
} from '@formily/react';
import { Dropdown, Menu } from 'antd';
import { useSchemaQuery } from '.';
import {
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import get from 'lodash/get';
import { BlockContext } from '../SchemaField';

export const Block = observer((props: any) => {
  const { children, title, DesignableBar } = props;
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
  console.log('ActionBar', DesignableBar);
  const { isOver, onTopHalf, dropRef } = useDrop({
    accept: 'grid',
    data: {},
    canDrop: !isDragging,
  });

  const options = useContext(SchemaOptionsContext);

  const DesignableBarComponent = get(options.components, DesignableBar);

  console.log({ DesignableBarComponent, DesignableBar });

  const { addBlock } = useSchemaQuery();

  console.log({ children });
  return (
    <div
      data-type={'block'}
      ref={mergeRefs([dropRef, previewRef])}
      className={classNames('block', { 'top-half': onTopHalf, hover: isOver })}
      // style={{ textAlign: 'center', lineHeight: '60px', background: '#f1f1f1' }}
    >
      <BlockContext.Provider value={{ dragRef }}>
        {children}
      </BlockContext.Provider>
      {/* {DesignableBarComponent && (
        <DefaultActionBar DesignableBarComponent={DesignableBarComponent} dragRef={dragRef} />
      )} */}
    </div>
  );
});

// function overlay() {
//   return <Menu>
//   <Menu.Item
//     onClick={() => {
//       addBlock(
//         {},
//         {
//           insertBefore: true,
//         },
//       );
//       setActive(false);
//     }}
//     icon={<ArrowUpOutlined />}
//   >
//     在上方插入区块
//   </Menu.Item>
//   <Menu.Item
//     onClick={() => {
//       addBlock();
//       setActive(false);
//     }}
//     icon={<ArrowDownOutlined />}
//   >
//     在下方插入区块
//   </Menu.Item>
//   <Menu.Divider />
//   <Menu.Item
//     onClick={() => {
//       removeBlock();
//       setActive(false);
//     }}
//     icon={<DeleteOutlined />}
//   >
//     删除区块
//   </Menu.Item>
// </Menu>
// }

function Overlay(props) {
  return (
    <>
      <Menu.Item>在上方插入区块1</Menu.Item>
      <Menu.Item>在下方插入区块2</Menu.Item>
      <Menu.Divider />
      <Menu.Item>删除区块</Menu.Item>
    </>
  );
}

const DefaultActionBar = ({ DesignableBarComponent, dragRef }) => {
  const { addBlock, removeBlock } = useSchemaQuery();
  const [active, setActive] = useState(false);
  // return <MenuOutlined className={'draggable'} ref={dragRef} />;
  return (
    <div className={classNames('action-bar', { active })}>
      <Dropdown
        overlayStyle={{ minWidth: 200 }}
        trigger={['click']}
        visible={active}
        onVisibleChange={setActive}
        overlay={<Menu>{DesignableBarComponent ? <DesignableBarComponent /> : <Overlay />}</Menu>}
      >
        <MenuOutlined className={'draggable'} ref={dragRef} />
      </Dropdown>
    </div>
  );
};

export default Block;
