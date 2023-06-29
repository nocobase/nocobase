import { useCollectionManager, useCompile } from '@nocobase/client';
import { useFlowContext } from './FlowContext';
import { NAMESPACE } from './locale';
import { instructions, useAvailableUpstreams, useNodeContext, useUpstreamScopes } from './nodes';
import { triggers } from './triggers';

export type VariableOption = {
  key?: string;
  value: string;
  label: string;
  children?: VariableOptions;
};

export type VariableOptions = VariableOption[] | null;

export const nodesOptions = {
  label: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
  value: '$jobsMapByNodeId',
  useOptions(options) {
    const current = useNodeContext();
    const upstreams = useAvailableUpstreams(current);
    const result: VariableOption[] = [];
    upstreams.forEach((node) => {
      const instruction = instructions.get(node.type);
      const subOptions = instruction.useVariables?.(node, options);
      if (subOptions) {
        result.push({
          key: node.id.toString(),
          value: node.id.toString(),
          label: node.title ?? `#${node.id}`,
          children: subOptions,
        });
      }
    });
    return result;
  },
};

export const triggerOptions = {
  label: `{{t("Trigger variables", { ns: "${NAMESPACE}" })}}`,
  value: '$context',
  useOptions(options) {
    const { workflow } = useFlowContext();
    const trigger = triggers.get(workflow.type);
    return trigger?.useVariables?.(workflow.config, options) ?? null;
  },
};

export const scopeOptions = {
  label: `{{t("Scope variables", { ns: "${NAMESPACE}" })}}`,
  value: '$scopes',
  useOptions(options) {
    const current = useNodeContext();
    const scopes = useUpstreamScopes(current);
    const result: VariableOption[] = [];
    scopes.forEach((node) => {
      const instruction = instructions.get(node.type);
      const subOptions = instruction.useScopeVariables?.(node, options);
      if (subOptions) {
        result.push({
          key: node.id.toString(),
          value: node.id.toString(),
          label: node.title ?? `#${node.id}`,
          children: subOptions,
        });
      }
    });
    return result;
  },
};

export const systemOptions = {
  label: `{{t("System variables", { ns: "${NAMESPACE}" })}}`,
  value: '$system',
  useOptions({ types }) {
    return [
      ...(!types || types.includes('date')
        ? [
            {
              key: 'now',
              value: 'now',
              label: `{{t("System time")}}`,
            },
          ]
        : []),
    ];
  },
};

export const BaseTypeSets = {
  boolean: new Set(['checkbox']),
  number: new Set(['number', 'percent']),
  string: new Set([
    'input',
    'password',
    'email',
    'phone',
    'select',
    'radioGroup',
    'text',
    'markdown',
    'richText',
    'expression',
    'time',
  ]),
  date: new Set(['date', 'createdAt', 'updatedAt']),
};

// { type: 'reference', options: { collection: 'users', multiple: false } }
// { type: 'reference', options: { collection: 'attachments', multiple: false } }
// { type: 'reference', options: { collection: 'myExpressions', entity: false } }

function matchFieldType(field, type, depth): boolean {
  const inputType = typeof type;
  if (inputType === 'string') {
    return BaseTypeSets[type]?.has(field.interface);
  }

  if (inputType === 'object' && type.type === 'reference') {
    if (isAssociationField(field)) {
      return (
        type.options?.entity && (field.collectionName === type.options?.collection || type.options?.collection === '*')
      );
    } else if (field.isForeignKey) {
      return (
        (field.collectionName === type.options?.collection && field.name === 'id') ||
        field.target === type.options?.collection
      );
    } else {
      return false;
    }
  }

  if (inputType === 'function') {
    return type(field, depth);
  }

  return false;
}

function isAssociationField(field): boolean {
  return ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type);
}

export function filterTypedFields({ fields, types, depth = 1, compile, getCollectionFields }) {
  if (!types) {
    return fields;
  }
  return fields.filter((field) => {
    if (
      isAssociationField(field) &&
      depth &&
      filterTypedFields({
        fields: getNormalizedFields(field.target, { compile, getCollectionFields }),
        types,
        depth: depth - 1,
        compile,
        getCollectionFields,
      }).length
    ) {
      return true;
    }
    return types.some((type) => matchFieldType(field, type, depth));
  });
}

export function useWorkflowVariableOptions(options = {}) {
  const compile = useCompile();
  const result = [scopeOptions, nodesOptions, triggerOptions, systemOptions].map((item: any) => {
    const opts = typeof item.useOptions === 'function' ? item.useOptions(options).filter(Boolean) : null;
    return {
      label: compile(item.label),
      value: item.value,
      key: item.value,
      children: compile(opts),
      disabled: opts && !opts.length,
    };
  });

  return result;
}

function getNormalizedFields(collectionName, { compile, getCollectionFields }) {
  const fields = getCollectionFields(collectionName);
  const foreignKeyFields: any[] = [];
  const otherFields: any[] = [];
  fields.forEach((field) => {
    if (field.isForeignKey) {
      foreignKeyFields.push(field);
    } else {
      otherFields.push(field);
    }
  });
  for (let i = otherFields.length - 1; i >= 0; i--) {
    const field = otherFields[i];
    if (field.type === 'belongsTo') {
      const foreignKeyField = foreignKeyFields.find((f) => f.name === field.foreignKey);
      if (foreignKeyField) {
        otherFields.splice(i, 0, {
          ...field,
          ...foreignKeyField,
          uiSchema: {
            ...field.uiSchema,
            title: field.uiSchema?.title ? `${compile(field.uiSchema?.title)} ID` : foreignKeyField.name,
          },
        });
      } else {
        otherFields.splice(i, 0, {
          ...field,
          name: field.foreignKey,
          type: 'bigInt',
          isForeignKey: true,
          interface: field.interface,
          uiSchema: {
            ...field.uiSchema,
            title: field.uiSchema?.title ? `${compile(field.uiSchema?.title)} ID` : field.name,
          },
        });
      }
    } else if (field.type === 'context' && field.collectionName === 'users') {
      const belongsToField =
        otherFields.find((f) => f.type === 'belongsTo' && f.target === 'users' && f.foreignKey === field.name) ?? {};
      otherFields.splice(i, 0, {
        ...field,
        type: field.dataType,
        interface: belongsToField.interface,
        uiSchema: {
          ...belongsToField.uiSchema,
          title: belongsToField.uiSchema?.title ? `${compile(belongsToField.uiSchema?.title)} ID` : field.name,
        },
      });
    }
  }

  return otherFields.filter((field) => field.interface && !field.hidden);
}

async function loadChildren(option) {
  setTimeout(() => {
    option.children = getCollectionFieldOptions({
      collection: option.field.target,
      types: option.types,
      depth: option.depth - 1,
      compile: this.compile,
      getCollectionFields: this.getCollectionFields,
    });
  });
}

export function getCollectionFieldOptions(options): VariableOption[] {
  const { fields, collection, types, depth = 1, compile, getCollectionFields } = options;
  const normalizedFields = getNormalizedFields(collection, { compile, getCollectionFields });
  const computedFields = fields ?? normalizedFields;

  const result: VariableOption[] = filterTypedFields({
    fields: computedFields,
    types,
    depth,
    compile,
    getCollectionFields,
  })
    .filter((field) => !isAssociationField(field) || depth)
    .map((field) => {
      const label = compile(field.uiSchema?.title || field.name);
      const isLeaf = !isAssociationField(field) || !depth;
      return {
        label,
        key: field.name,
        value: field.name,
        isLeaf,
        loadChildren: isLeaf ? null : loadChildren.bind({ compile, getCollectionFields }),
        field,
        depth,
        types,
      };
    });

  return result;
}
