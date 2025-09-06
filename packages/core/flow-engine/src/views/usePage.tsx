/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from '..';
import { FlowContext } from '../flowContext';
import { FlowViewContextProvider } from '../FlowContextProvider';
import { PageComponent } from './PageComponent';
import usePatchElement from './usePatchElement';
import { createViewMeta } from './createViewMeta';

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
      preventClose: !!config.preventClose,
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
      meta: createViewMeta(ctx, () => currentPage),
      resolveOnServer: (p: string) => p === 'record' || p.startsWith('record.'),
    });
    if (inheritContext) {
      ctx.addDelegate(flowContext);
    } else {
      ctx.addDelegate(flowContext.engine.context);
    }

    const PageWithContext = observer(
      () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const mountedRef = React.useRef(false);
        // 支持 content 为函数，传递 currentPage
        const pageContent = typeof content === 'function' ? content(currentPage, ctx) : content;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
          config.onOpen?.(currentPage, ctx);
        }, []);

        if (config.inputArgs?.hidden?.value && !mountedRef.current) {
          return null;
        }

        mountedRef.current = true;

        return (
          <PageComponent
            key={`page-${uuid}`}
            ref={pageRef}
            hidden={config.inputArgs?.hidden?.value}
            {...restConfig}
            afterClose={() => {
              closeFunc?.();
              config.onClose?.();
              resolvePromise?.(config.result);
            }}
          >
            {pageContent}
          </PageComponent>
        );
      },
      {
        displayName: 'PageWithContext',
      },
    );

    const page = (
      <FlowViewContextProvider context={ctx}>
        <PageWithContext />
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
