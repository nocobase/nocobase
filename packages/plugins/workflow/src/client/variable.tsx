import React from "react";
import { Cascader, Input, InputNumber, Select } from "antd";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";

import { useCollectionManager, useCompile } from "@nocobase/client";

import { instructions, useAvailableUpstreams, useNodeContext } from "./nodes";
import { useFlowContext } from "./FlowContext";
import { triggers } from "./triggers";
import { lang, NAMESPACE } from "./locale";
import { NullRender } from './components/NullRender';

const JT_VALUE_RE = /^\s*\{\{([\s\S]*)\}\}\s*$/;

function getType(value) {
  if (value == null) {
    return 'null';
  }
  const type = typeof value;
  switch (type) {
    case 'object':
      break;
    default:
      // 'boolean'
      // 'number'
      // 'bigint'
      // 'string'
      // 'symbol'
      return type;
  }
  if (value instanceof Date) {
    return 'date';
  }
  return 'object';
}

type ParsedOperand = {
  type: string;
  value?: any;
  options?: any;
};

export function parseValue(value: any, Types): ParsedOperand {
  const valueType = getType(value);
  if (valueType !== 'string') {
    return { type: 'constant', value, options: { type: valueType } }
  }

  const matcher = value.match(JT_VALUE_RE);
  if (!matcher) {
    return { type: 'constant', value, options: { type: 'string' } };
  }

  const [type, ...paths] = matcher[1].split('.');

  return {
    type,
    options: paths.length ? (Types || VariableTypes)[type]?.parse(paths) : {}
  };
}

export const BaseTypeSet = new Set(['boolean', 'number', 'string', 'date']);

const ConstantTypes = {
  null: {
    title: `{{t("Null", { ns: "${NAMESPACE}" })}}`,
    value: 'null',
    default: null,
    component: NullRender,
  },
  string: {
    title: `{{t("String", { ns: "${NAMESPACE}" })}}`,
    value: 'string',
    component({ onChange, value }) {
      return (
        <Input
          value={value}
          onChange={ev => onChange(ev.target.value)}
        />
      );
    },
    default: ''
  },
  number: {
    title: '{{t("Number")}}',
    value: 'number',
    component({ onChange, value }) {
      return (
        <InputNumber
          value={value}
          onChange={onChange}
        />
      );
    },
    default: 0
  },
  boolean: {
    title: `{{t("Boolean", { ns: "${NAMESPACE}" })}}`,
    value: 'boolean',
    component({ onChange, value }) {
      const { t } = useTranslation();
      return (
        <Select
          value={value}
          onChange={onChange}
          placeholder={t('Select')}
        >
          <Select.Option value={true}>{lang('True')}</Select.Option>
          <Select.Option value={false}>{lang('False')}</Select.Option>
        </Select>
      );
    },
    default: false
  },
  // date: {
  //   title: '日期',
  //   value: 'date',
  //   component({ onChange, type, options, value }) {
  //     return <DatePicker value={value} onChange={v => onChange({ value: v, type, options })}/>;
  //   },
  //   default: new Date()
  // }
};

export const VariableTypes = {
  constant: {
    title: `{{t("Constant", { ns: "${NAMESPACE}" })}}`,
    value: 'constant',
    options: Object.values(ConstantTypes).map(item => ({
      value: item.value,
      label: item.title
    })),
    component(props) {
      const { operand: { options = { type: 'string' } } } = useOperandContext();
      return ConstantTypes[options.type]?.component(props);
    },
    appendTypeValue({ options = { type: 'string' } }) {
      return options?.type ? [options.type] : [];
    },
    onTypeChange([type, optionsType], onChange) {
      const { default: value } = ConstantTypes[optionsType];
      onChange(value);
    },
    parse(path) {
      return { path };
    }
  },
  $jobsMapByNodeId: {
    title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
    value: '$jobsMapByNodeId',
    options(types) {
      const current = useNodeContext();
      const upstreams = useAvailableUpstreams(current);
      return upstreams
      .filter(node => {
        const { useValueGetter } = instructions.get(node.type);
        // Note: consider `useValueGetter()` as the key of a value available node
        return Boolean(useValueGetter?.(node, types));
      })
      .map(node => ({
        value: node.id,
        label: node.title ?? `#${node.id}`
      }));
    },
    component(props) {
      const { nodes } = useFlowContext();
      const { operand: { options }, types } = useOperandContext();
      if (!options?.nodeId) {
        return null;
      }
      const node = nodes.find(n => n.id == options.nodeId);
      if (!node) {
        return null;
      }
      const instruction = instructions.get(node.type);

      const getter = instruction?.useValueGetter?.(node, types);
      return getter ? getter(props) : null;
    },
    appendTypeValue({ options = {} }: { type: string, options: any }) {
      return options.nodeId ? [Number.parseInt(options.nodeId, 10)] : [];
    },
    onTypeChange([type, nodeId], onChange) {
      onChange(`{{${type}.${nodeId}}}`);
    },
    parse([nodeId, ...path]) {
      return { nodeId, path: path.join('.') };
    },
    stringify(next) {
      return `{{${next.join('.')}}}`;
    }
  },
  $context: {
    title: `{{t("Trigger variables", { ns: "${NAMESPACE}" })}}`,
    value: '$context',
    options(types) {
      const { workflow } = useFlowContext();
      const trigger = triggers.get(workflow.type);
      return trigger?.getOptions?.(workflow.config, types) ?? null;
    },
    component(props) {
      const { workflow } = useFlowContext();
      const trigger = triggers.get(workflow.type);
      const getter = trigger?.useValueGetter?.(workflow.config);
      return getter ? getter(props) : null;
    },
    appendTypeValue({ options }) {
      return options.type ? [options.type] : [];
    },
    onTypeChange([type, optionType], onChange) {
      onChange(`{{${type}.${optionType}}}`);
    },
    parse([type, ...path]) {
      return { type, ...( path?.length ? { path: path.join('.') } : {}) };
    },
    stringify(next) {
      return `{{${next.join('.')}}}`;
    }
  },
  // calculation: Calculation
};

export const VariableTypesContext = React.createContext({});

export function useVariableTypes() {
  return React.useContext(VariableTypesContext);
}

interface OperandProps {
  value: any;
  onChange(v: any): void;
  types?: any[];
  children?: React.ReactNode;
}

const OperandContext = React.createContext<{ operand: ParsedOperand; types?: any[] }>({ operand: { type: 'constant', value: null } });

export function useOperandContext() {
  return React.useContext(OperandContext);
}

export function Operand({
  value = null,
  onChange,
  types,
  children
}: OperandProps) {
  const compile = useCompile();
  const Types = useVariableTypes();

  const operand = parseValue(value, Types);

  const { type } = operand;

  const { component: Variable = NullRender, appendTypeValue } = Types[type] || {};

  return (
    <fieldset className={css`
      display: flex;
      gap: .5em;
      align-items: center;
    `}>
      <Cascader
        allowClear={false}
        value={[Types[type] ? type : '', ...(appendTypeValue ? appendTypeValue(operand) : [])]}
        options={Object.values(Types).map((item: any) => {
          const options = typeof item.options === 'function' ? item.options(types).filter(Boolean) : item.options;
          return {
            label: compile(item.title),
            value: item.value,
            children: compile(options),
            disabled: options && !options.length,
            isLeaf: !options
          };
        })}
        onChange={(next: any) => {
          // 类型变化，包括主类型和子类型
          const { onTypeChange, stringify } = Types[next[0]];
          // 自定义处理
          if (typeof onTypeChange === 'function') {
            return onTypeChange(next, onChange);
          }
          // 主类型变化
          if (next[0] !== type) {
            if (next[0] === 'constant') {
              onChange(null);
              return;
            } else if (stringify) {
              onChange(stringify(next));
              return;
            }
            onChange({ type: next[0], value: null });
            return;
          }
        }}
      />
      <OperandContext.Provider value={{ operand, types }}>
        {children ?? <Variable value={operand.value} onChange={onChange} />}
      </OperandContext.Provider>
    </fieldset>
  );
}

const TypeSets = {
  boolean: ['boolean'],
  number: ['integer', 'bigInt', 'float', 'double', 'real', 'decimal'],
  string: ['string', 'text', 'password'],
  date: ['date', 'time']
}

function matchFieldType(field, type): Boolean {
  if (typeof type === 'string') {
    return Boolean(TypeSets[type]?.includes(field.type));
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

export function useAvailableCollectionFields(collection) {
  const { types } = useOperandContext();
  const { getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(collection);

  return filterTypedFields(fields, types);
}
