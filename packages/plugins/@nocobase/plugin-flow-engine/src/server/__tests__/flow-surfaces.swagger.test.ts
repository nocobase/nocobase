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
    const schemas = (swaggerDocument.components?.schemas || {}) as Record<string, any>;
    const parameters = (swaggerDocument.components?.parameters || {}) as Record<string, any>;
    const expectSchemas = (schemaNames: string[]) => {
      for (const schemaName of schemaNames) {
        expect(schemas[schemaName]).toBeTruthy();
      }
    };
    const expectStringProperties = (schemaName: string, propertyNames: string[]) => {
      for (const propertyName of propertyNames) {
        expect(schemas[schemaName]?.properties?.[propertyName]?.type).toBe('string');
      }
    };
    const expectUndefinedProperties = (schemaName: string, propertyNames: string[]) => {
      for (const propertyName of propertyNames) {
        expect(schemas[schemaName]?.properties?.[propertyName]).toBeUndefined();
      }
    };

    expectSchemas([
      'FlowSurfaceWriteTarget',
      'FlowSurfaceMutateWriteTarget',
      'FlowSurfaceAddPopupTabRequest',
      'FlowSurfaceAddPopupTabResult',
      'FlowSurfaceUpdatePopupTabRequest',
      'FlowSurfaceUpdatePopupTabResult',
      'FlowSurfaceMovePopupTabRequest',
      'FlowSurfaceMovePopupTabResult',
      'FlowSurfaceRemovePopupTabRequest',
      'FlowSurfaceRemovePopupTabResult',
      'FlowSurfaceResolvedTarget',
      'FlowSurfaceReadTarget',
      'FlowSurfaceConfigureOption',
      'FlowSurfaceConfigureOptions',
      'FlowSurfaceContextVarInfo',
      'FlowSurfaceContextRequest',
      'FlowSurfaceContextResponse',
      'FlowSurfaceReactionKind',
      'FlowSurfaceReactionScene',
      'FlowSurfaceReactionSlot',
      'FlowSurfaceReactionTargetSummary',
      'FlowSurfaceReactionFilter',
      'FlowSurfaceReactionValueExpr',
      'FlowSurfaceReactionValueExprMeta',
      'FlowSurfaceReactionConditionMeta',
      'FlowSurfaceReactionSupportedAction',
      'FlowSurfaceReactionUnavailableCapability',
      'FlowSurfaceFieldOption',
      'FlowSurfaceFieldValueRule',
      'FlowSurfaceBlockLinkageRule',
      'FlowSurfaceFieldLinkageRule',
      'FlowSurfaceActionLinkageRule',
      'FlowSurfaceFieldValueCapability',
      'FlowSurfaceBlockLinkageCapability',
      'FlowSurfaceFieldLinkageCapability',
      'FlowSurfaceActionLinkageCapability',
      'FlowSurfaceReactionCapability',
      'FlowSurfaceGetReactionMetaRequest',
      'FlowSurfaceGetReactionMetaResult',
      'FlowSurfaceSetFieldValueRulesRequest',
      'FlowSurfaceSetFieldValueRulesResult',
      'FlowSurfaceSetBlockLinkageRulesRequest',
      'FlowSurfaceSetBlockLinkageRulesResult',
      'FlowSurfaceSetFieldLinkageRulesRequest',
      'FlowSurfaceSetFieldLinkageRulesResult',
      'FlowSurfaceSetActionLinkageRulesRequest',
      'FlowSurfaceSetActionLinkageRulesResult',
      'FlowSurfaceApplyBlueprintReactionItemSetFieldValueRules',
      'FlowSurfaceApplyBlueprintReactionItemSetBlockLinkageRules',
      'FlowSurfaceApplyBlueprintReactionItemSetFieldLinkageRules',
      'FlowSurfaceApplyBlueprintReactionItemSetActionLinkageRules',
      'FlowSurfaceDescribeSurfaceRequest',
      'FlowSurfaceDescribeSurfaceResponse',
      'FlowSurfaceApplyBlueprintReactionItem',
      'FlowSurfaceApplyBlueprintReaction',
      'FlowSurfaceApplyBlueprintRequest',
      'FlowSurfaceApplyBlueprintResponse',
      'FlowSurfaceApprovalBlueprintSurface',
      'FlowSurfaceApplyApprovalBlueprintBinding',
      'FlowSurfaceApplyApprovalBlueprintTarget',
      'FlowSurfaceApprovalBlueprintActionSpec',
      'FlowSurfaceApprovalBlueprintBlockSpec',
      'FlowSurfaceApplyApprovalBlueprintRequest',
      'FlowSurfaceApplyApprovalBlueprintResponse',
      'FlowSurfaceBindKey',
      'FlowSurfaceKeysMap',
      'FlowSurfaceCatalogItem',
      'FlowSurfaceNodeContract',
      'FlowSurfaceDomainContract',
      'FlowSurfaceDomainGroupContract',
      'FlowSurfaceFilterCondition',
      'FlowSurfaceFilterGroup',
      'FlowSurfaceApplyNodePopup',
      'FlowSurfaceNodeSpec',
      'FlowSurfaceApplySpec',
      'FlowSurfaceGetResponse',
      'FlowSurfaceTemplateRow',
      'FlowSurfaceListTemplatesRequest',
      'FlowSurfaceListTemplatesResult',
      'FlowSurfaceGetTemplateRequest',
      'FlowSurfaceSaveTemplateRequest',
      'FlowSurfaceUpdateTemplateRequest',
      'FlowSurfaceDestroyTemplateRequest',
      'FlowSurfaceDestroyTemplateResult',
      'FlowSurfaceConvertTemplateToCopyRequest',
      'FlowSurfaceConvertTemplateToCopyResult',
      'FlowSurfacePopupSummary',
      'FlowSurfaceTemplateRef',
      'FlowSurfaceBlockTemplateRef',
      'FlowSurfacePopupTemplateRef',
      'FlowSurfaceRequestPopupTemplateRef',
      'FlowSurfaceRequestPopupSaveAsTemplate',
      'FlowSurfaceComposeFieldPopup',
      'FlowSurfaceComposeRequestFieldPopup',
      'FlowSurfaceComposeRequestActionPopup',
      'FlowSurfaceComposeRequest',
      'FlowSurfaceComposeResult',
      'FlowSurfaceComposeRecordActionSpec',
      'FlowSurfaceConfigureRequest',
      'FlowSurfaceConfigureResult',
      'FlowSurfaceMutateOpItem',
      'FlowSurfaceMutateKey',
      'FlowSurfaceMutationResponse',
      'FlowSurfaceErrorResponse',
    ]);
    expect(schemas.FlowSurfaceWriteTarget.required).toEqual(['uid']);
    expect(schemas.FlowSurfaceAddTabRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceUpdateTabRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceMoveTabRequest.required).toEqual(['sourceUid', 'targetUid']);
    expectStringProperties('FlowSurfaceAddPopupTabResult', ['popupPageUid', 'popupTabUid', 'popupGridUid']);
    expectUndefinedProperties('FlowSurfaceAddPopupTabResult', ['tabUid', 'gridUid']);
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
    expect(schemas.FlowSurfaceApplySpec.properties.popup.$ref).toBe('#/components/schemas/FlowSurfaceApplyNodePopup');
    expect(schemas.FlowSurfaceGetTreeNode.properties.subModels.additionalProperties.oneOf).toEqual(
      expect.arrayContaining([
        {
          $ref: '#/components/schemas/FlowSurfaceGetTreeNode',
        },
      ]),
    );

    expect(schemas.FlowSurfaceMutateKey.required).toEqual(['key']);
    expect(schemas.FlowSurfaceMutateKey.properties.key.type).toBe('string');
    expect(schemas.FlowSurfaceMutateKey.properties.$ref).toBeUndefined();
    expect(schemas.FlowSurfaceMutateOpItem.required).toEqual(['type']);
    expect(schemas.FlowSurfaceMutateOpItem.properties.type.enum).toEqual([...FLOW_SURFACE_MUTATE_OP_TYPES]);
    expect(schemas.FlowSurfaceMutateOpItem.properties.values.additionalProperties).toBe(true);
    expect(schemas.FlowSurfaceMutateOpItem.properties.values.description).toContain('{ step:');
    expect(schemas.FlowSurfaceMutateOpItem.properties.type.enum).toEqual(
      expect.arrayContaining(['addPopupTab', 'updatePopupTab', 'movePopupTab', 'removePopupTab']),
    );

    expect(parameters.flowSurfaceTargetUid.example).toBe('view-action-uid');
    expect(parameters.flowSurfaceTargetPageSchemaUid.example).toBe('employees-page-schema');
    expect(parameters.flowSurfaceTargetTabSchemaUid.example).toBe('details-tab-schema');
    expect(parameters.flowSurfaceTargetRouteId.example).toBe('101');

    expect(schemas.FlowSurfaceDescribeSurfaceRequest.required).toEqual(['locator']);
    expect(schemas.FlowSurfaceDescribeSurfaceResponse.properties.fingerprint.type).toBe('string');
    expect(schemas.FlowSurfaceDescribeSurfaceResponse.properties.keys.$ref).toBe(
      '#/components/schemas/FlowSurfaceKeysMap',
    );
    expect(schemas.FlowSurfaceGetReactionMetaRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceGetReactionMetaResult.required).toEqual(['target', 'capabilities', 'unavailable']);
    expect(schemas.FlowSurfaceGetReactionMetaResult.properties.capabilities.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceReactionCapability',
    );
    expect(schemas.FlowSurfaceReactionCapability.oneOf).toEqual(
      expect.arrayContaining([
        { $ref: '#/components/schemas/FlowSurfaceFieldValueCapability' },
        { $ref: '#/components/schemas/FlowSurfaceBlockLinkageCapability' },
        { $ref: '#/components/schemas/FlowSurfaceFieldLinkageCapability' },
        { $ref: '#/components/schemas/FlowSurfaceActionLinkageCapability' },
      ]),
    );
    expect(schemas.FlowSurfaceSetFieldValueRulesRequest.required).toEqual(['target', 'rules']);
    expect(schemas.FlowSurfaceSetBlockLinkageRulesRequest.required).toEqual(['target', 'rules']);
    expect(schemas.FlowSurfaceSetFieldLinkageRulesRequest.required).toEqual(['target', 'rules']);
    expect(schemas.FlowSurfaceSetActionLinkageRulesRequest.required).toEqual(['target', 'rules']);
    expect(schemas.FlowSurfaceReactionSlot.properties.valuePath.description).toContain('nested value path');
    expect(schemas.FlowSurfaceSetFieldValueRulesRequest.properties.target.description).toContain(
      'outer form block uid',
    );
    expect(schemas.FlowSurfaceSetFieldValueRulesRequest.properties.rules.description).toContain('Pass `[]` to clear');
    expect(schemas.FlowSurfaceSetFieldValueRulesRequest.properties.expectedFingerprint.description).toContain(
      '`getReactionMeta.capabilities[].fingerprint`',
    );
    expect(schemas.FlowSurfaceSetFieldValueRulesResult.properties.updateAssociationValues.items.type).toBe('string');
    expect(schemas.FlowSurfaceSetFieldValueRulesResult.properties.resolvedScene.description).toContain(
      'Concrete reaction scene',
    );
    expect(schemas.FlowSurfaceApplyBlueprintRequest.oneOf).toBeUndefined();
    expect(schemas.FlowSurfaceApplyBlueprintRequest.type).toBe('object');
    expect(schemas.FlowSurfaceApplyBlueprintRequest.required).toEqual(['mode', 'tabs']);
    expect(schemas.FlowSurfaceApplyBlueprintRequest.properties.version.enum).toEqual(['1']);
    expect(schemas.FlowSurfaceApplyBlueprintRequest.properties.mode.enum).toEqual(['create', 'replace']);
    expect(schemas.FlowSurfaceApplyBlueprintRequest.properties.tabs.minItems).toBe(1);
    expect(schemas.FlowSurfaceApplyBlueprintRequest.properties.tabs.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintTab',
    );
    expect(schemas.FlowSurfaceApplyBlueprintRequest.description).toContain("defaults to '1'");
    expect(schemas.FlowSurfaceApplyBlueprintRequest.description).toContain('create does not accept target');
    expect(schemas.FlowSurfaceApplyBlueprintRequest.description).toContain('replace requires target.pageSchemaUid');
    expect(schemas.FlowSurfaceApplyBlueprintRequest.properties.reaction.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintReaction',
    );
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.required).toEqual(['surface']);
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.properties.version.enum).toEqual(['1']);
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.properties.mode.enum).toEqual(['replace']);
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.properties.surface.$ref).toBe(
      '#/components/schemas/FlowSurfaceApprovalBlueprintSurface',
    );
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.properties.blocks.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceApprovalBlueprintBlockSpec',
    );
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.properties.fields.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeFieldSpec',
    );
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.properties.layout.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeLayout',
    );
    expect(schemas.FlowSurfaceApprovalBlueprintBlockSpec.properties.type.enum).toEqual([
      'approvalInitiator',
      'approvalApprover',
      'approvalInformation',
    ]);
    expect(schemas.FlowSurfaceApprovalBlueprintBlockSpec.properties.actions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceApprovalBlueprintActionSpec',
    );
    expect(schemas.FlowSurfaceApprovalBlueprintActionSpec.oneOf[0].enum).toEqual(
      expect.arrayContaining(['approvalSubmit', 'approvalApprove']),
    );
    expect(schemas.FlowSurfaceApprovalBlueprintActionSpec.oneOf[0].enum).not.toEqual(
      expect.arrayContaining(['submit', 'refresh']),
    );
    expect(schemas.FlowSurfaceApprovalBlueprintBlockSpec.properties.template).toBeUndefined();
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.description).toContain('initiator');
    expect(schemas.FlowSurfaceApplyApprovalBlueprintRequest.description).toContain('taskCard');
    expect(schemas.FlowSurfaceApplyApprovalBlueprintResponse.required).toEqual([
      'version',
      'mode',
      'surfaceType',
      'target',
      'binding',
      'surface',
    ]);
    expect(schemas.FlowSurfaceApplyApprovalBlueprintResponse.properties.surfaceType.$ref).toBe(
      '#/components/schemas/FlowSurfaceApprovalBlueprintSurface',
    );
    expect(schemas.FlowSurfaceApplyApprovalBlueprintBinding.properties.resourceName.enum).toEqual([
      'workflows',
      'flow_nodes',
    ]);
    expect(schemas.FlowSurfaceApplyApprovalBlueprintTarget.properties.uid.type).toBe('string');
    expect(schemas.FlowSurfaceApplyBlueprintReaction.required).toEqual(['items']);
    expect(schemas.FlowSurfaceApplyBlueprintReaction.description).toContain('whole-page reaction authoring');
    expect(schemas.FlowSurfaceApplyBlueprintReaction.description).toContain('same `(type, target)` slot');
    expect(schemas.FlowSurfaceApplyBlueprintReaction.description).toContain('include every slot that must exist');
    expect(schemas.FlowSurfaceApplyBlueprintReaction.properties.items.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintReactionItem',
    );
    expect(schemas.FlowSurfaceApplyBlueprintReactionItem.oneOf).toEqual(
      expect.arrayContaining([
        { $ref: '#/components/schemas/FlowSurfaceApplyBlueprintReactionItemSetFieldValueRules' },
        { $ref: '#/components/schemas/FlowSurfaceApplyBlueprintReactionItemSetBlockLinkageRules' },
        { $ref: '#/components/schemas/FlowSurfaceApplyBlueprintReactionItemSetFieldLinkageRules' },
        { $ref: '#/components/schemas/FlowSurfaceApplyBlueprintReactionItemSetActionLinkageRules' },
      ]),
    );
    expect(schemas.FlowSurfaceApplyBlueprintReactionItemSetFieldValueRules.properties.target.description).toContain(
      'form block key',
    );
    expect(schemas.FlowSurfaceApplyBlueprintReactionItemSetFieldValueRules.properties.target.description).toContain(
      'explicit key/bind key',
    );
    expect(
      schemas.FlowSurfaceApplyBlueprintReactionItemSetFieldLinkageRules.properties.expectedFingerprint.description,
    ).toContain('prior `getReactionMeta` read');
    expect(schemas.FlowSurfaceApplyBlueprintTab.required).toEqual(['blocks']);
    expect(schemas.FlowSurfaceApplyBlueprintTab.properties.blocks.minItems).toBe(1);
    expect(schemas.FlowSurfaceApplyBlueprintTab.properties.key.description).toContain('Optional local tab key');
    expect(schemas.FlowSurfaceApplyBlueprintTab.properties.key.description).toContain(
      'not used to match existing route-backed tabs in replace mode',
    );
    expect(schemas.FlowSurfaceApplyBlueprintPopup.properties.layout.$ref).toBeUndefined();
    expect(schemas.FlowSurfaceApplyBlueprintTab.properties.layout.$ref).toBeUndefined();
    expect(schemas.FlowSurfaceApplyBlueprintPopup.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceRequestPopupTemplateRef',
    );
    expect(schemas.FlowSurfaceApplyBlueprintPopup.properties.tryTemplate.type).toBe('boolean');
    expect(schemas.FlowSurfaceApplyBlueprintPopup.properties.saveAsTemplate.allOf).toEqual([
      { $ref: '#/components/schemas/FlowSurfaceRequestPopupSaveAsTemplate' },
    ]);
    expect(schemas.FlowSurfaceRequestPopupTemplateRef.properties.local.type).toBe('string');
    expect(schemas.FlowSurfaceRequestPopupSaveAsTemplate.properties.local.type).toBe('string');
    expect(schemas.FlowSurfacePopupTemplateRef.allOf).toEqual([
      { $ref: '#/components/schemas/FlowSurfaceTemplateRef' },
    ]);
    expect(schemas.FlowSurfacePopupTemplateRef.properties).toBeUndefined();
    expect(schemas.FlowSurfacePopupSaveAsTemplate.properties.local).toBeUndefined();
    expect(schemas.FlowSurfaceApplyBlueprintPopup.properties.layout.allOf).toEqual([
      { $ref: '#/components/schemas/FlowSurfaceApplyBlueprintLayout' },
    ]);
    expect(schemas.FlowSurfaceApplyBlueprintTab.properties.layout.allOf).toEqual([
      { $ref: '#/components/schemas/FlowSurfaceApplyBlueprintLayout' },
    ]);
    expect(schemas.FlowSurfaceApplyBlueprintLayout.description).toContain('only on tabs and inline popup documents');
    expect(schemas.FlowSurfaceApplyBlueprintPopup.properties.layout.description).toContain('not on individual blocks');
    expect(schemas.FlowSurfaceApplyBlueprintTab.properties.layout.description).toContain('not on individual blocks');
    expect(schemas.FlowSurfaceApplyBlueprintPopup.properties.blocks.description).toContain(
      'exactly one `editForm` block',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.description).toContain(
      'Blocks do not accept a `layout` property',
    );
    expect(schemas.FlowSurfaceApplyBlueprintLayout.properties.rows.description).toContain('{ key, span }');
    expect(schemas.FlowSurfaceApplyBlueprintLayoutCell.oneOf[0].description).toContain('Local block key string');
    expect(schemas.FlowSurfaceApplyBlueprintLayoutCell.oneOf[1].description).toContain('local block key');
    expect(schemas.FlowSurfaceApplyBlueprintLayoutCell.oneOf[1].required).toEqual(['key']);
    expect(schemas.FlowSurfaceApplyBlueprintLayoutCell.oneOf[1].properties.key.type).toBe('string');
    expect(schemas.FlowSurfaceApplyBlueprintLayoutCell.oneOf[1].properties.span.type).toBe('number');
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.collection.description).toContain(
      'use resource.collectionName',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.resource.$ref).toBe(
      '#/components/schemas/FlowSurfaceBlockResourceInput',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.fields.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintFieldSpec',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.actions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintActionSpec',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.recordActions.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintRecordActionSpec',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.type.enum).toEqual([
      'table',
      'createForm',
      'editForm',
      'details',
      'filterForm',
      'list',
      'gridCard',
      'markdown',
      'iframe',
      'chart',
      'actionPanel',
      'jsBlock',
    ]);
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.type.description).toContain(
      'Generic `form` is not supported',
    );
    expect(schemas.FlowSurfaceApplyBlueprintFieldSpec.oneOf[1].properties.field.type).toBe('string');
    expect(schemas.FlowSurfaceApplyBlueprintFieldSpec.oneOf[1].properties.target.type).toBe('string');
    expect(schemas.FlowSurfaceApplyBlueprintFieldSpec.oneOf[1].properties.target.description).toContain(
      'String block key on the same tab or popup scope',
    );
    expect(schemas.FlowSurfaceApplyBlueprintFieldSpec.oneOf[1].properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintPopup',
    );
    expect(schemas.FlowSurfaceApplyBlueprintActionSpec.oneOf[1].properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintPopup',
    );
    expect(schemas.FlowSurfaceApplyBlueprintActionSpec.oneOf[0].enum).toEqual(
      expect.arrayContaining(['view', 'edit', 'updateRecord', 'delete']),
    );
    expect(schemas.FlowSurfaceApplyBlueprintActionSpec.oneOf[0].enum).not.toEqual(expect.arrayContaining(['addChild']));
    expect(schemas.FlowSurfaceApplyBlueprintActionSpec.oneOf[1].properties.type.enum).toEqual(
      expect.arrayContaining(['view', 'edit', 'updateRecord', 'delete']),
    );
    expect(schemas.FlowSurfaceApplyBlueprintActionSpec.oneOf[1].properties.type.enum).not.toEqual(
      expect.arrayContaining(['addChild']),
    );
    expect(schemas.FlowSurfaceApplyBlueprintActionSpec.oneOf[1].properties.type.description).toContain('auto-promotes');
    expect(schemas.FlowSurfaceApplyBlueprintActionSpec.oneOf[1].properties.type.description).toContain(
      'not auto-promoted',
    );
    expect(schemas.FlowSurfaceApplyBlueprintActionSpec.oneOf[1].properties.type.description).toContain(
      'exactly one `editForm` block',
    );
    expect(schemas.FlowSurfaceApplyBlueprintRecordActionSpec.oneOf[1].properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceApplyBlueprintPopup',
    );
    expect(schemas.FlowSurfaceApplyBlueprintRecordActionSpec.oneOf[0].enum).toEqual(
      expect.arrayContaining(['addChild']),
    );
    expect(schemas.FlowSurfaceApplyBlueprintRecordActionSpec.oneOf[1].properties.type.enum).toEqual(
      expect.arrayContaining(['addChild']),
    );
    expect(schemas.FlowSurfaceApplyBlueprintRecordActionSpec.oneOf[1].properties.type.description).toContain(
      'catalog.recordActions',
    );
    expect(schemas.FlowSurfaceApplyBlueprintRecordActionSpec.oneOf[1].properties.type.description).toContain(
      'exactly one `editForm` block',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.actions.description).toContain('auto-promotes');
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.actions.description).toContain('not auto-promoted');
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.associationPathName.description).toContain(
      'associatedRecords',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.associationPathName.description).toContain(
      'single association field name',
    );
    expect(schemas.FlowSurfaceApplyBlueprintBlockSpec.properties.associationField.description).toContain(
      'Canonical association field name',
    );
    expect(schemas.FlowSurfaceSemanticResourceInput.properties.associationField.description).toContain(
      'Canonical association field name',
    );
    expect(schemas.FlowSurfaceSemanticResourceInput.properties.associationField.description).toContain(
      'single association field name',
    );
    expect(schemas.FlowSurfaceApplyBlueprintNavigationGroup.properties.routeId.description).toContain(
      'Preferred existing menu-group route id',
    );
    expect(schemas.FlowSurfaceApplyBlueprintNavigationGroup.properties.title.description).toContain(
      'reuses a same-title group if the match is unique',
    );
    expect(schemas.FlowSurfaceApplyBlueprintNavigationGroup.properties.title.description).toContain(
      'Same-title reuse is title-only',
    );
    expect(schemas.FlowSurfaceApplyBlueprintNavigationGroup.properties.icon.description).toContain(
      'actually creates a new menu group',
    );
    expect(schemas.FlowSurfaceApplyBlueprintResponse.properties.surface.$ref).toBe(
      '#/components/schemas/FlowSurfaceGetResponse',
    );
    expect(Object.keys(schemas.FlowSurfaceApplyBlueprintResponse.properties).sort()).toEqual([
      'mode',
      'surface',
      'target',
      'version',
    ]);

    const catalogRequest = swaggerDocument.paths['/flowSurfaces:catalog'].post.requestBody.content['application/json'];
    expect(catalogRequest.example?.target?.uid).toBe('table-block-uid');
    expect(swaggerDocument.paths['/flowSurfaces:catalog'].post.description).toContain(
      'prefer `getReactionMeta` + `set*Rules`',
    );
    const describeRequest =
      swaggerDocument.paths['/flowSurfaces:describeSurface'].post.requestBody.content['application/json'];
    expect(describeRequest.example?.locator?.pageSchemaUid).toBe('employees-page-schema');
    const getReactionMetaPath = swaggerDocument.paths['/flowSurfaces:getReactionMeta'].post;
    expect(getReactionMetaPath.description).toContain('main discovery endpoint');
    expect(getReactionMetaPath.description).toContain('`targetFields`');
    expect(getReactionMetaPath.description).toContain('`supportedActions`');
    expect(getReactionMetaPath.description).toContain('outer form block uid');
    const setFieldValueRulesPath = swaggerDocument.paths['/flowSurfaces:setFieldValueRules'].post;
    expect(setFieldValueRulesPath.description).toContain('outer form block uid');
    expect(setFieldValueRulesPath.description).toContain('`getReactionMeta.capabilities[].fingerprint`');
    const setFieldLinkageRulesPath = swaggerDocument.paths['/flowSurfaces:setFieldLinkageRules'].post;
    expect(setFieldLinkageRulesPath.description).toContain('`setFieldState`');
    expect(setFieldLinkageRulesPath.description).toContain('`assignField`');
    const setActionLinkageRulesRequest =
      swaggerDocument.paths['/flowSurfaces:setActionLinkageRules'].post.requestBody.content['application/json'];
    expect(setActionLinkageRulesRequest.example?.expectedFingerprint).toBe('action-linkage-fp-1');
    const applyBlueprintRequest =
      swaggerDocument.paths['/flowSurfaces:applyBlueprint'].post.requestBody.content['application/json'];
    expect(applyBlueprintRequest.examples?.createPage?.value?.mode).toBe('create');
    expect(applyBlueprintRequest.examples?.createPage?.value?.tabs).toHaveLength(1);
    expect(applyBlueprintRequest.examples?.createPage?.value?.tabs?.[0]?.key).toBe('main');
    expect(applyBlueprintRequest.examples?.createPage?.value?.tabs?.[0]?.title).toBe('Overview');
    expect(applyBlueprintRequest.examples?.createPage?.value?.tabs?.[0]?.blocks?.[0]?.key).toBe('employeeForm');
    expect(applyBlueprintRequest.examples?.createPage?.value?.tabs?.[0]?.blocks?.[1]?.actions?.[0]?.key).toBe(
      'refreshAction',
    );
    expect(applyBlueprintRequest.examples?.createPage?.value?.reaction?.items).toHaveLength(4);
    expect(applyBlueprintRequest.examples?.createPage?.value?.reaction?.items?.[0]?.type).toBe('setFieldValueRules');
    expect(applyBlueprintRequest.examples?.createPage?.value?.reaction?.items?.[0]?.target).toBe('main.employeeForm');
    expect(applyBlueprintRequest.examples?.createPage?.value?.reaction?.items?.[2]?.type).toBe('setFieldLinkageRules');
    expect(
      applyBlueprintRequest.examples?.createPage?.value?.reaction?.items?.[2]?.rules?.[0]?.then?.[0]?.items?.[1]?.value
        ?.source,
    ).toBe('runjs');
    expect(applyBlueprintRequest.examples?.replacePage?.value?.mode).toBe('replace');
    expect(applyBlueprintRequest.examples?.replacePage?.value?.target?.pageSchemaUid).toBe('employees-page-schema');
    expect(applyBlueprintRequest.examples?.replacePage?.value?.tabs).toHaveLength(1);
    expect(swaggerDocument.paths['/flowSurfaces:applyBlueprint'].post.requestBody.description).toContain(
      'do not JSON.stringify it',
    );
    expect(swaggerDocument.paths['/flowSurfaces:applyBlueprint'].post.requestBody.description).toContain(
      'do not wrap it in { values: ... }',
    );
    const applyBlueprintPath = swaggerDocument.paths['/flowSurfaces:applyBlueprint'].post;
    expect(applyBlueprintPath.summary).toContain('blueprint');
    expect(applyBlueprintPath.summary).toContain('Modern page');
    expect(applyBlueprintPath.description).toContain('route-backed tab slots by index');
    expect(applyBlueprintPath.description).toContain('removes trailing old tabs');
    expect(applyBlueprintPath.description).toContain('appends extra new tabs');
    expect(applyBlueprintPath.description).toContain('navigation.group.routeId');
    expect(applyBlueprintPath.description).toContain('same-title group');
    expect(applyBlueprintPath.description).toContain('does not mutate existing group metadata');
    expect(applyBlueprintPath.description).toContain('Same-title reuse is title-only');
    expect(applyBlueprintPath.description).toContain('updateMenu');
    expect(applyBlueprintPath.description).toContain('top-level `reaction.items[]`');
    expect(applyBlueprintPath.description).toContain('whole-page interaction authoring');
    expect(applyBlueprintPath.description).toContain('`getReactionMeta` + `set*Rules`');
    expect(applyBlueprintPath.description).toContain('`rules: []` clears the targeted slot');
    expect(applyBlueprintPath.description).toContain('same `(type, target)` reaction slot');
    expect(applyBlueprintPath.description).toContain('newly produced blueprint result');
    expect(applyBlueprintPath.description).toContain('include it explicitly instead of relying on omission');
    expect(applyBlueprintPath.description).toContain('only allowed on tabs and inline popup documents');
    expect(applyBlueprintPath.description).toContain('must not be JSON-stringified');
    expect(applyBlueprintPath.description).toContain('internal flow-surface operations');
    expect(applyBlueprintPath.description).toContain('generic `form`');
    expect(applyBlueprintPath.description).toContain('exactly one `editForm` block');
    expect(applyBlueprintPath.description).toContain('popup.saveAsTemplate={ name, description, local? }');
    expect(applyBlueprintPath.description).toContain('popup.template={ local, mode }');
    const applyApprovalBlueprintPath = swaggerDocument.paths['/flowSurfaces:applyApprovalBlueprint'].post;
    expect(applyApprovalBlueprintPath.summary).toContain('approval blueprint');
    expect(applyApprovalBlueprintPath.description).toContain('workflow.config.approvalUid');
    expect(applyApprovalBlueprintPath.description).toContain('node.config.approvalUid');
    expect(applyApprovalBlueprintPath.description).toContain("surface='taskCard'");
    expect(applyApprovalBlueprintPath.description).toContain('preferred whole-surface bootstrap / replace entry');
    expect(applyApprovalBlueprintPath.description).toContain('reconciles approval runtime config');
    const applyApprovalBlueprintRequest = applyApprovalBlueprintPath.requestBody.content['application/json'];
    expect(applyApprovalBlueprintRequest.examples.initiator.value.surface).toBe('initiator');
    expect(applyApprovalBlueprintRequest.examples.initiator.value.blocks[0].type).toBe('approvalInitiator');
    expect(applyApprovalBlueprintRequest.examples.approver.value.surface).toBe('approver');
    expect(applyApprovalBlueprintRequest.examples.approver.value.blocks[0].type).toBe('approvalApprover');
    expect(applyApprovalBlueprintRequest.examples.taskCard.value.surface).toBe('taskCard');
    expect(applyApprovalBlueprintRequest.examples.taskCard.value.fields[0].fieldPath).toBe('nickname');
    expect(swaggerDocument.paths['/flowSurfaces:compose'].post.description).toContain(
      'use `applyApprovalBlueprint` first',
    );
    expect(swaggerDocument.paths['/flowSurfaces:compose'].post.description).toContain(
      'popup.saveAsTemplate={ name, description, local? }',
    );
    expect(swaggerDocument.paths['/flowSurfaces:compose'].post.description).toContain('popup.template={ local, mode }');
    expect(swaggerDocument.paths['/flowSurfaces:addBlock'].post.description).toContain(
      'do not auto-create an approval root',
    );
    expect(swaggerDocument.paths['/flowSurfaces:addField'].post.description).toContain(
      'does not allow standalone `jsItem`',
    );
    expect(swaggerDocument.paths['/flowSurfaces:addAction'].post.description).toContain(
      'reconciles the related workflow/node runtime config',
    );
    expect(swaggerDocument.paths['/flowSurfaces:configure'].post.description).toContain('approval-specific keys');
    const contextRequest = swaggerDocument.paths['/flowSurfaces:context'].post.requestBody.content['application/json'];
    expect(contextRequest.example?.target?.uid).toBe('details-block-uid');
    expect(contextRequest.example?.path).toBe('record');
    expect(contextRequest.example?.maxDepth).toBe(3);
    expect(swaggerDocument.paths['/flowSurfaces:context'].post.description).toContain('low-level `ctx` variable tree');
    expect(swaggerDocument.paths['/flowSurfaces:context'].post.description).toContain('main discovery endpoint');
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
    expect(schemas.FlowSurfaceCatalogResponse.properties.scenario.$ref).toBe(
      '#/components/schemas/FlowSurfaceCatalogScenario',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.selectedSections.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceCatalogSection',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.selectedSections.description).toContain(
      'server smart-selects sections for the current target scenario',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.selectedSections.description).toContain(
      'treat this field as authoritative',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.node.$ref).toBe(
      '#/components/schemas/FlowSurfaceCatalogNodeInfo',
    );
    expect(schemas.FlowSurfaceCatalogResponse.properties.configureOptions).toBeUndefined();
    expect(schemas.FlowSurfaceCatalogResponse.properties.recordActions.description).toContain(
      'table/details/list/gridCard',
    );
    expect(schemas.FlowSurfaceCatalogItem.properties.configureOptions.$ref).toBe(
      '#/components/schemas/FlowSurfaceConfigureOptions',
    );
    expect(schemas.FlowSurfaceCatalogNodeInfo.properties.configureOptions.$ref).toBe(
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
    expect(schemas.FlowSurfaceGetTreeNode.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceBlockTemplateRef',
    );
    expect(schemas.FlowSurfaceGetTreeNode.properties.fieldsTemplate.$ref).toBe(
      '#/components/schemas/FlowSurfaceTemplateRef',
    );
    expect(schemas.FlowSurfaceGetTreeNode.properties.popup.$ref).toBe('#/components/schemas/FlowSurfacePopupSummary');
    expect(schemas.FlowSurfacePopupSummary.properties.mode.enum).toEqual(['local', 'copy']);
    expect(schemas.FlowSurfacePopupSummary.properties.pageUid.type).toBe('string');
    expect(schemas.FlowSurfacePopupSummary.properties.tabUid.type).toBe('string');
    expect(schemas.FlowSurfacePopupSummary.properties.gridUid.type).toBe('string');
    expect(schemas.FlowSurfaceTemplateRow.required).toEqual(
      expect.arrayContaining(['uid', 'name', 'description', 'type', 'targetUid']),
    );
    expect(schemas.FlowSurfaceTemplateRow.properties.type.enum).toEqual(['block', 'popup']);
    expect(schemas.FlowSurfaceTemplateRow.properties.available.type).toBe('boolean');
    expect(schemas.FlowSurfaceTemplateRow.properties.disabledReason.type).toBe('string');
    expect(schemas.FlowSurfaceConvertTemplateToCopyResult.properties.type.enum).toEqual(['block', 'fields', 'popup']);
    expect(schemas.FlowSurfaceSaveTemplateRequest.required).toEqual(['target', 'name', 'description']);
    expect(schemas.FlowSurfaceListTemplatesResult.required).toEqual(['rows', 'count', 'page', 'pageSize', 'totalPage']);
    expect(schemas.FlowSurfaceListTemplatesRequest.properties.paginate).toBeUndefined();
    expect(schemas.FlowSurfaceListTemplatesRequest.properties.target.$ref).toBe(
      '#/components/schemas/FlowSurfaceWriteTarget',
    );
    expect(schemas.FlowSurfaceListTemplatesRequest.properties.type.enum).toEqual(['block', 'popup']);
    expect(schemas.FlowSurfaceListTemplatesRequest.properties.usage.enum).toEqual(['block', 'fields']);
    expect(schemas.FlowSurfaceListTemplatesRequest.properties.actionType.enum).toEqual(
      expect.arrayContaining(['addNew', 'popup', 'view', 'edit']),
    );
    expect(schemas.FlowSurfaceListTemplatesRequest.properties.actionScope.enum).toEqual(['block', 'record']);
    expect(schemas.FlowSurfaceRequestPopupTemplateRef.oneOf).toEqual(
      expect.arrayContaining([{ required: ['uid'] }, { required: ['local'] }]),
    );
    expect(schemas.FlowSurfaceComposeRequestActionPopup.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceRequestPopupTemplateRef',
    );
    expect(schemas.FlowSurfaceComposeRequestActionPopup.properties.tryTemplate.type).toBe('boolean');
    expect(schemas.FlowSurfaceComposeRequestActionPopup.properties.saveAsTemplate.allOf).toEqual([
      { $ref: '#/components/schemas/FlowSurfaceRequestPopupSaveAsTemplate' },
    ]);
    expect(schemas.FlowSurfaceComposeRequestFieldPopup.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceRequestPopupTemplateRef',
    );
    expect(schemas.FlowSurfaceComposeRequestFieldPopup.properties.tryTemplate.type).toBe('boolean');
    expect(schemas.FlowSurfaceComposeRequestFieldPopup.properties.defaultType.enum).toEqual(['view', 'edit']);
    expect(schemas.FlowSurfaceComposeRequestFieldPopup.properties.saveAsTemplate.allOf).toEqual([
      { $ref: '#/components/schemas/FlowSurfaceRequestPopupSaveAsTemplate' },
    ]);
    expect(schemas.FlowSurfaceComposeActionPopup.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfacePopupTemplateRef',
    );
    expect(schemas.FlowSurfaceComposeActionPopup.properties.tryTemplate.type).toBe('boolean');
    expect(schemas.FlowSurfaceComposeActionPopup.properties.saveAsTemplate.allOf).toEqual([
      { $ref: '#/components/schemas/FlowSurfacePopupSaveAsTemplate' },
    ]);
    expect(schemas.FlowSurfaceComposeFieldPopup.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfacePopupTemplateRef',
    );
    expect(schemas.FlowSurfaceComposeFieldPopup.properties.tryTemplate.type).toBe('boolean');
    expect(schemas.FlowSurfaceComposeFieldPopup.properties.defaultType.enum).toEqual(['view', 'edit']);
    expect(schemas.FlowSurfaceComposeFieldPopup.properties.saveAsTemplate.allOf).toEqual([
      { $ref: '#/components/schemas/FlowSurfacePopupSaveAsTemplate' },
    ]);
    expect(schemas.FlowSurfaceApplyNodePopup.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfacePopupTemplateRef',
    );
    expect(schemas.FlowSurfaceApplyNodePopup.properties.tryTemplate.type).toBe('boolean');
    expect(schemas.FlowSurfaceApplyNodePopup.properties.template.properties?.local).toBeUndefined();
    expect(schemas.FlowSurfacePopupSaveAsTemplate.required).toEqual(['name', 'description']);
    expect(schemas.FlowSurfacePopupSaveAsTemplate.properties.name.type).toBe('string');
    expect(schemas.FlowSurfacePopupSaveAsTemplate.properties.description.type).toBe('string');
    expect(schemas.FlowSurfaceNodeSpec.properties.popup.$ref).toBe('#/components/schemas/FlowSurfaceApplyNodePopup');

    const listTemplatesRequest =
      swaggerDocument.paths['/flowSurfaces:listTemplates'].post.requestBody.content['application/json'];
    expect(listTemplatesRequest.example?.target?.uid).toBe('employee-table-block');
    expect(listTemplatesRequest.example?.type).toBe('popup');
    expect(listTemplatesRequest.example?.actionType).toBe('view');
    expect(listTemplatesRequest.example?.actionScope).toBe('record');
    expect(listTemplatesRequest.example?.search).toBe('employee popup');
    expect(listTemplatesRequest.example?.pageSize).toBe(20);
    const getTemplateRequest =
      swaggerDocument.paths['/flowSurfaces:getTemplate'].post.requestBody.content['application/json'];
    expect(getTemplateRequest.example?.uid).toBe('employee-form-template');
    const saveTemplateRequest =
      swaggerDocument.paths['/flowSurfaces:saveTemplate'].post.requestBody.content['application/json'];
    expect(saveTemplateRequest.example?.description).toContain('Reusable');
    const convertTemplateToCopyRequest =
      swaggerDocument.paths['/flowSurfaces:convertTemplateToCopy'].post.requestBody.content['application/json'];
    expect(convertTemplateToCopyRequest.example?.target?.uid).toBe('employee-form-block');

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
      expect.arrayContaining([
        'table',
        'filterForm',
        'actionPanel',
        'jsBlock',
        'approvalInitiator',
        'approvalApprover',
      ]),
    );
    expect(schemas.FlowSurfaceComposeBlockSpec.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceBlockTemplateRef',
    );
    expect(schemas.FlowSurfaceComposeBlockSpec.properties.fieldsTemplate).toBeUndefined();
    expect(schemas.FlowSurfaceComposeBlockSpec.required).toEqual(['key']);
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[1].properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[2].properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[1].properties.key.type).toBe('string');
    expect(schemas.FlowSurfaceComposeActionSpec.oneOf[1].properties.key.type).toBe('string');
    expect(schemas.FlowSurfaceComposeRecordActionSpec.oneOf[1].properties.key.type).toBe('string');
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
        'approvalSubmit',
        'approvalApprove',
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
    expect(schemas.FlowSurfaceComposeResult.properties.blocks.items.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeBlockResult',
    );
    expect(schemas.FlowSurfaceComposeResult.properties.blocksByKey).toBeUndefined();
    expect(schemas.FlowSurfaceComposeResult.properties.keyToUid).toBeUndefined();
    expect(schemas.FlowSurfaceComposeBlockResult.properties.key.type).toBe('string');
    expect(schemas.FlowSurfaceComposeFieldResult.properties.key.type).toBe('string');
    expect(schemas.FlowSurfaceComposeActionResult.properties.key.type).toBe('string');
    expect(schemas.FlowSurfaceComposeBlockResult.properties.recordActions.description).toContain(
      'table/details/list/gridCard',
    );
    expect(swaggerDocument.paths['/flowSurfaces:compose'].post.description).toContain(
      'Blocks, fields, and actions can declare stable `key` values',
    );
    expect(schemas.FlowSurfaceComposeActionResult.properties.popupGridUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeActionResult.properties.assignFormUid.type).toBe('string');
    expect(schemas.FlowSurfaceComposeActionResult.properties.type.enum).toEqual(
      expect.arrayContaining([
        'link',
        'popup',
        'duplicate',
        'updateRecord',
        'templatePrint',
        'triggerWorkflow',
        'approvalSaveDraft',
        'approvalReject',
      ]),
    );
    expect(schemas.FlowSurfaceComposeFieldSpec.oneOf[1].properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeRequestFieldPopup',
    );
    expect(schemas.FlowSurfaceComposeActionSpec.oneOf[1].properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeRequestActionPopup',
    );
    expect(schemas.FlowSurfaceComposeRecordActionSpec.oneOf[1].properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeRequestActionPopup',
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
    const saveTemplateRequestForConfigure =
      swaggerDocument.paths['/flowSurfaces:saveTemplate'].post.requestBody.content['application/json'];
    expect(saveTemplateRequestForConfigure.example?.description).toContain('Reusable');
    const listTemplatesRequestForConfigure =
      swaggerDocument.paths['/flowSurfaces:listTemplates'].post.requestBody.content['application/json'];
    expect(listTemplatesRequestForConfigure.example?.search).toBe('employee popup');
    expect(listTemplatesRequestForConfigure.example?.actionType).toBe('view');
    expect(listTemplatesRequestForConfigure.example?.actionScope).toBe('record');
    expect(configureRequest.examples.pageHeaderSettings.value.changes.icon).toBe('UserOutlined');
    expect(configureRequest.examples.pageHeaderSettings.value.changes.enableHeader).toBe(false);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.quickEdit).toBe(true);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.treeTable).toBe(true);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.defaultExpandAllRows).toBe(true);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.dragSort).toBe(true);
    expect(configureRequest.examples.tableAdvancedSettings.value.changes.dragSortBy).toBe('sort');
    expect(configureRequest.examples.editFormSettings.value.changes.colon).toBe(false);
    expect(configureRequest.examples.editFormSettings.value.changes.dataScope.logic).toBe('$and');
    expect(configureRequest.examples.detailsCompatibilitySettings.value.changes.colon).toBe(true);
    expect(configureRequest.examples.detailsCompatibilitySettings.value.changes.linkageRules).toHaveLength(1);
    expect(configureRequest.examples.actionBehaviorCompatibilitySettings.value.changes.editMode).toBe('drawer');
    expect(configureRequest.examples.actionBehaviorCompatibilitySettings.value.changes.updateMode).toBe('overwrite');
    expect(configureRequest.examples.actionBehaviorCompatibilitySettings.value.changes.duplicateMode).toBe('popup');
    expect(configureRequest.examples.actionBehaviorCompatibilitySettings.value.changes.collapsedRows).toBe(2);
    expect(configureRequest.examples.actionBehaviorCompatibilitySettings.value.changes.defaultCollapsed).toBe(true);
    expect(configureRequest.examples.actionBehaviorCompatibilitySettings.value.changes.emailFieldNames).toEqual([
      'email',
      'backupEmail',
    ]);
    expect(configureRequest.examples.actionBehaviorCompatibilitySettings.value.changes.defaultSelectAllRecords).toBe(
      true,
    );

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
    expect(addFieldRequest.examples.popupTemplate.value.popup.template.uid).toBe('employee-popup-template');
    expect(addFieldRequest.examples.autoPopupTemplate.value.popup.tryTemplate).toBe(true);
    expect(addFieldRequest.examples.defaultEditPopup.value.popup.defaultType).toBe('edit');
    expect(addFieldRequest.examples.savePopupTemplate.value.popup.saveAsTemplate.name).toBe('employee-popup-template');
    expect(schemas.FlowSurfaceAddFieldRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceAddFieldRequest.oneOf).toHaveLength(2);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.renderer.enum).toEqual(['js']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.type.enum).toEqual(['jsColumn', 'jsItem']);
    expect(schemas.FlowSurfaceAddFieldRequest.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddFieldRequest.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceTemplateRef',
    );
    expect(schemas.FlowSurfaceAddFieldRequest.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeFieldPopup',
    );
    expect(schemas.FlowSurfaceAddFieldRequest.properties.wrapperProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldRequest.properties.fieldProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldRequest.properties.props).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldRequest.properties.decoratorProps).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldRequest.properties.stepParams).toBeUndefined();
    expect(schemas.FlowSurfaceAddFieldItem.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeFieldPopup',
    );
    expect(schemas.FlowSurfaceAddFieldItem.oneOf).toHaveLength(2);
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
      expect.arrayContaining(['markdown', 'actionPanel', 'jsBlock', 'approvalInitiator', 'approvalInformation']),
    );
    expect(schemas.FlowSurfaceAddBlockRequest.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceBlockTemplateRef',
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
    expect(addActionRequest.examples.autoPopupTemplate.value.popup.tryTemplate).toBe(true);
    expect(addActionRequest.examples.savePopupTemplate.value.popup.saveAsTemplate.name).toBe('employee-popup-template');
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
        'approvalSubmit',
        'approvalDelegate',
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
    expect(addRecordActionRequest.examples.addChild.value.type).toBe('addChild');
    expect(addRecordActionRequest.examples.addChild.value.settings.openView.collectionName).toBe('categories');
    expect(addRecordActionRequest.examples.js.value.type).toBe('js');
    expect(addRecordActionRequest.examples.js.value.settings.code).toContain('currentRecord');
    expect(addRecordActionRequest.examples.autoPopupTemplate.value.popup.tryTemplate).toBe(true);
    expect(addRecordActionRequest.examples.savePopupTemplate.value.popup.saveAsTemplate.name).toBe(
      'employee-popup-template',
    );
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
    expect(schemas.FlowSurfaceAddBlockItem.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceBlockTemplateRef',
    );
    expect(schemas.FlowSurfaceComposeBlockSpec.anyOf).toEqual(
      expect.arrayContaining([{ required: ['type'] }, { required: ['template'] }]),
    );
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
    expect(schemas.FlowSurfaceAddFieldsRequest.required).toEqual(['target']);
    expect(schemas.FlowSurfaceAddFieldsRequest.oneOf).toHaveLength(2);
    expect(schemas.FlowSurfaceAddFieldsRequest.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceTemplateRef',
    );
    expect(schemas.FlowSurfaceAddFieldItem.properties.settings.type).toBe('object');
    expect(schemas.FlowSurfaceAddFieldItem.properties.template.$ref).toBe(
      '#/components/schemas/FlowSurfaceTemplateRef',
    );
    expect(schemas.FlowSurfaceAddFieldItem.properties.popup.$ref).toBe(
      '#/components/schemas/FlowSurfaceComposeFieldPopup',
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
    expect(addRecordActionsRequest.examples.basic.value.recordActions).toHaveLength(3);
    expect(addRecordActionsRequest.examples.basic.value.recordActions.map((item: any) => item.type)).toEqual([
      'view',
      'edit',
      'delete',
    ]);
    expect(addRecordActionsRequest.examples.basic.value.recordActions[0].settings.openView.mode).toBe('drawer');
    expect(addRecordActionsRequest.examples.basic.value.recordActions[0].popup.blocks[0].type).toBe('details');
    expect(addRecordActionsRequest.examples.addChild.value.recordActions).toHaveLength(1);
    expect(addRecordActionsRequest.examples.addChild.value.recordActions[0].type).toBe('addChild');
    expect(addRecordActionsRequest.examples.addChild.value.recordActions[0].settings.openView.collectionName).toBe(
      'categories',
    );
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
    expect(mutateRequest.example.ops[1].values.menuRouteId).toEqual({
      step: 'menu',
      path: 'routeId',
    });
    expect(mutateRequest.example.ops[2].values.target.uid).toEqual({
      step: 'page',
      path: 'tabSchemaUid',
    });
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
    expect(applyRequest.example.spec.popup.tryTemplate).toBe(true);
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
    expect(catalogPath.description).toContain('When `sections` is omitted');
    expect(catalogPath.description).toContain('`selectedSections` in the response as the final authoritative result');
    expect(catalogPath.description).toContain('`loggedIn`');
    const composePath = swaggerDocument.paths['/flowSurfaces:compose'].post;
    expect(composePath.description).toContain('low-level building primitive');
    expect(composePath.description).not.toContain('preferred creation entry for AI callers');
    const configurePath = swaggerDocument.paths['/flowSurfaces:configure'].post;
    expect(configurePath.description).toContain('catalog item `configureOptions`');
    expect(configurePath.description).toContain('catalog.node.configureOptions');
    expect(configurePath.description).not.toContain('catalog(target).configureOptions');
    const listTemplatesPath = swaggerDocument.paths['/flowSurfaces:listTemplates'].post;
    expect(listTemplatesPath.description).toContain('required `description`');
    expect(listTemplatesPath.description).toContain('`loggedIn`');
    const getTemplatePath = swaggerDocument.paths['/flowSurfaces:getTemplate'].post;
    expect(getTemplatePath.description).toContain('usage count');
    expect(getTemplatePath.description).toContain('`loggedIn`');

    for (const actionName of [
      'catalog',
      'context',
      'listTemplates',
      'getTemplate',
      'compose',
      'configure',
      'saveTemplate',
      'updateTemplate',
      'destroyTemplate',
      'convertTemplateToCopy',
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
    expect(schemas.FlowSurfaceCreateMenuRequest.properties.pageUid).toBeUndefined();
    expect(schemas.FlowSurfaceCreatePageRequest.properties.menuRouteId).toBeTruthy();
  });
});
