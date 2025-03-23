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
import useStyles from './style';
import { WorkflowCanvas } from './WorkflowCanvas';

export const WorkflowPage = () => {
  const params = useParams<any>();
  const { styles } = useStyles();

  return (
    <div className={cx(styles.workflowPageClass)}>
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            [`provider_${params.id}`]: {
              type: 'void',
              'x-decorator': 'ResourceActionProvider',
              'x-decorator-props': {
                collection: {
                  name: 'workflows',
                  fields: [],
                },
                resourceName: 'workflows',
                request: {
                  resource: 'workflows',
                  action: 'get',
                  params: {
                    filter: { id: params.id },
                    appends: [
                      'nodes',
                      'revisions.id',
                      'revisions.createdAt',
                      'revisions.current',
                      'revisions.stats.executed',
                      'revisions.versionStats.executed',
                      'revisions.enabled',
                      'stats.executed',
                      'versionStats.executed',
                    ],
                  },
                },
              },
              'x-component': 'WorkflowCanvas',
            },
          },
        }}
        components={{
          WorkflowCanvas,
        }}
      />
    </div>
  );
};
