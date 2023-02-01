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
  if (type !== 'object') {
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
  type: string[];
  value?: any;
};

export function parseValue(value: any, Types: any = VariableTypes): ParsedOperand {
  const valueType = getType(value);
  const { appendTypeValue } = Types.constant ?? {};
  const constant = Types.constant ? {
    type: ['constant', ...(appendTypeValue ? appendTypeValue({ options: { type: valueType } }) : [])],
    value
  } : { type: [], value };
  if (valueType !== 'string') {
    return constant;
  }

  const matcher = value.match(JT_VALUE_RE);
  if (!matcher) {
    return constant;
  }

  return {
    type: matcher[1].split('.'),
  };
}

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
      const { operand: { value = '' } } = useOperandContext();
      const type = getType(value);
      return ConstantTypes[type]?.component(props);
    },
    appendTypeValue({ options = { type: 'string' } }) {
      return options?.type ? [options.type] : [];
    },
    onTypeChange([type, optionsType], onChange) {
      const { default: value } = ConstantTypes[optionsType];
      onChange(value);
    },
    // parse(path) {
    //   return { path };
    // }
  },
  $jobsMapByNodeId: {
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
  $context: {
    title: `{{t("Trigger variables", { ns: "${NAMESPACE}" })}}`,
    value: '$context',
    options(types) {
      const { workflow } = useFlowContext();
      const trigger = triggers.get(workflow.type);
      return trigger?.getOptions?.(workflow.config, types) ?? null;
    },
  },
};

interface OperandProps {
  value: any;
  onChange(v: any): void;
  scope: any;
  types?: (string | { type: string, options: { [key: string]: any } })[];
  children?: React.ReactNode;
}

const OperandContext = React.createContext<{ operand: ParsedOperand; types?: any[] }>({ operand: { type: ['constant'], value: null } });

export function useOperandContext() {
  return React.useContext(OperandContext);
}

export function Operand({
  value = null,
  onChange,
  scope = VariableTypes,
  types,
  children
}: OperandProps) {
  const compile = useCompile();

  const operand = parseValue(value, scope);

  const { type } = operand;

  const { component: Variable = NullRender } = scope[type[0]] || {};

  const options = Object.values(scope).map((item: any) => {
    const subOptions = typeof item.options === 'function' ? item.options(types).filter(Boolean) : item.options;
    return {
      label: compile(item.title),
      value: item.value,
      children: compile(subOptions),
      disabled: subOptions && !subOptions.length,
      isLeaf: !subOptions
    };
  });

  return (
    <fieldset className={css`
      display: flex;
      gap: .5em;
      align-items: center;
    `}>
      <Cascader
        allowClear={false}
        value={type}
        options={options}
        onChange={(next: any) => {
          // 类型变化，包括主类型和子类型
          const { onTypeChange } = scope[next[0]];
          // 自定义处理
          if (typeof onTypeChange === 'function') {
            onTypeChange(next, onChange);
            return;
          }
          if (next[0] === 'constant') {
            onChange(null);
          } else {
            onChange(`{{${next.join('.')}}}`);
          }
        }}
      />
      <OperandContext.Provider value={{ operand, types }}>
        {children ?? <Variable value={operand.value} onChange={onChange} />}
      </OperandContext.Provider>
    </fieldset>
  );
}

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

export function useAvailableCollectionFields(collection) {
  const { types } = useOperandContext();
  const { getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(collection);

  return filterTypedFields(fields, types);
}

export function useWorkflowVariableOptions() {
  const compile = useCompile();
  const options = [
    VariableTypes.$context,
    VariableTypes.$jobsMapByNodeId,
  ].map((item: any) => {
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
