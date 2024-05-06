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
import { GeneralSchemaDesigner } from '../../../schema-settings';

export const FormDesigner = () => {
  const { name, title } = useCollection_deprecated();
  return <GeneralSchemaDesigner schemaSettings="FormV1Settings" title={title || name}></GeneralSchemaDesigner>;
};
