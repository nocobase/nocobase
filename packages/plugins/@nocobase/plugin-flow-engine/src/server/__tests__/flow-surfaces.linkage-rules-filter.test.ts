/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getNodeContract } from '../flow-surfaces/catalog';
import { FlowSurfaceContractGuard } from '../flow-surfaces/contract-guard';

describe('flowSurfaces linkage rule condition normalization', () => {
  function mergeStepParams(use: string, stepParams: Record<string, unknown>) {
    const contract = getNodeContract(use).domains.stepParams;
    return new FlowSurfaceContractGuard().mergeDomainValue('stepParams', {}, stepParams, contract, use);
  }

  it('normalizes backend query linkage conditions before persistence', () => {
    const result = mergeStepParams('ChartBlockModel', {
      cardSettings: {
        linkageRules: {
          value: [
            {
              key: 'hideFromSales',
              title: '对销售角色隐藏',
              enable: true,
              condition: {
                $and: [
                  {
                    'user.roles.name': {
                      $eq: '销售',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    expect(result.cardSettings.linkageRules.value[0].condition).toEqual({
      logic: '$and',
      items: [
        {
          path: 'user.roles.name',
          operator: '$eq',
          value: '销售',
        },
      ],
    });
    expect(result.cardSettings.linkageRules.value[0].actions).toEqual([]);
  });

  it('fills canonical runtime defaults for condition-only linkage rules', () => {
    const result = mergeStepParams('RefreshActionModel', {
      buttonSettings: {
        linkageRules: {
          value: [
            {
              condition: {
                logic: '$and',
                items: [{ path: 'is_key', operator: '$isFalse' }],
              },
            },
          ],
        },
      },
    });

    expect(result.buttonSettings.linkageRules.value[0]).toEqual({
      key: 'linkage-rule-1',
      title: 'Linkage rule 1',
      enable: true,
      condition: {
        logic: '$and',
        items: [{ path: 'is_key', operator: '$isFalse' }],
      },
      actions: [],
    });
  });

  it('fills canonical runtime defaults for partial linkage rules', () => {
    const result = mergeStepParams('UpdateRecordActionModel', {
      buttonSettings: {
        linkageRules: {
          value: [
            {
              key: 'hide-update',
            },
          ],
        },
      },
    });

    expect(result.buttonSettings.linkageRules.value[0]).toEqual({
      key: 'hide-update',
      title: 'Linkage rule 1',
      enable: true,
      condition: {
        logic: '$and',
        items: [],
      },
      actions: [],
    });
  });

  it('normalizes public when/then linkage aliases to the runtime shape', () => {
    const then = [
      {
        key: 'hide',
        name: 'linkageSetActionProps',
        params: {
          value: 'hidden',
        },
      },
    ];
    const result = mergeStepParams('UpdateRecordActionModel', {
      buttonSettings: {
        linkageRules: {
          value: [
            {
              key: 'hideFromSales',
              when: {
                $and: [
                  {
                    'user.roles.name': {
                      $eq: 'sales',
                    },
                  },
                ],
              },
              then,
            },
          ],
        },
      },
    });

    expect(result.buttonSettings.linkageRules.value[0]).toEqual({
      key: 'hideFromSales',
      title: 'Linkage rule 1',
      enable: true,
      condition: {
        logic: '$and',
        items: [
          {
            path: 'user.roles.name',
            operator: '$eq',
            value: 'sales',
          },
        ],
      },
      actions: then,
    });
  });

  it('normalizes enabled alias without rewriting existing raw actions', () => {
    const actions = [
      {
        key: 'hide',
        name: 'linkageSetActionProps',
        params: {
          value: 'hidden',
        },
      },
    ];
    const result = mergeStepParams('RefreshActionModel', {
      buttonSettings: {
        linkageRules: {
          value: [
            {
              enabled: false,
              condition: {
                logic: '$and',
                items: [{ path: 'is_key', operator: '$isFalse' }],
              },
              actions,
            },
          ],
        },
      },
    });

    expect(result.buttonSettings.linkageRules.value[0]).toEqual({
      key: 'linkage-rule-1',
      title: 'Linkage rule 1',
      enable: false,
      condition: {
        logic: '$and',
        items: [{ path: 'is_key', operator: '$isFalse' }],
      },
      actions,
    });
  });

  it('rejects linkage rules whose actions are not arrays', () => {
    expect(() =>
      mergeStepParams('RefreshActionModel', {
        buttonSettings: {
          linkageRules: {
            value: [
              {
                condition: {
                  logic: '$and',
                  items: [{ path: 'is_key', operator: '$isFalse' }],
                },
                actions: {},
              },
            ],
          },
        },
      }),
    ).toThrow(/actions.*array/);
  });

  it('rejects linkage rules whose then alias is not an array', () => {
    expect(() =>
      mergeStepParams('RefreshActionModel', {
        buttonSettings: {
          linkageRules: {
            value: [
              {
                condition: {
                  logic: '$and',
                  items: [{ path: 'is_key', operator: '$isFalse' }],
                },
                then: {},
              },
            ],
          },
        },
      }),
    ).toThrow(/actions\/then.*array/);
  });

  it('normalizes backend field-root and nested relation linkage conditions', () => {
    const result = mergeStepParams('ChartBlockModel', {
      cardSettings: {
        linkageRules: {
          value: [
            {
              key: 'hideFromSales',
              enable: true,
              condition: {
                user: {
                  roles: {
                    name: {
                      $eq: '销售',
                    },
                  },
                },
                stage: {
                  $notIn: ['closed_won', 'closed_lost'],
                },
              },
              actions: [],
            },
          ],
        },
      },
    });

    expect(result.cardSettings.linkageRules.value[0].condition).toEqual({
      logic: '$and',
      items: [
        {
          path: 'user.roles.name',
          operator: '$eq',
          value: '销售',
        },
        {
          path: 'stage',
          operator: '$notIn',
          value: ['closed_won', 'closed_lost'],
        },
      ],
    });
  });

  it('keeps canonical linkage filter groups unchanged', () => {
    const condition = {
      logic: '$and',
      items: [
        {
          path: '{{ ctx.role }}',
          operator: '$eq',
          value: 'admin',
        },
      ],
    };

    const result = mergeStepParams('RefreshActionModel', {
      buttonSettings: {
        linkageRules: {
          value: [
            {
              key: 'hideAdminOnlyAction',
              enable: true,
              condition,
              actions: [],
            },
          ],
        },
      },
    });

    expect(result.buttonSettings.linkageRules.value[0].condition).toEqual(condition);
  });

  it('rejects backend query conditions that cannot be converted safely', () => {
    expect(() =>
      mergeStepParams('ChartBlockModel', {
        cardSettings: {
          linkageRules: {
            value: [
              {
                key: 'invalidRule',
                enable: true,
                condition: {
                  $and: [],
                  stage: {
                    $eq: 'new_lead',
                  },
                },
                actions: [],
              },
            ],
          },
        },
      }),
    ).toThrow(/mixed logical and field conditions/);
  });

  it('rejects canonical linkage conditions with backend field-root extras', () => {
    expect(() =>
      mergeStepParams('ChartBlockModel', {
        cardSettings: {
          linkageRules: {
            value: [
              {
                key: 'invalidRule',
                enable: true,
                condition: {
                  logic: '$and',
                  items: [],
                  stage: {
                    $eq: 'new_lead',
                  },
                },
                actions: [],
              },
            ],
          },
        },
      }),
    ).toThrow(/does not support: stage/);
  });

  it('rejects canonical filter groups nested in backend query operands', () => {
    expect(() =>
      mergeStepParams('ChartBlockModel', {
        cardSettings: {
          linkageRules: {
            value: [
              {
                key: 'invalidRule',
                enable: true,
                condition: {
                  $and: [
                    {
                      logic: '$and',
                      items: [
                        {
                          path: 'stage',
                          operator: '$eq',
                          value: 'new_lead',
                        },
                      ],
                    },
                  ],
                },
                actions: [],
              },
            ],
          },
        },
      }),
    ).toThrow(/cannot mix filter groups with backend query filters/);
  });
});
