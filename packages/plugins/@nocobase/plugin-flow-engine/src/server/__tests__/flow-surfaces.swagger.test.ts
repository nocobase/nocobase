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

describe('flowSurfaces swagger', () => {
  it('should keep exported swagger paths aligned with public flowSurfaces actions', () => {
    const expectedPaths = FLOW_SURFACES_ACTION_NAMES.map((actionName) => `/flowSurfaces:${actionName}`).sort();

    expect(swaggerDocument.openapi).toBe('3.0.2');
    expect(swaggerDocument.info?.title).toBe('NocoBase API - Flow engine plugin');
    expect(Object.keys(swaggerDocument.paths).sort()).toEqual(expectedPaths);

    for (const actionName of FLOW_SURFACES_ACTION_NAMES) {
      const path = `/flowSurfaces:${actionName}`;
      const expectedMethod = FLOW_SURFACES_ACTION_METHODS[actionName];
      const pathItem = swaggerDocument.paths[path];

      expect(pathItem).toBeTruthy();
      expect(pathItem[expectedMethod]).toBeTruthy();
      expect(Object.keys(pathItem)).toEqual([expectedMethod]);
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
    expect(schemas.FlowSurfaceConfigureRequest).toBeTruthy();
    expect(schemas.FlowSurfaceConfigureResult).toBeTruthy();
    expect(schemas.FlowSurfaceMutateOp).toBeTruthy();
    expect(schemas.FlowSurfaceMutationResponse).toBeTruthy();
    expect(schemas.FlowSurfaceErrorResponse).toBeTruthy();

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
    expect(mutateOpRefs).toHaveLength(14);
    expect(mutateOpRefs).toEqual(
      expect.arrayContaining([
        '#/components/schemas/FlowSurfaceMutateOpCreatePage',
        '#/components/schemas/FlowSurfaceMutateOpAddBlock',
        '#/components/schemas/FlowSurfaceMutateOpAddField',
        '#/components/schemas/FlowSurfaceMutateOpAddAction',
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

    const composeRequest = swaggerDocument.paths['/flowSurfaces:compose'].post.requestBody.content['application/json'];
    expect(composeRequest.examples.filterTable.value.blocks).toHaveLength(2);
    expect(composeRequest.examples.filterTable.value.layout?.rows?.[0]?.[0]?.key).toBe('filter');
    expect(composeRequest.examples.filterTable.value.blocks[1].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldPath: 'roles.title',
        }),
      ]),
    );
    expect(composeRequest.examples.staticBlocks.value.blocks[0].type).toBe('markdown');
    expect(composeRequest.examples.staticBlocks.value.blocks[1].type).toBe('iframe');
    expect(composeRequest.examples.listRich.value.blocks[0].type).toBe('list');
    expect(composeRequest.examples.listRich.value.blocks[0].recordActions).toBeTruthy();
    expect(composeRequest.examples.gridCardRich.value.blocks[0].type).toBe('gridCard');
    expect(composeRequest.examples.gridCardRich.value.blocks[0].recordActions).toBeTruthy();
    expect(composeRequest.examples.jsBlock.value.blocks[0].type).toBe('jsBlock');
    expect(composeRequest.examples.jsBlock.value.blocks[0].settings.code).toContain('Hello from JS block');

    expect(schemas.FlowSurfaceComposeBlockSpec.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionSpec',
    );
    expect(schemas.FlowSurfaceComposeBlockSpec.properties.type.enum).toEqual(
      expect.arrayContaining(['table', 'filterForm', 'actionPanel', 'jsBlock']),
    );
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[1].properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[2].properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceComposeActionSpec.oneOf[1].properties.type.enum).toEqual(
      expect.arrayContaining(['view', 'submit', 'reset', 'js']),
    );
    expect(schemas.FlowSurfaceComposeBlockResult.properties.itemUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeBlockResult.properties.itemGridUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeBlockResult.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeActionResult',
    );
    expect(schemas.FlowSurfaceComposeActionResult.properties.popupGridUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeActionResult.properties.assignFormUid.type).toBe('string');
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

    const addFieldRequest =
      swaggerDocument.paths['/flowSurfaces:addField'].post.requestBody.content['application/json'];
    expect(addFieldRequest.examples.directField.value.renderer).toBe('js');
    expect(addFieldRequest.examples.directField.value.fieldUse).toBeUndefined();
    expect(addFieldRequest.examples.relationField.value.associationPathName).toBe('department');
    expect(addFieldRequest.examples.jsColumn.value.type).toBe('jsColumn');
    expect(addFieldRequest.examples.jsItem.value.type).toBe('jsItem');
    expect(schemas.FlowSurfaceAddFieldRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceAddFieldResult.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceAddFieldResult.properties.type.enum).toEqual(['jsColumn', 'jsItem']);

    const addBlockRequest =
      swaggerDocument.paths['/flowSurfaces:addBlock'].post.requestBody.content['application/json'];
    expect(addBlockRequest.examples.jsBlock.value.type).toBe('jsBlock');
    expect(schemas.FlowSurfaceAddBlockRequest.properties.type.enum).toEqual(
      expect.arrayContaining(['markdown', 'actionPanel', 'jsBlock']),
    );

    const addActionRequest =
      swaggerDocument.paths['/flowSurfaces:addAction'].post.requestBody.content['application/json'];
    expect(addActionRequest.examples.view.value.type).toBe('view');
    expect(addActionRequest.examples.js.value.type).toBe('js');
    expect(addActionRequest.examples.js.value.stepParams.clickSettings.runJs.version).toBe('1.0.0');
    expect(schemas.FlowSurfaceAddActionRequest.properties.type.enum).toEqual(
      expect.arrayContaining(['view', 'submit', 'reset', 'js']),
    );

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

    for (const actionName of [
      'compose',
      'configure',
      'addBlock',
      'addAction',
      'updateSettings',
      'setEventFlows',
      'setLayout',
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
