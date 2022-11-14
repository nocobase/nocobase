import React from "react";
import { Cascader, Input, InputNumber, Select } from "antd";
import { css } from "@emotion/css";

import { useCompile } from "@nocobase/client";

import { instructions, useNodeContext } from "./nodes";
import { useFlowContext } from "./FlowContext";
import { triggers } from "./triggers";
import { useTranslation } from "react-i18next";
import { Registry } from "@nocobase/utils/client";
import { lang, NAMESPACE, useWorkflowTranslation } from "./locale";

function NullRender() {
  return null;
}

interface Calculator {
  name: string;
  type: 'boolean' | 'number' | 'string' | 'date' | 'unknown' | 'null' | 'array';
  group: string;
}

export const calculators = new Registry<Calculator>();

calculators.register('equal', {
  name: '=',
  type: 'boolean',
  group: 'boolean',
});
calculators.register('notEqual', {
  name: '≠',
  type: 'boolean',
  group: 'boolean',
});
calculators.register('gt', {
  name: '>',
  type: 'boolean',
  group: 'boolean',
});
calculators.register('gte', {
  name: '≥',
  type: 'boolean',
  group: 'boolean',
});
calculators.register('lt', {
  name: '<',
  type: 'boolean',
  group: 'boolean',
});
calculators.register('lte', {
  name: '≤',
  type: 'boolean',
  group: 'boolean',
});

calculators.register('add', {
  name: '+',
  type: 'number',
  group: 'number',
});
calculators.register('minus', {
  name: '-',
  type: 'number',
  group: 'number',
});
calculators.register('multiple', {
  name: '*',
  type: 'number',
  group: 'number',
});
calculators.register('divide', {
  name: '/',
  type: 'number',
  group: 'number',
});
calculators.register('mod', {
  name: '%',
  type: 'number',
  group: 'number',
});

calculators.register('includes', {
  name: '{{t("contains")}}',
  type: 'boolean',
  group: 'string'
});
calculators.register('notIncludes', {
  name: '{{t("does not contain")}}',
  type: 'boolean',
  group: 'string'
});
calculators.register('startsWith', {
  name: '{{t("starts with")}}',
  type: 'boolean',
  group: 'string'
});
calculators.register('notStartsWith', {
  name: '{{t("not starts with")}}',
  type: 'boolean',
  group: 'string'
});
calculators.register('endsWith', {
  name: '{{t("ends with")}}',
  type: 'boolean',
  group: 'string'
});
calculators.register('notEndsWith', {
  name: '{{t("not ends with")}}',
  type: 'boolean',
  group: 'string'
});
calculators.register('concat', {
  name: `{{t("concat", { ns: "${NAMESPACE}" })}}`,
  type: 'string',
  group: 'string'
});

const calculatorGroups = [
  {
    value: 'boolean',
    title: `{{t("Comparision", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: 'number',
    title: `{{t("Arithmetic calculation", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: 'string',
    title: `{{t("String operation", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: 'date',
    title: `{{t("Date", { ns: "${NAMESPACE}" })}}`,
  }
];

function getGroupCalculators(group) {
  return Array.from(calculators.getEntities()).filter(([key, value]) => value.group  === group);
}

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
    title: `{{t("String", { ns: "${NAMESPACE}" })}}`,
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
    title: '{{t("Number")}}',
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
    title: `{{t("Boolean", { ns: "${NAMESPACE}" })}}`,
    value: 'boolean',
    component({ onChange, type, options, value }) {
      const { t } = useTranslation();
      return (
        <Select
          value={value}
          onChange={v => onChange({ value: v, type, options })}
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
    title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
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
    title: `{{t("Trigger context", { ns: "${NAMESPACE}" })}}`,
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
  const compile = useCompile();
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
            label: compile(item.title),
            value: item.value,
            children: compile(options),
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
  const { t } = useWorkflowTranslation();
  const compile = useCompile();
  return (
    <VariableTypesContext.Provider value={VariableTypes}>
      <div className={css`
        display: flex;
        gap: .5em;
        align-items: center;
      `}>
        <Operand value={operands[0]} onChange={(v => onChange({ calculator, operands: [v, operands[1]] }))} />
        {operands[0]
          ? (
            <>
              <Select
                value={calculator}
                onChange={v => onChange({ operands, calculator: v })}
                placeholder={t('Calculator')}
              >
                {calculatorGroups.filter(group => Boolean(getGroupCalculators(group.value).length)).map(group => (
                  <Select.OptGroup key={group.value} label={compile(group.title)}>
                    {getGroupCalculators(group.value).map(([value, { name }]) => (
                      <Select.Option key={value} value={value}>{compile(name)}</Select.Option>
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
      title: `{{t("Constant", { ns: "${NAMESPACE}" })}}`,
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
