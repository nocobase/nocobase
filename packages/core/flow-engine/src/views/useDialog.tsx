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
import { FlowContext } from '../flowContext';
import { FlowViewContextProvider } from '../FlowContextProvider';
import { registerPopupVariable } from './createViewMeta';
import DialogComponent from './DialogComponent';
import usePatchElement from './usePatchElement';
import { VIEW_ACTIVATED_EVENT, bumpViewActivatedVersion, resolveOpenerEngine } from './viewEvents';
import { FlowEngineProvider } from '../provider';
import { createViewScopedEngine } from '../ViewScopedFlowEngine';
import { createViewRecordResolveOnServer, getViewRecordFromParent } from '../utils/variablesParams';
import { runViewBeforeClose } from './runViewBeforeClose';

let uuid = 0;

export function useDialog() {
  const holderRef = React.useRef(null);

  const open = (config, flowContext) => {
    const parentEngine = flowContext?.engine;
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
    const FooterComponent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
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
    const HeaderComponent: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> = (props) => {
      React.useEffect(() => {
        currentHeader = props;
        dialogRef.current?.setHeader(props);

        return () => {
          currentHeader = null;
          dialogRef.current?.setHeader(null);
        };
      }, [props]);

      return null; // Header 组件本身不渲染内容
    };

    const ctx = new FlowContext();
    // 为当前视图创建作用域引擎（隔离实例与缓存）
    const scopedEngine = createViewScopedEngine(flowContext.engine);
    const openerEngine = resolveOpenerEngine(parentEngine, scopedEngine);

    ctx.defineProperty('engine', { value: scopedEngine });
    ctx.addDelegate(scopedEngine.context);
    if (config.inheritContext !== false) {
      ctx.addDelegate(flowContext);
    } else {
      ctx.addDelegate(flowContext.engine.context);
    }

    // 幂等保护：防止 FlowPage 路由清理时二次调用 destroy
    let destroyed = false;

    // 构造 currentDialog 实例
    const currentDialog = {
      type: 'dialog' as const,
      inputArgs: config.inputArgs || {},
      preventClose: !!config.preventClose,
      beforeClose: undefined,
      destroy: (result?: any) => {
        if (destroyed) return;
        destroyed = true;
        config.onClose?.();
        dialogRef.current?.destroy();
        closeFunc?.();
        resolvePromise?.(result);
        // Notify opener view that it becomes active again.
        const openerEmitter = openerEngine?.emitter;
        bumpViewActivatedVersion(openerEmitter);
        openerEmitter?.emit?.(VIEW_ACTIVATED_EVENT, { type: 'dialog', viewUid: currentDialog?.inputArgs?.viewUid });
        // 关闭时修正 previous/next 指针
        scopedEngine.unlinkFromStack();
      },
      update: (newConfig) => dialogRef.current?.update(newConfig),
      close: async (result?: any, force?: boolean) => {
        if (config.preventClose && !force) {
          return false;
        }

        const shouldClose = await runViewBeforeClose(currentDialog, { result, force });
        if (!shouldClose) {
          return false;
        }

        if (config.triggerByRouter && config.inputArgs?.navigation?.back) {
          // 交由路由系统来销毁当前视图
          config.inputArgs.navigation.back();
          return true;
        }

        currentDialog.destroy(result);
        return true;
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
      get record() {
        return getViewRecordFromParent(flowContext, ctx);
      },
    };

    ctx.defineProperty('view', {
      get: () => currentDialog,
      resolveOnServer: createViewRecordResolveOnServer(ctx, () => getViewRecordFromParent(flowContext, ctx)),
    });
    // 注册视图销毁回调，供外部（如 afterSuccess）通过引擎栈遍历来关闭多层弹窗。
    // 对路由触发的弹窗：先 navigation.back() 清理 URL（replace 方式），再 destroy() 立即移除元素；
    // 对非路由弹窗：直接 destroy()。destroy() 已做幂等保护，FlowPage 后续清理不会重复执行。
    scopedEngine.setDestroyView(() => {
      if (config.triggerByRouter && config.inputArgs?.navigation?.back) {
        config.inputArgs.navigation.back();
      }
      currentDialog.destroy();
    });
    // 顶层 popup 变量：弹窗记录/数据源/上级弹窗链（去重封装）
    registerPopupVariable(ctx, currentDialog);
    // 内部组件，在 Provider 内部计算 content
    const DialogWithContext = observer(
      () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const mountedRef = React.useRef(false);
        const rawContent = typeof config.content === 'function' ? config.content(currentDialog, ctx) : config.content;
        const content =
          typeof rawContent === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawContent) }} />
          ) : (
            rawContent
          );

        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
          config.onOpen?.(currentDialog, ctx);
        }, []);

        if (config.inputArgs?.hidden?.value && !mountedRef.current) {
          return null;
        }

        mountedRef.current = true;

        return (
          <DialogComponent
            className="nb-dialog-overflow-hidden"
            ref={dialogRef}
            hidden={config.inputArgs?.hidden?.value}
            footer={currentFooter}
            header={currentHeader}
            {...config}
            onCancel={() => {
              currentDialog.close(config.result);
            }}
          >
            {content}
          </DialogComponent>
        );
      },
      {
        displayName: 'DialogWithContext',
      },
    );

    const key = config?.inputArgs?.viewUid || `page-${uuid}`;
    const dialog = (
      <FlowEngineProvider key={key} engine={scopedEngine}>
        <FlowViewContextProvider context={ctx}>
          <DialogWithContext />
        </FlowViewContextProvider>
      </FlowEngineProvider>
    );

    closeFunc = holderRef.current?.patchElement(dialog);
    return Object.assign(promise, currentDialog);
  };

  const api = React.useMemo(() => ({ open }), []);
  const ElementsHolder = React.memo(
    React.forwardRef((props, ref) => {
      const [elements, patchElement] = usePatchElement();
      React.useImperativeHandle(ref, () => ({ patchElement }), [patchElement]);
      return <>{elements}</>;
    }),
  );

  return [api, <ElementsHolder key="dialog-holder" ref={holderRef} />];
}
