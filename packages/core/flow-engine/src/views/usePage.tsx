/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowContext } from '../flowContext';
import { FlowViewContextProvider } from '../FlowContextProvider';
import { PageComponent } from './PageComponent';
import usePatchElement from './usePatchElement';
import ReactDOM from 'react-dom';

let uuid = 0;

export function usePage() {
  const holderRef = React.useRef(null);

  const open = (config, flowContext) => {
    uuid += 1;
    const pageRef = React.createRef<{ destroy: () => void; update: (config: any) => void }>();

    let closeFunc: (() => void) | undefined;
    let resolvePromise: (value?: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const { target, content, preventClose, inheritContext = true, ...restConfig } = config;

    // 构造 currentPage 实例
    const currentPage = {
      type: 'embed',
      inputArgs: config.inputArgs || {},
      destroy: () => pageRef.current?.destroy(),
      update: (newConfig) => pageRef.current?.update(newConfig),
      close: (result?: any) => {
        if (preventClose) {
          return;
        }
        resolvePromise?.(result);
        closeFunc?.();
      },
      navigation: config.inputArgs?.navigation,
    };

    const ctx = new FlowContext();
    ctx.defineProperty('view', {
      get: () => currentPage,
    });
    if (inheritContext) {
      ctx.addDelegate(flowContext);
    }

    // 支持 content 为函数，传递 currentPage
    const pageContent = typeof content === 'function' ? content(currentPage, ctx) : content;
    config.onOpen?.(currentPage, ctx);

    const page = (
      <FlowViewContextProvider context={ctx}>
        <PageComponent
          key={`page-${uuid}`}
          ref={pageRef}
          {...restConfig}
          afterClose={() => {
            closeFunc?.();
            config.onClose?.();
            resolvePromise?.(config.result);
          }}
        >
          {pageContent}
        </PageComponent>
      </FlowViewContextProvider>
    );

    if (target && target instanceof HTMLElement) {
      closeFunc = holderRef.current?.patchElement(ReactDOM.createPortal(page, target));
    } else {
      closeFunc = holderRef.current?.patchElement(page);
    }

    return Object.assign(promise, currentPage);
  };

  const api = React.useMemo(() => ({ open }), []);
  const ElementsHolder = React.memo(
    React.forwardRef((props, ref) => {
      const [elements, patchElement] = usePatchElement();
      React.useImperativeHandle(ref, () => ({ patchElement }), [patchElement]);
      return <>{elements}</>;
    }),
  );

  return [api, <ElementsHolder key="page-holder" ref={holderRef} />];
}
