import React from "react";
import { Input, Select } from "antd";
import { css } from "@emotion/css";

import { useNodeContext } from "./nodes";



export const calculators = [
  { value: 'equal', name: '等于' },
  { value: 'notEqual', name: '不等于' }
];

const JT_VALUE_RE = /^\s*\{\{([\s\S]*)\}\}\s*$/;

function JobSelect({ value, onChange }) {
  const node = useNodeContext();
  const stack = [];
  for (let current = node.upstream; current; current = current.upstream) {
    stack.push(current);
  }
  return (
    <Select value={value} onChange={onChange}>
      {stack.map(item => (
        <Select.Option key={item.id} value={item.id}>{item.title ?? `#${item.id}`}</Select.Option>
      ))}
    </Select>
  );
}

function ContextSelect({ value, onChange }) {
  return (
    <Select></Select>
  );
}

const VariableTypeComponent = {
  constant({ onChange, ...props }) {
    return <Input {...props} onChange={ev => onChange(ev.target.value)} />
  },
  job: JobSelect,
  context: ContextSelect,
  // calculation: Calculation
};

function OperandTypeSelect({ value, onChange }) {
  return (
    <Select value={value} onChange={onChange} placeholder="变量来源">
      <Select.Option value="constant">常量</Select.Option>
      <Select.Option value="job">节点数据</Select.Option>
      <Select.Option value="context" disabled>触发数据</Select.Option>
      <Select.Option value="calculation" disabled>计算</Select.Option>
    </Select>
  );
}

export function Operand({ value: operand = { type: 'constant', value: '' }, onChange }) {
  const { value } = operand;
  let { type = 'constant' } = operand;
  if (typeof value === 'string') {
    const matcher = value.match(JT_VALUE_RE);

    if (matcher) {
      console.log(matcher);
    }
  }

  const VariableComponent = VariableTypeComponent[type];

  return (
    <div className={css`
      display: flex;
      gap: .5em;
    `}>
      <OperandTypeSelect value={type} onChange={v => onChange({ ...operand, type: v })} />
      <VariableComponent value={value} onChange={v => onChange({ ...operand, value: v })} />
    </div>
  );
}
