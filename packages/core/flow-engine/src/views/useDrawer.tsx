/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as React from 'react';
import { FlowContext, FlowEngineContext } from '../flowContext';
import { FlowViewContextProvider } from '../FlowContextProvider';
import DrawerComponent from './DrawerComponent';
import usePatchElement from './usePatchElement';

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
    const FooterComponent = ({ children, ...props }) => {
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
    const HeaderComponent = ({ ...props }) => {
      React.useEffect(() => {
        currentHeader = props;
        drawerRef.current?.setHeader(props as any);

        return () => {
          currentHeader = null;
          drawerRef.current?.setHeader(null);
        };
      }, [props]);

      return null; // Header 组件本身不渲染内容
    };

    // 构造 currentDrawer 实例
    const currentDrawer = {
      type: 'drawer',
      inputArgs: config.inputArgs || {},
      destroy: () => drawerRef.current?.destroy(),
      update: (newConfig) => drawerRef.current?.update(newConfig),
      close: (result?: any) => {
        if (config.preventClose) {
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
    ctx.defineProperty('view', {
      get: () => currentDrawer,
    });
    if (config.inheritContext !== false) {
      ctx.addDelegate(flowContext);
    }

    // 内部组件，在 Provider 内部计算 content
    const DrawerWithContext: React.FC = (props) => {
      const content = typeof config.content === 'function' ? config.content(currentDrawer, ctx) : config.content;

      return (
        <DrawerComponent
          ref={drawerRef}
          {...config}
          footer={currentFooter}
          header={currentHeader}
          afterClose={() => {
            closeFunc?.();
            config.onClose?.();
            resolvePromise?.(config.result);
          }}
        >
          {content}
          {props.children}
        </DrawerComponent>
      );
    };

    const renderDrawer = (children: any) => (
      <FlowViewContextProvider context={ctx}>
        <DrawerWithContext>{children}</DrawerWithContext>
      </FlowViewContextProvider>
    );

    closeFunc = holderRef.current?.patchElement(renderDrawer);
    return Object.assign(promise, currentDrawer);
  };

  const api = React.useMemo(() => ({ open }), []);
  const ElementsHolder = React.memo(
    React.forwardRef((props, ref) => {
      const [elements, patchElement] = usePatchElement<(children: any) => React.ReactElement>();
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
