/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import {
  getAvailableActionCatalogItems,
  getNodeContract,
  resolveSupportedActionCatalogItem,
} from '../flow-surfaces/catalog';

describe('flowSurfaces Agent Gateway dispatch action contract', () => {
  it('exposes the dispatch action only when plugin-agent-gateway is enabled', () => {
    const enabledPackages = new Set(['@nocobase/plugin-agent-gateway']);
    const disabledPackages = new Set<string>();

    const enabledRecordActions = getAvailableActionCatalogItems('TableActionsColumnModel', 'record', enabledPackages);
    const dispatchAction = enabledRecordActions.find((item) => item.key === 'dispatchAgentRun');
    expect(dispatchAction).toMatchObject({
      kind: 'action',
      key: 'dispatchAgentRun',
      scope: 'record',
      use: 'AgentGatewayDispatchActionModel',
      createSupported: true,
    });

    const disabledRecordActions = getAvailableActionCatalogItems('TableActionsColumnModel', 'record', disabledPackages);
    expect(disabledRecordActions.find((item) => item.key === 'dispatchAgentRun')).toBeUndefined();

    expect(
      resolveSupportedActionCatalogItem(
        {
          type: 'dispatchAgentRun',
          containerUse: 'TableActionsColumnModel',
        },
        {
          enabledPackages,
          requireCreateSupported: true,
        },
      ),
    ).toMatchObject({
      key: 'dispatchAgentRun',
      use: 'AgentGatewayDispatchActionModel',
    });

    expect(() =>
      resolveSupportedActionCatalogItem(
        {
          type: 'dispatchAgentRun',
          containerUse: 'TableActionsColumnModel',
        },
        {
          enabledPackages: disabledPackages,
          requireCreateSupported: true,
        },
      ),
    ).toThrow("@nocobase/plugin-agent-gateway' is not enabled");
  });

  it('allows only the binding identifier setting for the dispatch flow step', () => {
    const contract = getNodeContract('AgentGatewayDispatchActionModel');

    expect(contract.editableDomains).toEqual(
      expect.arrayContaining(['props', 'decoratorProps', 'stepParams', 'flowRegistry']),
    );
    expect(contract.domains.stepParams?.groups?.agentGatewayDispatch).toMatchObject({
      allowedPaths: ['dispatch.bindingIdentifier'],
      eventBindingSteps: ['dispatch'],
      mergeStrategy: 'deep',
    });
  });
});
