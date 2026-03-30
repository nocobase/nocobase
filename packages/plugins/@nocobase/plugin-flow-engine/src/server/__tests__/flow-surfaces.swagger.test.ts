/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import swaggerDocument from '../../swagger';
import { FLOW_SURFACES_ACTION_METHODS, FLOW_SURFACES_ACTION_NAMES } from '../flow-surfaces/constants';

const DOC_ONLY_ACTION_NAMES = ['addRecordAction', 'addBlocks', 'addFields', 'addActions', 'addRecordActions'] as const;

describe('flowSurfaces swagger', () => {
  it('should keep exported swagger paths aligned with public flowSurfaces actions plus doc-only future actions', () => {
    const expectedPaths = [
      ...FLOW_SURFACES_ACTION_NAMES.map((actionName) => `/flowSurfaces:${actionName}`),
      ...DOC_ONLY_ACTION_NAMES.map((actionName) => `/flowSurfaces:${actionName}`),
    ].sort();
    const actualPaths = Object.keys(swaggerDocument.paths).sort();

    expect(swaggerDocument.openapi).toBe('3.0.2');
    expect(swaggerDocument.info?.title).toBe('NocoBase API - Flow engine plugin');
    expect(actualPaths).toEqual(expect.arrayContaining(expectedPaths));
    expect(new Set(actualPaths).size).toBe(actualPaths.length);

    for (const actionName of FLOW_SURFACES_ACTION_NAMES) {
      const path = `/flowSurfaces:${actionName}`;
      const expectedMethod = FLOW_SURFACES_ACTION_METHODS[actionName];
      const pathItem = swaggerDocument.paths[path];

      expect(pathItem).toBeTruthy();
      expect(pathItem[expectedMethod]).toBeTruthy();
      expect(Object.keys(pathItem)).toEqual([expectedMethod]);
    }

    for (const actionName of DOC_ONLY_ACTION_NAMES) {
      const path = `/flowSurfaces:${actionName}`;
      const pathItem = swaggerDocument.paths[path];

      expect(pathItem).toBeTruthy();
      expect(pathItem.post).toBeTruthy();
      expect(Object.keys(pathItem)).toEqual(['post']);
    }
  });

  it('should expose recursive tree schemas, mutate op union and representative request examples', () => {
    const schemas = swaggerDocument.components?.schemas || {};
    const parameters = swaggerDocument.components?.parameters || {};

    expect(schemas.FlowSurfaceTarget).toBeTruthy();
    expect(schemas.FlowSurfaceResolvedTarget).toBeTruthy();
    expect(schemas.FlowSurfaceCatalogItem).toBeTruthy();
    expect(schemas.FlowSurfaceNodeContract).toBeTruthy();
    expect(schemas.FlowSurfaceDomainContract).toBeTruthy();
    expect(schemas.FlowSurfaceDomainGroupContract).toBeTruthy();
    expect(schemas.FlowSurfaceFilterCondition).toBeTruthy();
    expect(schemas.FlowSurfaceFilterGroup).toBeTruthy();
    expect(schemas.FlowSurfaceNodeSpec).toBeTruthy();
    expect(schemas.FlowSurfaceApplySpec).toBeTruthy();
    expect(schemas.FlowSurfaceGetResponse).toBeTruthy();
    expect(schemas.FlowSurfaceComposeRequest).toBeTruthy();
    expect(schemas.FlowSurfaceComposeResult).toBeTruthy();
    expect(schemas.FlowSurfaceComposeRecordActionSpec).toBeTruthy();
    expect(schemas.FlowSurfaceConfigureRequest).toBeTruthy();
    expect(schemas.FlowSurfaceConfigureResult).toBeTruthy();
    expect(schemas.FlowSurfaceMutateOp).toBeTruthy();
    expect(schemas.FlowSurfaceMutationResponse).toBeTruthy();
    expect(schemas.FlowSurfaceErrorResponse).toBeTruthy();
    expect(schemas.FlowSurfaceAddRecordActionRequest).toBeTruthy();
    expect(schemas.FlowSurfaceAddRecordActionResult).toBeTruthy();
    expect(schemas.FlowSurfaceAddBlocksRequest).toBeTruthy();
    expect(schemas.FlowSurfaceAddFieldsRequest).toBeTruthy();
    expect(schemas.FlowSurfaceAddActionsRequest).toBeTruthy();
    expect(schemas.FlowSurfaceAddRecordActionsRequest).toBeTruthy();
    expect(schemas.FlowSurfaceAddBlocksResult).toBeTruthy();
    expect(schemas.FlowSurfaceAddFieldsResult).toBeTruthy();
    expect(schemas.FlowSurfaceAddActionsResult).toBeTruthy();
    expect(schemas.FlowSurfaceAddRecordActionsResult).toBeTruthy();

    expect(schemas.FlowSurfaceNodeSpec.properties.subModels.additionalProperties.oneOf).toEqual(
      expect.arrayContaining([
        {
          $ref: '#/components/schemas/FlowSurfaceNodeSpec',
        },
      ]),
    );
    expect(schemas.FlowSurfaceApplySpec.properties.subModels.additionalProperties.oneOf).toEqual(
      expect.arrayContaining([
        {
          $ref: '#/components/schemas/FlowSurfaceNodeSpec',
        },
      ]),
    );
    expect(schemas.FlowSurfaceGetTreeNode.properties.subModels.additionalProperties.oneOf).toEqual(
      expect.arrayContaining([
        {
          $ref: '#/components/schemas/FlowSurfaceGetTreeNode',
        },
      ]),
    );

    const mutateOpRefs = (schemas.FlowSurfaceMutateOp.oneOf || []).map((item: any) => item.$ref);
    expect(mutateOpRefs).toHaveLength(15);
    expect(mutateOpRefs).toEqual(
      expect.arrayContaining([
        '#/components/schemas/FlowSurfaceMutateOpCreatePage',
        '#/components/schemas/FlowSurfaceMutateOpAddBlock',
        '#/components/schemas/FlowSurfaceMutateOpAddField',
        '#/components/schemas/FlowSurfaceMutateOpAddAction',
        '#/components/schemas/FlowSurfaceMutateOpAddRecordAction',
        '#/components/schemas/FlowSurfaceMutateOpUpdateSettings',
        '#/components/schemas/FlowSurfaceMutateOpSetLayout',
        '#/components/schemas/FlowSurfaceMutateOpRemoveNode',
      ]),
    );

    expect(parameters.flowSurfaceTargetUid.example).toBe('view-action-uid');
    expect(parameters.flowSurfaceTargetPageSchemaUid.example).toBe('employees-page-schema');
    expect(parameters.flowSurfaceTargetTabSchemaUid.example).toBe('details-tab-schema');
    expect(parameters.flowSurfaceTargetRouteId.example).toBe(101);

    const catalogRequest = swaggerDocument.paths['/flowSurfaces:catalog'].post.requestBody.content['application/json'];
    expect(catalogRequest.example?.target?.uid).toBe('table-block-uid');
    expect(schemas.FlowSurfaceCatalogResponse.properties.actions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceCatalogItem',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceCatalogItem',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.recordActions.description).toContain(
      'table/details/list/gridCard',
    );

    const composeRequest = swaggerDocument.paths['/flowSurfaces:compose'].post.requestBody.content['application/json'];
    expect(composeRequest.examples.filterTable.value.blocks).toHaveLength(2);
    expect(composeRequest.examples.filterTable.value.layout?.rows?.[0]?.[0]?.key).toBe('filter');
    const filterTableBlock = composeRequest.examples.filterTable.value.blocks[1];
    expect(filterTableBlock.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldPath: 'roles.title',
        }),
      ]),
    );
    expect(filterTableBlock.actions).toEqual(['filter', 'addNew', 'refresh', 'bulkDelete', 'link']);
    expect(filterTableBlock.recordActions.map((item: any) => (typeof item === 'string' ? item : item.type))).toEqual([
      'view',
      'edit',
      'popup',
      'updateRecord',
      'delete',
    ]);
    expect(filterTableBlock.recordActions[2].popup.blocks[0].type).toBe('details');
    expect(composeRequest.examples.staticBlocks.value.blocks[0].type).toBe('markdown');
    expect(composeRequest.examples.staticBlocks.value.blocks[1].type).toBe('iframe');
    expect(composeRequest.examples.listRich.value.blocks[0].type).toBe('list');
    expect(composeRequest.examples.listRich.value.blocks[0].recordActions).toBeTruthy();
    expect(
      composeRequest.examples.listRich.value.blocks[0].recordActions.map((item: any) =>
        typeof item === 'string' ? item : item.type,
      ),
    ).toEqual(expect.arrayContaining(['view', 'edit', 'popup', 'delete']));
    expect(composeRequest.examples.gridCardRich.value.blocks[0].type).toBe('gridCard');
    expect(composeRequest.examples.gridCardRich.value.blocks[0].recordActions).toBeTruthy();
    expect(
      composeRequest.examples.gridCardRich.value.blocks[0].recordActions.map((item: any) =>
        typeof item === 'string' ? item : item.type,
      ),
    ).toEqual(expect.arrayContaining(['view', 'edit', 'updateRecord', 'delete']));
    expect(composeRequest.examples.jsBlock.value.blocks[0].type).toBe('jsBlock');
    expect(composeRequest.examples.jsBlock.value.blocks[0].settings.code).toContain('Hello from JS block');

    expect(schemas.FlowSurfaceComposeBlockSpec.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeRecordActionSpec',
    );
    expect(schemas.FlowSurfaceComposeBlockSpec.properties.actions.description).toContain('Block-level actions');
    expect(schemas.FlowSurfaceComposeBlockSpec.properties.recordActions.description).toContain(
      'table/details/list/gridCard',
    );
    expect(schemas.FlowSurfaceComposeBlockSpec.properties.type.enum).toEqual(
      expect.arrayContaining(['table', 'filterForm', 'actionPanel', 'jsBlock']),
    );
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[1].properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[2].properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceComposeActionSpec.oneOf[1].properties.type.enum).toEqual(
      expect.arrayContaining([
        'filter',
        'expandCollapse',
        'bulkEdit',
        'bulkUpdate',
        'export',
        'exportAttachments',
        'upload',
        'composeEmail',
        'templatePrint',
        'triggerWorkflow',
        'link',
        'submit',
        'reset',
        'collapse',
        'js',
      ]),
    );
    expect(schemas.FlowSurfaceComposeActionSpec.oneOf[1].properties.type.enum).not.toEqual(
      expect.arrayContaining(['view', 'edit', 'delete', 'updateRecord', 'duplicate', 'addChild']),
    );
    expect(schemas.FlowSurfaceComposeRecordActionSpec.oneOf[1].properties.type.enum).toEqual(
      expect.arrayContaining(['view', 'edit', 'delete', 'updateRecord', 'duplicate', 'addChild', 'popup', 'js']),
    );
    expect(schemas.FlowSurfaceComposeBlockResult.properties.itemUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeBlockResult.properties.itemGridUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeBlockResult.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionResult',
    );
    expect(schemas.FlowSurfaceComposeBlockResult.properties.recordActions.description).toContain(
      'table/details/list/gridCard',
    );
    expect(schemas.FlowSurfaceComposeActionResult.properties.popupGridUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeActionResult.properties.assignFormUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeActionResult.properties.type.enum).toEqual(
      expect.arrayContaining(['link', 'popup', 'duplicate', 'updateRecord', 'templatePrint', 'triggerWorkflow']),
    );
    expect(schemas.FlowSurfaceComposeFieldResult.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceComposeFieldResult.properties.type.enum).toEqual(['jsColumn', 'jsItem']);

    const configureRequest =
      swaggerDocument.paths['/flowSurfaces:configure'].post.requestBody.content['application/json'];
    expect(configureRequest.examples.fieldOpenView.value.changes.clickToOpen).toBe(true);
    expect(configureRequest.examples.fieldOpenView.value.changes.openView.collectionName).toBe('departments');
    expect(configureRequest.examples.relationFieldPopup.value.changes.openView.collectionName).toBe('roles');
    expect(configureRequest.examples.blockSettings.value.changes.pageSize).toBe(50);
    expect(configureRequest.examples.blockSettings.value.changes.dataScope.logic).toBe('$and');
    expect(configureRequest.examples.blockSettings.value.changes.dataScope.items[0]).toMatchObject({
      path: 'nickname',
      operator: '$eq',
      value: 'beta',
    });
    expect(configureRequest.examples.actionSettings.value.changes.assignValues.status).toBe('active');
    expect(configureRequest.examples.jsBlockSettings.value.changes.code).toContain('Users hero');
    expect(configureRequest.examples.jsActionSettings.value.changes.version).toBe('1.0.1');
    expect(configureRequest.examples.jsFieldSettings.value.changes.code).toContain('toUpperCase');
    expect(configureRequest.examples.jsColumnSettings.value.changes.fixed).toBe('left');
    expect(configureRequest.examples.jsItemSettings.value.changes.showLabel).toBe(true);
    expect(configureRequest.examples.pageHeaderSettings.value.changes.icon).toBe('UserOutlined');
    expect(configureRequest.examples.pageHeaderSettings.value.changes.enableHeader).toBe(false);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.quickEdit).toBe(true);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.treeTable).toBe(true);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.defaultExpandAllRows).toBe(true);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.dragSort).toBe(true);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.dragSortBy).toBe('sort');
    expect(configureRequest.examples.editFormSettings.value.changes.colon).toBe(false);
    expect(configureRequest.examples.editFormSettings.value.changes.dataScope.logic).toBe('$and');
    expect(configureRequest.examples.detailsSettings.value.changes.colon).toBe(true);
    expect(configureRequest.examples.detailsSettings.value.changes.linkageRules).toHaveLength(1);
    expect(configureRequest.examples.actionBehaviorSettings.value.changes.editMode).toBe('drawer');
    expect(configureRequest.examples.actionBehaviorSettings.value.changes.updateMode).toBe('overwrite');
    expect(configureRequest.examples.actionBehaviorSettings.value.changes.duplicateMode).toBe('popup');
    expect(configureRequest.examples.actionBehaviorSettings.value.changes.collapsedRows).toBe(2);
    expect(configureRequest.examples.actionBehaviorSettings.value.changes.defaultCollapsed).toBe(true);
    expect(configureRequest.examples.actionBehaviorSettings.value.changes.emailFieldNames).toEqual([
      'email',
      'backupEmail',
    ]);
    expect(configureRequest.examples.actionBehaviorSettings.value.changes.defaultSelectAllRecords).toBe(true);

    const addFieldRequest =
      swaggerDocument.paths['/flowSurfaces:addField'].post.requestBody.content['application/json'];
    expect(addFieldRequest.examples.directField.value.renderer).toBe('js');
    expect(addFieldRequest.examples.directField.value.fieldUse).toBeUndefined();
    expect(addFieldRequest.examples.directField.value.settings.label).toBe('Nickname (JS)');
    expect(addFieldRequest.examples.relationField.value.associationPathName).toBe('department');
    expect(addFieldRequest.examples.relationField.value.settings.width).toBe(240);
    expect(addFieldRequest.examples.jsColumn.value.type).toBe('jsColumn');
    expect(addFieldRequest.examples.jsColumn.value.settings.code).toContain('record.nickname');
    expect(addFieldRequest.examples.jsItem.value.type).toBe('jsItem');
    expect(addFieldRequest.examples.jsItem.value.settings.version).toBe('1.0.0');
    expect(schemas.FlowSurfaceAddFieldRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddFieldResult.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceAddFieldResult.properties.type.enum).toEqual(['jsColumn', 'jsItem']);

    const addBlockRequest =
      swaggerDocument.paths['/flowSurfaces:addBlock'].post.requestBody.content['application/json'];
    expect(addBlockRequest.examples.jsBlock.value.type).toBe('jsBlock');
    expect(addBlockRequest.examples.jsBlock.value.settings.code).toContain('Users banner');
    expect(schemas.FlowSurfaceAddBlockRequest.properties.type.enum).toEqual(
      expect.arrayContaining(['markdown', 'actionPanel', 'jsBlock']),
    );
    expect(schemas.FlowSurfaceAddBlockRequest.properties.settings.type).toBe('object');

    const addActionRequest =
      swaggerDocument.paths['/flowSurfaces:addAction'].post.requestBody.content['application/json'];
    expect(addActionRequest.examples.submit.value.type).toBe('submit');
    expect(addActionRequest.examples.submit.value.settings.confirm).toBe(false);
    expect(addActionRequest.examples.link.value.type).toBe('link');
    expect(addActionRequest.examples.link.value.settings.title).toBe('Open docs');
    expect(addActionRequest.examples.js.value.type).toBe('js');
    expect(addActionRequest.examples.js.value.settings.version).toBe('1.0.0');
    expect(schemas.FlowSurfaceAddActionRequest.properties.scope).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionRequest.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddActionRequest.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddActionRequest.properties.type.enum).toEqual(
      expect.arrayContaining([
        'filter',
        'expandCollapse',
        'bulkEdit',
        'bulkUpdate',
        'export',
        'exportAttachments',
        'upload',
        'composeEmail',
        'templatePrint',
        'triggerWorkflow',
        'link',
        'submit',
        'reset',
        'collapse',
        'js',
      ]),
    );
    expect(schemas.FlowSurfaceAddActionRequest.properties.type.enum).not.toEqual(
      expect.arrayContaining(['view', 'edit', 'delete', 'updateRecord', 'duplicate', 'addChild']),
    );

    const addRecordActionRequest =
      swaggerDocument.paths['/flowSurfaces:addRecordAction'].post.requestBody.content['application/json'];
    expect(addRecordActionRequest.examples.view.value.type).toBe('view');
    expect(addRecordActionRequest.examples.view.value.settings.openView.mode).toBe('drawer');
    expect(addRecordActionRequest.examples.view.value.popup.blocks[0].type).toBe('details');
    expect(addRecordActionRequest.examples.js.value.type).toBe('js');
    expect(addRecordActionRequest.examples.js.value.settings.code).toContain('currentRecord');
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.type.enum).toEqual(
      expect.arrayContaining(['view', 'edit', 'delete', 'updateRecord', 'duplicate', 'addChild', 'popup', 'js']),
    );
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.type.enum).not.toEqual(
      expect.arrayContaining(['submit', 'reset', 'filter', 'bulkDelete']),
    );

    const addBlocksRequest =
      swaggerDocument.paths['/flowSurfaces:addBlocks'].post.requestBody.content['application/json'];
    expect(addBlocksRequest.example.blocks).toHaveLength(2);
    expect(addBlocksRequest.example.blocks[0].type).toBe('table');
    expect(addBlocksRequest.example.blocks[1].type).toBe('markdown');
    expect(addBlocksRequest.example.blocks[0].settings.pageSize).toBe(50);
    expect(addBlocksRequest.example.blocks[1].settings.content).toContain('Team notes');
    expect(schemas.FlowSurfaceAddBlocksRequest.required).toEqual(['target', 'blocks']);
    expect(schemas.FlowSurfaceAddBlockItem.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddBlocksResult.properties.blocks.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceAddBlocksItemResult',
    );
    expect(schemas.FlowSurfaceAddBlocksResult.properties.successCount.type).toBe('integer');
    expect(schemas.FlowSurfaceAddBlocksResult.properties.errorCount.type).toBe('integer');

    const addFieldsRequest =
      swaggerDocument.paths['/flowSurfaces:addFields'].post.requestBody.content['application/json'];
    expect(addFieldsRequest.example.fields).toHaveLength(2);
    expect(addFieldsRequest.example.fields[1].renderer).toBe('js');
    expect(addFieldsRequest.example.fields[0].settings.title).toBe('User name');
    expect(addFieldsRequest.example.fields[1].settings.version).toBe('1.0.0');
    expect(schemas.FlowSurfaceAddFieldsRequest.required).toEqual(['target', 'fields']);
    expect(schemas.FlowSurfaceAddFieldItem.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddFieldsResult.properties.fields.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceAddFieldsItemResult',
    );

    const addActionsRequest =
      swaggerDocument.paths['/flowSurfaces:addActions'].post.requestBody.content['application/json'];
    expect(addActionsRequest.example.actions).toHaveLength(2);
    expect(addActionsRequest.example.actions[0].type).toBe('submit');
    expect(addActionsRequest.example.actions[1].type).toBe('reset');
    expect(addActionsRequest.example.actions[0].settings.confirm).toBe(false);
    expect(schemas.FlowSurfaceAddActionsRequest.required).toEqual(['target', 'actions']);
    expect(schemas.FlowSurfaceAddActionItem.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddActionItem.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddActionsResult.properties.actions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceAddActionsItemResult',
    );

    const addRecordActionsRequest =
      swaggerDocument.paths['/flowSurfaces:addRecordActions'].post.requestBody.content['application/json'];
    expect(addRecordActionsRequest.example.recordActions).toHaveLength(3);
    expect(addRecordActionsRequest.example.recordActions.map((item: any) => item.type)).toEqual([
      'view',
      'edit',
      'delete',
    ]);
    expect(addRecordActionsRequest.example.recordActions[0].settings.openView.mode).toBe('drawer');
    expect(addRecordActionsRequest.example.recordActions[0].popup.blocks[0].type).toBe('details');
    expect(schemas.FlowSurfaceAddRecordActionsRequest.required).toEqual(['target', 'recordActions']);
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddRecordActionsResult.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceAddRecordActionsItemResult',
    );
    expect(schemas.FlowSurfaceAddRecordActionsResult.properties.successCount.type).toBe('integer');
    expect(schemas.FlowSurfaceAddActionResult.properties.popupPageUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddActionResult.properties.popupTabUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddActionResult.properties.popupGridUid.type).toBe('string');

    const mutateRequest = swaggerDocument.paths['/flowSurfaces:mutate'].post.requestBody.content['application/json'];
    expect(mutateRequest.example.atomic).toBe(true);
    expect(mutateRequest.example.ops[1].values.target.uid.$ref).toBe('page.tabSchemaUid');

    const applyRequest = swaggerDocument.paths['/flowSurfaces:apply'].post.requestBody.content['application/json'];
    expect(applyRequest.example.mode).toBe('replace');
    expect(applyRequest.example.spec.subModels.items).toHaveLength(2);
    expect(schemas.FlowSurfaceFilterGroup.properties.logic.enum).toEqual(['$and', '$or']);
    expect(schemas.FlowSurfaceFilterGroup.properties.items.type).toBe('array');
    expect(schemas.FlowSurfaceFilterGroup.example).toEqual({ logic: '$and', items: [] });

    const getPath = swaggerDocument.paths['/flowSurfaces:get'].get;
    expect(getPath.requestBody).toBeUndefined();
    expect(getPath.parameters).toHaveLength(4);
    expect(getPath.parameters.map((parameter: any) => parameter.$ref)).toEqual([
      '#/components/parameters/flowSurfaceTargetUid',
      '#/components/parameters/flowSurfaceTargetPageSchemaUid',
      '#/components/parameters/flowSurfaceTargetTabSchemaUid',
      '#/components/parameters/flowSurfaceTargetRouteId',
    ]);
    expect(getPath.description).toContain('只接受根级定位字段');
    expect(getPath.description).toContain('不要使用 `{ target: { ... } }` 包裹');

    for (const actionName of [
      'catalog',
      'compose',
      'configure',
      'createPage',
      'destroyPage',
      'addTab',
      'updateTab',
      'moveTab',
      'removeTab',
      'addBlock',
      'addAction',
      'addRecordAction',
      'addBlocks',
      'addFields',
      'addActions',
      'addRecordActions',
      'updateSettings',
      'setEventFlows',
      'setLayout',
      'moveNode',
      'removeNode',
      'mutate',
      'apply',
    ] as const) {
      const operation = swaggerDocument.paths[`/flowSurfaces:${actionName}`].post;
      expect(operation.requestBody?.content?.['application/json']).toBeTruthy();
      expect(operation.responses?.[200]?.content?.['application/json']?.schema?.properties?.data).toBeTruthy();
      expect(operation.responses?.[500]?.content?.['application/json']?.schema?.$ref).toBe(
        '#/components/schemas/FlowSurfaceErrorResponse',
      );
    }
  });
});
