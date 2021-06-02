import React, { useContext } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import classNames from 'classnames';
import { useSchema } from '../../fields';
import { AcceptContext } from './Grid';
import { useField } from '@formily/react';

export function DropFirstRow() {
  const field = useField();
  const { schema } = useSchema();
  const accept = useContext(AcceptContext);
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept,
      drop: () => ({
        gridType: 'first-row',
        schema,
        segments: field.address.segments,
      }),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [schema],
  );

  const active = canDrop && isOver;

  return (
    <div
      className={classNames('drop-row', 'first', { active })}
      ref={drop}
    ></div>
  );
}

export function DropRow() {
  const { schema } = useSchema();
  const field = useField();
  const accept = useContext(AcceptContext);
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept,
      drop: () => ({
        gridType: 'row',
        schema,
        segments: field.address.segments,
      }),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [schema],
  );

  const active = canDrop && isOver;

  return <div className={classNames('drop-row', { active })} ref={drop}></div>;
}

export function DropColumn() {
  const field = useField();
  const { schema } = useSchema();
  const accept = useContext(AcceptContext);
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept,
      drop: () => ({
        gridType: 'column',
        schema,
        segments: field.address.segments,
      }),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [schema],
  );

  const active = canDrop && isOver;

  return (
    <div className={classNames('drop-column', { active })} ref={drop}></div>
  );
}

export function DropLastColumn() {
  const field = useField();
  const { schema } = useSchema();
  const accept = useContext(AcceptContext);
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept,
      drop: () => ({
        gridType: 'last-column',
        schema,
        segments: field.address.segments,
      }),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [schema],
  );

  const active = canDrop && isOver;

  return (
    <div
      className={classNames('drop-column', 'last', { active })}
      ref={drop}
    ></div>
  );
}

export function DropBlock({ canDrop }) {
  const { schema } = useSchema();
  const accept = useContext(AcceptContext);
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept,
      drop: () => ({ schema }),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
      canDrop: () => canDrop,
    }),
    [canDrop],
  );

  console.log({ canDrop });

  const active = canDrop && isOver;

  return (
    <div className={classNames('drop-block', { active })} ref={drop}></div>
  );
}

export default {
  DropRow,
  DropColumn,
  DropLastColumn,
  DropBlock,
};
