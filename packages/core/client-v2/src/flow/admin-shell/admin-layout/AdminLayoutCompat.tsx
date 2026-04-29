/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import _ from 'lodash';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useHref, useNavigate, type NavigateFunction, type NavigateOptions } from 'react-router-dom';
import { isURL } from '@nocobase/utils/client';
import type { NocoBaseDesktopRoute } from '../../../flow-compat';
import type { FlowContext } from '@nocobase/flow-engine';

/**
 * 菜单渲染期需要暴露当前路由，避免继续依赖旧 admin-shell 上下文。
 */
export const NocoBaseRouteContext = createContext<NocoBaseDesktopRoute | null>(null);
NocoBaseRouteContext.displayName = 'NocoBaseRouteContext';

/**
 * 菜单渲染期需要暴露父级路由，避免继续依赖旧 Menu 上下文。
 */
export const ParentRouteContext = createContext<NocoBaseDesktopRoute | null>(null);
ParentRouteContext.displayName = 'ParentRouteContext';

const NavigateNoUpdateContext = createContext<NavigateFunction>(null);
NavigateNoUpdateContext.displayName = 'NavigateNoUpdateContext';

/**
 * 提供一个在 URL 变化时不会重新创建引用的 navigate。
 */
export const NavigateNoUpdateProvider: React.FC = ({ children }) => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const navigateNoUpdate = useCallback((to: string, options?: NavigateOptions) => {
    navigateRef.current(to, options);
  }, []);

  return (
    <NavigateNoUpdateContext.Provider value={navigateNoUpdate as NavigateFunction}>
      {children}
    </NavigateNoUpdateContext.Provider>
  );
};

/**
 * 读取稳定引用的 navigate。
 */
export const useNavigateNoUpdate = () => {
  const contextNavigate = useContext(NavigateNoUpdateContext);
  const navigate = useNavigate();
  return contextNavigate || navigate;
};

/**
 * 读取当前 Router 的 basename。
 */
export const useRouterBasename = () => {
  return useHref('/');
};

/**
 * 将查询参数拼接到 URL。
 */
export function appendQueryStringToUrl(url: string, queryString: string) {
  if (!queryString) {
    return url;
  }

  const hashIndex = url.indexOf('#');
  const hasHash = hashIndex >= 0;
  const path = hasHash ? url.slice(0, hashIndex) : url;
  const hash = hasHash ? url.slice(hashIndex + 1) : '';
  const isHashRoute = hash.startsWith('/') || hash.startsWith('!/');

  if (hasHash && isHashRoute) {
    const hashSeparator = hash.includes('?') ? '&' : '?';
    return `${path}#${hash}${hashSeparator}${queryString}`;
  }

  const separator = path.includes('?') ? '&' : '?';
  return hasHash ? `${path}${separator}${queryString}#${hash}` : `${path}${separator}${queryString}`;
}

/**
 * 缩减大对象，避免把超大值拼到链接里。
 */
export function reduceValueSize(value: any) {
  if (_.isPlainObject(value)) {
    const result = {};
    Object.keys(value).forEach((key) => {
      if (_.isPlainObject(value[key]) || _.isArray(value[key])) {
        return;
      }
      if (_.isString(value[key]) && value[key].length > 100) {
        return;
      }
      result[key] = value[key];
    });
    return result;
  }

  if (_.isArray(value)) {
    return value.map((item) => {
      if (_.isPlainObject(item) || _.isArray(item)) {
        return reduceValueSize(item);
      }
      return item;
    });
  }

  return value;
}

/**
 * 补全站内 URL。
 */
export function completeURL(url: string, origin = window.location.origin) {
  if (!url) {
    return '';
  }
  if (isURL(url)) {
    return url;
  }
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

/**
 * 在当前窗口内跳转链接。
 */
export function navigateWithinSelf(link: string, navigate: NavigateFunction, basePath = window.location.origin) {
  if (!_.isString(link)) {
    return console.error('link should be a string');
  }

  if (isURL(link)) {
    if (link.startsWith(basePath)) {
      navigate(completeURL(link.replace(basePath, ''), ''));
    } else {
      window.open(link, '_self');
    }
    return;
  }

  navigate(completeURL(link, ''));
}

const titleWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

/**
 * 为标题补充 tooltip 图标。
 */
export const withTooltipComponent = (Component: React.FC) => {
  return (props) => {
    const { tooltip } = props;

    if (!tooltip) {
      return <Component {...props} />;
    }

    return (
      <div style={titleWrapperStyle}>
        <Component {...props} />
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined style={{ zIndex: 1 }} />
        </Tooltip>
      </div>
    );
  };
};

/**
 * 在 flow 侧最小复刻变量作用域，避免继续依赖旧变量模块。
 */
export const VariableScopeContext = createContext<{ scopeId: string; type: string; parent?: any }>({
  scopeId: '',
  type: '',
});

/**
 * 为菜单项提供变量作用域信息。
 */
export const VariableScope: React.FC<{ scopeId: string; type: string }> = (props) => {
  const parent = useContext(VariableScopeContext);
  const value = useMemo(
    () => ({
      scopeId: props.scopeId,
      type: props.type,
      parent,
    }),
    [parent, props.scopeId, props.type],
  );

  return <VariableScopeContext.Provider value={value}>{props.children}</VariableScopeContext.Provider>;
};

export const REGEX_OF_VARIABLE = /^\s*\{\{\s*([\p{L}0-9_$-.]+?)\s*\}\}\s*$/u;

/**
 * 判断字符串是否为变量表达式。
 */
export const isVariable = (str: unknown) => {
  return typeof str === 'string' && REGEX_OF_VARIABLE.test(str);
};

/**
 * 用 flow context 解析 badge 等轻量模板值。
 */
export const useEvaluatedExpression = (expression: string, context?: FlowContext) => {
  const [parsedValue, setParsedValue] = useState<number | string>();

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (expression == null || expression === '') {
        if (active) {
          setParsedValue(undefined);
        }
        return;
      }

      if (!context?.resolveJsonTemplate) {
        if (active) {
          setParsedValue(expression);
        }
        return;
      }

      try {
        const result = await context.resolveJsonTemplate(expression);
        if (!active) {
          return;
        }
        if (typeof result === 'string' && result.trim() !== '' && Number.isFinite(Number(result))) {
          setParsedValue(Number(result));
          return;
        }
        setParsedValue(result as any);
      } catch (error) {
        console.error(error);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [context, expression]);

  return parsedValue;
};

/**
 * 查找分组下首个可用页面。
 */
export function findFirstPageRoute(routes: NocoBaseDesktopRoute[]) {
  if (!routes) {
    return;
  }

  for (const route of routes.filter((item) => !item.hideInMenu)) {
    if (route.type === 'page' || route.type === 'flowPage') {
      return route;
    }

    if (route.type === 'group' && route.children?.length) {
      const result = findFirstPageRoute(route.children);
      if (result) {
        return result;
      }
    }
  }
}

/**
 * 生成经典页面的默认 schema。
 */
export function getPageMenuSchema({
  pageSchemaUid,
  tabSchemaUid,
  tabSchemaName,
}: {
  pageSchemaUid: string;
  tabSchemaUid: string;
  tabSchemaName: string;
}) {
  return {
    type: 'void',
    'x-component': 'Page',
    properties: {
      [tabSchemaName]: {
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {},
        'x-uid': tabSchemaUid,
        'x-async': true,
      },
    },
    'x-uid': pageSchemaUid,
  };
}

/**
 * 生成 v2 页面菜单的默认 schema。
 */
export function getFlowPageMenuSchema({ pageSchemaUid }: { pageSchemaUid: string }) {
  return {
    type: 'void',
    'x-component': 'FlowRoute',
    'x-uid': pageSchemaUid,
  };
}
