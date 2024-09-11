/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField } from '@formily/react';
import {
  useAPITokenVariable,
  useCurrentRoleVariable,
  useCurrentUserVariable,
  useDatetimeVariable,
  usePopupVariable,
  useURLSearchParamsVariable,
} from '@nocobase/client';
import { useMemo } from 'react';
import { useFilterVariable } from './filter';

export const useGeneralVariableOptions = (
  schema: ISchema,
  operator?: {
    value: string;
  },
) => {
  const { currentUserSettings } = useCurrentUserVariable({
    collectionField: { uiSchema: schema },
    uiSchema: schema,
  });
  const { currentRoleSettings } = useCurrentRoleVariable({ uiSchema: schema });
  const { apiTokenSettings } = useAPITokenVariable({ noDisabled: true });
  const { datetimeSettings } = useDatetimeVariable({ operator, schema, noDisabled: true });
  const { urlSearchParamsSettings } = useURLSearchParamsVariable();
  const { settings: popupRecordSettings, shouldDisplayPopupRecord } = usePopupVariable({
    schema,
  });

  const result = useMemo(
    () =>
      [
        currentUserSettings,
        currentRoleSettings,
        apiTokenSettings,
        datetimeSettings,
        urlSearchParamsSettings,
        shouldDisplayPopupRecord && popupRecordSettings,
      ].filter(Boolean),
    [
      datetimeSettings,
      currentUserSettings,
      currentRoleSettings,
      urlSearchParamsSettings,
      apiTokenSettings,
      shouldDisplayPopupRecord,
      popupRecordSettings,
    ],
  );

  if (!schema) return [];

  return result;
};

export const useVariableOptions = () => {
  const field = useField<any>();
  const { operator, schema } = field.data || {};
  const filterVariable = useFilterVariable();
  const generalOptions = useGeneralVariableOptions(schema, operator);

  const result = useMemo(() => [...generalOptions, filterVariable].filter(Boolean), [generalOptions, filterVariable]);

  if (!operator || !schema) return [];

  return result;
};
