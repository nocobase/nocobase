/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useSchemaInitializer, SchemaInitializerItemType } from '@nocobase/client';
import { PrintTemplateActionName, PrintTemplateActionNameLowercase } from '../constants';
import { createPrintTemplateActionSchema } from '../schema';
import { useT } from '../locale';
export const createPrintTemplateActionInitializerItem = (blockComponent: string): SchemaInitializerItemType => {
  return {
    type: 'item',
    name: PrintTemplateActionNameLowercase,
    useComponentProps() {
      const { insert } = useSchemaInitializer(); // SchemaInitializerContext - 上下文
      const t = useT();
      return {
        title: t(PrintTemplateActionName),
        onClick: () => {
          insert(createPrintTemplateActionSchema(blockComponent));
        },
      };
    },
  };
};
