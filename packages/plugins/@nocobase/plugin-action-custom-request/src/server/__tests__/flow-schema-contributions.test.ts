/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';
import { flowSchemaContribution } from '../flow-schema-contributions';
import { flowSchemaContribution as coreFlowSchemaContribution } from '../../../../plugin-flow-engine/src/server/flow-schema-contributions';
import { FlowSchemaService } from '../../../../plugin-flow-engine/src/server/flow-schema-service';

const getClientCustomRequestActionName = () => {
  const filePath = path.resolve(
    process.cwd(),
    'packages/plugins/@nocobase/plugin-action-custom-request/src/client/models/customRequestFlowAction.tsx',
  );
  const source = fs.readFileSync(filePath, 'utf8');
  if (!/scene:\s*(?:\[\s*)?ActionScene\.DYNAMIC_EVENT_FLOW/.test(source)) {
    return null;
  }

  return source.match(/name:\s*'([^']+)'/)?.[1] || null;
};

describe('custom request flow schema contributions', () => {
  it('should expose a server contribution for the custom request event flow action', () => {
    const clientActionName = getClientCustomRequestActionName();
    const serverActionNames = (flowSchemaContribution.actions || []).map((contribution) => contribution.name);

    expect(clientActionName).toBe('customRequest');
    expect(serverActionNames).toContain(clientActionName);
  });

  it('should validate flow models that use the custom request event flow action', () => {
    const service = new FlowSchemaService();
    service.registerActionContributions(coreFlowSchemaContribution.actions || []);
    service.registerModelContributions(coreFlowSchemaContribution.models || []);
    service.registerActionContributions(flowSchemaContribution.actions || []);

    const issues = service.validateModelTree({
      uid: 'custom-request-action-host',
      use: 'EditFormModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
      flowRegistry: {
        customRequestFlow: {
          title: 'Custom request flow',
          on: {
            eventName: 'formValuesChange',
          },
          steps: {
            requestStep: {
              key: 'requestStep',
              use: 'customRequest',
              sort: 1,
              defaultParams: {
                key: 'req_demo',
                method: 'POST',
                url: 'https://api.example.com/orders',
                headers: [
                  {
                    name: 'Authorization',
                    value: 'Bearer {{ctx.token}}',
                  },
                ],
                params: [
                  {
                    name: 'id',
                    value: '{{ctx.record.id}}',
                  },
                ],
                data: {
                  status: 'processed',
                },
                timeout: 5000,
                responseType: 'json',
                variablePaths: ['ctx.record.id'],
                roles: ['admin'],
              },
            },
          },
        },
      },
    });

    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });
});
