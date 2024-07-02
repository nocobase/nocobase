/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useMobileRoutes } from '../../../mobile-providers';

export function useUpdateTabBarItem() {
  const { refresh, resource } = useMobileRoutes();
  const fieldSchema = useFieldSchema();
  return async () => {
    const schema = fieldSchema.toJSON();
    const id = Number(schema.name);
    await resource.update({ filterByTk: id, values: { options: schema } });
    refresh();
  };
}
