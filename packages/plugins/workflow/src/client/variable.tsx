import { useCollectionManager, useCompile } from '@nocobase/client';
import { useFlowContext } from './FlowContext';
import { NAMESPACE } from './locale';
import { instructions, useAvailableUpstreams, useNodeContext } from './nodes';
import { triggers } from './triggers';

export type VariableOption = {
  key: string;
  value: string;
  label: string;
  children?: VariableOption[];
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

export function useCollectionFieldOptions(props) {
  const { fields, collection, types } = props;
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const result = filterTypedFields(fields ?? getCollectionFields(collection), types).map((field) => ({
    label: compile(field.uiSchema?.title || field.name),
    key: field.name,
    value: field.name,
    children: ['linkTo', 'belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)
      ? getCollectionFields(field.target)
          ?.filter((subField) => subField.interface && (!subField.target || subField.type === 'belongsTo'))
          .map((subField) =>
            subField.type === 'belongsTo'
              ? {
                  label: `${compile(subField.uiSchema?.title || subField.name)} ID`,
                  key: subField.foreignKey,
                  value: subField.foreignKey,
                }
              : {
                  label: compile(subField.uiSchema?.title || subField.name),
                  key: subField.name,
                  value: subField.name,
                },
          )
      : null,
  }));

  return result;
}
