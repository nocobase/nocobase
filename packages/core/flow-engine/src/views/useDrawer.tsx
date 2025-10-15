/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as React from 'react';
import DOMPurify from 'dompurify';
import { observer } from '..';
import { FlowContext, FlowEngineContext } from '../flowContext';
import { FlowViewContextProvider } from '../FlowContextProvider';
import { registerPopupVariable } from './createViewMeta';
import DrawerComponent from './DrawerComponent';
import usePatchElement from './usePatchElement';
import { FlowEngineProvider } from '../provider';
import { createViewScopedEngine } from '../ViewScopedFlowEngine';

let uuid = 0;

export function useDrawer() {
  const holderRef = React.useRef(null);

  const open = (config, flowContext: FlowEngineContext) => {
    uuid += 1;
    const drawerRef = React.createRef<{
      destroy: () => void;
      update: (config: any) => void;
      setFooter: (footer: React.ReactNode) => void;
      setHeader: (header: { title?: React.ReactNode; extra?: React.ReactNode }) => void;
    }>();

    // eslint-disable-next-line prefer-const
    let closeFunc: (() => void) | undefined;
    let resolvePromise: (value?: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    // 使用普通变量来存储状态
    let currentFooter: React.ReactNode = null;
    let currentHeader: any = null;

    // Footer 组件实现
    const FooterComponent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
      React.useEffect(() => {
        currentFooter = children;
        drawerRef.current?.setFooter(children);

        return () => {
          currentFooter = null;
          drawerRef.current?.setFooter(null);
        };
      }, [children]);

      return null; // Footer 组件本身不渲染内容
    };

    // Header 组件实现
    const HeaderComponent: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> = (props) => {
      React.useEffect(() => {
        currentHeader = props;
        drawerRef.current?.setHeader(props);

        return () => {
          currentHeader = null;
          drawerRef.current?.setHeader(null);
        };
      }, [props]);

      return null; // Header 组件本身不渲染内容
    };

    // 构造 currentDrawer 实例
    const currentDrawer = {
      type: 'drawer' as const,
      inputArgs: config.inputArgs || {},
      preventClose: !!config.preventClose,
      destroy: () => drawerRef.current?.destroy(),
      update: (newConfig) => drawerRef.current?.update(newConfig),
      close: (result?: any, force?: boolean) => {
        if (config.preventClose && !force) {
          return;
        }
        drawerRef.current?.destroy();
        closeFunc?.();
        resolvePromise?.(result);
      },
      Footer: FooterComponent,
      Header: HeaderComponent,
      setFooter: (footer: React.ReactNode) => {
        currentFooter = footer;
        drawerRef.current?.setFooter(footer);
      },
      setHeader: (header: { title?: React.ReactNode; extra?: React.ReactNode }) => {
        currentHeader = header;
        drawerRef.current?.setHeader(header);
      },
      navigation: config.inputArgs?.navigation,
    };

    const ctx = new FlowContext();
    // 为当前视图创建作用域引擎（隔离实例与缓存）
    const scopedEngine = createViewScopedEngine(flowContext.engine);
    // 先将引擎暴露给视图上下文，再按需继承父上下文
    ctx.defineProperty('engine', { value: scopedEngine });
    ctx.addDelegate(scopedEngine.context);
    if (config.inheritContext !== false) {
      ctx.addDelegate(flowContext);
    } else {
      ctx.addDelegate(flowContext.engine.context);
    }

    ctx.defineProperty('view', {
      get: () => currentDrawer,
      // meta: createViewMeta(ctx),
      resolveOnServer: (p: string) => p === 'record' || p.startsWith('record.'),
    });
    // 顶层 popup 变量：弹窗记录/数据源/上级弹窗链（去重封装）
    registerPopupVariable(ctx, currentDrawer);

    // 内部组件，在 Provider 内部计算 content
    const DrawerWithContext: React.FC = observer(
      (props) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const mountedRef = React.useRef(false);
        const rawContent = typeof config.content === 'function' ? config.content(currentDrawer, ctx) : config.content;
        const content =
          typeof rawContent === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawContent) }} />
          ) : (
            rawContent
          );

        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
          config.onOpen?.(currentDrawer, ctx);
        }, []);

        if (config.inputArgs?.hidden?.value && !mountedRef.current) {
          return <>{props.children}</>;
        }

        mountedRef.current = true;

        return (
          <DrawerComponent
            ref={drawerRef}
            {...config}
            footer={currentFooter}
            header={currentHeader}
            hidden={config.inputArgs?.hidden?.value}
            afterClose={() => {
              closeFunc?.();
              config.onClose?.();
              resolvePromise?.(config.result);
              // 关闭时修正 previous/next 指针
              scopedEngine.unlinkFromStack();
            }}
          >
            {content}
            {props.children}
          </DrawerComponent>
        );
      },
      {
        displayName: 'DrawerWithContext',
      },
    );

    const renderDrawer = (children: React.ReactNode) => (
      <FlowEngineProvider engine={scopedEngine}>
        <FlowViewContextProvider context={ctx}>
          <DrawerWithContext>{children}</DrawerWithContext>
        </FlowViewContextProvider>
      </FlowEngineProvider>
    );

    closeFunc = holderRef.current?.patchElement(renderDrawer);
    return Object.assign(promise, currentDrawer);
  };

  const api = React.useMemo(() => ({ open }), []);
  const ElementsHolder = React.memo(
    React.forwardRef((props, ref) => {
      const [elements, patchElement] = usePatchElement<(children: React.ReactNode) => React.ReactElement>();
      React.useImperativeHandle(ref, () => ({ patchElement }), [patchElement]);

      // 嵌套渲染：后面的元素是前一个元素的子元素
      const renderNestedElements = () => {
        if (elements.length === 0) {
          return null;
        }

        // 从最后一个元素开始，向前递归渲染
        return elements.reduceRight((children: React.ReactNode, renderElement) => {
          return renderElement(children);
        }, null as React.ReactNode);
      };

      return <>{renderNestedElements()}</>;
    }),
  );

  return [api, <ElementsHolder key="drawer-holder" ref={holderRef} />];
}
