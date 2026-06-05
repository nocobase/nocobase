/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer as originalObserver, IObserverOptions, ReactFC } from '@formily/reactive-react';
import React, { useMemo, useEffect, useRef } from 'react';
import { useFlowContext } from '../FlowContextProvider';
import { reaction } from '@formily/reactive';
import { FlowEngineContext } from '..';

type ObserverComponentProps<P, Options extends IObserverOptions> = Options extends {
  forwardRef: true;
}
  ? P & {
      ref?: 'ref' extends keyof P ? P['ref'] : React.RefAttributes<any>;
    }
  : React.PropsWithoutRef<P>;

export const observer = <P, Options extends IObserverOptions = IObserverOptions>(
  Component: ReactFC<P>,
  options?: Options,
): React.MemoExoticComponent<ReactFC<ObserverComponentProps<P, Options>>> => {
  const ComponentWithDefaultScheduler = React.memo((props: any) => {
    const ctx = useFlowContext();
    const ctxRef = useRef(ctx);
    ctxRef.current = ctx;

    // 保存延迟更新的监听器，避免重复创建监听。
    const pendingDisposerRef = useRef<(() => void) | null>(null);
    // 保存延迟创建监听器的定时器，避免组件卸载后仍继续调度。
    const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * 清理挂起的可见性监听器。
     *
     * @example
     * ```typescript
     * clearPendingDisposer();
     * ```
     */
    const clearPendingDisposer = () => {
      if (pendingDisposerRef.current) {
        pendingDisposerRef.current();
        pendingDisposerRef.current = null;
      }
    };

    /**
     * 清理挂起的定时器。
     *
     * @example
     * ```typescript
     * clearPendingTimer();
     * ```
     */
    const clearPendingTimer = () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
    };

    /**
     * 判断当前页面与标签页是否允许立即更新。
     *
     * @returns 当前上下文是否处于可更新状态。
     * @example
     * ```typescript
     * if (isContextActive()) {
     *   updater();
     * }
     * ```
     */
    const isContextActive = () => {
      const pageActive = getPageActive(ctxRef.current);
      const tabActive = ctxRef.current?.tabActive?.value;

      return pageActive !== false && tabActive !== false;
    };

    // 组件卸载时统一清理所有挂起任务，避免异步回调在卸载后继续运行。
    useEffect(() => {
      return () => {
        if (pendingTimerRef.current) {
          clearTimeout(pendingTimerRef.current);
          pendingTimerRef.current = null;
        }

        if (pendingDisposerRef.current) {
          pendingDisposerRef.current();
          pendingDisposerRef.current = null;
        }
      };
    }, []);

    const ObservedComponent = useMemo(
      () =>
        originalObserver(Component, {
          scheduler(updater) {
            if (!isContextActive()) {
              if (pendingTimerRef.current || pendingDisposerRef.current) {
                return;
              }

              // 通过异步任务打断同步调度，避免连续触发时形成递归更新。
              pendingTimerRef.current = setTimeout(() => {
                pendingTimerRef.current = null;

                if (pendingDisposerRef.current) {
                  return;
                }

                if (isContextActive()) {
                  updater();
                  return;
                }

                // 只监听组合后的“是否可更新”状态，条件恢复后执行一次并立即销毁。
                pendingDisposerRef.current = reaction(
                  () => isContextActive(),
                  (active) => {
                    if (!active) {
                      return;
                    }

                    clearPendingDisposer();
                    updater();
                  },
                  {
                    name: 'FlowObserverPendingUpdate',
                  },
                );
              });
              return;
            }

            clearPendingTimer();
            clearPendingDisposer();

            updater();
          },
          ...options,
        }),
      [],
    );
    return <ObservedComponent {...props} />;
  });

  ComponentWithDefaultScheduler.displayName = `ComponentWithDefaultScheduler`;

  return ComponentWithDefaultScheduler as React.MemoExoticComponent<ReactFC<ObserverComponentProps<P, Options>>>;
};

export function getPageActive(context: FlowEngineContext): boolean | undefined {
  return typeof context?.pageActive?.value === 'boolean'
    ? context?.pageActive?.value
    : context?.view?.inputArgs.pageActive;
}
