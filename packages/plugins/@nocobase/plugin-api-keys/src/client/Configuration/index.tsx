/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NocoBaseRecursionField, SchemaComponentOptions, useCurrentRoles } from '@nocobase/client';
import React from 'react';
import { ExpiresSelect } from './ExpiresSelect';
import { configurationSchema } from './schema';

export const Configuration = () => {
  const currentRoles = useCurrentRoles().filter((x) => x.name !== '__union__');
  return (
    <SchemaComponentOptions scope={{ currentRoles }} components={{ ExpiresSelect }}>
      <NocoBaseRecursionField schema={configurationSchema} />
    </SchemaComponentOptions>
  );
};
