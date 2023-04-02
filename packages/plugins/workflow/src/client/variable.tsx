import { useCollectionManager, useCompile } from '@nocobase/client';
import { useFlowContext } from './FlowContext';
import { NAMESPACE } from './locale';
import { instructions, useAvailableUpstreams, useNodeContext } from './nodes';
import { triggers } from './triggers';

export type VariableOption = {
  key?: string;
  value: string;
  label: string;
  children?: VariableOption[] | null;
};

const VariableTypes = [
  {
    title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
    value: '$jobsMapByNodeId',
    options(types) {
      const current = useNodeContext();
      const upstreams = useAvailableUpstreams(current);
      const options: VariableOption[] = [];
      upstreams.forEach((node) => {
        const instruction = instructions.get(node.type);
        const subOptions = instruction.getOptions?.(node.config, types);
        if (subOptions) {
          options.push({
            key: node.id.toString(),
            value: node.id.toString(),
            label: node.title ?? `#${node.id}`,
            children: subOptions,
          });
        }
      });
      return options;
    },
  },
  {
    title: `{{t("Trigger variables", { ns: "${NAMESPACE}" })}}`,
    value: '$context',
    options(types) {
      const { workflow } = useFlowContext();
      const trigger = triggers.get(workflow.type);
      return trigger?.getOptions?.(workflow.config, types) ?? null;
    },
  },
  {
    title: `{{t("System variables", { ns: "${NAMESPACE}" })}}`,
    value: '$system',
    options: [
      {
        key: 'now',
        value: 'now',
        label: `{{t("Now")}}`,
      },
    ],
  },
];

export const TypeSets = {
  boolean: new Set(['boolean']),
  number: new Set(['integer', 'bigInt', 'float', 'double', 'real', 'decimal']),
  string: new Set(['string', 'text', 'password']),
  date: new Set(['date', 'time']),
};

function matchFieldType(field, type): Boolean {
  if (typeof type === 'string') {
    return Boolean(TypeSets[type]?.has(field.type));
  }

  if (typeof type === 'object' && type.type === 'reference') {
    return (
      (field.collectionName === type.options?.collection && field.name === 'id') ||
      (field.type === 'belongsTo' && field.target === type.options?.collection)
    );
  }

  return false;
}

export function filterTypedFields(fields, types) {
  return types ? fields.filter((field) => types.some((type) => matchFieldType(field, type))) : fields;
}

export function useWorkflowVariableOptions() {
  const compile = useCompile();
  const options = VariableTypes.map((item: any) => {
    const options = typeof item.options === 'function' ? item.options().filter(Boolean) : item.options;
    return {
      label: compile(item.title),
      value: item.value,
      key: item.value,
      children: compile(options),
      disabled: options && !options.length,
    };
  });
  return options;
}

function useCollectionNormalFields(collection) {
  const { getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(collection);
  return fields.filter(field => field.interface);
}

export function useCollectionFieldOptions(options, depth = 1): VariableOption[] {
  const { fields, collection, types } = options;
  const compile = useCompile();
  const result: VariableOption[] = [];
  filterTypedFields((fields ?? useCollectionNormalFields(collection)), types)
    .forEach(field => {
      const label = compile(field.uiSchema?.title || field.name);
      if (field.type === 'belongsTo') {
        result.push({
          label: `${label} ID`,
          key: field.foreignKey,
          value: field.foreignKey,
        });
      }
      result.push({
        label,
        key: field.name,
        value: field.name,
        children: ['linkTo', 'belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type) && depth > 0
          ? useCollectionFieldOptions({ collection: field.target, types }, depth - 1)
          : null
      });
    });

  return result;
}
