/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsItemModel } from '@nocobase/client-v2';
import { parseCollectionName } from '@nocobase/plugin-workflow/client-v2';
import { CollectionField, type Collection, type FlowEngine, type FlowModelContext } from '@nocobase/flow-engine';

import { buildTempAssociationFieldName, TEMP_ASSOCIATION_PREFIX } from '../../common/tempAssociation';
import { NAMESPACE, tExpr } from '../locale';

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
  flowEngine: FlowEngine;
  nodes?: Array<{ id?: number | string; title?: string }>;
  workflow?: { id?: number | string; title?: string };
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
  dataSourceKey: string;
  fieldName: string;
  target: string;
  title?: string;
};

export const getEligibleTempAssociationSources = (sources: TempAssociationSource[] = [], collection?: Collection) => {
  const unique = new Map<string, CCTaskAssociationMetadata>();
  sources.forEach((source) => {
    const fieldName = buildTempAssociationFieldName(source.nodeType, source.nodeKey);
    if (unique.has(fieldName) || collection?.getField(fieldName)) {
      return;
    }
    const [dataSourceKey, target] = parseCollectionName(source.collection) as [string, string];
    if (!target) {
      return;
    }
    unique.set(fieldName, {
      dataSourceKey: dataSourceKey || 'main',
      fieldName,
      nodeId: source.nodeId,
      nodeKey: source.nodeKey,
      nodeType: source.nodeType,
      target,
      title: source.nodeKey,
    });
  });
  return Array.from(unique.values());
};

export const updateWorkflowCcTaskAssociationFields = ({
  flowEngine,
  nodes,
  tempAssociationSources,
  workflow,
}: CCTaskAssociationContext & { tempAssociationSources?: TempAssociationSource[] }) => {
  if (!flowEngine) {
    return;
  }
  const collection = flowEngine.dataSourceManager.getCollection('main', 'workflowCcTasks');
  if (!collection) {
    return;
  }
  const associations = getEligibleTempAssociationSources(tempAssociationSources || [], collection);
  if (!associations.length) {
    return;
  }

  associations
    .map((item) => {
      const title = [workflow, ...(nodes || [])].find((node) => node?.id === item.nodeId)?.title;
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
        if (!binding || EXCLUDED_FIELDS.includes(field.name) || field.name.startsWith(TEMP_ASSOCIATION_PREFIX)) {
          return null;
        }
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
                  collectionName: ctx.model.context.blockModel?.collection?.name ?? collection.name,
                  fieldPath: fullName,
                },
              },
            },
            subModels: {
              field: {
                use: binding.modelName,
                props:
                  typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, field) : binding.defaultProps,
              },
            },
          }),
        };
      })
      .filter(Boolean);
  }

  onInit(options: Parameters<DetailsItemModel['onInit']>[0]): void {
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
          return this.context.dataSourceManager.getCollectionField(
            `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`,
          ) as CollectionField;
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

export default CCTaskCardDetailsItemModel;
