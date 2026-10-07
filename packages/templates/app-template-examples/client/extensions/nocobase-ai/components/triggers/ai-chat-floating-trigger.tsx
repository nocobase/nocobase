import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { NocoBaseAIChatIcon } from '../../shared/icons/nocobase-ai-chat-icon.js';
import { cn } from 'cn';
import {
  useAIChatControllerState,
  useGlobalAIChatController,
} from '../../providers/index.js';
import type { AIChatController } from '../../providers/index.js';

export type AIChatFloatingTriggerProps = {
  aiEmployee?: string;
  controller?: AIChatController;
  unreadCount?: number;
  position?: 'fixed' | 'absolute';
  hideWhenOpen?: boolean;
  className?: string;
};

const DRAG_THRESHOLD = 4;
const VIEWPORT_MARGIN = 12;

type VerticalDragSession = {
  pointerId: number;
  startClientY: number;
  startTop: number;
  minTop: number;
  maxTop: number;
  moved: boolean;
};

function clampFloatingTriggerTop(top: number, minTop: number, maxTop: number) {
  return Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));
}

function getVerticalDragBounds(
  element: HTMLElement,
  position: 'fixed' | 'absolute',
) {
  const rect = element.getBoundingClientRect();

  if (position === 'absolute' && element.offsetParent instanceof HTMLElement) {
    const parentRect = element.offsetParent.getBoundingClientRect();
    return {
      startTop: rect.top - parentRect.top,
      minTop: VIEWPORT_MARGIN,
      maxTop: parentRect.height - rect.height - VIEWPORT_MARGIN,
    };
  }

  return {
    startTop: rect.top,
    minTop: VIEWPORT_MARGIN,
    maxTop: window.innerHeight - rect.height - VIEWPORT_MARGIN,
  };
}

export function AIChatFloatingTrigger({
  aiEmployee,
  controller: providedController,
  unreadCount = 0,
  position = 'fixed',
  hideWhenOpen = true,
  className,
}: AIChatFloatingTriggerProps) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const globalController = useGlobalAIChatController();
  const controller = providedController ?? globalController;
  const { open } = useAIChatControllerState(controller);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dragSessionRef = useRef<VerticalDragSession | null>(null);
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const keepInsideBounds = () => {
      const element = triggerRef.current;
      if (!element) return;
      setTop((currentTop) => {
        if (currentTop === null) return null;
        const bounds = getVerticalDragBounds(element, position);
        return clampFloatingTriggerTop(
          currentTop,
          bounds.minTop,
          bounds.maxTop,
        );
      });
    };

    window.addEventListener('resize', keepInsideBounds);
    return () => window.removeEventListener('resize', keepInsideBounds);
  }, [position]);

  if (hideWhenOpen && open) return null;

  // Without an explicit employee the chat it opens decides, from its own
  // `defaultEmployee`, so that is set in one place.
  const openChat = () => {
    controller.triggerTask(
      aiEmployee ? { aiEmployee, open: true } : { open: true },
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const bounds = getVerticalDragBounds(event.currentTarget, position);
    dragSessionRef.current = {
      pointerId: event.pointerId,
      startClientY: event.clientY,
      startTop: bounds.startTop,
      minTop: bounds.minTop,
      maxTop: bounds.maxTop,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const deltaY = event.clientY - session.startClientY;
    if (!session.moved && Math.abs(deltaY) < DRAG_THRESHOLD) return;

    session.moved = true;
    event.preventDefault();
    setTop(
      clampFloatingTriggerTop(
        session.startTop + deltaY,
        session.minTop,
        session.maxTop,
      ),
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    dragSessionRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    dragSessionRef.current = null;
  };

  return (
    <div
      ref={triggerRef}
      data-slot='ai-chat-drag-handle'
      className={cn(
        'group/ai-floating z-[60] flex touch-none cursor-grab items-center rounded-l-full border bg-background py-2.5 pr-5 pl-3 shadow-lg transition-[transform,opacity,box-shadow] duration-300 hover:translate-x-0 hover:opacity-100 hover:shadow-xl active:cursor-grabbing',
        position === 'fixed'
          ? cn('fixed right-0', top === null && 'bottom-10')
          : cn('absolute right-0', top === null && 'bottom-8'),
        'translate-x-2 opacity-80',
        className,
      )}
      style={top === null ? undefined : { top }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <button
        type='button'
        aria-label={t('surface.openChat', 'Open AI chat')}
        className='relative flex size-[42px] touch-auto cursor-pointer items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
        onPointerDown={(event) => event.stopPropagation()}
        onClick={openChat}
      >
        <span className='flex size-full items-center justify-center overflow-hidden rounded-lg'>
          <NocoBaseAIChatIcon
            className='size-full object-contain'
            aria-hidden='true'
          />
        </span>
        {unreadCount > 0 ? (
          <span className='absolute -top-1.5 -right-1.5 z-10 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-background'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
