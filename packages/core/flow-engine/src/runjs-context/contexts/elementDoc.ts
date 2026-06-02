/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSDocPropertyDoc } from '../../flowContext';

const elementProperties: Record<string, RunJSDocPropertyDoc> = {
  innerHTML: 'Sanitized inner HTML string.',
  outerHTML: 'Sanitized outer HTML string.',
  textContent: 'Text content.',
  style: 'Inline style declaration.',
  classList: 'DOMTokenList for CSS classes.',
  appendChild: {
    type: 'function',
    description: 'Append a DOM node or text.',
    detail: '(child: Node | string) => void',
    completion: { insertText: `ctx.element.appendChild('text')` },
  },
  setAttribute: {
    type: 'function',
    description: 'Set an HTML attribute.',
    detail: '(name: string, value: string) => void',
    completion: { insertText: `ctx.element.setAttribute('data-key', 'value')` },
  },
  getAttribute: {
    type: 'function',
    description: 'Read an HTML attribute.',
    detail: '(name: string) => string | null',
    completion: { insertText: `ctx.element.getAttribute('data-key')` },
  },
  querySelector: {
    type: 'function',
    description: 'Find the first matching descendant.',
    detail: '(selectors: string) => Element | null',
    completion: { insertText: `ctx.element.querySelector('.selector')` },
  },
  querySelectorAll: {
    type: 'function',
    description: 'Find all matching descendants.',
    detail: '(selectors: string) => NodeListOf<Element>',
    completion: { insertText: `ctx.element.querySelectorAll('.selector')` },
  },
  addEventListener: {
    type: 'function',
    description: 'Attach an event listener to the element.',
    detail: '(type: string, listener: EventListener) => void',
    completion: { insertText: `ctx.element.addEventListener('click', (event) => {})` },
  },
  removeEventListener: {
    type: 'function',
    description: 'Remove an event listener from the element.',
    detail: '(type: string, listener: EventListener) => void',
    completion: { insertText: `ctx.element.removeEventListener('click', handler)` },
  },
};

const zhCNElementProperties: Record<string, RunJSDocPropertyDoc> = {
  innerHTML: '已消毒的 innerHTML 字符串。',
  outerHTML: '已消毒的 outerHTML 字符串。',
  textContent: '文本内容。',
  style: '内联样式声明。',
  classList: 'CSS class 列表。',
  appendChild: {
    type: 'function',
    description: '追加 DOM 节点或文本。',
    detail: '(child: Node | string) => void',
    completion: { insertText: `ctx.element.appendChild('text')` },
  },
  setAttribute: {
    type: 'function',
    description: '设置 HTML 属性。',
    detail: '(name: string, value: string) => void',
    completion: { insertText: `ctx.element.setAttribute('data-key', 'value')` },
  },
  getAttribute: {
    type: 'function',
    description: '读取 HTML 属性。',
    detail: '(name: string) => string | null',
    completion: { insertText: `ctx.element.getAttribute('data-key')` },
  },
  querySelector: {
    type: 'function',
    description: '查询第一个匹配的后代元素。',
    detail: '(selectors: string) => Element | null',
    completion: { insertText: `ctx.element.querySelector('.selector')` },
  },
  querySelectorAll: {
    type: 'function',
    description: '查询所有匹配的后代元素。',
    detail: '(selectors: string) => NodeListOf<Element>',
    completion: { insertText: `ctx.element.querySelectorAll('.selector')` },
  },
  addEventListener: {
    type: 'function',
    description: '给元素添加事件监听。',
    detail: '(type: string, listener: EventListener) => void',
    completion: { insertText: `ctx.element.addEventListener('click', (event) => {})` },
  },
  removeEventListener: {
    type: 'function',
    description: '移除元素事件监听。',
    detail: '(type: string, listener: EventListener) => void',
    completion: { insertText: `ctx.element.removeEventListener('click', handler)` },
  },
};

export function createElementPropertyDoc(
  description = 'Current DOM container for this RunJS context. Usually an ElementProxy.',
): RunJSDocPropertyDoc {
  return {
    description,
    detail: 'HTMLElement | ElementProxy',
    properties: elementProperties,
  };
}

export function createZhCNElementPropertyDoc(
  description = '当前 RunJS 上下文的 DOM 容器，通常为 ElementProxy。',
): RunJSDocPropertyDoc {
  return {
    description,
    detail: 'HTMLElement | ElementProxy',
    properties: zhCNElementProperties,
  };
}
