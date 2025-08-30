/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import DOMPurify from 'dompurify';

export class ElementProxy {
  private __el: HTMLElement;

  constructor(element) {
    this.__el = element;

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // 如果 ElementProxy 本身定义了属性（如 getter 方法），则优先用它
        if (prop in target) {
          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(receiver) : value;
        }

        // 否则透传给原始 HTMLElement
        const elValue = target.__el[prop];
        return typeof elValue === 'function' ? elValue.bind(target.__el) : elValue;
      },

      set: (target, prop, value, receiver) => {
        // 如果 ElementProxy 本身定义了 setter 方法，则使用它
        const descriptor = Object.getOwnPropertyDescriptor(ElementProxy.prototype, prop);
        if (descriptor && typeof descriptor.set === 'function') {
          descriptor.set.call(receiver, value);
          return true;
        }

        // 否则透传设置
        target.__el[prop] = value;
        return true;
      },
    });
  }

  // ✅ 自定义 getter/setter
  get innerHTML() {
    return this.__el.innerHTML;
  }

  set innerHTML(value) {
    this.__el.innerHTML = DOMPurify.sanitize(value);
  }

  get outerHTML() {
    return this.__el.outerHTML;
  }

  set outerHTML(value) {
    this.__el.outerHTML = DOMPurify.sanitize(value);
  }

  // ✅ 示例：封装方法（可选）
  safeAppend(child) {
    if (child instanceof HTMLElement || typeof child === 'string') {
      this.__el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
  }
}
