/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngineContext } from '../flowContext';
import { ViewParam as SharedViewParam } from '../utils';

type ViewParam = Omit<SharedViewParam, 'viewUid'> & { viewUid?: string };

function encodeFilterByTk(val: SharedViewParam['filterByTk']): string {
  if (val === undefined || val === null) return '';
  // 1.x 兼容：对象按 key1=v1&key2=v2 拼接后整体 encodeURIComponent
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const pairs = Object.entries(val).map(([k, v]) => {
      return `${encodeURIComponent(String(k))}=${encodeURIComponent(String(v))}`;
    });
    return encodeURIComponent(pairs.join('&'));
  }
  // 其它情况按原单值编码（字符串）
  return encodeURIComponent(String(val));
}

/**
 * 将 ViewParam 数组转换为 pathname
 *
 * @param viewParams - ViewParam 数组
 * @returns 生成的 pathname
 *
 * @example
 * ```typescript
 * generatePathnameFromViewParams([{ viewUid: 'xxx' }]) // '/admin/xxx'
 * generatePathnameFromViewParams([{ viewUid: 'xxx', tabUid: 'yyy' }]) // '/admin/xxx/tab/yyy'
 * generatePathnameFromViewParams([{ viewUid: 'xxx' }, { viewUid: 'yyy' }]) // '/admin/xxx/view/yyy'
 * ```
 */
export function generatePathnameFromViewParams(viewParams: ViewParam[]): string {
  if (!viewParams || viewParams.length === 0) {
    return '/admin';
  }

  const segments = ['admin'];

  viewParams.forEach((viewParam, index) => {
    // 如果不是第一个视图，添加 'view' 关键字
    if (index > 0) {
      segments.push('view');
    }

    // 添加视图 UID
    segments.push(viewParam.viewUid);

    // 添加参数
    if (viewParam.tabUid) {
      segments.push('tab', viewParam.tabUid);
    }
    if (viewParam.filterByTk != null) {
      const encoded = encodeFilterByTk(viewParam.filterByTk);
      if (encoded) {
        segments.push('filterbytk', encoded);
      }
    }
    if (viewParam.sourceId) {
      segments.push('sourceid', viewParam.sourceId);
    }
  });

  return '/' + segments.join('/');
}

export class ViewNavigation {
  viewStack: ViewParam[];
  ctx: FlowEngineContext;

  constructor(ctx: FlowEngineContext, viewParams: ViewParam[]) {
    this.viewStack = [...viewParams];
    this.ctx = ctx;
  }

  changeTo(viewParam: ViewParam) {
    // 1. 根据传入的参数，改变当前视图的参数。当前视图的参数是 viewStack 中最后一个元素
    if (this.viewStack.length === 0) {
      this.viewStack.push(viewParam);
    } else {
      this.viewStack[this.viewStack.length - 1] = { ...this.viewStack[this.viewStack.length - 1], ...viewParam };
    }

    // 2. 根据 viewStack 生成新的 pathname
    const newPathname = generatePathnameFromViewParams(this.viewStack);

    // 3. 触发一次跳转。使用 replace 的方式
    this.ctx.router.navigate(newPathname, { replace: true });
  }

  navigateTo(viewParam: ViewParam, opts?: { replace?: boolean; state?: any }) {
    // 1. 基于当前 viewStack 生成一个 pathname
    // 2. 将当前传入的参数转为 path string
    const newViewPathname = generatePathnameFromViewParams([...this.viewStack, viewParam]);

    // 3. 与 pathname 拼接成新的 pathname（这里直接使用新生成的 pathname）
    const newPathname = newViewPathname;

    // 4. 判断新的 pathname 是否与当前 location.pathname 的结尾一致。防止出现重复路径
    //    不用 this.ctx.route.pathname 是因为它的值可能不是最新的，会导致判断失误
    if (location.pathname.endsWith(newPathname)) {
      return this.ctx.router.navigate(-1); // 避免点击按钮没反应的问题
    }

    // 5. 如果新的 pathname 与当前 ctx.route.pathname 不同，则触发一次跳转。使用 push 的方式
    this.ctx.router.navigate(newPathname, opts);

    // 6. 当 viewStack 为空时，把当前参数 push 到 viewStack 中
    if (this.viewStack.length === 0) {
      this.viewStack.push(viewParam);
    }
  }

  back() {
    const pathname = generatePathnameFromViewParams(this.viewStack);

    // 防止重复触发返回操作
    if (location.pathname.endsWith(pathname)) {
      this.ctx.router.navigate(-1);
      this.viewStack.pop();
    }
  }
}
