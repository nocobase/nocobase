/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { REQUEST_BODY_EDITOR_KIND } from './constants';
import type { RequestContentType } from './types';

export function getRequestBodyEditorKind(contentType?: RequestContentType) {
  return REQUEST_BODY_EDITOR_KIND[contentType ?? 'application/json'];
}

export function getDefaultRequestBodyValue(contentType?: RequestContentType) {
  switch (contentType ?? 'application/json') {
    case 'application/json':
      return {};
    case 'application/x-www-form-urlencoded':
    case 'multipart/form-data':
      return [];
    case 'application/xml':
    case 'text/plain':
      return '';
    default:
      return {};
  }
}

export function buildResponseVariableChildren(onlyData: boolean | undefined, t: (key: string) => string) {
  if (onlyData) {
    return null;
  }

  return [
    {
      value: 'status',
      label: t('Status code'),
    },
    {
      value: 'data',
      label: t('Data'),
    },
    {
      value: 'headers',
      label: t('Response headers'),
    },
  ];
}
