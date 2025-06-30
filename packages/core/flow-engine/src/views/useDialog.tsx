/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as React from 'react';
import DialogComponent from './DialogComponent';
import usePatchElement from './usePatchElement';

let uuid = 0;

export function useDialog() {
  const holderRef = React.useRef(null);

  const open = (config) => {
    uuid += 1;
    const dialogRef = React.createRef<{ destroy: () => void; update: (config: any) => void }>();

    // eslint-disable-next-line prefer-const
    let closeFunc: (() => void) | undefined;
    let resolvePromise: (value?: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    // 构造 currentDialog 实例
    const currentDialog = {
      destroy: () => dialogRef.current?.destroy(),
      update: (newConfig) => dialogRef.current?.update(newConfig),
      close: (result?: any) => {
        resolvePromise?.(result);
        dialogRef.current?.destroy();
      },
    };

    // 支持 content 为函数，传递 currentDialog
    const content = typeof config.content === 'function' ? config.content(currentDialog) : config.content;

    const dialog = (
      <DialogComponent
        key={`dialog-${uuid}`}
        ref={dialogRef}
        {...config}
        afterClose={() => {
          closeFunc?.();
          config.onClose?.();
          resolvePromise?.(config.result);
        }}
      >
        {content}
      </DialogComponent>
    );
    closeFunc = holderRef.current?.patchElement(dialog);

    return Object.assign(promise, currentDialog);
  };

  const api = React.useMemo(() => ({ open }), []);
  const ElementsHolder = React.memo(
    React.forwardRef((props, ref) => {
      const [elements, patchElement] = usePatchElement();
      React.useImperativeHandle(ref, () => ({ patchElement }), []);
      return <>{elements}</>;
    }),
  );

  return [api, <ElementsHolder key="dialog-holder" ref={holderRef} />];
}
