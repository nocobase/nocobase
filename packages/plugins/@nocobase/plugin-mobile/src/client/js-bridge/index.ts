/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

interface InvokeFunction {
  (params: { action: 'scan' }, cb: (data: { url: string }) => void): void;
  (params: { action: 'moveTaskToBack' }, cb?: () => void): void;
}

export const getJsBridge = () =>
  (window as any).JsBridge as {
    invoke: InvokeFunction;
  };

export const invoke: InvokeFunction = (params, cb) => {
  return getJsBridge().invoke(params, cb);
};

export const isJSBridge = () => !!getJsBridge();

/**
 * App 右滑返回
 * @param cb 回调函数，返回 true 表示 web 自己消费，false表示 app 消费
 */
export const JSBridgeFunctions = {
  /**
   * @description JSBridge injects
   */
  onBackPressed: () => {
    if (history.length === 1) {
      invoke({ action: 'moveTaskToBack' });
    } else {
      history.back();
    }
  },
};

Object.keys(JSBridgeFunctions).forEach((key) => {
  window[key] = JSBridgeFunctions[key];
});
