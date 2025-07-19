/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as React from 'react';
import DrawerComponent from './DrawerComponent';
import usePatchElement from './usePatchElement';

let uuid = 0;

export function useDrawer() {
  const holderRef = React.useRef(null);

  const open = (config) => {
    uuid += 1;
    const drawerRef = React.createRef<{ destroy: () => void; update: (config: any) => void }>();

    // eslint-disable-next-line prefer-const
    let closeFunc: (() => void) | undefined;
    let resolvePromise: (value?: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    // 构造 currentDrawer 实例
    const currentDrawer = {
      destroy: () => drawerRef.current?.destroy(),
      update: (newConfig) => drawerRef.current?.update(newConfig),
      close: (result?: any) => {
        resolvePromise?.(result);
        drawerRef.current?.destroy();
      },
    };

    // 支持 content 为函数，传递 currentDrawer
    const content = typeof config.content === 'function' ? config.content(currentDrawer) : config.content;

    const drawer = (
      <DrawerComponent
        key={`drawer-${uuid}`}
        ref={drawerRef}
        {...config}
        afterClose={() => {
          closeFunc?.();
          config.onClose?.();
          resolvePromise?.(config.result);
        }}
      >
        {content}
      </DrawerComponent>
    );
    closeFunc = holderRef.current?.patchElement(drawer);

    return Object.assign(promise, currentDrawer);
  };

  const api = React.useMemo(() => ({ open }), []);
  const ElementsHolder = React.memo(
    React.forwardRef((props, ref) => {
      const [elements, patchElement] = usePatchElement();
      React.useImperativeHandle(ref, () => ({ patchElement }), []);
      return <>{elements}</>;
    }),
  );

  return [api, <ElementsHolder key="drawer-holder" ref={holderRef} />];
}
