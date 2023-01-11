import React from 'react';
import { Select } from 'antd';
import { css } from '@emotion/css';

import { useCompile } from '@nocobase/client';
import { Registry } from "@nocobase/utils/client";

import { Operand, VariableTypes, VariableTypesContext } from './variable';
import { NAMESPACE, useWorkflowTranslation } from "./locale";



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
