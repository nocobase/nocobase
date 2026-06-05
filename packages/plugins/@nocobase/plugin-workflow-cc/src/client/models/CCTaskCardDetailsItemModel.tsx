/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsItemModel, parseCollectionName } from '@nocobase/client';
import { Collection, CollectionField, FlowModelContext, tExpr } from '@nocobase/flow-engine';
import { NAMESPACE } from '../../common/constants';
import { buildTempAssociationFieldName, TEMP_ASSOCIATION_PREFIX } from '../../common/tempAssociation';

// 排除的字段
const EXCLUDED_FIELDS = ['node', 'job', 'workflow', 'execution', 'user'];

class CCTaskCardTempAssociationField extends CollectionField {
  get targetCollection() {
    return (
      this.options.target &&
      this.flowEngine.dataSourceManager.getCollection(this.options.dataSourceKey, this.options.target)
    );
  }
}

type CCTaskAssociationContext = {
  flowEngine: FlowModelContext['model']['flowEngine'];
  workflow?: any;
  nodes?: any[];
};

type TempAssociationSource = {
  collection: string;
  nodeId: string | number;
  nodeKey: string;
  nodeType: 'workflow' | 'node';
};

export type CCTaskTempAssociationFieldConfig = {
  nodeId: string | number;
  nodeKey: string;
  nodeType: 'workflow' | 'node';
};

type CCTaskAssociationMetadata = CCTaskTempAssociationFieldConfig & {
  fieldName: string;
  title?: string;
  dataSourceKey: string;
  target: string;
};

export const getEligibleTempAssociationSources = (sources: TempAssociationSource[] = [], collection?: Collection) => {
  const unique = new Map<string, CCTaskAssociationMetadata>();
  sources.forEach((source) => {
    const fieldName = buildTempAssociationFieldName(source.nodeType, source.nodeKey);
    if (unique.has(fieldName) || collection?.getField(fieldName)) return;
    const [dataSourceKey, target] = parseCollectionName(source.collection);
    if (!target) return;
    unique.set(fieldName, {
      fieldName,
      nodeId: source.nodeId,
      nodeKey: source.nodeKey,
      nodeType: source.nodeType,
      title: source.nodeKey,
      dataSourceKey: dataSourceKey || 'main',
      target,
    });
  });
  return Array.from(unique.values());
};

export const updateWorkflowCcTaskAssociationFields = ({
  flowEngine,
  workflow,
  nodes,
  tempAssociationSources,
}: CCTaskAssociationContext & { tempAssociationSources?: TempAssociationSource[] }) => {
  if (!flowEngine) return;
  const collection = flowEngine.dataSourceManager.getCollection('main', 'workflowCcTasks');
  if (!collection) return;
  const associations = getEligibleTempAssociationSources(tempAssociationSources || [], collection);

  if (!associations.length) {
    return;
  }

  associations
    .map((item) => {
      const title = [workflow, ...(nodes || [])].find((node) => node.id === item.nodeId)?.title;
      return {
        ...item,
        title: title || item.nodeKey,
      };
    })
    .forEach((association) => {
      collection.addField(
        new CCTaskCardTempAssociationField({
          type: 'belongsTo',
          name: association.fieldName,
          dataSourceKey: association.dataSourceKey,
          target: association.target,
          interface: 'm2o',
          isAssociation: true,
          uiSchema: {
            title: association.title || association.target,
          },
        }),
      );
    });
};

export class CCTaskCardDetailsItemModel extends DetailsItemModel {
  static defineChildren(ctx: FlowModelContext) {
    const collection = ctx.collection as Collection;
    return collection
      .getFields()
      .map((field) => {
        const binding = this.getDefaultBindingByField(ctx, field, { fallbackToTargetTitleField: true });
        if (!binding) return null;
        if (EXCLUDED_FIELDS.includes(field.name)) return null;
        if (field.name.startsWith(TEMP_ASSOCIATION_PREFIX)) return null;
        const fieldModel = binding.modelName;
        const fullName = ctx.prefixFieldPath ? `${ctx.prefixFieldPath}.${field.name}` : field.name;
        return {
          key: fullName,
          label: field.title,
          refreshTargets: ['DetailsCustomItemModel/DetailsJSFieldItemModel'],
          toggleable: (subModel) => {
            const fieldPath = subModel.getStepParams('fieldSettings', 'init')?.fieldPath;
            return fieldPath === fullName;
          },
          useModel: 'CCTaskCardDetailsItemModel',
          createModelOptions: () => ({
            use: 'CCTaskCardDetailsItemModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection.dataSourceKey,
                  collectionName: ctx.model.context.blockModel.collection.name,
                  fieldPath: fullName,
                },
              },
            },
            subModels: {
              field: {
                use: fieldModel,
                props:
                  typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, field) : binding.defaultProps,
              },
            },
          }),
        };
      })
      .filter(Boolean);
  }

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('collectionField', {
      get: () => {
        const params = this.getFieldSettingsInitParams();
        const collectionField = this.context.dataSourceManager.getCollectionField(
          `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`,
        ) as CollectionField;

        if (!collectionField && this.context.workflow) {
          updateWorkflowCcTaskAssociationFields({
            flowEngine: this.flowEngine,
            workflow: this.context.workflow,
            nodes: this.context.nodes,
            tempAssociationSources: this.context.tempAssociationSources,
          });
          const refreshedField = this.context.dataSourceManager.getCollectionField(
            `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`,
          ) as CollectionField;
          return refreshedField;
        }

        return collectionField;
      },
      cache: false,
    });
  }
}

CCTaskCardDetailsItemModel.define({
  label: tExpr('CC information', { ns: NAMESPACE }),
  sort: 100,
});
