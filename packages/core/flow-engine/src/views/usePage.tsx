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
import { registerPopupVariable } from './createViewMeta';
import { PageComponent } from './PageComponent';
import usePatchElement from './usePatchElement';
import { FlowEngineProvider } from '../provider';
import { createViewScopedEngine } from '../ViewScopedFlowEngine';
import { createViewRecordResolveOnServer, getViewRecordFromParent } from '../utils/variablesParams';

let uuid = 0;

// 稳定的 Holder 组件，避免在父组件重渲染时更换组件类型导致卸载， 否则切换主题时会丢失所有页面内容
const PageElementsHolder = React.memo(
  React.forwardRef((props: any, ref: any) => {
    const [elements, patchElement] = usePatchElement();
    React.useImperativeHandle(ref, () => ({ patchElement }), [patchElement]);
    console.log('[NocoBase] Rendering PageElementsHolder with elements count:', elements.length);
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
    const FooterComponent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
      React.useEffect(() => {
        pageRef.current?.setFooter(children);

        return () => {
          pageRef.current?.setFooter(null);
        };
      }, [children]);

      return null; // Footer 组件本身不渲染内容
    };

    // Header 组件实现
    const HeaderComponent: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> = (props) => {
      React.useEffect(() => {
        pageRef.current?.setHeader(props);

        return () => {
          pageRef.current?.setHeader(null);
        };
      }, [props]);

      return null; // Header 组件本身不渲染内容
    };

    const { target, content, preventClose, inheritContext = true, inputArgs, ...restConfig } = config;

    const ctx = new FlowContext();
    // 为当前视图创建作用域引擎（隔离实例与缓存）
    const scopedEngine = createViewScopedEngine(flowContext.engine);
    ctx.defineProperty('engine', { value: scopedEngine });
    ctx.addDelegate(scopedEngine.context);
    if (inheritContext) {
      ctx.addDelegate(flowContext);
    } else {
      ctx.addDelegate(flowContext.engine.context);
    }

    // 构造 currentPage 实例
    const currentPage = {
      type: 'embed' as const,
      inputArgs: config.inputArgs || {},
      preventClose: !!config.preventClose,
      destroy: () => pageRef.current?.destroy(),
      update: (newConfig) => pageRef.current?.update(newConfig),
      close: (result?: any, force?: boolean) => {
        if (preventClose && !force) {
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
      get record() {
        // 当视图正在查看与父 record 同一条记录时，复用父记录深拷贝；否则走服务端解析
        return getViewRecordFromParent(flowContext, ctx);
      },
    };

    ctx.defineProperty('view', {
      get: () => currentPage,
      // meta: createViewMeta(ctx),
      // 仅当访问关联字段或前端无本地记录数据时，才交给服务端解析
      resolveOnServer: createViewRecordResolveOnServer(ctx, () => getViewRecordFromParent(flowContext, ctx)),
    });
    // 顶层 popup 变量：弹窗记录/数据源/上级弹窗链（去重封装）
    registerPopupVariable(ctx, currentPage);

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
              // 关闭时修正 previous/next 指针
              scopedEngine.unlinkFromStack();
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

    const key = inputArgs?.viewUid || `page-${uuid}`;
    const page = (
      <FlowEngineProvider key={key} engine={scopedEngine}>
        <FlowViewContextProvider context={ctx}>
          <PageWithContext />
        </FlowViewContextProvider>
      </FlowEngineProvider>
    );

    if (target && target instanceof HTMLElement) {
      closeFunc = holderRef.current?.patchElement(ReactDOM.createPortal(page, target, key));
    } else {
      closeFunc = holderRef.current?.patchElement(page);
    }

    return Object.assign(promise, currentPage);
  };

  const api = React.useMemo(() => ({ open }), []);

  return [api, <PageElementsHolder key="page-holder" ref={holderRef} />];
}
