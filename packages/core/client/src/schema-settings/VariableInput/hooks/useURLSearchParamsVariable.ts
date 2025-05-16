/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable, untracked } from '@formily/reactive';
import _ from 'lodash';
import qs from 'qs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocationSearch } from '../../../application/CustomRouterContextProvider';
import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { Option } from '../type';
import { getLabelWithTooltip } from './useBaseVariable';
import { string } from '../../../collection-manager/interfaces/properties/operators';

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
      operators: string,
    };
  });
};

export const useURLSearchParamsCtx = (search: string) => {
  // 使用响应式对象，目的是为了在变量值变化时，能够触发重新解析变量值
  const [_urlSearchParamsCtx] = useState(() => observable({}));

  return useMemo(() => {
    const newValue = getURLSearchParams(search);

    untracked(() => {
      Object.assign(_urlSearchParamsCtx, newValue);
      Object.keys(_urlSearchParamsCtx).forEach((key) => {
        if (newValue[key] === undefined) {
          delete _urlSearchParamsCtx[key];
        }
      });
    });

    return _urlSearchParamsCtx;
  }, [_urlSearchParamsCtx, search]);
};

/**
 * 变量：`URL search params`
 * @param props
 * @returns
 */
export const useURLSearchParamsVariable = (props: any = {}) => {
  const variableName = '$nURLSearchParams';
  const { t } = useTranslation();
  const searchString = useLocationSearch();
  const { isVariableParsedInOtherContext } = useFlag();
  const urlSearchParamsCtx = useURLSearchParamsCtx(searchString);
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
    /**
     * 这里的默认值是 null，这样会导致数据范围中的 filter 条件不会被清除掉，而 URL search params 变量的值为空时，应该清除掉 filter 条件，
     * 所以这里把 defaultValue 设置为 undefined，这样在解析出来的值是 undefined 时，会返回 undefined，从而清除掉 filter 条件。
     */
    defaultValue: undefined,
    shouldDisplay: !isVariableParsedInOtherContext,
  };
};
