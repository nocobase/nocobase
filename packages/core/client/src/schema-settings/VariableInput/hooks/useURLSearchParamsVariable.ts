/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Option } from '../type';
import { getLabelWithTooltip } from './useBaseVariable';

const getQueryParamsFromLocation = () => {
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const result: Record<string, any> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

const getURLSearchParamsChildren = (queryParams: Record<string, any>): Option[] => {
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
  const urlSearchParamsCtx = getQueryParamsFromLocation();
  const disabled = _.isEmpty(urlSearchParamsCtx);
  const urlSearchParamsSettings: Option = {
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
      const activeSettings = {
        [activeKey]: undefined,
      };
      option.children = getURLSearchParamsChildren({ ...activeSettings, ...urlSearchParamsCtx });
    },
  };

  return {
    name: variableName,
    /** 变量配置 */
    urlSearchParamsSettings,
    /** 变量值 */
    urlSearchParamsCtx,
  };
};
