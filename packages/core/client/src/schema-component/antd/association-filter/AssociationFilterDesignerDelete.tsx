/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { useFieldSchema } from '@formily/react';
import { createDesignable, SchemaComponentContext } from '../..';
import { useAPIClient } from '../../../api-client';
import { useTranslation } from 'react-i18next';
import { SchemaInitializerItem, useSchemaInitializerItem } from '../../../application';

export const AssociationFilterDesignerDelete = () => {
  const itemConfig = useSchemaInitializerItem();
  const { refresh } = useContext(SchemaComponentContext);
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { t } = useTranslation();
  const dn = createDesignable({ t, api, refresh, current: fieldSchema });
  dn.loadAPIClientEvents();

  const handleClick = () => {
    dn.remove(fieldSchema);
  };

  return (
    <SchemaInitializerItem onClick={handleClick}>
      <div>{itemConfig.title}</div>
    </SchemaInitializerItem>
  );
};
