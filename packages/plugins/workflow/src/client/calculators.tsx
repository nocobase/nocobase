import React from "react";
import { Cascader, Input, InputNumber, Select } from "antd";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";

import { useCompile } from "@nocobase/client";
import { Registry } from "@nocobase/utils/client";

import { instructions, useAvailableUpstreams } from "./nodes";
import { useFlowContext } from "./FlowContext";
import { triggers } from "./triggers";
import { lang, NAMESPACE, useWorkflowTranslation } from "./locale";
import { NullRender } from './components/NullRender';



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
    title: '{{t("Comparision")}}',
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
      const { options = { type: 'string' } } = useOperandContext();
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
    options() {
      const upstreams = useAvailableUpstreams();
      return upstreams.map(node => ({
        value: node.id,
        label: node.title ?? `#${node.id}`
      }));
    },
    component(props) {
      const { nodes } = useFlowContext();
      const { options } = useOperandContext();
      if (!options?.nodeId) {
        return null;
      }
      const node = nodes.find(n => n.id == options.nodeId);
      if (!node) {
        return null;
      }
      const instruction = instructions.get(node.type);
      const getter = instruction?.useValueGetter?.(node);
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
    options() {
      const { workflow } = useFlowContext();
      const trigger = triggers.get(workflow.type);
      return trigger?.getOptions?.(workflow.config) ?? null;
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
  children?: React.ReactNode;
}

const OperandContext = React.createContext<ParsedOperand>({ type: 'constant', value: null });

export function useOperandContext() {
  return React.useContext(OperandContext);
}

export function Operand({
  value = null,
  onChange,
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
          const options = typeof item.options === 'function' ? item.options().filter(Boolean) : item.options;
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
      <OperandContext.Provider value={operand}>
        {children ?? <Variable value={operand.value} onChange={onChange} />}
      </OperandContext.Provider>
    </fieldset>
  );
}

export function Calculation({ calculator, operands = [null], onChange }) {
  const { t } = useWorkflowTranslation();
  const compile = useCompile();
  return (
    <VariableTypesContext.Provider value={VariableTypes}>
      <fieldset className={css`
        display: flex;
        gap: .5em;
        align-items: center;
      `}>
        <Operand value={operands[0]} onChange={(v => onChange({ calculator, operands: [v, operands[1]] }))} />
        {typeof operands[0] !== 'undefined'
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
      </fieldset>
    </VariableTypesContext.Provider>
  );
}

export function VariableComponent({ value, onChange, renderSchemaComponent }) {
  const VTypes = {
    ...VariableTypes,
    constant: {
      title: `{{t("Constant", { ns: "${NAMESPACE}" })}}`,
      value: 'constant',
    }
  };

  const { type } = parseValue(value, VTypes);

  return (
    <VariableTypesContext.Provider value={VTypes}>
      <Operand value={value} onChange={onChange}>
        {type === 'constant' ? renderSchemaComponent() : null}
      </Operand>
    </VariableTypesContext.Provider>
  );
}
