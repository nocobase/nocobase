import { useCollectionManager, useCompile } from "@nocobase/client";

import { instructions, useAvailableUpstreams, useNodeContext } from "./nodes";
import { useFlowContext } from "./FlowContext";
import { triggers } from "./triggers";
import { NAMESPACE } from "./locale";



const VariableTypes = [
  {
    title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
    value: '$jobsMapByNodeId',
    options(types) {
      const current = useNodeContext();
      const upstreams = useAvailableUpstreams(current);
      const options = [];
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
];

export const TypeSets = {
  boolean: new Set(['boolean']),
  number: new Set(['integer', 'bigInt', 'float', 'double', 'real', 'decimal']),
  string: new Set(['string', 'text', 'password']),
  date: new Set(['date', 'time'])
}

function matchFieldType(field, type): Boolean {
  if (typeof type === 'string') {
    return Boolean(TypeSets[type]?.has(field.type));
  }

  if (typeof type === 'object' && type.type === 'reference') {
    return (field.collectionName === type.options?.collection && field.name === 'id')
      || (field.type === 'belongsTo' && field.target === type.options?.collection);
  }

  return false;
}

export function filterTypedFields(fields, types) {
  return types
    ? fields.filter(field => types.some(type => matchFieldType(field, type)))
    : fields;
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
      disabled: options && !options.length
    };
  });
  return options;
}

export function useCollectionFieldOptions(props) {
  const { fields, collection, types } = props;
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  return filterTypedFields((fields ?? getCollectionFields(collection)), types)
    .filter(field => field.interface && (!field.target || field.type === 'belongsTo'))
    .map(field => field.type === 'belongsTo'
      ? {
        label: `${compile(field.uiSchema?.title || field.name)} ID`,
        key: field.foreignKey,
        value: field.foreignKey,
      }
      : {
        label: compile(field.uiSchema?.title || field.name),
        key: field.name,
        value: field.name,
      });
}
