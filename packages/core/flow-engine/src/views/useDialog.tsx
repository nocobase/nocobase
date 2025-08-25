/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as React from 'react';
import { FlowContext } from '../flowContext';
import { FlowViewContextProvider } from '../FlowContextProvider';
import DialogComponent from './DialogComponent';
import usePatchElement from './usePatchElement';

let uuid = 0;

export function useDialog() {
  const holderRef = React.useRef(null);

  const open = (config, flowContext) => {
    uuid += 1;
    const dialogRef = React.createRef<{
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
        dialogRef.current?.setFooter(children);

        return () => {
          currentFooter = null;
          dialogRef.current?.setFooter(null);
        };
      }, [children]);

      return null; // Footer 组件本身不渲染内容
    };

    // Header 组件实现
    const HeaderComponent = ({ ...props }) => {
      React.useEffect(() => {
        currentHeader = props;
        dialogRef.current?.setHeader(props as any);

        return () => {
          currentHeader = null;
          dialogRef.current?.setHeader(null);
        };
      }, [props]);

      return null; // Header 组件本身不渲染内容
    };

    // 构造 currentDialog 实例
    const currentDialog = {
      inputArgs: config.inputArgs || {},
      destroy: () => dialogRef.current?.destroy(),
      update: (newConfig) => dialogRef.current?.update(newConfig),
      close: (result?: any) => {
        if (config.preventClose) {
          return;
        }
        resolvePromise?.(result);
        dialogRef.current?.destroy();
      },
      Footer: FooterComponent,
      Header: HeaderComponent,
      setFooter: (footer: React.ReactNode) => {
        currentFooter = footer;
        dialogRef.current?.setFooter(footer);
      },
      setHeader: (header: { title?: React.ReactNode; extra?: React.ReactNode }) => {
        currentHeader = header;
        dialogRef.current?.setHeader(header);
      },
      navigation: config.inputArgs?.navigation,
    };

    const ctx = new FlowContext();
    ctx.defineProperty('view', {
      get: () => currentDialog,
    });
    if (config.inheritContext !== false) {
      ctx.addDelegate(flowContext);
    }

    // 内部组件，在 Provider 内部计算 content
    const DialogWithContext = () => {
      const content = typeof config.content === 'function' ? config.content(currentDialog, ctx) : config.content;

      return (
        <DialogComponent
          key={`dialog-${uuid}`}
          ref={dialogRef}
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
        </DialogComponent>
      );
    };

    const dialog = (
      <FlowViewContextProvider context={ctx}>
        <DialogWithContext />
      </FlowViewContextProvider>
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
