import React, { cloneElement, useRef, useState } from 'react';
import { useMouseEvents } from 'beautiful-react-hooks';
import { mergeRefs, useDrop } from './DND';
import classNames from 'classnames';

export function useColResizer(options?: any) {
  const { onDragStart, onDrag, onDragEnd } = options || {};
  const dragRef = useRef<HTMLDivElement>();
  const [dragOffset, setDragOffset] = useState({ left: 0, top: 0 });
  const { onMouseDown } = useMouseEvents(dragRef);
  const { onMouseMove, onMouseUp } = useMouseEvents();
  const [isDragging, setIsDragging] = useState(false);
  const [columns, setColumns] = useState(options.columns || []);
  const [initial, setInitial] = useState<any>(null);

  onMouseDown((event: React.MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    const prev = dragRef.current.previousElementSibling as HTMLDivElement;
    const next = dragRef.current.nextElementSibling as HTMLDivElement;
    if (!prev || !next) {
      return;
    }
    setIsDragging(true);
    if (!initial) {
      setInitial({
        offset: event.clientX,
        prevWidth: prev.style.width,
        nextWidth: next.style.width,
      });
    }
  });

  onMouseUp((event: React.MouseEvent) => {
    if (!isDragging) {
      return;
    }
    const parent = dragRef.current.parentElement;
    const els = parent.querySelectorAll('.col');
    const size = [];
    els.forEach((el: HTMLDivElement) => {
      const w = el.clientWidth / parent.clientWidth;
      size.push(w);
      el.style.width = `${100 * w}%`;
    });
    console.log(size);
    setIsDragging(false);
    setInitial(null);
    // @ts-ignore
    event.data = { size };
    onDragEnd && onDragEnd(event);
  });

  onMouseMove((event: React.MouseEvent) => {
    if (!isDragging) {
      return;
    }
    const offset = event.clientX - initial.offset;
    // dragRef.current.style.transform = `translateX(${event.clientX - initialOffset}px)`;
    const prev = dragRef.current.previousElementSibling as HTMLDivElement;
    const next = dragRef.current.nextElementSibling as HTMLDivElement;
    prev.style.width = `calc(${initial.prevWidth} + ${offset}px)`;
    next.style.width = `calc(${initial.nextWidth} - ${offset}px)`;
    // console.log('dragRef.current.nextSibling', prev.style.width);
  });

  return { isDragging, dragOffset, dragRef, columns };
}

export const Col: any = (props) => {
  const { size, children, position = {}, isLast } = props;
  return (
    <>
      <div data-type={'col'} className={'col'} style={{ width: `${size * 100}%` }}>
        {children}
      </div>
      <Col.Divider />
    </>
  );
};

Col.Divider = (props) => {
  const { onDragEnd, resizable = true } = props;
  const { isDragging, dragRef } = useColResizer({ onDragEnd });
  const { isOver, dropRef } = useDrop({
    accept: 'grid',
    data: { },
  });
  return (
    <div
      data-type={'col-divider'}
      className={classNames('col-divider', { hover: isOver, resizable })}
      style={{ width: '24px' }}
      ref={mergeRefs(resizable ? [dropRef, dragRef] : [dropRef])}
    ></div>
  );
};

export default Col;
