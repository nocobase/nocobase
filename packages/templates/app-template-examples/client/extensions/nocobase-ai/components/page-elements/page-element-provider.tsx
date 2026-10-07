import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import { cn } from '../../shared/utils.js';
import { MousePointer2, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AIPageContextResolverProvider,
  type AIWorkContextItem,
} from '../../providers/index.js';
import {
  AIPageContextResolutionError,
  AIPageElementContext,
  findRegisteredElement,
  PAGE_ELEMENT_ATTRIBUTE,
  type AIPageContextFailurePolicy,
  type AIPageElementContextValue,
  type AIPageElementPickerOptions,
  type PickerRequest,
  type RegisteredPageElement,
} from './page-element-store.js';

export type AIPageElementProviderProps = PropsWithChildren<{
  contextFailurePolicy?: AIPageContextFailurePolicy;
}>;

type HoveredPageElement = {
  runtimeId: string;
  title: string;
  rect: DOMRect;
};

export function AIPageElementProvider({
  children,
  contextFailurePolicy = 'throw',
}: AIPageElementProviderProps) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const registryRef = useRef(new Map<string, RegisteredPageElement>());
  const [registeredCount, setRegisteredCount] = useState(0);
  const [request, setRequest] = useState<PickerRequest>();
  const [hovered, setHovered] = useState<HoveredPageElement>();
  const picking = Boolean(request);
  const requestRef = useRef(request);
  // The picking handlers assign this themselves before each `setRequest`; the
  // effect only keeps it correct if a request ever changes by another path.
  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  const register = useCallback<AIPageElementContextValue['register']>(
    (runtimeId, element, getDescriptor) => {
      const contextId = getDescriptor().id ?? runtimeId;
      const duplicate = [...registryRef.current.entries()].find(
        ([registeredRuntimeId, entry]) =>
          registeredRuntimeId !== runtimeId &&
          (entry.getDescriptor().id ?? registeredRuntimeId) === contextId,
      );
      if (duplicate) {
        throw new Error(
          `AI page context id "${contextId}" is already registered`,
        );
      }
      element.setAttribute(PAGE_ELEMENT_ATTRIBUTE, runtimeId);
      registryRef.current.set(runtimeId, { element, getDescriptor });
      setRegisteredCount(registryRef.current.size);
      return () => {
        if (element.getAttribute(PAGE_ELEMENT_ATTRIBUTE) === runtimeId) {
          element.removeAttribute(PAGE_ELEMENT_ATTRIBUTE);
        }
        if (registryRef.current.get(runtimeId)?.element === element) {
          registryRef.current.delete(runtimeId);
        }
        setHovered((current) =>
          current?.runtimeId === runtimeId ? undefined : current,
        );
        setRegisteredCount(registryRef.current.size);
      };
    },
    [],
  );

  const cancelPicking = useCallback(() => {
    const current = requestRef.current;
    requestRef.current = undefined;
    setRequest(undefined);
    setHovered(undefined);
    current?.onCancel?.();
  }, []);

  const startPicking = useCallback((options: AIPageElementPickerOptions) => {
    const current = requestRef.current;
    const nextRequest: PickerRequest = {
      ...options,
      token: Symbol('page-element-picker'),
      resolving: false,
    };
    requestRef.current = nextRequest;
    setRequest(nextRequest);
    setHovered(undefined);
    current?.onCancel?.();
  }, []);

  const resolvePageContext = useCallback(
    async (items: AIWorkContextItem[]) => {
      const resolved = await Promise.allSettled(
        items.map(async (item) => {
          if (item.type !== 'page-element') return item;
          const registeredEntry = [...registryRef.current.entries()].find(
            ([runtimeId, entry]) =>
              (entry.getDescriptor().id ?? runtimeId) === item.id,
          );
          if (!registeredEntry) {
            if (item.content !== undefined) return item;
            throw new Error(
              `Page context "${item.title ?? item.id ?? 'unknown'}" is not mounted`,
            );
          }
          const [runtimeId, entry] = registeredEntry;
          const descriptor = entry.getDescriptor();
          const contextId = item.id ?? descriptor.id ?? runtimeId;
          const frontendTools = descriptor.frontendTools ?? [];
          return {
            ...item,
            id: contextId,
            title: item.title ?? descriptor.title,
            kind: item.kind ?? descriptor.kind,
            content: await descriptor.getContext(),
            ...(frontendTools.length ? { uid: contextId, frontendTools } : {}),
          } satisfies AIWorkContextItem;
        }),
      );
      const failures = resolved.flatMap((result, index) =>
        result.status === 'rejected'
          ? [{ item: items[index], reason: result.reason as unknown }]
          : [],
      );
      if (failures.length && contextFailurePolicy === 'throw') {
        const labels = failures.map(({ item, reason }) => {
          const label = item.title ?? item.id ?? 'unknown page context';
          return reason instanceof Error
            ? `${label} (${reason.message})`
            : label;
        });
        throw new AIPageContextResolutionError(
          `Unable to read page context: ${labels.join(', ')}`,
          failures,
        );
      }
      return resolved.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
    },
    [contextFailurePolicy],
  );

  useEffect(() => {
    if (!picking) return;

    const updateHoveredElement = (event: PointerEvent) => {
      const match = findRegisteredElement(event.target, registryRef.current);
      setHovered(
        match
          ? {
              runtimeId: match.runtimeId,
              title: match.registered.getDescriptor().title,
              rect: match.registered.element.getBoundingClientRect(),
            }
          : undefined,
      );
    };
    const clearHoveredElement = () => {
      setHovered(undefined);
    };
    const updateHoveredRect = () => {
      setHovered((current) => {
        if (!current) return current;
        const element = registryRef.current.get(current.runtimeId)?.element;
        return element
          ? { ...current, rect: element.getBoundingClientRect() }
          : undefined;
      });
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelPicking();
    };
    const resolveClick = async (event: MouseEvent) => {
      const match = findRegisteredElement(event.target, registryRef.current);
      const currentRequest = requestRef.current;
      if (!match || !currentRequest || currentRequest.resolving) return;
      event.preventDefault();
      event.stopPropagation();
      const descriptor = match.registered.getDescriptor();
      const resolvingRequest = {
        ...currentRequest,
        resolving: true,
        error: undefined,
      };
      requestRef.current = resolvingRequest;
      setRequest(resolvingRequest);
      try {
        const content = await descriptor.getContext();
        if (requestRef.current?.token !== currentRequest.token) return;
        const contextId = descriptor.id ?? match.runtimeId;
        const frontendTools = descriptor.frontendTools ?? [];
        currentRequest.onSelect({
          type: 'page-element',
          id: contextId,
          title: descriptor.title,
          kind: descriptor.kind,
          content,
          ...(frontendTools.length ? { uid: contextId, frontendTools } : {}),
        });
        requestRef.current = undefined;
        setRequest(undefined);
        clearHoveredElement();
      } catch (error) {
        if (requestRef.current?.token !== currentRequest.token) return;
        const failedRequest = {
          ...currentRequest,
          resolving: false,
          error:
            error instanceof Error
              ? error.message
              : t('pageElement.readError', 'Unable to read this page element'),
        };
        requestRef.current = failedRequest;
        setRequest(failedRequest);
      }
    };
    const handleClick = (event: MouseEvent) => {
      const resolvePromise = resolveClick(event);
      resolvePromise.catch(() => undefined);
    };

    document.addEventListener('pointermove', updateHoveredElement, true);
    document.addEventListener('pointerleave', clearHoveredElement, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', updateHoveredRect, true);
    window.addEventListener('resize', updateHoveredRect);
    return () => {
      document.removeEventListener('pointermove', updateHoveredElement, true);
      document.removeEventListener('pointerleave', clearHoveredElement, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', updateHoveredRect, true);
      window.removeEventListener('resize', updateHoveredRect);
    };
  }, [cancelPicking, picking, t]);

  const value = useMemo<AIPageElementContextValue>(
    () => ({
      picking,
      registeredCount,
      register,
      startPicking,
      cancelPicking,
    }),
    [cancelPicking, picking, register, registeredCount, startPicking],
  );

  return (
    <AIPageContextResolverProvider resolve={resolvePageContext}>
      <AIPageElementContext.Provider value={value}>
        {children}
        {request && typeof document !== 'undefined'
          ? createPortal(
              <>
                {hovered ? (
                  <div
                    className='pointer-events-none fixed z-[2000] rounded-lg border-2 border-foreground bg-foreground/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.08)]'
                    style={{
                      left: hovered.rect.left,
                      top: hovered.rect.top,
                      width: hovered.rect.width,
                      height: hovered.rect.height,
                    }}
                  >
                    <div className='absolute -top-7 left-0 max-w-[min(320px,80vw)] truncate rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-sm'>
                      {hovered.title}
                    </div>
                  </div>
                ) : null}
                <div className='fixed bottom-6 left-1/2 z-[2001] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border bg-background px-3 py-2 shadow-xl'>
                  <MousePointer2
                    className={cn(
                      'size-4 shrink-0',
                      request.resolving && 'animate-pulse',
                    )}
                  />
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-medium'>
                      {request.resolving
                        ? t('pageElement.reading', 'Reading page element…')
                        : t('pageElement.pick', 'Pick a page element')}
                    </div>
                    <div
                      className={cn(
                        'truncate text-xs text-muted-foreground',
                        request.error && 'text-destructive',
                      )}
                    >
                      {request.error ??
                        t(
                          'pageElement.hint',
                          'Hover a highlighted element, then click to add it.',
                        )}
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t(
                      'pageElement.cancelPicking',
                      'Cancel picking page element',
                    )}
                    disabled={request.resolving}
                    onClick={cancelPicking}
                  >
                    <X />
                  </Button>
                </div>
              </>,
              document.body,
            )
          : null}
      </AIPageElementContext.Provider>
    </AIPageContextResolverProvider>
  );
}
