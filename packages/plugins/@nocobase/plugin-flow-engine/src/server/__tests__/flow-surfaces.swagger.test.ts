/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import swaggerDocument from '../../swagger';
import {
  FLOW_SURFACE_MUTATE_OP_TYPES,
  FLOW_SURFACES_ACTION_METHODS,
  FLOW_SURFACES_ACTION_NAMES,
} from '../flow-surfaces/constants';

describe('flowSurfaces swagger', () => {
  it('should keep exported swagger paths aligned with public flowSurfaces actions only', () => {
    const expectedPaths = FLOW_SURFACES_ACTION_NAMES.map((actionName) => `/flowSurfaces:${actionName}`).sort();
    const actualPaths = Object.keys(swaggerDocument.paths).sort();

    expect(swaggerDocument.openapi).toBe('3.0.2');
    expect(swaggerDocument.info?.title).toBe('NocoBase API - Flow engine plugin');
    expect(swaggerDocument.info?.version).toBe('1.0.0');
    expect(actualPaths).toEqual(expectedPaths);
    expect(new Set(actualPaths).size).toBe(actualPaths.length);

    for (const actionName of FLOW_SURFACES_ACTION_NAMES) {
      const path = `/flowSurfaces:${actionName}`;
      const expectedMethod = FLOW_SURFACES_ACTION_METHODS[actionName];
      const pathItem = swaggerDocument.paths[path];

      expect(pathItem).toBeTruthy();
      expect(pathItem[expectedMethod]).toBeTruthy();
      expect(Object.keys(pathItem)).toEqual([expectedMethod]);
    }
  });

  it('should expose recursive tree schemas, flattened mutate schema and representative request examples', () => {
    const schemas = swaggerDocument.components?.schemas || {};
    const parameters = swaggerDocument.components?.parameters || {};

    expect(schemas.FlowSurfaceWriteTarget).toBeTruthy();
    expect(schemas.FlowSurfaceWriteTarget.required).toEqual(['uid']);
    expect(schemas.FlowSurfaceMutateWriteTarget).toBeTruthy();
    expect(schemas.FlowSurfaceAddTabRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceUpdateTabRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceMoveTabRequest.required).toEqual(['sourceUid', 'targetUid']);
    expect(schemas.FlowSurfaceAddPopupTabRequest).toBeTruthy();
    expect(schemas.FlowSurfaceAddPopupTabResult).toBeTruthy();
    expect(schemas.FlowSurfaceAddPopupTabResult.properties.popupPageUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddPopupTabResult.properties.popupTabUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddPopupTabResult.properties.popupGridUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddPopupTabResult.properties.tabUid).toBeUndefined();
    expect(schemas.FlowSurfaceAddPopupTabResult.properties.gridUid).toBeUndefined();
    expect(schemas.FlowSurfaceUpdatePopupTabRequest).toBeTruthy();
    expect(schemas.FlowSurfaceUpdatePopupTabResult).toBeTruthy();
    expect(schemas.FlowSurfaceMovePopupTabRequest).toBeTruthy();
    expect(schemas.FlowSurfaceMovePopupTabResult).toBeTruthy();
    expect(schemas.FlowSurfaceRemovePopupTabRequest).toBeTruthy();
    expect(schemas.FlowSurfaceRemovePopupTabResult).toBeTruthy();
    expect(schemas.FlowSurfaceResolvedTarget).toBeTruthy();
    expect(schemas.FlowSurfaceReadTarget).toBeTruthy();
    expect(schemas.FlowSurfaceConfigureOption).toBeTruthy();
    expect(schemas.FlowSurfaceConfigureOptions).toBeTruthy();
    expect(schemas.FlowSurfaceContextVarInfo).toBeTruthy();
    expect(schemas.FlowSurfaceContextRequest).toBeTruthy();
    expect(schemas.FlowSurfaceContextResponse).toBeTruthy();
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
    expect(schemas.FlowSurfaceMutateOpItem).toBeTruthy();
    expect(schemas.FlowSurfaceMutateRef).toBeTruthy();
    expect(schemas.FlowSurfaceMutationResponse).toBeTruthy();
    expect(schemas.FlowSurfaceErrorResponse).toBeTruthy();
    expect(schemas.FlowSurfaceErrorResponse.example).toMatchObject({
      errors: [
        {
          code: 'FLOW_SURFACE_BAD_REQUEST',
          message: expect.any(String),
          status: 400,
          type: 'bad_request',
        },
      ],
    });
    expect(schemas.FlowSurfaceErrorResponse.properties.errors.items.properties.code).toMatchObject({
      type: 'string',
      example: 'FLOW_SURFACE_BAD_REQUEST',
    });
    expect(schemas.FlowSurfaceErrorResponse.properties.errors.items.properties.status).toMatchObject({
      type: 'integer',
      example: 400,
    });
    expect(schemas.FlowSurfaceErrorResponse.properties.errors.items.properties.type).toMatchObject({
      type: 'string',
      example: 'bad_request',
    });
    expect(schemas.FlowSurfaceErrorResponse.properties.errors.items.properties.type.enum).toEqual([
      'bad_request',
      'forbidden',
      'conflict',
      'internal_error',
    ]);
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

    expect(schemas.FlowSurfaceMutateRef.required).toEqual(['ref']);
    expect(schemas.FlowSurfaceMutateRef.properties.ref.type).toBe('string');
    expect(schemas.FlowSurfaceMutateRef.properties.$ref).toBeUndefined();
    expect(schemas.FlowSurfaceMutateOpItem.required).toEqual(['type']);
    expect(schemas.FlowSurfaceMutateOpItem.properties.type.enum).toEqual([...FLOW_SURFACE_MUTATE_OP_TYPES]);
    expect(schemas.FlowSurfaceMutateOpItem.properties.values.additionalProperties).toBe(true);
    expect(schemas.FlowSurfaceMutateOpItem.properties.values.description).toContain('{ ref:');
    expect(schemas.FlowSurfaceMutateOpItem.properties.type.enum).toEqual(
      expect.arrayContaining(['addPopupTab', 'updatePopupTab', 'movePopupTab', 'removePopupTab']),
    );

    expect(parameters.flowSurfaceTargetUid.example).toBe('view-action-uid');
    expect(parameters.flowSurfaceTargetPageSchemaUid.example).toBe('employees-page-schema');
    expect(parameters.flowSurfaceTargetTabSchemaUid.example).toBe('details-tab-schema');
    expect(parameters.flowSurfaceTargetRouteId.example).toBe('101');

    const catalogRequest = swaggerDocument.paths['/flowSurfaces:catalog'].post.requestBody.content['application/json'];
    expect(catalogRequest.example?.target?.uid).toBe('table-block-uid');
    const contextRequest = swaggerDocument.paths['/flowSurfaces:context'].post.requestBody.content['application/json'];
    expect(contextRequest.example?.target?.uid).toBe('details-block-uid');
    expect(contextRequest.example?.path).toBe('record');
    expect(contextRequest.example?.maxDepth).toBe(3);
    expect(schemas.FlowSurfaceContextRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceContextRequest.properties.path.type).toBe('string');
    expect(schemas.FlowSurfaceContextRequest.properties.maxDepth.minimum).toBe(1);
    expect(schemas.FlowSurfaceContextResponse.properties.vars.additionalProperties.$ref).toBe(
      '#/components/schemas/FlowSurfaceContextVarInfo',
    );
    expect(schemas.FlowSurfaceConfigureOption.properties.supportsFlowContext.type).toBe('boolean');
    expect(schemas.FlowSurfaceCatalogResponse.properties.actions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceCatalogItem',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceCatalogItem',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.configureOptions.$ref).toBe(
      '#/components/schemas/FlowSurfaceConfigureOptions',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.recordActions.description).toContain(
      'table/details/list/gridCard',
    );
    expect(schemas.FlowSurfaceCatalogItem.properties.configureOptions.$ref).toBe(
      '#/components/schemas/FlowSurfaceConfigureOptions',
    );
    expect(schemas.FlowSurfaceCatalogItem.properties.resourceBindings.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceResourceBindingOption',
    );
    expect(schemas.FlowSurfaceResourceBindingOption.properties.key.enum).toEqual(
      expect.arrayContaining(['currentCollection', 'currentRecord', 'associatedRecords', 'otherRecords']),
    );
    expect(schemas.FlowSurfaceResourceBindingOption.properties.associationFields.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceResourceBindingAssociationField',
    );
    expect(schemas.FlowSurfaceGetResponse.properties.target.$ref).toBe('#/components/schemas/FlowSurfaceReadTarget');
    expect(schemas.FlowSurfaceGetResponse.properties.tabs).toBeUndefined();
    expect(schemas.FlowSurfaceGetResponse.properties.tabTrees).toBeUndefined();

    const composeRequest = swaggerDocument.paths['/flowSurfaces:compose'].post.requestBody.content['application/json'];
    expect(swaggerDocument.paths['/flowSurfaces:compose'].post.description).toContain(
      '`select / subForm / bulkEditForm` scene',
    );
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
    expect(schemas.FlowSurfaceComposeBlockSpec.properties.resource.$ref).toBe(
      '#/components/schemas/FlowSurfaceBlockResourceInput',
    );
    expect(schemas.FlowSurfaceBlockResourceInput.oneOf).toHaveLength(2);
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
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[1].properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceComposeFieldResult.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceComposeFieldResult.properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceComposeFieldResult.properties.popupPageUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeFieldResult.properties.popupTabUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeFieldResult.properties.popupGridUid.type).toBe('string');
    expect(
      swaggerDocument.paths['/flowSurfaces:compose'].post.requestBody.content['application/json'].examples
        .popupCurrentRecord.value.blocks[0].resource.binding,
    ).toBe('currentRecord');
    expect(
      swaggerDocument.paths['/flowSurfaces:compose'].post.requestBody.content['application/json'].examples
        .popupAssociatedRecords.value.blocks[0].resource,
    ).toMatchObject({
      binding: 'associatedRecords',
      associationField: 'employee',
    });
    expect(schemas.FlowSurfaceSemanticResourceInput.properties.dataSourceKey.type).toBe('string');

    const configureRequest =
      swaggerDocument.paths['/flowSurfaces:configure'].post.requestBody.content['application/json'];
    expect(configureRequest.examples.fieldOpenView.value.changes.clickToOpen).toBe(true);
    expect(configureRequest.examples.fieldOpenView.value.changes.openView.collectionName).toBe('departments');
    expect(configureRequest.examples.associationFieldPopup.value.changes.openView.collectionName).toBe('roles');
    expect(configureRequest.examples.associationFieldPopup.value.changes.openView.associationName).toBe('users.roles');
    expect(schemas.FlowSurfaceConfigureResult.properties.popupPageUid.type).toBe('string');
    expect(schemas.FlowSurfaceConfigureResult.properties.popupTabUid.type).toBe('string');
    expect(schemas.FlowSurfaceConfigureResult.properties.popupGridUid.type).toBe('string');
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
    expect(configureRequest.examples.jsItemActionSettings.value.changes.code).toContain('item diagnostics');
    expect(configureRequest.examples.jsFieldSettings.value.changes.code).toContain('toUpperCase');
    expect(configureRequest.examples.jsColumnSettings.value.changes.fixed).toBe('left');
    expect(configureRequest.examples.jsItemSettings.value.changes.showLabel).toBe(true);
    expect(configureRequest.examples.jsBlockSettings.value.changes.code).not.toContain("return { type: 'div'");
    expect(configureRequest.examples.jsFieldSettings.value.changes.code).not.toContain('return record.');
    expect(configureRequest.examples.jsColumnSettings.value.changes.code).not.toContain('return record.');
    expect(configureRequest.examples.jsItemSettings.value.changes.code).not.toContain('return record.');
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

    const addPopupTabRequest =
      swaggerDocument.paths['/flowSurfaces:addPopupTab'].post.requestBody.content['application/json'];
    expect(addPopupTabRequest.example?.target?.uid).toBe('view-action-popup-page-uid');
    expect(addPopupTabRequest.example?.title).toBe('Popup details');

    const updatePopupTabRequest =
      swaggerDocument.paths['/flowSurfaces:updatePopupTab'].post.requestBody.content['application/json'];
    expect(updatePopupTabRequest.example?.target?.uid).toBe('popup-secondary-tab-uid');
    expect(updatePopupTabRequest.example?.documentTitle).toBe('Popup details updated tab');

    const movePopupTabRequest =
      swaggerDocument.paths['/flowSurfaces:movePopupTab'].post.requestBody.content['application/json'];
    expect(movePopupTabRequest.example).toMatchObject({
      sourceUid: 'popup-secondary-tab-uid',
      targetUid: 'popup-primary-tab-uid',
      position: 'before',
    });

    const removePopupTabRequest =
      swaggerDocument.paths['/flowSurfaces:removePopupTab'].post.requestBody.content['application/json'];
    expect(removePopupTabRequest.example?.target?.uid).toBe('popup-secondary-tab-uid');

    const addFieldRequest =
      swaggerDocument.paths['/flowSurfaces:addField'].post.requestBody.content['application/json'];
    expect(addFieldRequest.examples.directField.value.renderer).toBe('js');
    expect(addFieldRequest.examples.directField.value.fieldUse).toBeUndefined();
    expect(addFieldRequest.examples.directField.value.settings.label).toBe('Nickname (JS)');
    expect(addFieldRequest.examples.associationField.value.associationPathName).toBe('department');
    expect(addFieldRequest.examples.associationField.value.settings.width).toBe(240);
    expect(addFieldRequest.examples.associationField.value.popup.blocks[0].type).toBe('details');
    expect(addFieldRequest.examples.jsColumn.value.type).toBe('jsColumn');
    expect(addFieldRequest.examples.jsColumn.value.settings.code).toContain('ctx.render');
    expect(addFieldRequest.examples.jsColumn.value.settings.code).not.toContain('return record.');
    expect(addFieldRequest.examples.jsItem.value.type).toBe('jsItem');
    expect(addFieldRequest.examples.jsItem.value.settings.version).toBe('1.0.0');
    expect(addFieldRequest.examples.jsItem.value.settings.code).toContain('ctx.render');
    expect(addFieldRequest.examples.jsItem.value.settings.code).not.toContain('return record.');
    expect(schemas.FlowSurfaceAddFieldRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddFieldRequest.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddFieldRequest.properties.wrapperProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldRequest.properties.fieldProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldRequest.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldRequest.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldRequest.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddFieldItem.properties.wrapperProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.fieldProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldResult.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceAddFieldResult.properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceAddFieldResult.properties.popupPageUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddFieldResult.properties.popupTabUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddFieldResult.properties.popupGridUid.type).toBe('string');

    const addBlockRequest =
      swaggerDocument.paths['/flowSurfaces:addBlock'].post.requestBody.content['application/json'];
    expect(swaggerDocument.paths['/flowSurfaces:addBlock'].post.description).toContain(
      '`select / subForm / bulkEditForm` scene',
    );
    expect(addBlockRequest.examples.jsBlock.value.type).toBe('jsBlock');
    expect(addBlockRequest.examples.jsBlock.value.settings.code).toContain('Users banner');
    expect(addBlockRequest.examples.popupCurrentRecord.value.resource.binding).toBe('currentRecord');
    expect(addBlockRequest.examples.popupAssociatedRecords.value.resource).toMatchObject({
      binding: 'associatedRecords',
      associationField: 'employee',
    });
    expect(addBlockRequest.examples.popupOtherRecords.value.resource).toMatchObject({
      binding: 'otherRecords',
      dataSourceKey: 'main',
      collectionName: 'departments',
    });
    expect(schemas.FlowSurfaceAddBlockRequest.properties.type.enum).toEqual(
      expect.arrayContaining(['markdown', 'actionPanel', 'jsBlock']),
    );
    expect(schemas.FlowSurfaceAddBlockRequest.properties.resource.$ref).toBe(
      '#/components/schemas/FlowSurfaceBlockResourceInput',
    );
    expect(schemas.FlowSurfaceAddBlockRequest.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddBlockRequest.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockRequest.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockRequest.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockRequest.properties.flowRegistry).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockItem.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockItem.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockItem.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockItem.properties.flowRegistry).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockItem.properties.resource.$ref).toBe(
      '#/components/schemas/FlowSurfaceBlockResourceInput',
    );

    const addActionRequest =
      swaggerDocument.paths['/flowSurfaces:addAction'].post.requestBody.content['application/json'];
    expect(addActionRequest.examples.submit.value.type).toBe('submit');
    expect(addActionRequest.examples.submit.value.settings.confirm).toBe(false);
    expect(addActionRequest.examples.link.value.type).toBe('link');
    expect(addActionRequest.examples.link.value.settings.title).toBe('Open docs');
    expect(addActionRequest.examples.js.value.type).toBe('js');
    expect(addActionRequest.examples.js.value.settings.version).toBe('1.0.0');
    expect(addActionRequest.examples.js.value.settings.code).not.toContain('return await ctx.runjs');
    expect(addActionRequest.examples.jsItem.value.type).toBe('jsItem');
    expect(addActionRequest.examples.jsItem.value.settings.code).toContain('await ctx.runjs');
    expect(schemas.FlowSurfaceAddActionRequest.properties.scope).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionRequest.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddActionRequest.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddActionRequest.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionRequest.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionRequest.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionRequest.properties.flowRegistry).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionItem.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionItem.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionItem.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionItem.properties.flowRegistry).toBeUndefined();
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
        'jsItem',
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
    expect(swaggerDocument.paths['/flowSurfaces:addRecordAction'].post.description).toContain('table actions column');
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionRequest.properties.flowRegistry).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.flowRegistry).toBeUndefined();
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
    expect(schemas.FlowSurfaceAddBlockItem.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockItem.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlockItem.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddBlocksResult.properties.blocks.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceAddBlocksItemResult',
    );
    expect(schemas.FlowSurfaceAddBlocksResult.properties.successCount.type).toBe('integer');
    expect(schemas.FlowSurfaceAddBlocksResult.properties.errorCount.type).toBe('integer');
    expect(schemas.FlowSurfaceBatchItemError.required).toEqual(['message', 'type', 'code', 'status']);
    expect(schemas.FlowSurfaceBatchItemError.additionalProperties).toBe(false);
    expect(schemas.FlowSurfaceBatchItemError.properties.code.type).toBe('string');
    expect(schemas.FlowSurfaceBatchItemError.properties.status.type).toBe('integer');
    expect(schemas.FlowSurfaceBatchItemError.properties.type.enum).toEqual([
      'bad_request',
      'forbidden',
      'conflict',
      'internal_error',
    ]);

    const addFieldsRequest =
      swaggerDocument.paths['/flowSurfaces:addFields'].post.requestBody.content['application/json'];
    expect(addFieldsRequest.example.fields).toHaveLength(2);
    expect(addFieldsRequest.example.fields[0].popup.blocks[0].type).toBe('details');
    expect(addFieldsRequest.example.fields[1].renderer).toBe('js');
    expect(addFieldsRequest.example.fields[0].settings.title).toBe('User name');
    expect(addFieldsRequest.example.fields[1].settings.version).toBe('1.0.0');
    expect(schemas.FlowSurfaceAddFieldsRequest.required).toEqual(['target', 'fields']);
    expect(schemas.FlowSurfaceAddFieldItem.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddFieldItem.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionPopup',
    );
    expect(schemas.FlowSurfaceAddFieldItem.properties.wrapperProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.fieldProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.stepParams).toBeUndefined();
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
    expect(schemas.FlowSurfaceAddActionItem.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionItem.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionItem.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddActionItem.properties.flowRegistry).toBeUndefined();
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
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionItem.properties.flowRegistry).toBeUndefined();
    expect(schemas.FlowSurfaceAddRecordActionsResult.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceAddRecordActionsItemResult',
    );
    expect(schemas.FlowSurfaceAddRecordActionsResult.properties.successCount.type).toBe('integer');
    expect(schemas.FlowSurfaceAddActionResult.properties.popupPageUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddActionResult.properties.popupTabUid.type).toBe('string');
    expect(schemas.FlowSurfaceAddActionResult.properties.popupGridUid.type).toBe('string');

    const mutateRequest = swaggerDocument.paths['/flowSurfaces:mutate'].post.requestBody.content['application/json'];
    expect(mutateRequest.example.atomic).toBe(true);
    expect(mutateRequest.example.ops[1].values.menuRouteId.ref).toBe('menu.routeId');
    expect(mutateRequest.example.ops[2].values.target.uid.ref).toBe('page.tabSchemaUid');
    expect(JSON.stringify(mutateRequest.example)).not.toContain('"$ref"');
    expect(schemas.FlowSurfaceMutateRequest.properties.target).toBeUndefined();
    expect(schemas.FlowSurfaceMutateRequest.properties.ops.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceMutateOpItem',
    );
    expect(schemas.FlowSurfaceMutateRequest.properties.ops.items.allOf).toBeUndefined();
    expect(schemas.FlowSurfaceMutateRequest.properties.ops.items.oneOf).toBeUndefined();
    expect(schemas.FlowSurfaceMutationItemResult).toBeTruthy();
    expect(schemas.FlowSurfaceMutationItemResult.required).toEqual(['result']);
    expect(schemas.FlowSurfaceMutationResponse.properties.results.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceMutationItemResult',
    );
    expect(schemas.FlowSurfaceMutationResult.oneOf).toEqual(
      expect.arrayContaining([
        { $ref: '#/components/schemas/FlowSurfaceAddPopupTabResult' },
        { $ref: '#/components/schemas/FlowSurfaceUpdatePopupTabResult' },
        { $ref: '#/components/schemas/FlowSurfaceMovePopupTabResult' },
        { $ref: '#/components/schemas/FlowSurfaceRemovePopupTabResult' },
      ]),
    );

    const createMenuRequest =
      swaggerDocument.paths['/flowSurfaces:createMenu'].post.requestBody.content['application/json'];
    expect(createMenuRequest.example.type).toBe('item');
    expect(createMenuRequest.example.parentMenuRouteId).toBe(1001);

    const updateMenuRequest =
      swaggerDocument.paths['/flowSurfaces:updateMenu'].post.requestBody.content['application/json'];
    expect(updateMenuRequest.example.menuRouteId).toBe(1002);

    const createPageRequest =
      swaggerDocument.paths['/flowSurfaces:createPage'].post.requestBody.content['application/json'];
    expect(createPageRequest.example.menuRouteId).toBe(1002);

    const addTabRequest = swaggerDocument.paths['/flowSurfaces:addTab'].post.requestBody.content['application/json'];
    expect(addTabRequest.example.target.uid).toBe('employees-page-uid');
    expect(addTabRequest.example.target.pageSchemaUid).toBeUndefined();

    const removeTabRequest =
      swaggerDocument.paths['/flowSurfaces:removeTab'].post.requestBody.content['application/json'];
    expect(removeTabRequest.example.uid).toBe('details-tab');
    expect(removeTabRequest.example.tabSchemaUid).toBeUndefined();
    expect(swaggerDocument.paths['/flowSurfaces:removeTab'].post.description).toContain(
      'The last outer tab cannot be removed',
    );
    expect(swaggerDocument.paths['/flowSurfaces:removeTab'].post.description).toContain('destroyPage');

    const destroyPageRequest =
      swaggerDocument.paths['/flowSurfaces:destroyPage'].post.requestBody.content['application/json'];
    expect(destroyPageRequest.example.uid).toBe('employees-page-uid');
    expect(destroyPageRequest.example.pageSchemaUid).toBeUndefined();

    const removeNodeOperation = swaggerDocument.paths['/flowSurfaces:removeNode'].post;
    expect(removeNodeOperation.description).toContain('Only `target.uid` is accepted');
    expect(removeNodeOperation.description).toContain('flowSurfaces:get');

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
    expect(getPath.description).toContain('Only root-level locator fields are accepted');
    expect(getPath.description).toContain('Exactly one of the following four fields');
    expect(getPath.description).toContain('Do not wrap the payload with `{ target: { ... } }`');
    expect(getPath.description).toContain('Do not wrap the payload with `{ values: { ... } }`');
    expect(getPath.description).toContain('`loggedIn`');

    const catalogPath = swaggerDocument.paths['/flowSurfaces:catalog'].post;
    expect(catalogPath.description).toContain('truly available public capabilities');
    expect(catalogPath.description).toContain('`loggedIn`');

    for (const actionName of [
      'catalog',
      'context',
      'compose',
      'configure',
      'createMenu',
      'updateMenu',
      'createPage',
      'destroyPage',
      'addTab',
      'updateTab',
      'moveTab',
      'removeTab',
      'addPopupTab',
      'updatePopupTab',
      'movePopupTab',
      'removePopupTab',
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
      expect(operation.responses?.[400]?.description).toBe('Invalid public request parameters or semantics');
      expect(operation.responses?.[400]?.content?.['application/json']?.schema?.$ref).toBe(
        '#/components/schemas/FlowSurfaceErrorResponse',
      );
      expect(operation.responses?.[403]?.description).toBe('Current role is not allowed to call this action');
      expect(operation.responses?.[403]?.content?.['application/json']?.schema?.$ref).toBe(
        '#/components/schemas/FlowSurfaceErrorResponse',
      );
      expect(operation.responses?.[409]?.description).toBe(
        'Current FlowSurface state conflicts with the requested operation',
      );
      expect(operation.responses?.[409]?.content?.['application/json']?.schema?.$ref).toBe(
        '#/components/schemas/FlowSurfaceErrorResponse',
      );
      expect(operation.responses?.[500]?.description).toBe('Unexpected internal server error');
      expect(operation.responses?.[500]?.content?.['application/json']?.schema?.$ref).toBe(
        '#/components/schemas/FlowSurfaceErrorResponse',
      );
    }

    expect(swaggerDocument.components?.schemas?.FlowSurfaceRemoveNodeRequest).toMatchObject({
      required: ['target'],
      properties: {
        target: {
          required: ['uid'],
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    });
    expect(swaggerDocument.components?.schemas?.FlowSurfaceMutateAddTabValues.required).toEqual(['target']);
    expect(swaggerDocument.components?.schemas?.FlowSurfaceMutateUpdateTabValues.required).toEqual(['target']);
    expect(swaggerDocument.components?.schemas?.FlowSurfaceMutateMoveTabValues.required).toEqual([
      'sourceUid',
      'targetUid',
    ]);
    expect(swaggerDocument.components?.schemas?.FlowSurfaceCreateMenuRequest.required).toEqual(['title']);
    expect(swaggerDocument.components?.schemas?.FlowSurfaceUpdateMenuRequest.required).toEqual(['menuRouteId']);
    expect(swaggerDocument.components?.schemas?.FlowSurfaceCreateMenuRequest.properties.pageUid).toBeUndefined();
    expect(swaggerDocument.components?.schemas?.FlowSurfaceCreatePageRequest.properties.menuRouteId).toBeTruthy();
  });
});
