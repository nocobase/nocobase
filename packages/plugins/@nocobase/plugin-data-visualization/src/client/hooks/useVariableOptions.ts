/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import { useCurrentUserVariable, useDatetimeVariable } from '@nocobase/client';
import { useMemo } from 'react';
import { useFilterVariable } from './filter';

export const useVariableOptions = () => {
  const field = useField<any>();
  const { operator, schema } = field.data || {};
  const { currentUserSettings } = useCurrentUserVariable({
    collectionField: { uiSchema: schema },
    uiSchema: schema,
  });
  const { datetimeSettings } = useDatetimeVariable({ operator, schema });
  const filterVariable = useFilterVariable();

  const result = useMemo(
    () => [currentUserSettings, datetimeSettings, filterVariable].filter(Boolean),
    [datetimeSettings, currentUserSettings, filterVariable],
  );

  if (!operator || !schema) return [];

  return result;
};
