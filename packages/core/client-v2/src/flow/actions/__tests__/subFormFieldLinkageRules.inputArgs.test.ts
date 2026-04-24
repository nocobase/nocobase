/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { subFormFieldLinkageRules } from '../linkageRules';
import { SubFormFieldModel, SubFormListFieldModel } from '../../models/fields/AssociationFieldModel/SubFormFieldModel';

describe('subFormFieldLinkageRules action', () => {
  it('passes inputArgs to fork runtime context', async () => {
    const linkageAssignHandler = vi.fn();
    const engine = new FlowEngine();
    const forkModel = new FlowModel({ uid: 'fork-model', flowEngine: engine }) as any;
    forkModel.hidden = false;
    forkModel.getAction = vi.fn((name: string) => {
      if (name === 'linkageAssignField') {
        return {
          handler: linkageAssignHandler,
        };
      }
    });
    forkModel.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });

    const ctx: any = {
      model: {
        hidden: false,
        subModels: {
          grid: {
            forks: [forkModel],
          },
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        changedPaths: [['users', 0, 'name']],
      },
    };

    await subFormFieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-1',
          title: 'rule-1',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'r1',
                    enable: true,
                    targetPath: 'foo',
                    mode: 'assign',
                    value: 'bar',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(linkageAssignHandler).toHaveBeenCalledTimes(1);
    const actionCtx = linkageAssignHandler.mock.calls[0][0];
    expect(actionCtx.inputArgs).toEqual({
      source: 'user',
      changedPaths: [['users', 0, 'name']],
    });
  });

  it('passes linkageScopeDepth to fork runtime context', async () => {
    const linkageAssignHandler = vi.fn();
    const engine = new FlowEngine();
    const forkModel = new FlowModel({ uid: 'fork-model-depth', flowEngine: engine }) as any;
    forkModel.hidden = false;
    forkModel.getAction = vi.fn((name: string) => {
      if (name === 'linkageAssignField') {
        return {
          handler: linkageAssignHandler,
        };
      }
    });
    forkModel.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });

    const nestedSubFormModel = {
      parent: {
        parent: {
          parent: null,
        },
      },
    };
    Object.setPrototypeOf(nestedSubFormModel.parent.parent, SubFormListFieldModel.prototype);
    Object.setPrototypeOf(nestedSubFormModel.parent, SubFormFieldModel.prototype);

    const ctx: any = {
      model: {
        ...nestedSubFormModel,
        hidden: false,
        subModels: {
          grid: {
            forks: [forkModel],
          },
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-1',
        changedPaths: [['users', 0, 'name']],
      },
    };

    await subFormFieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-1',
          title: 'rule-1',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'r1',
                    enable: true,
                    targetPath: 'foo',
                    mode: 'assign',
                    value: 'bar',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(linkageAssignHandler).toHaveBeenCalledTimes(1);
    const actionCtx = linkageAssignHandler.mock.calls[0][0];
    expect(actionCtx.linkageScopeDepth).toBe(2);
    expect(actionCtx.inputArgs).toEqual({
      source: 'user',
      txId: 'tx-1',
      changedPaths: [['users', 0, 'name']],
    });
  });
});
