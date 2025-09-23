/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lang } from '../locale';

export function convertDatasetFormats(data: Record<string, any>[]) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      objects: [],
      rows: [],
      columns: [],
    };
  }

  const dimensions = Object.keys(data[0]);
  const categoryKey = dimensions[0];
  const valueKeys = dimensions.slice(1);

  const objects = data;

  const rows = [dimensions];
  data.forEach((row) => {
    rows.push(dimensions.map((k) => row[k]));
  });

  const categories = data.map((row) => row[categoryKey]);
  const columns = [categories];
  valueKeys.forEach((key) => {
    columns.push(data.map((row) => row[key]));
  });

  return {
    dimensions,
    objects,
    rows,
    columns,
  };
}

export const formatters = {
  datetime: [
    {
      label: lang('YYYY'),
      value: 'YYYY',
    },
    {
      label: lang('MM'),
      value: 'MM',
    },
    {
      label: lang('DD'),
      value: 'DD',
    },
    {
      label: lang('YYYY-MM'),
      value: 'YYYY-MM',
    },
    {
      label: lang('YYYY-MM-DD'),
      value: 'YYYY-MM-DD',
    },
    {
      label: lang('YYYY-MM-DD hh:mm'),
      value: 'YYYY-MM-DD hh:mm',
    },
    {
      label: lang('YYYY-MM-DD hh:mm:ss'),
      value: 'YYYY-MM-DD hh:mm:ss',
    },
  ],
  date: [
    {
      label: lang('YYYY'),
      value: 'YYYY',
    },
    {
      label: lang('MM'),
      value: 'MM',
    },
    {
      label: lang('DD'),
      value: 'DD',
    },
    {
      label: lang('YYYY-MM'),
      value: 'YYYY-MM',
    },
    {
      label: lang('YYYY-MM-DD'),
      value: 'YYYY-MM-DD',
    },
  ],
  time: [
    {
      label: lang('hh:mm:ss'),
      value: 'hh:mm:ss',
    },
    {
      label: lang('hh:mm'),
      value: 'hh:mm',
    },
    {
      label: lang('hh'),
      value: 'hh',
    },
  ],
};
