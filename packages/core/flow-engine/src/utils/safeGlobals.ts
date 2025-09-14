/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 统一的安全全局对象代理：window/document
 * - 默认仅允许常用的定时器、console、Math、Date、addEventListener（绑定原 window）
 * - document 仅允许 createElement/querySelector/querySelectorAll
 * - 不允许随意访问未声明的属性，最小权限原则
 */

export function createSafeWindow(extra?: Record<string, any>) {
  const allowedGlobals: Record<string, any> = {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    console,
    Math,
    Date,
    // 事件侦听仅绑定到真实 window，便于少量需要的全局监听
    addEventListener: addEventListener.bind(window),
    ...(extra || {}),
  };

  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop in allowedGlobals) return allowedGlobals[prop];
        throw new Error(`Access to global property "${prop}" is not allowed.`);
      },
    },
  );
}

export function createSafeDocument(extra?: Record<string, any>) {
  const allowed: Record<string, any> = {
    createElement: document.createElement.bind(document),
    querySelector: document.querySelector.bind(document),
    querySelectorAll: document.querySelectorAll.bind(document),
    ...(extra || {}),
  };
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop in allowed) return allowed[prop];
        throw new Error(`Access to document property "${prop}" is not allowed.`);
      },
    },
  );
}
