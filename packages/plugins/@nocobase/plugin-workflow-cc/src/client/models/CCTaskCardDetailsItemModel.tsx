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

// 注意：如果更改这里的值，会导致渲染错误
export const TEMP_ASSOCIATION_PREFIX = 'ccTempAssoc_';

// 排除的字段
const EXCLUDED_FIELDS = ['node', 'job', 'workflow', 'execution', 'user'];

const sanitizeFieldKey = (value: string | number) => String(value ?? '').replace(/[^a-zA-Z0-9_]/g, '_');

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

export type CCTaskTempAssociationFieldConfig = {
  fieldName: string;
  nodeId: string | number;
  nodeType: 'workflow' | 'node';
  timestamp?: number;
};

type CCTaskAssociationMetadata = CCTaskTempAssociationFieldConfig & {
  title?: string;
  dataSourceKey: string;
  target: string;
};

export const getWorkflowCcTaskAssociationMetadata = ({
  workflow,
  nodes,
  collection,
}: Pick<CCTaskAssociationContext, 'workflow' | 'nodes'> & { collection?: Collection }): CCTaskAssociationMetadata[] => {
  const associations: CCTaskAssociationMetadata[] = [];

  const collectAssociation = (
    collectionName: string,
    title: string | undefined,
    key: string | number,
    nodeId: string | number,
    nodeType: CCTaskTempAssociationFieldConfig['nodeType'],
  ) => {
    const [dataSourceKey, target] = parseCollectionName(collectionName);
    if (!target) return;
    const fieldName = `${TEMP_ASSOCIATION_PREFIX}${nodeType}_${sanitizeFieldKey(key)}`;
    if (collection?.getField(fieldName)) {
      return;
    }
    const resolvedTitle = title || target;
    associations.push({
      fieldName,
      nodeId,
      nodeType,
      title: resolvedTitle,
      dataSourceKey: dataSourceKey || 'main',
      target,
    });
  };

  if (workflow?.config?.collection) {
    const key = 'workflow';
    const nodeId = workflow?.id ?? key;
    collectAssociation(workflow.config.collection, workflow.title, key, nodeId, 'workflow');
  }

  (nodes || []).forEach((node) => {
    if (!node?.config?.collection) return;
    const key = node?.key ?? node?.id;
    const nodeId = node?.id ?? key;
    collectAssociation(node.config.collection, node.title, key, nodeId, 'node');
  });

  return associations;
};

export const updateWorkflowCcTaskAssociationFields = ({ flowEngine, workflow, nodes }: CCTaskAssociationContext) => {
  if (!flowEngine) return;
  const collection = flowEngine.dataSourceManager.getCollection('main', 'workflowCcTasks');
  if (!collection) return;
  const associations = getWorkflowCcTaskAssociationMetadata({ workflow, nodes, collection });

  if (!associations.length) {
    return;
  }

  associations.forEach((association) => {
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
