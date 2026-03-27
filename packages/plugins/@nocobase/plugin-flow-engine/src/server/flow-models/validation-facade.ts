/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowSchemaService, type FlowSchemaValidationIssue } from '../flow-schema-service';
import FlowModelRepository from '../repository';
import { FlowModelOperationError } from './repository-internals/errors';

export class FlowModelValidationFacade {
  constructor(
    private readonly flowSchemaService: FlowSchemaService,
    private readonly app: any,
  ) {}

  async prepareEnsureValues(
    values: any,
    repository: FlowModelRepository,
    options: {
      transaction?: any;
    } = {},
  ) {
    const uid = String(values?.uid || '').trim();
    if (uid) {
      const existing = await (repository.model as any)?.findByPk?.(uid, {
        transaction: options.transaction,
      });
      if (existing) {
        return values;
      }
    }

    return this.assertValidFlowModelSchema(values, { allowRootObjectLocator: true });
  }

  assertValidFlowModelSchema(
    values: any,
    options: {
      allowRootObjectLocator?: boolean;
    } = {},
  ) {
    const normalizedValues = this.flowSchemaService.normalizeModelTree(values, [], {
      allowRootObjectLocator: options.allowRootObjectLocator,
    });
    const validatedValues = this.validateNormalizedFlowModelSchema(normalizedValues, options);
    if (!options.allowRootObjectLocator) {
      return validatedValues;
    }
    return this.flowSchemaService.assignImplicitUids(validatedValues, {
      allowRootObjectLocator: options.allowRootObjectLocator,
    });
  }

  async assertValidFlowModelSchemaForSave(values: any, repository: FlowModelRepository) {
    const { existingNodeUids, existingNodeUses } = await this.getExistingFlowModelSaveTreeMetadata(values, repository);
    const preparedValues = this.patchExistingFlowModelUses(values, existingNodeUses);
    const normalizedValues = this.flowSchemaService.normalizeModelTree(preparedValues);
    const normalizedWithUids = this.flowSchemaService.assignImplicitUids(normalizedValues);
    return this.validateNormalizedFlowModelSchema(normalizedWithUids, { existingNodeUids });
  }

  validateNormalizedFlowModelSchema(
    normalizedValues: any,
    options: {
      allowRootObjectLocator?: boolean;
      existingNodeUids?: ReadonlySet<string>;
    } = {},
  ) {
    const issues = this.flowSchemaService.validateNormalizedModelTree(normalizedValues, options);
    const errors = issues.filter((item) => item.level === 'error');
    const warnings = issues.filter((item) => item.level === 'warning');

    if (warnings.length) {
      warnings.forEach((warning) => {
        this.app.logger.warn(warning.message, {
          type: 'flow-model-schema-warning',
          ...warning,
        });
      });
    }

    if (!errors.length) {
      return normalizedValues;
    }

    throw new FlowModelOperationError({
      status: 400,
      code: 'INVALID_FLOW_MODEL_SCHEMA',
      message: 'Flow model payload does not match registered JSON schema.',
      details: {
        errors: errors.map((item) => this.toValidationError(item)),
      },
    });
  }

  private async getExistingFlowModelSaveTreeMetadata(values: any, repository: FlowModelRepository) {
    const rootUid = String(values?.uid || '').trim();
    const existingNodeUids = new Set<string>();
    const existingNodeUses = new Map<string, string>();

    if (!rootUid) {
      return {
        existingNodeUids,
        existingNodeUses,
      };
    }

    const existingNodes = await repository.findNodesById(rootUid, { includeAsyncNode: true });
    for (const node of existingNodes || []) {
      const nodeUid = String(node?.uid || '').trim();
      if (!nodeUid) {
        continue;
      }
      existingNodeUids.add(nodeUid);
      const nodeOptions = FlowModelRepository.optionsToJson(node.options);
      const nodeUse = String(nodeOptions?.use || '').trim();
      if (nodeUse) {
        existingNodeUses.set(nodeUid, nodeUse);
      }
    }

    return {
      existingNodeUids,
      existingNodeUses,
    };
  }

  private patchExistingFlowModelUses(values: any, existingNodeUses: ReadonlyMap<string, string>): any {
    if (!values || typeof values !== 'object') {
      return values;
    }

    if (Array.isArray(values)) {
      return values.map((item) => this.patchExistingFlowModelUses(item, existingNodeUses));
    }

    const nextValues = { ...values };
    const nodeUid = String(values?.uid || '').trim();
    if (nodeUid && !String(values?.use || '').trim()) {
      const existingUse = existingNodeUses.get(nodeUid);
      if (existingUse) {
        nextValues.use = existingUse;
      }
    }

    const subModels = values?.subModels;
    if (!subModels || typeof subModels !== 'object' || Array.isArray(subModels)) {
      return nextValues;
    }

    nextValues.subModels = Object.fromEntries(
      Object.entries(subModels).map(([slotKey, slotValue]) => [
        slotKey,
        Array.isArray(slotValue)
          ? slotValue.map((item) => this.patchExistingFlowModelUses(item, existingNodeUses))
          : this.patchExistingFlowModelUses(slotValue, existingNodeUses),
      ]),
    );

    return nextValues;
  }

  private toValidationError(issue: FlowSchemaValidationIssue) {
    return {
      jsonPointer: issue.jsonPointer,
      modelUid: issue.modelUid,
      modelUse: issue.modelUse,
      section: issue.section,
      keyword: issue.keyword,
      message: issue.message,
      expectedType: issue.expectedType,
      allowedValues: issue.allowedValues,
      suggestedUses: issue.suggestedUses,
      fieldInterface: issue.fieldInterface,
      fieldType: issue.fieldType,
      targetCollectionTemplate: issue.targetCollectionTemplate,
      schemaHash: issue.schemaHash,
    };
  }
}
