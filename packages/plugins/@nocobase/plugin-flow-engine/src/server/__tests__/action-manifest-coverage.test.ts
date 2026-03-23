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
import { flowSchemaActionManifests } from '../flow-schema-manifests/actions';
import { flowSchemaManifestContribution } from '../flow-schema-manifests';
import { FlowSchemaService } from '../flow-schema-service';

const extractDynamicEventActionName = (filePath: string) => {
  const source = fs.readFileSync(filePath, 'utf8');
  if (!/scene:\s*(?:\[\s*)?ActionScene\.DYNAMIC_EVENT_FLOW/.test(source)) {
    return null;
  }

  return source.match(/name:\s*'([^']+)'/)?.[1] || null;
};

const getCoreDynamicEventActionNames = () => {
  const actionDir = path.resolve(process.cwd(), 'packages/core/client/src/flow/actions');
  return fs
    .readdirSync(actionDir)
    .filter((fileName) => fileName.endsWith('.tsx'))
    .map((fileName) => extractDynamicEventActionName(path.join(actionDir, fileName)))
    .filter((name): name is string => !!name)
    .sort();
};

const buildFlowRegistry = () => ({
  eventFlow: {
    title: 'Dynamic event flow coverage',
    on: {
      eventName: 'formValuesChange',
      defaultParams: {
        condition: {
          logic: '$and',
          items: [],
        },
      },
    },
    steps: {
      showMessageStep: {
        key: 'showMessageStep',
        use: 'showMessage',
        sort: 1,
        defaultParams: {
          value: {
            type: 'info',
            content: 'Saved successfully',
            duration: 3,
          },
        },
      },
      showNotificationStep: {
        key: 'showNotificationStep',
        use: 'showNotification',
        sort: 2,
        defaultParams: {
          value: {
            type: 'info',
            title: 'Sync completed',
            description: 'The target blocks were refreshed.',
            duration: 5,
            placement: 'topRight',
          },
        },
      },
      navigateToURLStep: {
        key: 'navigateToURLStep',
        use: 'navigateToURL',
        sort: 3,
        defaultParams: {
          value: {
            url: '/admin/users',
            searchParams: [
              {
                name: 'status',
                value: 'active',
              },
            ],
            openInNewWindow: false,
          },
        },
      },
      refreshTargetBlocksStep: {
        key: 'refreshTargetBlocksStep',
        use: 'refreshTargetBlocks',
        sort: 4,
        defaultParams: {
          targets: ['table-users'],
        },
      },
      setTargetDataScopeStep: {
        key: 'setTargetDataScopeStep',
        use: 'setTargetDataScope',
        sort: 5,
        defaultParams: {
          targetBlockUid: 'table-users',
          filter: {
            logic: '$and',
            items: [],
          },
        },
      },
      customVariableStep: {
        key: 'customVariableStep',
        use: 'customVariable',
        sort: 6,
        defaultParams: {
          variables: [
            {
              key: 'var_form',
              title: 'Current form',
              type: 'formValue',
              formUid: 'edit-form-uid',
            },
          ],
        },
      },
      runjsStep: {
        key: 'runjsStep',
        use: 'runjs',
        sort: 7,
        defaultParams: {
          code: 'return 1;',
        },
      },
    },
  },
});

describe('flow schema action manifest coverage', () => {
  it('should register server manifests for every core dynamic event flow action', () => {
    const clientActionNames = getCoreDynamicEventActionNames();
    const registeredActionNames = Array.from(
      new Set(
        flowSchemaActionManifests.map((manifest) => manifest.name).filter((name) => clientActionNames.includes(name)),
      ),
    ).sort();

    expect(clientActionNames.length).toBeGreaterThan(0);
    expect(clientActionNames).toEqual(registeredActionNames);
  });

  it('should validate flow models that use all core dynamic event flow actions', () => {
    const service = new FlowSchemaService();
    service.registerActionManifests(flowSchemaManifestContribution.actions || []);
    service.registerModelManifests(flowSchemaManifestContribution.models || []);

    const issues = service.validateModelTree({
      uid: 'dynamic-event-actions-host',
      use: 'EditFormModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
      flowRegistry: buildFlowRegistry(),
    });

    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });
});
