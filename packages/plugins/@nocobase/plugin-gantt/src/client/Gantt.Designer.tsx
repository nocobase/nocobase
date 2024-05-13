/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { GeneralSchemaDesigner, useCollection_deprecated, useSchemaTemplate } from '@nocobase/client';
import React from 'react';
export const GanttDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="blockSettings:gantt"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
