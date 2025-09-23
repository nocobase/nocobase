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
import { createViewMeta } from './createViewMeta';
import { PageComponent } from './PageComponent';
import usePatchElement from './usePatchElement';
import { FlowEngineProvider } from '../provider';
import { createViewScopedEngine } from '../ViewScopedFlowEngine';

let uuid = 0;

// 稳定的 Holder 组件，避免在父组件重渲染时更换组件类型导致卸载， 否则切换主题时会丢失所有页面内容
const PageElementsHolder = React.memo(
  React.forwardRef((props: any, ref: any) => {
    const [elements, patchElement] = usePatchElement();
    React.useImperativeHandle(ref, () => ({ patchElement }), [patchElement]);
    return <>{elements}</>;
  }),
);

export function usePage() {
  const holderRef = React.useRef(null);

  const open = (config, flowContext) => {
    uuid += 1;
    const pageRef = React.createRef<{
      destroy: () => void;
      update: (config: any) => void;
      setFooter: (footer: React.ReactNode) => void;
      setHeader: (header: { title?: React.ReactNode; extra?: React.ReactNode }) => void;
    }>();

    let closeFunc: (() => void) | undefined;
    let resolvePromise: (value?: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    // Footer 组件实现
    const FooterComponent = ({ children, ...props }) => {
      React.useEffect(() => {
        pageRef.current?.setFooter(children);

        return () => {
          pageRef.current?.setFooter(null);
        };
      }, [children]);

      return null; // Footer 组件本身不渲染内容
    };

    // Header 组件实现
    const HeaderComponent = ({ ...props }) => {
      React.useEffect(() => {
        pageRef.current?.setHeader(props as any);

        return () => {
          pageRef.current?.setHeader(null);
        };
      }, [props]);

      return null; // Header 组件本身不渲染内容
    };

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
        pageRef.current?.destroy();
        closeFunc?.();
      },
      Header: HeaderComponent,
      Footer: FooterComponent,
      setFooter: (footer: React.ReactNode) => {
        pageRef.current?.setFooter(footer);
      },
      setHeader: (header: { title?: React.ReactNode; extra?: React.ReactNode }) => {
        pageRef.current?.setHeader(header);
      },
      navigation: config.inputArgs?.navigation,
    };

    const ctx = new FlowContext();
    ctx.defineProperty('view', {
      get: () => currentPage,
      meta: createViewMeta(ctx, () => currentPage),
      resolveOnServer: (p: string) => p === 'record' || p.startsWith('record.'),
    });
    // build a scoped engine for this view; isolate model instances & cache by default
    const scopedEngine = createViewScopedEngine(flowContext.engine);
    ctx.defineProperty('engine', { value: scopedEngine });
    ctx.addDelegate(scopedEngine.context);
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
        // 响应themeToken的响应式更新
        void ctx.themeToken;
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
      <FlowEngineProvider engine={scopedEngine}>
        <FlowViewContextProvider context={ctx}>
          <PageWithContext />
        </FlowViewContextProvider>
      </FlowEngineProvider>
    );

    if (target && target instanceof HTMLElement) {
      closeFunc = holderRef.current?.patchElement(ReactDOM.createPortal(page, target));
    } else {
      closeFunc = holderRef.current?.patchElement(page);
    }

    return Object.assign(promise, currentPage);
  };

  const api = React.useMemo(() => ({ open }), []);

  return [api, <PageElementsHolder key="page-holder" ref={holderRef} />];
}
