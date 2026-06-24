/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createOpenViewRouteState, type OpenViewRouteState } from './openViewRouteState';

export interface ViewParam {
  /** 视图唯一标识符，一般为某个 Model 实例的 uid */
  viewUid: string;
  /** 标签页唯一标识符 */
  tabUid?: string;
  /** 弹窗记录的 id */
  filterByTk?: string | Record<string, string | number>;
  /** source Id */
  sourceId?: string;
  /** RunJS ctx.openView runtime display overrides decoded from URL. */
  openViewRouteState?: OpenViewRouteState;
}

export interface ParsePathnameToViewParamsOptions {
  rootPrefix?: string;
  basePath?: string;
}

const normalizePathname = (pathname: string) => {
  if (!pathname || pathname === '/') {
    return '/';
  }
  return `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`;
};

const normalizeBasePath = (basePath: string) => `/${basePath.replace(/^\/+/, '').replace(/\/+$/, '')}`;

const stripBasePath = (pathname: string, basePath: string) => {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedBasePath = normalizeBasePath(basePath);

  if (normalizedPathname === normalizedBasePath) {
    return '';
  }

  if (normalizedPathname.startsWith(`${normalizedBasePath}/`)) {
    return normalizedPathname.slice(normalizedBasePath.length + 1);
  }

  return '';
};

/**
 * 解析路径名为视图参数数组
 *
 * 支持解析包含多个视图的路径，每个视图可以包含 tab、filterByTk、sourceId 等参数
 *
 * @param pathname - 要解析的路径名，格式如 '/admin/xxx/view/xxx/tab/xxx'
 * @returns 视图参数数组，每个元素对应一个视图
 *
 * @example
 * ```typescript
 * parsePathnameToViewParams('/admin/xxx') // [{ viewUid: 'xxx' }]
 * parsePathnameToViewParams('/admin/xxx/tab/yyy') // [{ viewUid: 'xxx', tabUid: 'yyy' }]
 * parsePathnameToViewParams('/admin/xxx/view/yyy') // [{ viewUid: 'xxx' }, { viewUid: 'yyy' }]
 * ```
 */
export const parsePathnameToViewParams = (
  pathname: string,
  options: ParsePathnameToViewParamsOptions = {},
): ViewParam[] => {
  if (!pathname || pathname === '/') {
    return [];
  }

  const rootPrefix = options.rootPrefix || 'admin';
  const relativePath = options.basePath ? stripBasePath(pathname, options.basePath) : '';

  // 移除开头的斜杠并分割路径
  const segments = (options.basePath ? relativePath : pathname).replace(/^\/+/, '').split('/').filter(Boolean);

  if (segments.length < (options.basePath ? 1 : 2)) {
    return [];
  }

  const result: ViewParam[] = [];
  let currentView: ViewParam | null = null;
  let i = 0;

  if (options.basePath) {
    currentView = { viewUid: segments[0] };
    i = 1;
  }

  while (i < segments.length) {
    const segment = segments[i];

    // 处理布局根前缀或 view 关键字
    if (segment === rootPrefix || segment === 'view') {
      // 如果有当前视图，先保存到结果中
      if (currentView) {
        result.push(currentView);
      }

      // 获取视图 UID
      if (i + 1 < segments.length) {
        currentView = { viewUid: segments[i + 1] };
        i += 2; // 跳过 admin/view 和 viewUid
      } else {
        // 没有 viewUid，跳出循环
        break;
      }
    }
    // 处理参数
    else if (currentView) {
      if (i + 1 >= segments.length) {
        i++;
        continue;
      }

      const rawValue = segments[i + 1];
      // 尝试对路径段进行解码
      let decoded: string = rawValue;
      try {
        decoded = decodeURIComponent(rawValue);
      } catch (_) {
        // ignore
      }

      switch (segment) {
        case 'tab':
          // tab/sourceId 仅作为字符串处理
          currentView.tabUid = decoded;
          break;
        case 'filterbytk': {
          // 仅在 filterByTk 分支支持对象/JSON/键值对解析
          const parseKeyValuePairs = (s: string): Record<string, string | number> => {
            const obj: Record<string, string | number> = {};
            s.split('&').forEach((pair) => {
              const [k, v = ''] = pair.split('=');
              if (!k) return;
              try {
                const key = decodeURIComponent(k);
                const val = decodeURIComponent(v);
                obj[key] = val;
              } catch (_) {
                obj[k] = v;
              }
            });
            return obj;
          };

          let parsed: string | Record<string, string | number> = decoded;
          if (decoded && (decoded.startsWith('{') || decoded.startsWith('['))) {
            try {
              const maybe = JSON.parse(decoded);
              if (maybe && typeof maybe === 'object' && !Array.isArray(maybe)) {
                parsed = maybe as Record<string, string | number>;
              } else {
                // 非对象 JSON（如数组/数字）按字符串保留
                parsed = decoded;
              }
            } catch (_) {
              // 解析失败，按字符串保留
              parsed = decoded;
            }
          } else if (decoded && /^[^=&]+=[^=&]*(?:&[^=&]+=[^=&]*)*$/.test(decoded)) {
            // 形如 a=b 或 a=b&c=d 的整体段
            parsed = parseKeyValuePairs(decoded);
          }
          currentView.filterByTk = parsed;
          break;
        }
        case 'sourceid':
          currentView.sourceId = decoded;
          break;
        case 'openviewmode': {
          const routeState = createOpenViewRouteState({
            ...currentView.openViewRouteState,
            mode: decoded,
          });
          if (routeState) {
            currentView.openViewRouteState = routeState;
          }
          break;
        }
        case 'openviewsize': {
          const routeState = createOpenViewRouteState({
            ...currentView.openViewRouteState,
            size: decoded,
          });
          if (routeState) {
            currentView.openViewRouteState = routeState;
          }
          break;
        }
        default:
          // 未知参数，跳过
          break;
      }

      i += 2; // 跳过参数名和参数值
    } else {
      // 无法处理的情况，跳过当前段
      i++;
    }
  }

  // 保存最后一个视图
  if (currentView) {
    result.push(currentView);
  }

  return result;
};
