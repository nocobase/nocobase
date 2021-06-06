import React, { cloneElement, useRef } from 'react';
import classNames from 'classnames';
import { Col } from './Col';
import { DragDropProvider, useDrop } from './DND';
import { useField } from '@formily/react';

export const Row = (props) => {
  const { children, onColResize, position = {}, isLast } = props;
  const { isOver, onTopHalf, dropRef } = useDrop({
    accept: 'grid',
    data: {},
    shallow: true,
  });
  return (
    <>
      <div
        data-type={'row'}
        ref={dropRef}
        className={classNames('row', { hover: isOver, 'top-half': onTopHalf })}
        style={{ margin: '0 -24px', display: 'flex' }}
      >
        <Col.Divider resizable={false} />
        {children}
      </div>
      <Row.Divider />
    </>
  );
};

Row.Divider = (props) => {
  const { style = {}, position } = props;
  const { isOver, dropRef } = useDrop({
    accept: 'grid',
    data: { position },
  });
  return (
    <div
      data-type={'row-divider'}
      ref={dropRef}
      className={classNames('row-divider', { hover: isOver })}
      style={{ ...style, height: '24px' }}
    ></div>
  );
};

export default Row;
