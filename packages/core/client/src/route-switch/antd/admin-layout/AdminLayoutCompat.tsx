/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isURL } from '@nocobase/utils/client';
import type { NavigateFunction } from 'react-router-dom';
import { useNavigateNoUpdate, useRouterBasename } from '../../../application/CustomRouterContextProvider';
import { appendQueryStringToUrl, reduceValueSize } from '../../../block-provider/hooks';
import { withTooltipComponent } from '../../../hoc/withTooltipComponent';
import { useEvaluatedExpression as useParsedEvaluatedExpression } from '../../../hooks/useParsedValue';
import { getFlowPageMenuSchema } from '../../../modules/menu/FlowPageMenuItem';
import { getPageMenuSchema } from '../../../modules/menu/PageMenuItem';
import { VariableScope } from '../../../variables/VariableScope';
import { isVariable } from '../../../variables/utils/isVariable';
import { ParentRouteContext } from '../../../schema-component/antd/menu/Menu';
import { NocoBaseRouteContext } from './route-runtime';
import { findFirstPageRoute } from './route-utils';

export {
  appendQueryStringToUrl,
  getFlowPageMenuSchema,
  getPageMenuSchema,
  isVariable,
  NocoBaseRouteContext,
  ParentRouteContext,
  reduceValueSize,
  useNavigateNoUpdate,
  useRouterBasename,
  VariableScope,
  withTooltipComponent,
  findFirstPageRoute,
};

/**
 * 兼容 v2 菜单副本里保留的两参调用签名。
 */
export const useEvaluatedExpression = (expression: string, _context?: unknown) => {
  return useParsedEvaluatedExpression(expression);
};

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
  if (typeof link !== 'string') {
    console.error('link should be a string');
    return;
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
