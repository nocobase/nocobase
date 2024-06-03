/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import _ from 'lodash';
import qs from 'qs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { Option } from '../type';
import { getLabelWithTooltip } from './useBaseVariable';

export const getURLSearchParams = (search: string) => {
  if (search.startsWith('?')) {
    search = search.slice(1);
  }
  const params = qs.parse(search);
  return params || {};
};

export const getURLSearchParamsChildren = (queryParams: Record<string, any>): Option[] => {
  return Object.keys(queryParams).map((key) => {
    return {
      label: key,
      value: key,
      key,
      isLeaf: true,
    };
  });
};

/**
 * 变量：`URL search params`
 * @param props
 * @returns
 */
export const useURLSearchParamsVariable = (props: any = {}) => {
  const variableName = '$nURLSearchParams';
  const { t } = useTranslation();
  const location = useLocation();
  const { isVariableParsedInOtherContext } = useFlag();

  // 使用响应式对象，目的是为了在变量值变化时，能够触发重新解析变量值
  const [_urlSearchParamsCtx] = useState(() => observable({}));

  const urlSearchParamsCtx = useMemo(() => {
    const newValue = getURLSearchParams(location.search);
    Object.assign(_urlSearchParamsCtx, newValue);
    return _urlSearchParamsCtx;
  }, [_urlSearchParamsCtx, location.search]);
  const disabled = useMemo(() => _.isEmpty(urlSearchParamsCtx), [urlSearchParamsCtx]);
  const urlSearchParamsSettings: Option = useMemo(() => {
    return {
      label: getLabelWithTooltip(
        t('URL search params'),
        disabled
          ? t(
              'The value of this variable is derived from the query string of the page URL. This variable can only be used normally when the page has a query string.',
            )
          : '',
      ),
      value: variableName,
      key: variableName,
      isLeaf: false,
      disabled,
      loadChildren: async (option, activeKey) => {
        const activeSettings = activeKey
          ? {
              [activeKey]: undefined,
            }
          : {};
        option.children = getURLSearchParamsChildren({ ...activeSettings, ...urlSearchParamsCtx });
      },
    };
  }, [disabled, t, urlSearchParamsCtx]);

  return {
    name: variableName,
    /** 变量配置 */
    urlSearchParamsSettings,
    /** 变量值 */
    urlSearchParamsCtx,
    shouldDisplay: !isVariableParsedInOtherContext,
  };
};
