/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select } from 'antd';
import React, { useEffect, useState } from 'react';

type SortFieldOption = {
  label: string;
  value: string;
};

export const upsertKanbanCollectionFieldOptions = (
  fields: Record<string, any>[] = [],
  fieldData?: Record<string, any>,
) => {
  if (!fieldData?.name) {
    return fields;
  }

  const nextFields = [...fields];
  const existingIndex = nextFields.findIndex((field) => field?.name === fieldData.name);
  if (existingIndex >= 0) {
    nextFields[existingIndex] = {
      ...nextFields[existingIndex],
      ...fieldData,
    };
    return nextFields;
  }

  nextFields.push(fieldData);
  return nextFields;
};

export const KanbanCreateSortFieldSelect = (props: {
  sortFields?: SortFieldOption[];
  groupField?: { value: string };
  [key: string]: any;
}) => {
  const { sortFields = [], groupField, ...others } = props;
  const [sortFieldOptions, setSortFieldOptions] = useState<SortFieldOption[]>(sortFields);

  useEffect(() => {
    setSortFieldOptions(sortFields);
  }, [sortFields]);

  return <Select options={sortFieldOptions} {...others} disabled={!groupField} />;
};
