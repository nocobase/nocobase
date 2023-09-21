import { CloseCircleOutlined } from '@ant-design/icons';
import { css, cx, useCompile, Variable } from '@nocobase/client';
import { evaluators } from '@nocobase/evaluators/client';
import { Registry } from '@nocobase/utils/client';
import { Button, Select } from 'antd';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { NodeDefaultView } from '.';
import { Branch } from '../Branch';
import { RadioWithTooltip, RadioWithTooltipOption } from '../components/RadioWithTooltip';
import { renderEngineReference } from '../components/renderEngineReference';
import { useFlowContext } from '../FlowContext';
import { lang, NAMESPACE } from '../locale';
import useStyles from '../style';
import { useWorkflowVariableOptions } from '../variable';

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
  group: 'string',
});
calculators.register('notIncludes', {
  name: '{{t("does not contain")}}',
  type: 'boolean',
  group: 'string',
});
calculators.register('startsWith', {
  name: '{{t("starts with")}}',
  type: 'boolean',
  group: 'string',
});
calculators.register('notStartsWith', {
  name: '{{t("not starts with")}}',
  type: 'boolean',
  group: 'string',
});
calculators.register('endsWith', {
  name: '{{t("ends with")}}',
  type: 'boolean',
  group: 'string',
});
calculators.register('notEndsWith', {
  name: '{{t("not ends with")}}',
  type: 'boolean',
  group: 'string',
});
calculators.register('concat', {
  name: `{{t("concat", { ns: "${NAMESPACE}" })}}`,
  type: 'string',
  group: 'string',
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
  },
];

function getGroupCalculators(group) {
  return Array.from(calculators.getEntities()).filter(([key, value]) => value.group === group);
}

function Calculation({ calculator, operands = [], onChange }) {
  const compile = useCompile();
  const options = useWorkflowVariableOptions();
  return (
    <fieldset
      className={css`
        display: flex;
        gap: 0.5em;
        align-items: center;
        flex-wrap: wrap;
      `}
    >
      <Variable.Input
        value={operands[0]}
        onChange={(v) => onChange({ calculator, operands: [v, operands[1]] })}
        scope={options}
        useTypedConstant
      />
      <Select
        data-testid="antd-select"
        value={calculator}
        onChange={(v) => onChange({ operands, calculator: v })}
        placeholder={lang('Calculator')}
        popupMatchSelectWidth={false}
        className="auto-width"
      >
        {calculatorGroups
          .filter((group) => Boolean(getGroupCalculators(group.value).length))
          .map((group) => (
            <Select.OptGroup key={group.value} label={compile(group.title)}>
              {getGroupCalculators(group.value).map(([value, { name }]) => (
                <Select.Option key={value} value={value}>
                  {compile(name)}
                </Select.Option>
              ))}
            </Select.OptGroup>
          ))}
      </Select>
      <Variable.Input
        value={operands[1]}
        onChange={(v) => onChange({ calculator, operands: [operands[0], v] })}
        scope={options}
        useTypedConstant
      />
    </fieldset>
  );
}

function CalculationItem({ value, onChange, onRemove }) {
  if (!value) {
    return null;
  }

  const { calculator, operands = [] } = value;

  return (
    <div
      className={css`
        display: flex;
        position: relative;
        margin: 0.5em 0;
      `}
    >
      {value.group ? (
        <CalculationGroup value={value.group} onChange={(group) => onChange({ ...value, group })} />
      ) : (
        <Calculation operands={operands} calculator={calculator} onChange={onChange} />
      )}
      <Button data-testid="close-icon-button" onClick={onRemove} type="link" icon={<CloseCircleOutlined />} />
    </div>
  );
}

function CalculationGroup({ value, onChange }) {
  const { t } = useTranslation();
  const { type = 'and', calculations = [] } = value;

  function onAddSingle() {
    onChange({
      ...value,
      calculations: [...calculations, { not: false, calculator: 'equal' }],
    });
  }

  function onAddGroup() {
    onChange({
      ...value,
      calculations: [...calculations, { not: false, group: { type: 'and', calculations: [] } }],
    });
  }

  function onRemove(i: number) {
    calculations.splice(i, 1);
    onChange({ ...value, calculations: [...calculations] });
  }

  function onItemChange(i: number, v) {
    calculations.splice(i, 1, v);

    onChange({ ...value, calculations: [...calculations] });
  }

  return (
    <div
      className={cx(
        'node-type-condition-group',
        css`
          position: relative;
          width: 100%;
          .node-type-condition-group {
            padding: 0.5em 1em;
            border: 1px dashed #ddd;
          }
          + button {
            position: absolute;
            right: 0;
          }
        `,
      )}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.5em;
          .ant-select {
            width: auto;
            min-width: 6em;
          }
        `}
      >
        <Trans>
          {'Meet '}
          <Select value={type} onChange={(t) => onChange({ ...value, type: t })}>
            <Select.Option value="and">All</Select.Option>
            <Select.Option value="or">Any</Select.Option>
          </Select>
          {' conditions in the group'}
        </Trans>
      </div>
      <div className="calculation-items">
        {calculations.map((calculation, i) => (
          <CalculationItem
            key={`${calculation.calculator}_${i}`}
            value={calculation}
            onChange={onItemChange.bind(this, i)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>
      <div
        className={css`
          button {
            padding: 0;
            &:not(:last-child) {
              margin-right: 1em;
            }
          }
        `}
      >
        <Button type="link" onClick={onAddSingle}>
          {t('Add condition')}
        </Button>
        <Button type="link" onClick={onAddGroup}>
          {t('Add condition group')}
        </Button>
      </div>
    </div>
  );
}

function CalculationConfig({ value, onChange }) {
  const rule = value && Object.keys(value).length ? value : { group: { type: 'and', calculations: [] } };
  return <CalculationGroup value={rule.group} onChange={(group) => onChange({ ...rule, group })} />;
}

export default {
  title: `{{t("Condition", { ns: "${NAMESPACE}" })}}`,
  type: 'condition',
  group: 'control',
  description: `{{t('Based on boolean result of the calculation to determine whether to "continue" or "exit" the process, or continue on different branches of "yes" and "no".', { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    rejectOnFalse: {
      type: 'boolean',
      title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
        disabled: true,
      },
      enum: [
        {
          value: true,
          label: `{{t('Continue when "Yes"', { ns: "${NAMESPACE}" })}}`,
        },
        {
          value: false,
          label: `{{t('Branch into "Yes" and "No"', { ns: "${NAMESPACE}" })}}`,
        },
      ],
    },
    engine: {
      type: 'string',
      title: `{{t("Calculation engine", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: [
          ['basic', { label: `{{t("Basic", { ns: "${NAMESPACE}" })}}` }],
          ...Array.from(evaluators.getEntities()),
        ].reduce((result: RadioWithTooltipOption[], [value, options]: any) => result.concat({ value, ...options }), []),
      },
      required: true,
      default: 'basic',
    },
    calculation: {
      type: 'string',
      title: `{{t("Condition", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'CalculationConfig',
      'x-reactions': {
        dependencies: ['engine'],
        fulfill: {
          state: {
            visible: '{{$deps[0] === "basic"}}',
          },
        },
      },
      required: true,
    },
    expression: {
      type: 'string',
      title: `{{t("Condition expression", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'CalculationExpression',
      ['x-validator'](value, rules, { form }) {
        const { values } = form;
        const { evaluate } = evaluators.get(values.engine);
        const exp = value.trim().replace(/{{([^{}]+)}}/g, ' 1 ');
        try {
          evaluate(exp);
          return '';
        } catch (e) {
          return lang('Expression syntax error');
        }
      },
      'x-reactions': {
        dependencies: ['engine'],
        fulfill: {
          state: {
            visible: '{{$deps[0] !== "basic"}}',
          },
          schema: {
            description: '{{renderEngineReference($deps[0])}}',
          },
        },
      },
      required: true,
    },
  },
  view: {},
  options: [
    {
      label: `{{t('Continue when "Yes"', { ns: "${NAMESPACE}" })}}`,
      key: 'rejectOnFalse',
      value: { rejectOnFalse: true },
    },
    {
      label: `{{t('Branch into "Yes" and "No"', { ns: "${NAMESPACE}" })}}`,
      key: 'branch',
      value: { rejectOnFalse: false },
    },
  ],
  component: function Component({ data }) {
    const { t } = useTranslation();
    const { nodes } = useFlowContext();
    const { styles } = useStyles();
    const {
      id,
      config: { rejectOnFalse },
    } = data;
    const trueEntry = nodes.find((item) => item.upstreamId === id && item.branchIndex === 1);
    const falseEntry = nodes.find((item) => item.upstreamId === id && item.branchIndex === 0);
    return (
      <NodeDefaultView data={data}>
        {rejectOnFalse ? null : (
          <div className={cx(styles.nodeSubtreeClass)}>
            <div
              className={cx(
                styles.branchBlockClass,
                css`
                  > * > .workflow-branch-lines {
                    > button {
                      display: none;
                    }
                  }
                `,
              )}
            >
              <Branch from={data} entry={falseEntry} branchIndex={0} />
              <Branch from={data} entry={trueEntry} branchIndex={1} />
            </div>
            <div className={styles.conditionClass}>
              <span style={{ right: '4em' }}>{t('No')}</span>
              <span style={{ left: '4em' }}>{t('Yes')}</span>
            </div>
          </div>
        )}
      </NodeDefaultView>
    );
  },
  scope: {
    renderEngineReference,
    useWorkflowVariableOptions,
  },
  components: {
    CalculationConfig,
    CalculationExpression(props) {
      const scope = useWorkflowVariableOptions();

      return <Variable.TextArea scope={scope} {...props} />;
    },
    RadioWithTooltip,
  },
};
