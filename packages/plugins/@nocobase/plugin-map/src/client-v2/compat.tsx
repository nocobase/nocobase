/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { TextAreaWithContextSelector } from '@nocobase/client-v2';
import { getDefaultFormat, str2moment } from '@nocobase/utils/client';
import { Input } from 'antd';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { useMapTranslation } from './locale';

export const TextAreaWithGlobalScope = TextAreaWithContextSelector || Input.TextArea;

export const withSkeletonComponent = <P extends object>(
  Component: React.ComponentType<P>,
  options?: { displayName?: string },
) => {
  if (options?.displayName) {
    Component.displayName = options.displayName;
  }
  return Component;
};

export const useLocationSearch = () => {
  return useLocation().search;
};

export const useFilterAPI = () => {
  return {
    isConnected: false,
    doFilter: () => {},
  };
};

export const useCompile = () => {
  const { t } = useMapTranslation();
  return (value: any) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.replace(/\{\{\s*t\(['"]([^'"]+)['"][^)]*\)\s*\}\}/g, (_, key) => t(key));
  };
};

const toArray = (value: any) => {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

export const getDatePickerLabels = (props: Record<string, any>): string => {
  const format = getDefaultFormat(props) as string;
  const m = str2moment(props.value, props);
  const labels = m && m.isValid() ? m.format(format) : props.value;
  return Array.isArray(labels) ? labels.join('~') : labels;
};

export const getLabelFormatValue = (labelUiSchema: ISchema, value: any): any => {
  const options = labelUiSchema?.enum;
  if (Array.isArray(options) && value) {
    return toArray(value)
      .map((val) => {
        const option: any = options.find((item: any) => item.value === val);
        return option?.label;
      })
      .join(', ');
  }

  if (labelUiSchema?.['x-component'] === 'DatePicker') {
    return getDatePickerLabels({ ...labelUiSchema?.['x-component-props'], value });
  }

  return value;
};
