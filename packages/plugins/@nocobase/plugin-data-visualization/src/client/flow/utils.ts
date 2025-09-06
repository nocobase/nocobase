/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
