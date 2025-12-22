/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer as originalObserver, IObserverOptions, ReactFC } from '@formily/reactive-react';
import React, { useMemo } from 'react';

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
  const ComponentWithDefaultScheduler = (props: any) => {
    const ObservedComponent = useMemo(() => originalObserver(Component, options), []);
    return <ObservedComponent {...props} />;
  };

  return ComponentWithDefaultScheduler as React.MemoExoticComponent<ReactFC<ObserverComponentProps<P, Options>>>;
};
