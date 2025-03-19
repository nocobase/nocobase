/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { NocoBaseRecursionField } from '@nocobase/client';
import { Schema } from '@nocobase/utils';
import React, { FC } from 'react';

export const GanttRecordViewer: FC = (props) => {
  const fieldSchema = useFieldSchema();
  const eventSchema: Schema = fieldSchema.properties.detail;

  if (!eventSchema) {
    return null;
  }

  return <NocoBaseRecursionField schema={eventSchema} name={eventSchema.name} />;
};
