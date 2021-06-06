import React, { cloneElement, useRef } from 'react';
import { Col } from './Col';
import { Row } from './Row';
import { Block } from './Block';
import { DragDropProvider } from './DND';
import { useSchemaQuery } from './';

type Event = React.MouseEvent & {
  dropElement: HTMLElement;
  onTopHalf?: boolean;
  dragItem?: any;
};

export const Grid = (props) => {
  const { children, onDrop } = props;
  const ref = useRef();
  const { schema, moveTo, refresh } = useSchemaQuery();
  return (
    <div className={'grid'}>
      <DragDropProvider
        gridRef={ref}
        onDrop={(event: Event) => {
          const el = event.dropElement;
          const type = el.getAttribute('data-type');
          const getIndex = (el) => {
            const type = el.getAttribute('data-type');
            return Array.prototype.indexOf.call(
              el.parentNode.querySelectorAll(`.${type}`),
              el,
            );
          };
          let position: any = { type };
          if (type === 'row') {
            // position.rowIndex = getIndex(el);
            position = {
              type: 'row-divider',
              rowDividerIndex: getIndex(
                event.onTopHalf ? el.previousSibling : el.nextSibling,
              ),
            };
          }
          if (type === 'row-divider') {
            position.rowDividerIndex = getIndex(el);
          }
          if (type === 'col-divider') {
            position.colDividerIndex = getIndex(el);
            position.rowIndex = getIndex(el.parentNode);
          }
          if (type === 'block') {
            const rowNode = el.parentNode.parentNode;
            position.blockIndex = getIndex(el);
            position.colIndex = getIndex(el.parentNode);
            position.rowIndex = getIndex(rowNode);
            const colsize = rowNode.querySelectorAll('.col').length;
            if (colsize === 1) {
              position = {
                type: 'row-divider',
                rowDividerIndex: getIndex(
                  event.onTopHalf
                    ? rowNode.previousSibling
                    : rowNode.nextSibling,
                ),
              };
            } else {
              position.type = 'block-divider';
              position.blockDividerIndex = getIndex(el);
              if (!event.onTopHalf) {
                position.blockDividerIndex += 1
              }
            }
          }
          onDrop && onDrop(event);
          moveTo(event.dragItem.path, position);
          console.log('onDrop', position, event.dragItem);
        }}
      >
        <Row.Divider style={{ marginTop: -24 }} />
        {children}
      </DragDropProvider>
    </div>
  );
};

Grid.Row = Row;
Grid.Col = Col;
Grid.Block = Block;

export default Grid;
