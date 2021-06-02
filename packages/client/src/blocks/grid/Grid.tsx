import React, { createContext, useContext, useState } from 'react';
import { Row, Col, Dropdown, Menu } from 'antd';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  DropFirstRow,
  DropRow,
  DropColumn,
  DropBlock,
  DropLastColumn,
} from './Drop';
import {
  CloseOutlined,
  DeleteOutlined,
  MenuOutlined,
  PlusOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import {
  getFullPaths,
  SchemaDesignerContext,
  useSchemaQuery,
  useSchema,
} from '../../fields';
import { TouchBackend } from 'react-dnd-touch-backend';
import { usePreview } from 'react-dnd-preview';
import classNames from 'classnames';
import './style.less';
import { useField, useFieldSchema } from '@formily/react';

const Preview = () => {
  const accept = useContext(AcceptContext);
  const { item, style, display, itemType } = usePreview();
  if (itemType !== accept) {
    return null;
  }
  if (!display) {
    return null;
  }
  if (!item.ref) {
    return null;
  }
  if (!item.ref.current) {
    return null;
  }
  const el = item.ref.current as HTMLDivElement;
  console.log({ itemType });
  return (
    <div
      style={{
        ...style,
        height: el.clientHeight,
        width: el.clientWidth,
        zIndex: 9999,
        opacity: 0.8,
        // left: `-${el.clientWidth}px`,
      }}
    >
      <div
        style={{
          transform: 'translate(-90%, -5%)',
        }}
        dangerouslySetInnerHTML={{ __html: el.outerHTML }}
      />
    </div>
  );
};

export interface GridPorps {
  children?: React.ReactNode;
}

export interface GridRowPorps {
  children?: React.ReactNode;
  rowOrder?: number;
}

export interface GridColumnPorps {
  children?: React.ReactNode;
  span?: any;
}

export interface GridBlockProps {
  children?: React.ReactNode;
  lastComponentType?: string;
}

export type GridComponent = React.FC<GridPorps> & {
  Row?: React.FC<GridRowPorps>;
  Column?: React.FC<GridColumnPorps>;
  Block?: React.FC<GridBlockProps>;
};

export const AcceptContext = createContext(null);

export const Grid: GridComponent = (props) => {
  const { children } = props;
  const schema = useFieldSchema();
  const field = useField();
  console.log({ accept: schema.name, schema: schema.toJSON() });
  return (
    <div className={'grid'} style={{ marginTop: 24 }}>
      <AcceptContext.Provider value={schema.name}>
        <DndProvider
          backend={TouchBackend}
          options={{ enableMouseEvents: true }}
        >
          {children}
          <Preview />
        </DndProvider>
      </AcceptContext.Provider>
    </div>
  );
};

Grid.Row = (props) => {
  const { children, rowOrder } = props;
  const { schema } = useSchema();
  const field = useField();
  const accept = useContext(AcceptContext);
  console.log({ accept });
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept,
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      return { gridType: 'row', schema, segments: field.address.segments };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  }));

  const active = canDrop && isOverCurrent;

  return (
    <div
      ref={drop}
      className={classNames('grid-row', `grid-row-order-${rowOrder}`, {
        active,
      })}
    >
      {rowOrder === 0 && <DropFirstRow />}
      <Row gutter={24}>{children}</Row>
      <DropLastColumn />
      {/* <DropRow /> */}
    </div>
  );
};

Grid.Column = (props) => {
  const { children, span } = props;
  return (
    <Col span={span}>
      <DropColumn />
      {children}
    </Col>
  );
};

interface DropResult {
  [key: string]: any;
}

Grid.Block = (props) => {
  const { children, lastComponentType } = props;
  const { schema, refresh } = useSchema();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const accept = useContext(AcceptContext);
  const context = useContext(SchemaDesignerContext);
  const {
    insertAfter,
    insertAfterWithAddRow,
    insertBeforeWithAddRow,
    insertBeforeWithAddColumn,
    appendToRowWithAddColumn,
  } = useSchemaQuery();
  const ref = React.useRef();
  console.log({ accept });
  const [{ opacity, isDragging }, drag, preview] = useDrag(
    () => ({
      type: accept,
      item: {
        ref,
        preview,
        schema,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        opacity: monitor.isDragging() ? 0.9 : 1,
      }),
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult<DropResult>();
        if (item && dropResult) {
          if (dropResult.gridType === 'block') {
            insertAfter(field.address.segments, dropResult.segments);
          } else if (dropResult.gridType === 'row') {
            insertAfterWithAddRow(field.address.segments, dropResult.segments);
          } else if (dropResult.gridType === 'column') {
            insertBeforeWithAddColumn(
              field.address.segments,
              dropResult.segments,
            );
          } else if (dropResult.gridType === 'last-column') {
            appendToRowWithAddColumn(
              field.address.segments,
              dropResult.segments,
            );
          } else if (dropResult.gridType === 'first-row') {
            insertBeforeWithAddRow(
              field.address.segments,
              dropResult.segments,
            );
          }
          refresh();
        }
      },
    }),
    [field, schema],
  );

  const segments = field.address.segments;

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept,
      drop: () => {
        console.log('source.segments', segments);
        return { gridType: 'block', segments, schema };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
      // hover: (item, monitor) => {
      //   console.log(monitor.getSourceClientOffset());
      // },
      canDrop: () => !isDragging,
    }),
    [isDragging, schema],
  );

  const active = canDrop && isOver;

  drop(ref);

  console.log({ isDragging });

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className={classNames(`grid-block`, `grid-block--${lastComponentType}`, {
        active,
      })}
    >
      <ActionBar dragRef={drag} />
      {children}
      {/* <DropBlock canDrop={!isDragging} /> */}
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
                addBlock({}, true);
                setActive(false);
              }}
              icon={<ArrowUpOutlined />}
            >
              在上方插入区块
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                addBlock({});
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

export default Grid;
