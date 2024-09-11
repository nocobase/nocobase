/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useMemo } from 'react';
import { useBlockTemplateContext } from '../../schema-templates/BlockTemplateProvider';

export const useBlockHeightProps = () => {
  const fieldSchema = useFieldSchema();
  const cardItemSchema = getCardItemSchema(fieldSchema);
  const blockTemplateSchema = useBlockTemplateContext()?.fieldSchema;
  const pageSchema = useMemo(() => getPageSchema(blockTemplateSchema || fieldSchema), []);
  const { disablePageHeader, enablePageTabs, hidePageTitle } = pageSchema?.['x-component-props'] || {};
  return {
    heightProps: {
      ...cardItemSchema?.['x-component-props'],
      disablePageHeader,
      enablePageTabs,
      hidePageTitle,
    },
  };
};
export const getPageSchema = (schema) => {
  if (!schema) return null;

  if (schema['x-component'] === 'Page') {
    return schema;
  }
  return getPageSchema(schema.parent);
};

const getCardItemSchema = (schema) => {
  if (!schema) return null;
  if (['BlockItem', 'CardItem'].includes(schema['x-component'])) {
    return schema;
  }
  return getCardItemSchema(schema.parent);
};
