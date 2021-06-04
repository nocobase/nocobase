import React from 'react';
import { Col } from './Col';

export const Row = (props) => {
  const { children, onColResize } = props;
  const len = children.length;
  return (
    <div style={{ display: 'flex' }}>
      {children.map((child, index) => {
        return (
          <>
            {child}
            {len > index + 1 && <Col.Divider onDragEnd={onColResize} />}
          </>
        );
      })}
    </div>
  );
}

export default Row;
