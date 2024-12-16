/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, useFieldSchema } from '@formily/react';
import { NocoBaseRecursionField } from '@nocobase/client';
import React, { FC, useMemo } from 'react';

export const CalendarRecordViewer: FC = (props) => {
  const fieldSchema = useFieldSchema();
  const eventSchema: Schema = useMemo(() => findEventSchema(fieldSchema), [fieldSchema]);

  if (!eventSchema) {
    return null;
  }

  return <NocoBaseRecursionField schema={eventSchema} name={eventSchema.name} />;
};

export function findEventSchema(schema: Schema) {
  if (schema['x-component'].endsWith('.Event')) {
    return schema;
  }

  return schema.reduceProperties((buf, current) => {
    if (current['x-component'].endsWith('.Event')) {
      return current;
    }
    return buf;
  }, null);
}
