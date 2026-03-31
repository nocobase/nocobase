/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ExecutionCanvas } from './ExecutionCanvas';
import useStyles from './style';

export const ExecutionPage = () => {
  const params = useParams<any>();
  const { styles } = useStyles();

  return (
    <div className={cx(styles.workflowPageClass)}>
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            [`execution_${params.id}`]: {
              type: 'void',
              'x-decorator': 'ResourceActionProvider',
              'x-decorator-props': {
                collection: {
                  name: 'executions',
                  fields: [],
                },
                resourceName: 'executions',
                request: {
                  resource: 'executions',
                  action: 'get',
                  params: {
                    filter: params,
                    appends: ['jobs', 'workflow', 'workflow.nodes', 'workflow.versionStats', 'workflow.stats'],
                    except: ['jobs.result', 'workflow.options'],
                  },
                },
              },
              'x-component': 'ExecutionCanvas',
            },
          },
        }}
        components={{
          ExecutionCanvas,
        }}
      />
    </div>
  );
};
