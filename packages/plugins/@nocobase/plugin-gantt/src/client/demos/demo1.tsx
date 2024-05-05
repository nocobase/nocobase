/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Gantt, SchemaComponent, SchemaComponentProvider, useGanttBlockProps } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    tasks: {
      type: 'void',
      'x-component': 'Gantt',
      'x-use-component-props': 'useGanttBlockProps',
      'x-component-props': {
        tasks: [
          {
            start: new Date(2020, 0, 1),
            end: new Date(2020, 2, 2),
            name: 'Redesign website',
            id: 'Task 0',
            progress: 45,
            type: 'task',
          },
        ],
      },
    },
  },
};

export default () => {
  return <div>TODO</div>;

  return (
    <SchemaComponentProvider components={{ Gantt }} scope={{ useGanttBlockProps }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
