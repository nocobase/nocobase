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
import { autorun } from '@formily/reactive';
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

    // Store the pending disposer to avoid creating multiple listeners
    const pendingDisposerRef = useRef<(() => void) | null>(null);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
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
            const pageActive = getPageActive(ctxRef.current);
            const tabActive = ctxRef.current?.tabActive?.value;

            if (pageActive === false || tabActive === false) {
              // Avoid stack overflow
              setTimeout(() => {
                // If there is already a pending updater, do nothing
                if (pendingDisposerRef.current) {
                  return;
                }

                // Delay the update until the page and tab become active
                const disposer = autorun(() => {
                  if (
                    ctxRef.current?.pageActive?.value &&
                    (ctxRef.current?.tabActive?.value === true || ctxRef.current?.tabActive?.value === undefined)
                  ) {
                    updater();
                    disposer?.();
                    pendingDisposerRef.current = null;
                  }
                });
                pendingDisposerRef.current = disposer;
              });
              return;
            }

            // If we are updating immediately, clear any pending disposer
            if (pendingDisposerRef.current) {
              pendingDisposerRef.current();
              pendingDisposerRef.current = null;
            }

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
