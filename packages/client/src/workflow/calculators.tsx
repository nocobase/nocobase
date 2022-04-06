import React from "react";
import { Cascader, DatePicker, Input, InputNumber, Select } from "antd";
import { css } from "@emotion/css";

import { instructions, useNodeContext } from "./nodes";
import { useFlowContext } from "./WorkflowCanvas";

function NullRender() {
  return null;
}

export const calculators = [
  { value: 'equal', name: '等于' },
  { value: 'notEqual', name: '不等于' }
];

const JT_VALUE_RE = /^\s*\{\{([\s\S]*)\}\}\s*$/;

export function parseStringValue(value: string, Types) {
  const matcher = value.match(JT_VALUE_RE);
  if (!matcher) {
    return { type: 'constant', value, options: { type: 'string' } };
  }

  const [type, ...paths] = matcher[1].split('.');

  return {
    type,
    options: paths.length ? (Types || VariableTypes)[type].parse(paths) : {}
  };
}

const ConstantTypes = {
  string: {
    title: '字符串',
    value: 'string',
    component({ onChange, type, options, ...props }) {
      return <Input {...props} onChange={ev => onChange(ev.target.value)} />;
    },
    default: ''
  },
  number: {
    title: '数字',
    value: 'number',
    component({ type, options, ...props }) {
      return <InputNumber {...props} />;
    },
    default: 0
  },
  boolean: {
    title: '逻辑值',
    value: 'boolean',
    component({ type, options, ...props }) {
      return (
        <Select {...props}>
          <Select.Option value={true}>真</Select.Option>
          <Select.Option value={false}>假</Select.Option>
        </Select>
      );
    },
    default: false
  },
  // date: {
  //   title: '日期',
  //   value: 'date',
  //   component({ type, options, ...props }) {
  //     return <DatePicker {...props} />;
  //   },
  //   default: new Date()
  // }
};

export const VariableTypes = {
  constant: {
    title: '常量',
    value: 'constant',
    options: Object.values(ConstantTypes).map(item => ({
      value: item.value,
      label: item.title
    })),
    component({ options: { type } = { type: 'string' } }) {
      return type ? ConstantTypes[type].component : NullRender;
    },
    appendTypeValue({ options = { type: 'string' } }) {
      return options?.type ? [options.type] : [];
    },
    onTypeChange(props, [type, optionsType], onChange) {
      const { default: value } = ConstantTypes[optionsType];
      onChange({
        value,
        type,
        options: { ...props.options, type: optionsType }
      });
    },
    parse(path) {
      return { path };
    }
  },
  job: {
    title: '节点数据',
    value: 'job',
    options() {
      const node = useNodeContext();
      const stack = [];
      for (let current = node.upstream; current; current = current.upstream) {
        const { getter } = instructions.get(current.type);
        // consider `getter` as the key of a value available node
        if (getter) {
          stack.push({
            value: current.id,
            label: current.title ?? `#${current.id}`
          });
        }
      }

      return stack;
    },
    component({ options }) {
      const { nodes } = useFlowContext();
      if (!options?.nodeId) {
        return NullRender;
      }
      const node = nodes.find(n => n.id == options.nodeId);
      if (!node) {
        return NullRender;
      }
      const instruction = instructions.get(node.type);
      return instruction?.getter ?? NullRender;
    },
    appendTypeValue({ options = {} }: { type: string, options: any }) {
      return options.nodeId ? [Number.parseInt(options.nodeId, 10)] : [];
    },
    onTypeChange(props, [type, nodeId], onChange) {
      onChange({
        ...props,
        type,
        options: { ...props.options, nodeId }
      });
    },
    parse([nodeId, ...path]) {
      return { nodeId, path: path.join('.') };
    },
    stringify({ options }) {
      const stack = ['job'];
      if (options.nodeId) {
        stack.push(options.nodeId);
        if (options.path) {
          stack.push(options.path);
        }
      }
      return `{{${stack.join('.')}}}`;
    }
  },
  // context: ContextSelect,
  // calculation: Calculation
};

interface OperandProps {
  value: {
    type: string;
    value?: any;
    options?: any;
  };
  onChange(v: any): void
}

export function Operand({ onChange, value: operand = { type: 'constant', value: '', options: { type: 'string' } } }: OperandProps) {
  const { type } = operand;

  const { component, appendTypeValue } = VariableTypes[type];
  const VariableComponent = typeof component === 'function' ? component(operand) : component;

  return (
    <div className={css`
      display: flex;
      gap: .5em;
      align-items: center;
    `}>
      <Cascader
        allowClear={false}
        value={[type, ...(appendTypeValue ? appendTypeValue(operand) : [])]}
        options={Object.values(VariableTypes).map(item => {
          const children = typeof item.options === 'function' ? item.options() : item.options;
          return {
            label: item.title,
            value: item.value,
            children,
            disabled: children && !children.length
          };
        })}
        onChange={(t: Array<string | number>) => {
          const { onTypeChange } = VariableTypes[t[0]];
          if (typeof onTypeChange === 'function') {
            onTypeChange(operand, t, onChange);
          } else {
            if (t[0] !== type) {
              onChange({ type: t[0], value: null });
            }
          }
        }}
      />
      <VariableComponent {...operand} onChange={v => onChange({ ...operand, value: v })} />
    </div>
  );
}

export function Calculation({ calculator, operands, onChange }) {
  return (
    <div className={css`
      display: flex;
      gap: .5em;
      align-items: center;

      .ant-select{
        width: auto;
      }
    `}>
      <Operand value={operands[0]} onChange={(v => onChange({ calculator, operands: [v, operands[1]] }))} />
      {operands[0]
        ? (
          <>
            <Select value={calculator} onChange={v => onChange({ operands, calculator: v })}>
              {calculators.map(item => (
                <Select.Option key={item.value} value={item.value}>{item.name}</Select.Option>
              ))}
            </Select>
            <Operand value={operands[1]} onChange={(v => onChange({ calculator, operands: [operands[0], v] }))} />
          </>
        )
        : null
      }
    </div>
  );
}
