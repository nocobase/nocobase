import React from 'react';

import { Variable, parseCollectionName, useCompile, usePlugin } from '@nocobase/client';

import { useFlowContext } from './FlowContext';
import { NAMESPACE, lang } from './locale';
import { useAvailableUpstreams, useNodeContext, useUpstreamScopes } from './nodes';
import WorkflowPlugin from '.';

export type VariableOption = {
  key?: string;
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};

export type VariableDataType =
  | 'boolean'
  | 'number'
  | 'string'
  | 'date'
  | {
      type: 'reference';
      options: {
        collection: string;
        multiple?: boolean;
        entity?: boolean;
      };
    }
  | ((field: any) => boolean);

export type UseVariableOptions = {
  types?: VariableDataType[];
  fieldNames?: {
    label?: string;
    value?: string;
    children?: string;
  };
  appends?: string[] | null;
  depth?: number;
};

export const defaultFieldNames = { label: 'label', value: 'value', children: 'children' } as const;

export const nodesOptions = {
  label: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
  value: '$jobsMapByNodeKey',
  useOptions(options: UseVariableOptions) {
    const { instructions } = usePlugin(WorkflowPlugin);
    const current = useNodeContext();
    const upstreams = useAvailableUpstreams(current);
    const result: VariableOption[] = [];
    upstreams.forEach((node) => {
      const instruction = instructions.get(node.type);
      const subOption = instruction.useVariables?.(node, options);
      if (subOption) {
        result.push(subOption);
      }
    });
    return result;
  },
};

export const triggerOptions = {
  label: `{{t("Trigger variables", { ns: "${NAMESPACE}" })}}`,
  value: '$context',
  useOptions(options: UseVariableOptions) {
    const { triggers } = usePlugin(WorkflowPlugin);
    const { workflow } = useFlowContext();
    const trigger = triggers.get(workflow.type);
    return trigger?.useVariables?.(workflow.config, options) ?? null;
  },
};

export const scopeOptions = {
  label: `{{t("Scope variables", { ns: "${NAMESPACE}" })}}`,
  value: '$scopes',
  useOptions(options: UseVariableOptions & { current: any }) {
    const { fieldNames = defaultFieldNames, current } = options;
    const { instructions } = usePlugin(WorkflowPlugin);
    const source = useNodeContext();
    const from = current ?? source;
    const scopes = useUpstreamScopes(from);
    const result: VariableOption[] = [];
    scopes.forEach((node) => {
      const instruction = instructions.get(node.type);
      const subOptions = instruction.useScopeVariables?.(node, options);
      if (subOptions) {
        result.push({
          key: node.key,
          [fieldNames.value]: node.key,
          [fieldNames.label]: node.title ?? `#${node.id}`,
          [fieldNames.children]: subOptions,
        });
      }
    });
    return result;
  },
};

export const systemOptions = {
  label: `{{t("System variables", { ns: "${NAMESPACE}" })}}`,
  value: '$system',
  useOptions({ types, fieldNames = defaultFieldNames }: UseVariableOptions) {
    return [
      ...(!types || types.includes('date')
        ? [
            {
              key: 'now',
              [fieldNames.label]: lang('System time'),
              [fieldNames.value]: 'now',
            },
          ]
        : []),
    ];
  },
};

export const BaseTypeSets = {
  boolean: new Set(['checkbox']),
  number: new Set(['integer', 'number', 'percent']),
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

function matchFieldType(field, type: VariableDataType): boolean {
  if (typeof type === 'string') {
    return BaseTypeSets[type]?.has(field.interface);
  }

  if (typeof type === 'object' && type.type === 'reference') {
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

  if (typeof type === 'function') {
    return type(field);
  }

  return false;
}

function isAssociationField(field): boolean {
  return ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type);
}

function getNextAppends(field, appends: string[] | null): string[] | null {
  if (appends == null) {
    return null;
  }
  const fieldPrefix = `${field.name}.`;
  return appends.filter((item) => item.startsWith(fieldPrefix)).map((item) => item.replace(fieldPrefix, ''));
}

function filterTypedFields({ fields, types, appends, depth = 1, compile, getCollectionFields }) {
  return fields.filter((field) => {
    const match = types?.length ? types.some((type) => matchFieldType(field, type)) : true;
    if (isAssociationField(field)) {
      if (appends === null) {
        if (!depth) {
          return false;
        }
        return (
          match ||
          filterTypedFields({
            fields: getNormalizedFields(field.target, { compile, getCollectionFields }),
            types,
            depth: depth - 1,
            appends,
            compile,
            getCollectionFields,
          })
        );
      }
      const nextAppends = getNextAppends(field, appends);
      const included = appends.includes(field.name);
      if (match) {
        return included;
      } else {
        return (
          (nextAppends?.length || included) &&
          filterTypedFields({
            fields: getNormalizedFields(field.target, { compile, getCollectionFields }),
            types,
            // depth: depth - 1,
            appends: nextAppends,
            compile,
            getCollectionFields,
          }).length
        );
      }
    } else {
      return match;
    }
  });
}

function useOptions(scope, opts) {
  const compile = useCompile();
  const children = scope.useOptions?.(opts)?.filter(Boolean);
  const { fieldNames } = opts;
  return {
    [fieldNames.label]: compile(scope.label),
    [fieldNames.value]: scope.value,
    key: scope[fieldNames.value],
    [fieldNames.children]: children,
    disabled: !children || !children.length,
  };
}

export function useWorkflowVariableOptions(options: UseVariableOptions = {}) {
  const fieldNames = Object.assign({}, defaultFieldNames, options.fieldNames ?? {});
  const opts = Object.assign(options, { fieldNames });
  const result = [
    useOptions(scopeOptions, opts),
    useOptions(nodesOptions, opts),
    useOptions(triggerOptions, opts),
    useOptions(systemOptions, opts),
  ];
  // const cache = useMemo(() => result, [result]);

  return result;
}

function getNormalizedFields(collectionName, { compile, getCollectionFields }) {
  const [dataSourceName, collection] = parseCollectionName(collectionName);
  const fields = getCollectionFields(collection, dataSourceName);
  const foreignKeyFields: any[] = [];
  const result: any[] = [];
  fields.forEach((field) => {
    if (field.isForeignKey) {
      foreignKeyFields.push(field);
    } else {
      result.push(field);
    }
  });
  for (let i = result.length - 1; i >= 0; i--) {
    const field = result[i];
    if (field.type === 'belongsTo') {
      const foreignKeyField = foreignKeyFields.find((f) => f.name === field.foreignKey);
      if (foreignKeyField) {
        result.splice(i, 0, {
          ...field,
          ...foreignKeyField,
          uiSchema: {
            ...field.uiSchema,
            title: field.uiSchema?.title ? `${compile(field.uiSchema?.title)} ID` : foreignKeyField.name,
          },
        });
      } else {
        result.splice(i, 0, {
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
        result.find((f) => f.type === 'belongsTo' && f.target === 'users' && f.foreignKey === field.name) ?? {};
      result.splice(i, 0, {
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

  return result.filter((field) => field.interface && !field.hidden);
}

function loadChildren(option) {
  const appends = getNextAppends(option.field, option.appends);
  const result = getCollectionFieldOptions({
    collection: `${
      option.field.dataSourceKey && option.field.dataSourceKey !== 'main' ? `${option.field.dataSourceKey}:` : ''
    }${option.field.target}`,
    types: option.types,
    appends,
    depth: option.depth - 1,
    ...this,
  });
  option.loadChildren = null;
  if (result.length) {
    option.children = result;
  } else {
    option.isLeaf = true;
    const matchingType = option.types ? option.types.some((type) => matchFieldType(option.field, type)) : true;
    if (!matchingType) {
      option.disabled = true;
    }
  }
}

export function getCollectionFieldOptions(options): VariableOption[] {
  const {
    fields,
    collection,
    types,
    appends = [],
    depth = 1,
    compile,
    getCollectionFields,
    fieldNames = defaultFieldNames,
  } = options;
  const computedFields = fields ?? getNormalizedFields(collection, { compile, getCollectionFields });
  const boundLoadChildren = loadChildren.bind({ compile, getCollectionFields, fieldNames });

  const result: VariableOption[] = filterTypedFields({
    fields: computedFields,
    types,
    depth,
    appends,
    compile,
    getCollectionFields,
  }).map((field) => {
    const label = compile(field.uiSchema?.title || field.name);
    const nextAppends = getNextAppends(field, appends);
    // TODO: no matching fields in next appends should consider isLeaf as true
    const isLeaf =
      !isAssociationField(field) || (nextAppends && !nextAppends.length && !appends.includes(field.name)) || false;

    return {
      [fieldNames.label]: label,
      key: field.name,
      [fieldNames.value]: field.name,
      isLeaf,
      loadChildren: isLeaf ? null : boundLoadChildren,
      field,
      depth,
      appends,
      types,
    };
  });

  return result;
}

export function WorkflowVariableInput({ variableOptions, ...props }): JSX.Element {
  const scope = useWorkflowVariableOptions(variableOptions);
  return <Variable.Input scope={scope} {...props} />;
}

export function WorkflowVariableTextArea({ variableOptions, ...props }): JSX.Element {
  const scope = useWorkflowVariableOptions(variableOptions);
  return <Variable.TextArea scope={scope} {...props} />;
}

export function WorkflowVariableRawTextArea({ variableOptions, ...props }): JSX.Element {
  const scope = useWorkflowVariableOptions(variableOptions);
  return <Variable.RawTextArea scope={scope} {...props} />;
}

export function WorkflowVariableJSON({ variableOptions, ...props }): JSX.Element {
  const scope = useWorkflowVariableOptions(variableOptions);
  return <Variable.JSON scope={scope} {...props} />;
}
