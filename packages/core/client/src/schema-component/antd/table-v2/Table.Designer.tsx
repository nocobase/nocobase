/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useCollection_deprecated } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettingsRemove } from '../../../schema-settings';

export const TableDesigner = () => {
  const { name, title } = useCollection_deprecated();
  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
