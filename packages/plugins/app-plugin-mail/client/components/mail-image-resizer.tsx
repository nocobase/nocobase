import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from 'react';

import { Button } from './ui/button.js';

interface ImageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}
interface ResizeSession {
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: string | null;
  originalHeight: string | null;
}

/** Editing controls live outside contentEditable so they never enter the message. */
export function MailImageResizer({
  editorRef,
  disabled,
  label,
  deleteLabel,
  onCommit,
}: {
  readonly editorRef: RefObject<HTMLDivElement | null>;
  readonly disabled: boolean;
  readonly label: string;
  readonly deleteLabel: string;
  readonly onCommit: () => void;
}): ReactElement | null {
  const [selected, setSelected] = useState<HTMLImageElement>();
  const [box, setBox] = useState<ImageBox>();
  const sessionRef = useRef<ResizeSession | undefined>(undefined);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || disabled) return;
    const select = (event: MouseEvent): void => {
      const image =
        event.target instanceof HTMLImageElement ? event.target : undefined;
      setSelected(image);
      if (image) setBox(imageBox(image, editor));
    };
    const outside = (event: PointerEvent): void => {
      if (
        event.target instanceof Node &&
        !editor.parentElement?.contains(event.target)
      )
        setSelected(undefined);
    };
    editor.addEventListener('click', select);
    document.addEventListener('pointerdown', outside);
    return () => {
      editor.removeEventListener('click', select);
      document.removeEventListener('pointerdown', outside);
    };
  }, [editorRef, disabled]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!selected || !editor || disabled) return;
    const measure = (): void => {
      if (!editor.contains(selected)) {
        setSelected(undefined);
        return;
      }
      setBox(imageBox(selected, editor));
    };
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(editor);
    observer?.observe(selected);
    const mutation = new MutationObserver(measure);
    mutation.observe(editor, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    window.addEventListener('resize', measure);
    document.addEventListener('scroll', measure, true);
    selected.addEventListener('load', measure);
    return () => {
      observer?.disconnect();
      mutation.disconnect();
      window.removeEventListener('resize', measure);
      document.removeEventListener('scroll', measure, true);
      selected.removeEventListener('load', measure);
      restoreSize(selected, sessionRef.current);
      sessionRef.current = undefined;
    };
  }, [selected, editorRef, disabled]);

  const resize = (width: number, ratio: number): void => {
    if (!selected || !box) return;
    const editor = editorRef.current;
    if (!editor?.contains(selected)) return;
    const available = editor.clientWidth - 24;
    const bounded = Math.round(
      Math.max(
        16,
        Math.min(
          10000,
          10000 * ratio,
          available > 0 ? available : 10000,
          width,
        ),
      ),
    );
    selected.setAttribute('width', String(bounded));
    selected.setAttribute(
      'height',
      String(Math.max(1, Math.round(bounded / ratio))),
    );
    setBox({ ...box, width: bounded, height: bounded / ratio });
  };

  const cancel = (): void => {
    const current = sessionRef.current;
    sessionRef.current = undefined;
    if (!current || !selected) return;
    restoreSize(selected, current);
  };

  const remove = (): void => {
    if (!selected || !editorRef.current?.contains(selected)) return;
    cancel();
    selected.remove();
    setSelected(undefined);
    onCommit();
    editorRef.current.focus();
  };

  if (disabled || !selected || !box || box.width <= 0 || box.height <= 0)
    return null;
  return (
    <div
      className='pointer-events-none absolute z-10 border border-primary'
      style={box}
    >
      <Button
        type='button'
        aria-label={deleteLabel}
        title={deleteLabel}
        className='pointer-events-auto absolute top-0 right-0 h-auto w-auto rounded bg-background px-2 py-1 text-xs text-destructive shadow-sm hover:bg-background'
        onMouseDown={(event) => event.preventDefault()}
        onClick={remove}
        variant='ghost'
      >
        {deleteLabel}
      </Button>
      <Button
        type='button'
        aria-label={label}
        title={label}
        className='pointer-events-auto absolute -right-2 -bottom-2 h-4 w-4 touch-none cursor-nwse-resize rounded-sm border-2 border-background bg-primary p-0 shadow-sm hover:bg-primary focus-visible:outline-2 focus-visible:outline-ring'
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          sessionRef.current = {
            x: event.clientX,
            y: event.clientY,
            width: box.width,
            height: box.height,
            originalWidth: selected.getAttribute('width'),
            originalHeight: selected.getAttribute('height'),
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const current = sessionRef.current;
          if (!current) return;
          const dx = event.clientX - current.x;
          const dy = event.clientY - current.y;
          const ratio = current.width / current.height;
          resize(
            current.width +
              (Math.abs(dx) >= Math.abs(dy * ratio) ? dx : dy * ratio),
            ratio,
          );
        }}
        onPointerUp={(event) => {
          if (!sessionRef.current) return;
          sessionRef.current = undefined;
          event.currentTarget.releasePointerCapture(event.pointerId);
          onCommit();
        }}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={(event) => {
          if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            remove();
            return;
          }
          if (event.key === 'Escape') {
            cancel();
            setSelected(undefined);
            editorRef.current?.focus();
            return;
          }
          if (
            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
              event.key,
            )
          )
            return;
          event.preventDefault();
          resize(
            box.width +
              (['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1) *
                (event.shiftKey ? 10 : 1),
            box.width / box.height,
          );
          onCommit();
        }}
        variant='ghost'
      />
    </div>
  );
}

function imageBox(image: HTMLImageElement, editor: HTMLElement): ImageBox {
  const rect = image.getBoundingClientRect();
  const parent = editor.parentElement!.getBoundingClientRect();
  return {
    left: rect.left - parent.left,
    top: rect.top - parent.top,
    width: rect.width,
    height: rect.height,
  };
}

function restoreSize(
  image: HTMLImageElement,
  session: ResizeSession | undefined,
): void {
  if (!session) return;
  for (const [name, value] of [
    ['width', session.originalWidth],
    ['height', session.originalHeight],
  ] as const) {
    if (value === null) image.removeAttribute(name);
    else image.setAttribute(name, value);
  }
}
