/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngineContext } from '../flowContext';

interface ViewParam {
  /** 视图唯一标识符，一般为某个 Model 实例的 uid */
  viewUid?: string;
  /** 标签页唯一标识符 */
  tabUid?: string;
  /** 弹窗记录的 id */
  filterByTk?: string;
  /** source Id */
  sourceId?: string;
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
    if (viewParam.filterByTk) {
      segments.push('filterbytk', viewParam.filterByTk);
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

    // 4. 如果新的 pathname 与当前 ctx.route.pathname 相同，则直接 return，避免重复跳转
    if (newPathname === this.ctx.route.pathname) {
      return;
    }

    // 5. 如果新的 pathname 与当前 ctx.route.pathname 不同，则触发一次跳转。使用 push 的方式
    this.ctx.router.navigate(newPathname, opts);

    // 6. 当 viewStack 为空时，把当前参数 push 到 viewStack 中
    if (this.viewStack.length === 0) {
      this.viewStack.push(viewParam);
    }
  }

  back() {
    this.ctx.router.navigate(-1);
  }
}
