/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// hooks/useTemplateBlockNotifier.ts
import { useFieldSchema, useForm } from '@formily/react';
import { useMemo } from 'react';

export const useTemplateBlockNotifier = () => {
  const form = useForm();
  const fieldSchema = useFieldSchema();

  // only when TemplateGridDecorator is used, the blockAdded event will be notified
  const hasTemplateGridDecorator = useMemo(() => {
    let current = fieldSchema;
    while (current) {
      if (current['x-decorator'] === 'TemplateGridDecorator') {
        return true;
      }
      current = current.parent;
    }
    return false;
  }, [fieldSchema]);

  const notify = (info: { collection: string; dataSource: string; componentType: string; menuName: string }) => {
    if (hasTemplateGridDecorator) {
      form.notify('blockAdded', info);
    }
  };

  return notify;
};
