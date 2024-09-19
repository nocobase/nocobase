/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollection_deprecated, useCompile } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const useGanttTranslation = () => {
  return useTranslation('gantt');
};
export const useOptions = (type: string | string[] = 'string') => {
  const compile = useCompile();
  const { fields } = useCollection_deprecated();
  const options = fields
    ?.filter((field) => {
      if (typeof type === 'string') {
        return field.type === type;
      } else {
        return type.includes(field.type);
      }
    })
    ?.map((field) => {
      return {
        value: field.name,
        label: compile(field?.uiSchema?.title),
      };
    });
  return options;
};
