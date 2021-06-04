import React, { useRef, useState } from 'react';
import { useMouseEvents } from 'beautiful-react-hooks';

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
    setIsDragging(true);
    const prev = dragRef.current.previousElementSibling as HTMLDivElement;
    const next = dragRef.current.nextElementSibling as HTMLDivElement;
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
    onDragEnd(event);
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

  return { dragOffset, dragRef, columns };
}

export const Col: any = (props) => {
  const { size, children } = props;
  return (
    <div
      className={'col'}
      style={{ width: `${size * 100}%` }}
    >
      {children}
    </div>
  );
}

Col.Divider = (props) => {
  const { onDragEnd } = props;
  const { dragRef } = useColResizer({ onDragEnd });
  return (
    <div
      className={'col-divider'}
      style={{ width: '24px', cursor: 'col-resize' }}
      ref={dragRef}
    ></div>
  );
}

export default Col;
