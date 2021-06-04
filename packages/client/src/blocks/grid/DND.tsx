import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useMouseEvents } from 'beautiful-react-hooks';

export const DragDropManagerContext = createContext({ drag: null, drops: {} });

export function DragDropProvider({ children }) {
  return (
    <DragDropManagerContext.Provider
      value={{
        drag: null,
        drops: {},
      }}
    >
      {children}
    </DragDropManagerContext.Provider>
  );
}

export function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

export function useDrag(options?: any) {
  const { type, onDragStart, onDrag, onDragEnd } = options;
  const dragRef = useRef<HTMLButtonElement>();
  const previewRef = useRef<HTMLDivElement>();
  const [dragOffset, setDragOffset] = useState({ left: 0, top: 0 });
  const [previewOffset, setPreviewOffset] = useState({ left: 0, top: 0 });
  const { onMouseDown } = useMouseEvents(dragRef);
  const { onMouseMove, onMouseUp } = useMouseEvents();
  const [previewElement, setPreviewElement] = useState<HTMLDivElement>();
  const [isDragging, setIsDragging] = useState(false);
  const dragDropManager = useContext(DragDropManagerContext);

  onMouseDown((event: React.MouseEvent) => {
    dragDropManager.drag = { type };
    setIsDragging(true);

    const offset = {
      left: event.clientX - previewRef.current.offsetLeft,
      top: event.clientY - previewRef.current.offsetTop,
    };
    setDragOffset(offset);

    const offset2 = {
      left: event.clientX - offset.left,
      top: event.clientY - offset.top,
    };
    setPreviewOffset(offset2);

    console.log('previewRef.current.clientWidth', previewRef.current.clientWidth);

    const wrap = document.createElement('div');
    wrap.style.position = 'absolute';
    wrap.style.pointerEvents = 'none';
    wrap.style.opacity = '0.7';
    wrap.style.left = `0px`;
    wrap.style.top = `0px`;
    wrap.style.zIndex = '9999';
    wrap.style.width = `${previewRef.current.clientWidth}px`;
    wrap.style.transform = `translate(${offset2.left}px, ${offset2.top}px)`;

    setPreviewElement(wrap);
    document.body.appendChild(wrap);
    const el = document.createElement('div');
    wrap.appendChild(el);
    el.outerHTML = previewRef.current.outerHTML;
    onDragStart && onDragStart(event);
    document.body.style.cursor = 'grab';

    console.log('onMouseDown', dragDropManager);
  });

  onMouseUp((event: React.MouseEvent) => {
    setIsDragging(false);
    dragDropManager.drag = null;
    if (!previewElement) {
      return;
    }

    previewElement.remove();
    document.body.style.cursor = null;

    if (type) {
      let dropElement = document.elementFromPoint(event.clientX, event.clientY);
      const dropIds = [];
      while (dropElement) {
        if (!dropElement.getAttribute) {
          dropElement = dropElement.parentNode as Element;
          continue;
        }
        const dropId = dropElement.getAttribute('data-drop-id');
        const dropContext = dropId ? dragDropManager.drops[dropId] : null;
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
        dropElement = dropElement.parentNode as Element;
      }
    } else {
      onDragEnd && onDragEnd(event);
    }
  });

  onMouseMove((event: React.MouseEvent) => {
    if (!isDragging) {
      return;
    }

    if (!previewElement) {
      return;
    }

    const offset = {
      left: event.clientX - dragOffset.left,
      top: event.clientY - dragOffset.top,
    };

    setPreviewOffset(offset);

    previewElement.style.transform = `translate(${offset.left}px, ${offset.top}px)`;

    if (type) {
      let dropElement = document.elementFromPoint(event.clientX, event.clientY);
      const dropIds = [];
      while (dropElement) {
        if (!dropElement.getAttribute) {
          dropElement = dropElement.parentNode as Element;
          continue;
        }
        const dropId = dropElement.getAttribute('data-drop-id');
        const dropContext = dropId ? dragDropManager.drops[dropId] : null;
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
        dropElement = dropElement.parentNode as Element;
      }
      dragDropManager.drag = { type, dropIds };
    }

    onDrag && onDrag(event);
  });

  return { isDragging, previewOffset, dragOffset, dragRef, previewRef };
}

export function useDrop(options) {
  const { accept, data, shallow } = options;
  const dropRef = useRef<HTMLDivElement>();
  const { onMouseEnter, onMouseLeave, onMouseMove, onMouseUp } =
    useMouseEvents(dropRef);
  const [isOver, setIsOver] = useState(false);
  const [dropId] = useState<string>(`d${Math.random()}`);
  const dragDropManager = useContext(DragDropManagerContext);

  useEffect(() => {
    dragDropManager.drops[dropId] = {
      accept,
      data,
      shallow,
    };
    dropRef.current.setAttribute('data-drop-id', dropId);
  }, [accept, data, shallow]);

  onMouseEnter((event) => {
    console.log({ dragDropManager });
    if (!dragDropManager.drag || dragDropManager.drag.type !== accept) {
      return;
    }
    setIsOver(true);
  });

  onMouseMove(() => {
    if (!dragDropManager.drag || dragDropManager.drag.type !== accept) {
      return;
    }
    if (
      dragDropManager.drag.dropIds &&
      dragDropManager.drag.dropIds.includes(dropId)
    ) {
      setIsOver(true);
    } else {
      setIsOver(false);
    }
  });

  onMouseUp((event) => {
    setIsOver(false);
  });

  onMouseLeave(() => {
    setIsOver(false);
  });

  return {
    isOver,
    dropRef,
  };
}
