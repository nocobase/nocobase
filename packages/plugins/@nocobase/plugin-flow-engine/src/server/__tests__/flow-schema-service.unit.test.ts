/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import {
  createActionStepParamsSchema,
  genericFilterSchema,
  popupActionSettingsStepParamsSchema,
} from '../flow-schema-contributions/shared';
import { flowSchemaContribution } from '../flow-schema-contributions';
import { FlowSchemaService } from '../flow-schema-service';

function objectSchema(
  properties: Record<string, any> = {},
  options: {
    required?: string[];
    additionalProperties?: boolean | Record<string, any>;
  } = {},
) {
  const { required = [], additionalProperties = true } = options;

  return {
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
    additionalProperties,
  };
}

function modelContribution(use: string, extra: Record<string, any> = {}) {
  return {
    use,
    source: 'official',
    strict: true,
    stepParamsSchema: objectSchema(),
    ...extra,
  };
}

function objectSlot(extra: Record<string, any> = {}) {
  return {
    type: 'object',
    ...extra,
  };
}

function arraySlot(extra: Record<string, any> = {}) {
  return {
    type: 'array',
    ...extra,
  };
}

function createService() {
  const service = new FlowSchemaService();

  service.registerFieldBindingContexts([
    { name: 'editable-field' },
    { name: 'display-field' },
    { name: 'form-item-field', inherits: ['editable-field'] },
  ]);

  service.registerFieldBindings(
    [
      {
        context: 'editable-field',
        use: 'InputFieldModel',
        interfaces: ['input', 'uuid'],
        isDefault: true,
      },
      {
        context: 'form-item-field',
        use: 'RecordSelectFieldModel',
        interfaces: ['m2m'],
        isDefault: true,
      },
      {
        context: 'form-item-field',
        use: 'RecordPickerFieldModel',
        interfaces: ['m2m'],
        order: 20,
      },
      {
        context: 'form-item-field',
        use: 'SubTableFieldModel',
        interfaces: ['m2m'],
        order: 30,
      },
      {
        context: 'display-field',
        use: 'DisplayTextFieldModel',
        interfaces: ['input'],
        isDefault: true,
      },
    ],
    'official',
  );

  service.registerModelContributions([
    modelContribution('FormItemModel', {
      subModelSlots: {
        field: objectSlot({
          fieldBindingContext: 'form-item-field',
        }),
      },
    }),
    modelContribution('InputFieldModel'),
    modelContribution('RecordSelectFieldModel', {
      subModelSlots: {
        field: objectSlot({
          fieldBindingContext: 'editable-field',
        }),
      },
    }),
    modelContribution('RecordPickerFieldModel', {
      subModelSlots: {
        field: objectSlot({
          fieldBindingContext: 'display-field',
        }),
        'grid-block': objectSlot({
          use: 'BlockGridModel',
        }),
      },
    }),
    modelContribution('SubTableFieldModel', {
      subModelSlots: {
        columns: arraySlot({
          uses: ['SubTableColumnModel'],
        }),
      },
    }),
    modelContribution('SubTableColumnModel', {
      subModelSlots: {
        field: objectSlot({
          fieldBindingContext: 'editable-field',
        }),
      },
    }),
    modelContribution('BlockGridModel'),
    modelContribution('ChildPageModel', {
      subModelSlots: {
        tabs: arraySlot({
          uses: ['ChildPageTabModel'],
          required: true,
          minItems: 1,
        }),
      },
    }),
    modelContribution('ChildPageTabModel', {
      subModelSlots: {
        grid: objectSlot({
          use: 'BlockGridModel',
          required: true,
        }),
      },
    }),
    modelContribution('DisplayTextFieldModel'),
    modelContribution('SaveExistingLeafModel', {
      stepParamsSchema: objectSchema(
        {
          alpha: {
            type: 'string',
          },
        },
        { required: ['alpha'], additionalProperties: false },
      ),
    }),
    modelContribution('SaveExistingRootModel', {
      stepParamsSchema: objectSchema(
        {
          enabled: {
            type: 'boolean',
          },
        },
        { required: ['enabled'], additionalProperties: false },
      ),
      subModelSlots: {
        body: objectSlot({
          use: 'SaveExistingLeafModel',
          required: true,
        }),
      },
    }),
  ]);

  return service;
}

const buildDynamicEventFlowRegistry = () => ({
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

describe('FlowSchemaService', () => {
  it('should normalize fieldBinding-driven field switches and prune stale subModels', () => {
    const service = createService();
    const payload = {
      uid: 'form-item-1',
      use: 'FormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'roles',
          },
        },
      },
      subModels: {
        field: {
          uid: 'field-node-1',
          use: 'RecordSelectFieldModel',
          stepParams: {
            fieldBinding: {
              use: 'RecordPickerFieldModel',
            },
            fieldSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'users',
                fieldPath: 'roles',
              },
            },
          },
          subModels: {
            field: {
              uid: 'label-field-1',
              use: 'DisplayTextFieldModel',
            },
            'grid-block': {
              uid: 'picker-grid-1',
              use: 'BlockGridModel',
            },
            columns: [
              {
                uid: 'legacy-column-1',
                use: 'LegacyColumnModel',
              },
            ],
          },
        },
      },
    };

    const normalized = service.normalizeModelTree(payload);

    expect(normalized.subModels.field.use).toBe('RecordPickerFieldModel');
    expect(normalized.subModels.field.subModels).toMatchObject({
      field: {
        uid: 'label-field-1',
        use: 'DisplayTextFieldModel',
      },
      'grid-block': {
        uid: 'picker-grid-1',
        use: 'BlockGridModel',
      },
    });
    expect(normalized.subModels.field.subModels.columns).toBeUndefined();

    const issues = service.validateModelTree(payload);
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should expose RecordPickerFieldModel popup slots in discovery schema', () => {
    const service = createService();
    const document = service.getDocument('RecordPickerFieldModel');

    expect(document?.jsonSchema?.properties?.subModels).toMatchObject({
      type: 'object',
      properties: {
        field: {
          type: 'object',
        },
        'grid-block': {
          type: 'object',
          properties: {
            use: {
              const: 'BlockGridModel',
            },
          },
        },
      },
    });
  });

  it('should prune stale field slot when switching association form item to SubTableFieldModel', () => {
    const service = createService();
    const payload = {
      uid: 'form-item-sub-table',
      use: 'FormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'roles',
          },
        },
        editItemSettings: {
          model: {
            use: 'SubTableFieldModel',
          },
        },
      },
      subModels: {
        field: {
          uid: 'field-sub-table',
          use: 'RecordSelectFieldModel',
          stepParams: {
            fieldBinding: {
              use: 'SubTableFieldModel',
            },
            fieldSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'users',
                fieldPath: 'roles',
              },
            },
          },
          subModels: {
            field: {
              uid: 'stale-display-field',
              use: 'DisplayTextFieldModel',
            },
          },
        },
      },
    };

    const normalized = service.normalizeModelTree(payload);
    expect(normalized.subModels.field.use).toBe('SubTableFieldModel');
    expect(normalized.subModels.field.subModels?.field).toBeUndefined();

    const issues = service.validateModelTree(payload);
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should allow editable field models inside SubTableColumnModel', () => {
    const service = createService();
    const payload = {
      uid: 'sub-table-column-1',
      use: 'SubTableColumnModel',
      parentId: 'sub-table-field-1',
      subKey: 'columns',
      subType: 'array',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'roles.name',
          },
        },
      },
      subModels: {
        field: {
          uid: 'sub-table-column-field-1',
          use: 'InputFieldModel',
          stepParams: {},
        },
      },
    };

    const issues = service.validateModelTree(payload);
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should allow ensure-style partial nested child creation without uid for lazy popup tabs', () => {
    const service = createService();
    const payload = {
      parentId: 'popup-parent',
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
      async: true,
      stepParams: {
        pageSettings: {
          general: {
            displayTitle: false,
            enableTabs: true,
          },
        },
      },
      subModels: {
        tabs: [
          {
            use: 'ChildPageTabModel',
            stepParams: {
              pageTabSettings: {
                tab: {
                  title: 'Details',
                },
              },
            },
          },
        ],
      },
    };

    const issues = service.validateModelTree(payload, { allowRootObjectLocator: true });
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);

    const normalized = service.normalizeModelTree(payload, [], {
      allowRootObjectLocator: true,
      assignImplicitUids: true,
    });

    expect(normalized.uid).toBeUndefined();
    expect(normalized.subModels.tabs[0].uid).toBeTruthy();
    expect(normalized.subModels.tabs[0].subModels?.grid).toBeUndefined();
  });

  it('should skip direct validation for existing root nodes during save-style validation', () => {
    const service = createService();

    const issues = service.validateModelTree(
      {
        uid: 'save-existing-root-1',
        use: 'SaveExistingRootModel',
        stepParams: {
          enabled: 'bad',
        },
      },
      {
        existingNodeUids: new Set(['save-existing-root-1']),
      },
    );

    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should keep validating new child nodes under an existing root during save-style validation', () => {
    const service = createService();

    const issues = service.validateModelTree(
      {
        uid: 'save-existing-root-2',
        use: 'SaveExistingRootModel',
        stepParams: {
          enabled: 'bad',
        },
        subModels: {
          body: {
            uid: 'save-new-child-2',
            use: 'SaveExistingLeafModel',
            stepParams: {
              alpha: 1,
            },
          },
        },
      },
      {
        existingNodeUids: new Set(['save-existing-root-2']),
      },
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jsonPointer: '#/subModels/body/stepParams/alpha',
          modelUid: 'save-new-child-2',
          modelUse: 'SaveExistingLeafModel',
          section: 'stepParams',
          keyword: 'type',
        }),
      ]),
    );
  });

  it('should validate generic filter trees as recursive groups or conditions', () => {
    const service = new FlowSchemaService();
    const ajv = new Ajv({ allErrors: true, strict: false });

    service.registerModelContributions([
      modelContribution('FilterHostModel', {
        stepParamsSchema: objectSchema(
          {
            filter: genericFilterSchema,
          },
          { required: ['filter'], additionalProperties: false },
        ),
      }),
    ]);

    const document = service.getDocument('FilterHostModel');
    const filterSchema = document?.jsonSchema?.properties?.stepParams?.properties?.filter;
    expect(filterSchema).toBeTruthy();
    const validateFilter = ajv.compile(filterSchema || {});

    expect(
      validateFilter({
        logic: '$and',
        items: [
          {
            path: 'status',
            operator: '$eq',
            value: 'published',
          },
          {
            logic: '$or',
            items: [
              {
                path: 'createdBy',
                operator: '$eq',
                value: '{{ctx.currentUser.id}}',
              },
            ],
          },
        ],
      }),
      JSON.stringify(validateFilter.errors),
    ).toBe(true);

    expect(
      validateFilter({
        logic: '$and',
        items: [
          {
            foo: 'bar',
          },
        ],
      }),
      JSON.stringify(validateFilter.errors),
    ).toBe(false);

    const issues = service.validateModelTree({
      uid: 'filter-host-1',
      use: 'FilterHostModel',
      stepParams: {
        filter: {
          logic: '$and',
          items: [
            {
              foo: 'bar',
            },
          ],
        },
      },
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jsonPointer: '#/stepParams/filter/items/0',
          modelUid: 'filter-host-1',
          modelUse: 'FilterHostModel',
          section: 'stepParams',
          keyword: 'oneOf',
        }),
      ]),
    );
  });

  it('should validate the same child use differently under different parent contexts', () => {
    const service = new FlowSchemaService();

    service.registerModelContributions([
      modelContribution('ContextChildModel'),
      modelContribution('ContextParentAlphaModel', {
        subModelSlots: {
          body: objectSlot({
            use: 'ContextChildModel',
            childSchemaPatch: {
              stepParamsSchema: objectSchema(
                {
                  alpha: {
                    type: 'string',
                  },
                },
                { required: ['alpha'], additionalProperties: false },
              ),
            },
          }),
        },
      }),
      modelContribution('ContextParentBetaModel', {
        subModelSlots: {
          body: objectSlot({
            use: 'ContextChildModel',
            childSchemaPatch: {
              stepParamsSchema: objectSchema(
                {
                  beta: {
                    type: 'number',
                  },
                },
                { required: ['beta'], additionalProperties: false },
              ),
            },
          }),
        },
      }),
    ]);

    const alphaIssues = service.validateModelTree({
      uid: 'ctx-alpha-1',
      use: 'ContextParentAlphaModel',
      subModels: {
        body: {
          uid: 'ctx-child-alpha-1',
          use: 'ContextChildModel',
          stepParams: {
            alpha: 'ok',
          },
        },
      },
    });
    expect(alphaIssues.filter((item) => item.level === 'error')).toEqual([]);

    const betaIssues = service.validateModelTree({
      uid: 'ctx-beta-1',
      use: 'ContextParentBetaModel',
      subModels: {
        body: {
          uid: 'ctx-child-beta-1',
          use: 'ContextChildModel',
          stepParams: {
            alpha: 'ok',
          },
        },
      },
    });
    expect(betaIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUid: 'ctx-child-beta-1',
          modelUse: 'ContextChildModel',
          section: 'stepParams',
          level: 'error',
        }),
      ]),
    );
  });

  it('should validate descendant patches through the full ancestor chain', () => {
    const service = new FlowSchemaService();

    service.registerModelContributions([
      modelContribution('AncestorChildModel'),
      modelContribution('AncestorBridgeModel'),
      modelContribution('AncestorRootModel', {
        subModelSlots: {
          body: objectSlot({
            use: 'AncestorBridgeModel',
            childSchemaPatch: {
              subModelSlots: {
                leaf: objectSlot({
                  use: 'AncestorChildModel',
                  childSchemaPatch: {
                    stepParamsSchema: objectSchema(
                      {
                        marker: {
                          type: 'string',
                        },
                        directOnly: {
                          type: 'string',
                        },
                      },
                      { required: ['directOnly'], additionalProperties: false },
                    ),
                  },
                }),
              },
            },
            descendantSchemaPatches: [
              {
                path: [
                  {
                    slotKey: 'leaf',
                    use: 'AncestorChildModel',
                  },
                ],
                patch: {
                  stepParamsSchema: objectSchema(
                    {
                      marker: {
                        type: 'number',
                      },
                      ancestorOnly: {
                        type: 'boolean',
                      },
                    },
                    { required: ['ancestorOnly'] },
                  ),
                },
              },
            ],
          }),
        },
      }),
    ]);

    const passIssues = service.validateModelTree({
      uid: 'ctx-ancestor-1',
      use: 'AncestorRootModel',
      subModels: {
        body: {
          uid: 'ctx-bridge-1',
          use: 'AncestorBridgeModel',
          subModels: {
            leaf: {
              uid: 'ctx-leaf-1',
              use: 'AncestorChildModel',
              stepParams: {
                ancestorOnly: true,
                directOnly: 'ok',
                marker: 'direct',
              },
            },
          },
        },
      },
    });
    expect(passIssues.filter((item) => item.level === 'error')).toEqual([]);

    const failIssues = service.validateModelTree({
      uid: 'ctx-ancestor-2',
      use: 'AncestorRootModel',
      subModels: {
        body: {
          uid: 'ctx-bridge-2',
          use: 'AncestorBridgeModel',
          subModels: {
            leaf: {
              uid: 'ctx-leaf-2',
              use: 'AncestorChildModel',
              stepParams: {
                ancestorOnly: 'bad',
                directOnly: 'ok',
                marker: 'direct',
              },
            },
          },
        },
      },
    });
    expect(failIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jsonPointer: '#/subModels/body/subModels/leaf/stepParams/ancestorOnly',
          modelUid: 'ctx-leaf-2',
          modelUse: 'AncestorChildModel',
          section: 'stepParams',
          keyword: 'type',
          level: 'error',
        }),
      ]),
    );
  });

  it('should downgrade invalid generic filter trees to warnings when validation is loose', () => {
    const service = new FlowSchemaService();

    service.registerModelContributions([
      modelContribution('LooseFilterHostModel', {
        strict: false,
        stepParamsSchema: objectSchema(
          {
            filter: genericFilterSchema,
          },
          { required: ['filter'], additionalProperties: false },
        ),
      }),
    ]);

    const issues = service.validateModelTree({
      uid: 'loose-filter-host-1',
      use: 'LooseFilterHostModel',
      stepParams: {
        filter: {
          logic: '$and',
          items: [
            {
              foo: 'bar',
            },
          ],
        },
      },
    });

    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jsonPointer: '#/stepParams/filter/items/0',
          modelUid: 'loose-filter-host-1',
          modelUse: 'LooseFilterHostModel',
          section: 'stepParams',
          keyword: 'oneOf',
          level: 'warning',
        }),
      ]),
    );
  });

  it('should validate representative dynamic event flow actions with official contributions', () => {
    const service = new FlowSchemaService();
    service.registerActionContributions(flowSchemaContribution.actions || []);
    service.registerModelContributions(flowSchemaContribution.models || []);
    service.registerInventory(flowSchemaContribution.inventory, 'official');

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
      flowRegistry: buildDynamicEventFlowRegistry(),
    });

    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should resolve official BlockGridModel item candidates from inventory slot expansions', () => {
    const service = new FlowSchemaService();
    service.registerModelContributions(flowSchemaContribution.models || []);
    service.registerInventory(flowSchemaContribution.inventory, 'official');

    const bundle = service.getBundle(['BlockGridModel']);

    expect(bundle.items[0]).toMatchObject({
      use: 'BlockGridModel',
      subModelCatalog: {
        items: {
          type: 'array',
          candidates: expect.arrayContaining([
            expect.objectContaining({ use: 'CreateFormModel' }),
            expect.objectContaining({ use: 'DetailsBlockModel' }),
            expect.objectContaining({ use: 'TableBlockModel' }),
          ]),
        },
      },
    });
  });

  it('should accept null action icons for link-style edit actions', () => {
    const service = new FlowSchemaService();
    service.registerModelContributions([
      modelContribution('EditActionModel', {
        stepParamsSchema: createActionStepParamsSchema({
          popupSettings: popupActionSettingsStepParamsSchema,
        }),
      }),
    ]);

    const payload = {
      uid: 'edit-action-1',
      use: 'EditActionModel',
      parentId: 'table-actions-col-1',
      subKey: 'actions',
      subType: 'array',
      stepParams: {
        popupSettings: {
          openView: {
            collectionName: 'orders',
            dataSourceKey: 'main',
          },
        },
        buttonSettings: {
          general: {
            type: 'link',
            icon: null,
          },
        },
      },
    };

    const issues = service.validateModelTree(payload);
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should re-resolve dynamic step validators when schema changes at the same path', () => {
    const service = new FlowSchemaService();

    service.registerActionContributions([
      {
        name: 'dynamicBooleanAction',
        paramsSchema: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
            },
          },
          required: ['enabled'],
          additionalProperties: false,
        },
      },
      {
        name: 'dynamicStringAction',
        paramsSchema: {
          type: 'object',
          properties: {
            enabled: {
              type: 'string',
            },
          },
          required: ['enabled'],
          additionalProperties: false,
        },
      },
    ]);
    service.registerModelContributions([
      modelContribution('DynamicStepHostModel', {
        flowRegistrySchema: objectSchema(),
      }),
    ]);

    const firstIssues = service.validateModelTree({
      uid: 'dynamic-step-host-1',
      use: 'DynamicStepHostModel',
      flowRegistry: {
        settings: {
          steps: {
            save: {
              use: 'dynamicBooleanAction',
            },
          },
        },
      },
      stepParams: {
        settings: {
          save: {
            enabled: true,
          },
        },
      },
    });
    expect(firstIssues.filter((item) => item.level === 'error')).toEqual([]);

    const secondIssues = service.validateModelTree({
      uid: 'dynamic-step-host-2',
      use: 'DynamicStepHostModel',
      flowRegistry: {
        settings: {
          steps: {
            save: {
              use: 'dynamicStringAction',
            },
          },
        },
      },
      stepParams: {
        settings: {
          save: {
            enabled: true,
          },
        },
      },
    });

    expect(secondIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jsonPointer: '#/stepParams/settings/save/enabled',
          modelUid: 'dynamic-step-host-2',
          modelUse: 'DynamicStepHostModel',
          section: 'stepParams',
          keyword: 'type',
        }),
      ]),
    );
  });

  it('should treat paramsSchemaOverride as a JSON schema object in flow definitions', () => {
    const service = new FlowSchemaService();

    service.registerActionContributions([
      {
        name: 'overrideSchemaAction',
        paramsSchema: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
            },
          },
          required: ['enabled'],
          additionalProperties: false,
        },
      },
    ]);
    service.registerModelContributions([
      modelContribution('OverrideSchemaHostModel', {
        flowRegistrySchema: objectSchema(),
      }),
    ]);

    const issues = service.validateModelTree({
      uid: 'override-schema-host-1',
      use: 'OverrideSchemaHostModel',
      flowRegistry: {
        settings: {
          steps: {
            save: {
              use: 'overrideSchemaAction',
              paramsSchemaOverride: {
                type: 'object',
                properties: {
                  label: {
                    type: 'string',
                  },
                },
                required: ['label'],
                additionalProperties: false,
              },
            },
          },
        },
      },
    });

    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });
});
