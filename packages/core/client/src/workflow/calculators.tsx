import React from "react";
import { observer } from "@formily/react";
import { FormItem } from "@formily/antd";
import { Cascader, DatePicker, Input, InputNumber, Select } from "antd";
import { css } from "@emotion/css";

import { instructions, useNodeContext } from "./nodes";
import { useFlowContext } from "./WorkflowCanvas";
import { triggers } from "./triggers";
import { SchemaComponent, useCompile } from "..";

function NullRender() {
  return null;
}

export const calculators = [
  {
    value: 'boolean',
    title: '值比较',
    children: [
      { value: 'equal', name: '=' },
      { value: 'notEqual', name: '≠' },
      { value: 'gt', name: '>' },
      { value: 'gte', name: '≥' },
      { value: 'lt', name: '<' },
      { value: 'lte', name: '≤' }
    ]
  },
  {
    value: 'number',
    title: '算术运算',
    children: [
      { value: 'add', name: '+' },
      { value: 'minus', name: '-' },
      { value: 'multipe', name: '*' },
      { value: 'divide', name: '/' },
      { value: 'mod', name: '%' },
    ]
  },
  {
    value: 'string',
    title: '字符串',
    children: [
      { value: 'includes', name: '包含' },
      { value: 'notIncludes', name: '不包含' },
      { value: 'startsWith', name: '开头是' },
      { value: 'notStartsWith', name: '开头不是' },
      { value: 'endsWith', name: '结尾是' },
      { value: 'notEndsWith', name: '结尾不是' }
    ]
  },
  {
    value: 'date',
    title: '日期',
    children: []
  }
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
    options: paths.length ? (Types || VariableTypes)[type]?.parse(paths) : {}
  };
}

export const BaseTypeSet = new Set(['boolean', 'number', 'string', 'date']);

const ConstantTypes = {
  string: {
    title: '字符串',
    value: 'string',
    component({ onChange, type, options, value }) {
      return (
        <Input
          value={value}
          onChange={ev => onChange({ value: ev.target.value, type, options })}
        />
      );
    },
    default: ''
  },
  number: {
    title: '数字',
    value: 'number',
    component({ onChange, type, options, value }) {
      return (
        <InputNumber
          value={value}
          onChange={v => onChange({ value: v, type, options })}
        />
      );
    },
    default: 0
  },
  boolean: {
    title: '逻辑值',
    value: 'boolean',
    component({ onChange, type, options, value }) {
      return (
        <Select value={value} onChange={v => onChange({ value: v, type, options })}>
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
  //   component({ onChange, type, options, value }) {
  //     return <DatePicker value={value} onChange={v => onChange({ value: v, type, options })}/>;
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
    component({ options = { type: 'string' } }) {
      return ConstantTypes[options.type]?.component ?? NullRender;
    },
    appendTypeValue({ options = { type: 'string' } }) {
      return options?.type ? [options.type] : [];
    },
    onTypeChange(old, [type, optionsType], onChange) {
      if (old?.options?.type === optionsType) {
        return;
      }
      const { default: value } = ConstantTypes[optionsType];
      onChange({
        value,
        type,
        options: { ...old.options, type: optionsType }
      });
    },
    parse(path) {
      return { path };
    }
  },
  $jobsMapByNodeId: {
    title: '节点数据',
    value: '$jobsMapByNodeId',
    options() {
      const node = useNodeContext();
      const stack = [];
      for (let current = node.upstream; current; current = current.upstream) {
        const { getter } = instructions.get(current.type);
        // Note: consider `getter` as the key of a value available node
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
    onTypeChange(old, [type, nodeId], onChange) {
      onChange({
        // ...old,
        type,
        options: { nodeId }
      });
    },
    parse([nodeId, ...path]) {
      return { nodeId, path: path.join('.') };
    },
    stringify({ options }) {
      const stack = ['$jobsMapByNodeId'];
      if (options.nodeId) {
        stack.push(options.nodeId);
        if (options.path) {
          stack.push(options.path);
        }
      }
      return `{{${stack.join('.')}}}`;
    }
  },
  $context: {
    title: '触发数据',
    value: '$context',
    component() {
      const { workflow } = useFlowContext();
      const trigger = triggers.get(workflow.type);
      return trigger?.getter ?? NullRender;
    },
    parse([prefix, ...path]) {
      return { path: path.join('.') };
    },
    stringify({ options }) {
      const stack = ['$context'];
      if (options?.path) {
        stack.push(options.path);
      }
      return `{{${stack.join('.')}}}`;
    }
  },
  // calculation: Calculation
};

export const VariableTypesContext = React.createContext(null);

export function useVariableTypes() {
  return React.useContext(VariableTypesContext);
}

interface OperandProps {
  value: {
    type: string;
    value?: any;
    options?: any;
  };
  onChange(v: any): void;
  children?: React.ReactNode;
}

export function Operand({
  value: operand = { type: 'constant', value: '', options: { type: 'string' } },
  onChange,
  children
}: OperandProps) {
  const Types = useVariableTypes();

  const { type } = operand;

  const { component, appendTypeValue } = Types[type] || {};
  const VariableComponent = typeof component === 'function' ? component(operand) : NullRender;

  return (
    <div className={css`
      display: flex;
      gap: .5em;
      align-items: center;
    `}>
      <Cascader
        allowClear={false}
        value={[type, ...(appendTypeValue ? appendTypeValue(operand) : [])]}
        options={Object.values(Types).map((item: any) => {
          const options = typeof item.options === 'function' ? item.options() : item.options;
          return {
            label: item.title,
            value: item.value,
            children: options,
            disabled: options && !options.length,
            isLeaf: !options
          };
        })}
        onChange={(next: Array<string | number>) => {
          const { onTypeChange } = Types[next[0]];
          if (typeof onTypeChange === 'function') {
            onTypeChange(operand, next, onChange);
          } else {
            if (next[0] !== type) {
              onChange({ type: next[0], value: null });
            }
          }
        }}
      />
      {children ?? <VariableComponent {...operand} onChange={op => onChange({ ...op })} />}
    </div>
  );
}

export function Calculation({ calculator, operands = [], onChange }) {
  return (
    <VariableTypesContext.Provider value={VariableTypes}>
      <div className={css`
        display: flex;
        gap: .5em;
        align-items: center;

        .ant-select{
          width: auto;
          min-width: 6em;
        }
      `}>
        <Operand value={operands[0]} onChange={(v => onChange({ calculator, operands: [v, operands[1]] }))} />
        {operands[0]
          ? (
            <>
              <Select value={calculator} onChange={v => onChange({ operands, calculator: v })}>
                {calculators.map(group => (
                  <Select.OptGroup key={group.value} label={group.title}>
                    {group.children.map(item => (
                      <Select.Option key={item.value} value={item.value}>{item.name}</Select.Option>
                    ))}
                  </Select.OptGroup>
                ))}
              </Select>
              <Operand value={operands[1]} onChange={(v => onChange({ calculator, operands: [operands[0], v] }))} />
            </>
          )
          : null
        }
      </div>
    </VariableTypesContext.Provider>
  );
}

export function VariableComponent({ value, onChange, renderSchemaComponent }) {
  const VTypes = { ...VariableTypes,
    constant: {
      title: '常量',
      value: 'constant',
      options: undefined
    }
  };

  const operand = typeof value === 'string'
    ? parseStringValue(value, VTypes)
    : { type: 'constant', value };

  return (
    <VariableTypesContext.Provider value={VTypes}>
      <Operand
        value={operand}
        onChange={(next) => {
          if (next.type !== operand.type && next.type === 'constant') {
            onChange(null);
          } else {
            const { stringify } = VTypes[next.type];
            onChange(stringify(next));
          }
        }}
      >
        {operand.type === 'constant' ? renderSchemaComponent() : null}
      </Operand>
    </VariableTypesContext.Provider>
  );
}

// NOTE: observer for watching useProps
export const CollectionFieldset = observer(({ value, onChange, useProps }: any) => {
  const { fields } = useProps();
  const compile = useCompile();

  const VTypes = { ...VariableTypes,
    constant: {
      title: '常量',
      value: 'constant',
      options: undefined
    }
  };

  return (
    <fieldset className={css`
      margin-top: .5em;

      .ant-formily-item{
        .ant-formily-item-label{
          line-height: 32px;
        }

        .ant-select,
        .ant-cascader-picker,
        .ant-picker,
        .ant-input-number,
        .ant-input-affix-wrapper{
          width: auto;
        }
      }
    `}>
      {fields.length
        ? fields.map(field => {
            const operand = typeof value[field.name] === 'string'
              ? parseStringValue(value[field.name], VTypes)
              : { type: 'constant', value: value[field.name] };

            return (
              <FormItem label={compile(field.title)}>
                <VariableTypesContext.Provider value={VTypes}>
                  <Operand
                    value={operand}
                    onChange={(next) => {
                      if (next.type !== operand.type && next.type === 'constant') {
                        onChange({ ...value, [field.name]: null });
                      } else {
                        const { stringify } = VTypes[next.type];
                        onChange({ ...value, [field.name]: stringify(next) });
                      }
                    }}
                  >
                    {operand.type === 'constant'
                      ? <SchemaComponent schema={field.schema} />
                      : null
                    }
                  </Operand>
                </VariableTypesContext.Provider>
              </FormItem>
            );
          })
        : <p>请先选择数据表</p>
      }
    </fieldset>
  );
});
