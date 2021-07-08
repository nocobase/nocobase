import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useMouseEvents, useWillUnmount } from 'beautiful-react-hooks';
import { useField, useFieldSchema } from '@formily/react';
import { useMount } from 'ahooks';
import constate from 'constate';
import { useSchemaPath } from '../../schemas';

export const DraggableBlockContext = createContext({
  dragRef: null,
});

export function useDragDropManager({ uid }) {
  const [drag, setDrag] = useState(null);
  const [drop, setDrop] = useState(null);
  const [drops, setDrops] = useState({});
  const addDrop = (dropId, data) =>
    setDrops((prevDrops) => {
      prevDrops[dropId] = data;
      return prevDrops;
    });
  const getDrop = (dropId) => {
    return drops[dropId];
  };
  return { uid, drag, drop, drops, setDrag, addDrop, setDrop, getDrop };
}

const [DragDropManagerProvider, useDragDropManagerContext] =
  constate(useDragDropManager);

export function useDragDropUID() {
  const { uid } = useDragDropManagerContext();
  return uid;
}

export { DragDropManagerProvider, useDragDropManagerContext };

export function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>,
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

export function useDrag(options?: any) {
  const { type, onDragStart, onDrag, onDragEnd, item = {} } = options;
  const dragRef = useRef<HTMLDivElement>();
  const previewRef = useRef<HTMLDivElement>();
  const { onMouseDown } = useMouseEvents(dragRef);
  const { onMouseMove, onMouseUp } = useMouseEvents();
  const [previewElement, setPreviewElement] = useState<HTMLDivElement>();
  const [isDragging, setIsDragging] = useState(false);
  const [mousePostionWithinPreview, setMousePostionWithinPreview] = useState({
    left: 0,
    top: 0,
  });
  const { drag, setDrag, setDrop, getDrop } = useDragDropManagerContext();

  useWillUnmount(() => {
    setIsDragging(false);
    // @ts-ignore
    window.__previewElement && window.__previewElement.remove();
    // @ts-ignore
    window.__previewElement = undefined;

    setDrag(null);
    setDrop(null);

    document.body.classList.remove('dragging');
    document.body.style.cursor = null;
    document.body.style.userSelect = null;
  });

  onMouseDown((event: React.MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    setDrop({ type, item });
    setDrag({ type, item });
    setIsDragging(true);

    const postion = {
      left: event.clientX - previewRef.current.getBoundingClientRect().left,
      top: event.clientY - previewRef.current.getBoundingClientRect().top,
    };

    setMousePostionWithinPreview(postion);

    const offset = {
      left: event.pageX - postion.left,
      top: event.pageY - postion.top,
    };

    const wrap = document.createElement('div');
    wrap.className = 'drag-container';
    wrap.style.position = 'absolute';
    wrap.style.pointerEvents = 'none';
    wrap.style.opacity = '0.7';
    wrap.style.left = `0px`;
    wrap.style.top = `0px`;
    wrap.style.zIndex = '9999';
    wrap.style.width = `${previewRef.current.clientWidth}px`;
    wrap.style.transform = `translate(${offset.left}px, ${offset.top}px)`;

    setPreviewElement(wrap);
    // @ts-ignore
    window.__previewElement = wrap;
    // console.log(
    //   'dragDropManager.previewElement',
    //   dragDropManager.previewElement,
    // );
    document.body.appendChild(wrap);
    const el = document.createElement('div');
    wrap.appendChild(el);
    el.outerHTML = previewRef.current.outerHTML;
    onDragStart && onDragStart(event);
    document.body.style.cursor = 'grab';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');

    // console.log(
    //   'onMouseDown',
    //   { isDragging, previewElement },
    //   dragDropManager.previewElement,
    //   field ? field.address.segments : null,
    // );
    // console.log('onMouseDown', event);
  });

  onMouseUp((event: React.MouseEvent) => {
    if (!isDragging || !previewElement) {
      return;
    }

    // console.log(
    //   'onMouseUp',
    //   { isDragging, previewElement },
    //   field ? field.address.segments : null,
    // );

    // @ts-ignore
    event.dragItem = item;

    setIsDragging(false);
    setDrag(null);
    // dragDropManager.drag = null;
    previewElement.remove();
    setPreviewElement(undefined);
    document.body.classList.remove('dragging');
    document.body.style.cursor = null;
    document.body.style.userSelect = null;
    // @ts-ignore
    window.__previewElement && window.__previewElement.remove();
    // @ts-ignore
    window.__previewElement = undefined;

    if (!type) {
      onDragEnd && onDragEnd(event);
    }

    let dropElement = document.elementFromPoint(event.clientX, event.clientY);
    const dropIds = [];
    while (dropElement) {
      if (!dropElement.getAttribute) {
        dropElement = dropElement.parentNode as HTMLElement;
        continue;
      }
      const dropId = dropElement.getAttribute('data-drop-id');

      const dropContext = getDrop(dropId);
      if (dropContext && dropContext.accept === type) {
        if (
          !dropContext.shallow ||
          (dropContext.shallow && dropIds.length === 0)
        ) {
          // @ts-ignore
          event.data = dropContext.data;
          onDragEnd && onDragEnd(event);
          dropIds.push(dropId);
        }
      }
      dropElement = dropElement.parentNode as HTMLElement;
    }
  });

  onMouseMove((event: React.MouseEvent) => {
    if (!isDragging || !previewElement) {
      return;
    }

    console.log('drag', drag.dropIds);
    // console.log(
    //   'onMouseMove',
    //   { isDragging, previewElement },
    //   dragDropManager.previewElement,
    //   field ? field.address.segments : null,
    // );
    // console.log({previewElement})

    const offset = {
      left: event.pageX - mousePostionWithinPreview.left,
      top: event.pageY - mousePostionWithinPreview.top,
    };

    previewElement.style.transform = `translate(${offset.left}px, ${offset.top}px)`;

    if (type) {
      let dropElement = document.elementFromPoint(event.clientX, event.clientY);
      const dropIds = [];
      while (dropElement) {
        if (!dropElement.getAttribute) {
          dropElement = dropElement.parentNode as HTMLElement;
          continue;
        }
        const dropId = dropElement.getAttribute('data-drop-id');
        const dropContext = getDrop(dropId);
        if (dropContext && dropContext.accept === type) {
          if (
            !dropContext.shallow ||
            (dropContext.shallow && dropIds.length === 0)
          ) {
            dropIds.push(dropId);
          }
          // @ts-ignore
          // event.data = dropContext.data;
        }
        dropElement = dropElement.parentNode as HTMLElement;
      }
      setDrag({ type, dropIds });
    }

    onDrag && onDrag(event);
  });

  return { isDragging, dragRef, previewRef };
}

export function useDrop(options) {
  const {
    uid: dropId,
    accept,
    data,
    shallow,
    onDrop,
    onHover,
    canDrop = true,
  } = options;
  const dropRef = useRef<HTMLDivElement>();
  const { onMouseEnter, onMouseLeave, onMouseMove, onMouseUp } =
    useMouseEvents(dropRef);
  const [isOver, setIsOver] = useState(false);
  const [onTopHalf, setOnTopHalf] = useState(null);
  // const dragDropManager = useContext(DragDropManagerContext);
  const { drag, drop, addDrop, setDrop } = useDragDropManagerContext();

  useEffect(() => {
    addDrop(dropId, {
      accept,
      data,
      shallow,
    });
    // console.log('dragDropManager.drops', dragDropManager.drops);
    // dragDropManager.drops[dropId] = {
    //   accept,
    //   data,
    //   shallow,
    // };
    dropRef.current.setAttribute('data-drop-id', dropId);
  }, [dropId]);

  onMouseEnter((event) => {
    if (!canDrop) {
      return;
    }
    // console.log({ dragDropManager });
    if (!drag || drag.type !== accept) {
      return;
    }
    setIsOver(true);
  });

  onMouseMove((event: React.MouseEvent) => {
    if (!canDrop) {
      return;
    }
    if (!drag || drag.type !== accept) {
      return;
    }
    console.log('drag.dropIds', drag.dropIds, dropId);
    if (drag.dropIds && drag.dropIds.includes(dropId)) {
      const top = event.clientY - dropRef.current.getBoundingClientRect().top;
      const onTop = top < dropRef.current.clientHeight / 2;
      setOnTopHalf(onTop);
      // @ts-ignore
      event.onTopHalf = onTop;
      setIsOver(true);
      onHover && onHover(event);
    } else {
      setIsOver(false);
    }
  });

  onMouseUp((event: React.MouseEvent) => {
    if (!canDrop) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    if (isOver) {
      const top = event.clientY - dropRef.current.getBoundingClientRect().top;
      const onTop = top < dropRef.current.clientHeight / 2;
      setOnTopHalf(onTop);
      // @ts-ignore
      event.onTopHalf = onTop;
      // @ts-ignore
      event.data = data;
      // @ts-ignore
      event.dragItem = drop.item;
      // @ts-ignore
      event.dropElement = dropRef.current;
      onDrop && onDrop(event);
      // dragDropManager.onDrop && dragDropManager.onDrop(event);
      setDrop(null);
    }
    setIsOver(false);
  });

  onMouseLeave(() => {
    if (!canDrop) {
      return;
    }
    setIsOver(false);
  });

  return {
    onTopHalf: isOver ? onTopHalf : null,
    isOver,
    dropRef,
  };
}

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
    const els = parent.querySelectorAll(':scope > .nb-grid-col');
    const size = [];
    const gap = dragRef.current.clientWidth;
    console.log(
      'parent.clientWidth',
      parent.clientWidth,
      dragRef.current.clientWidth,
    );
    els.forEach((el: HTMLDivElement) => {
      const w = (100 * el.clientWidth) / parent.clientWidth;
      const w2 =
        (100 * (el.clientWidth + gap + gap / els.length)) / parent.clientWidth;
      size.push(w2);
      el.style.width = `${w}%`;
    });
    console.log({ size });
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

export function useBlockDragAndDrop() {
  const schema = useFieldSchema();
  const uid = useDragDropUID();
  const path = useSchemaPath();
  const { isDragging, dragRef, previewRef } = useDrag({
    type: uid,
    onDragStart() {
      console.log('onDragStart');
    },
    onDragEnd(event) {
      console.log('onDragEnd', event.data);
    },
    onDrag(event) {
      // console.log('onDrag');
    },
    item: {
      path,
      schema: schema.toJSON(),
    },
  });
  const { isOver, onTopHalf, dropRef } = useDrop({
    uid: schema.name,
    accept: uid,
    data: {},
    canDrop: !isDragging,
  });

  return {
    isDragging,
    dragRef,
    previewRef,
    isOver,
    onTopHalf,
    dropRef,
  };
}
