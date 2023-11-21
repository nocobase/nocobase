import { FormItem, FormLayout } from '@formily/antd-v5';
import { SchemaInitializerItemType, Variable, defaultFieldNames, useCollectionManager } from '@nocobase/client';
import { Evaluator, evaluators, getOptions } from '@nocobase/evaluators/client';
import { Radio } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RadioWithTooltip } from '../components/RadioWithTooltip';
import { ValueBlock } from '../components/ValueBlock';
import { renderEngineReference } from '../components/renderEngineReference';
import { NAMESPACE, lang } from '../locale';
import { BaseTypeSets, WorkflowVariableInput, WorkflowVariableTextArea, useWorkflowVariableOptions } from '../variable';

function useDynamicExpressionCollectionFieldMatcher(field): boolean {
  if (!['belongsTo', 'hasOne'].includes(field.type)) {
    return false;
  }

  if (this.getCollection(field.collectionName)?.template === 'expression') {
    return true;
  }

  const fields = this.getCollectionFields(field.target);
  return fields.some((f) => f.interface === 'expression');
}

const DynamicConfig = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { getCollectionFields, getCollection } = useCollectionManager();
  const scope = useWorkflowVariableOptions({
    types: [useDynamicExpressionCollectionFieldMatcher.bind({ getCollectionFields, getCollection })],
  });

  return (
    <FormLayout layout="vertical">
      <FormItem colon label={t('Expression type', { ns: NAMESPACE })}>
        <Radio.Group
          value={value === false ? false : value || ''}
          onChange={(ev) => {
            onChange(ev.target.value);
          }}
        >
          <Radio value={false}>{t('Static', { ns: NAMESPACE })}</Radio>
          <Radio value={value || ''}>{t('Dynamic', { ns: NAMESPACE })}</Radio>
        </Radio.Group>
      </FormItem>
      {value !== false ? (
        <FormItem
          label={t('Select dynamic expression', { ns: NAMESPACE })}
          extra={t(
            'Select the dynamic expression queried from the upstream node. You need to query it from an expression collection.',
            { ns: NAMESPACE },
          )}
        >
          <Variable.Input value={value || ''} onChange={(v) => onChange(v)} scope={scope} />
        </FormItem>
      ) : null}
    </FormLayout>
  );
};

export default {
  title: `{{t("Calculation", { ns: "${NAMESPACE}" })}}`,
  type: 'calculation',
  group: 'control',
  description: `{{t("Calculate an expression based on a calculation engine and obtain a value as the result. Variables in the upstream nodes can be used in the expression. The expression can be static or dynamic one from an expression collections.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    dynamic: {
      type: 'string',
      'x-component': 'DynamicConfig',
      // description: `{{t("Select the dynamic expression queried from the upstream node. You need to query it from an expression collection.", { ns: "${NAMESPACE}" })}}`,
      default: false,
    },
    engine: {
      type: 'string',
      title: `{{t("Calculation engine", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: getOptions(),
      },
      required: true,
      default: 'math.js',
      'x-reactions': {
        dependencies: ['dynamic'],
        fulfill: {
          state: {
            visible: '{{$deps[0] === false}}',
          },
        },
      },
    },
    expression: {
      type: 'string',
      title: `{{t("Calculation expression", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': {
        changeOnSelect: true,
      },
      ['x-validator'](value, rules, { form }) {
        const { values } = form;
        const { evaluate } = evaluators.get(values.engine) as Evaluator;
        const exp = value.trim().replace(/{{([^{}]+)}}/g, ' 1 ');
        try {
          evaluate(exp);
          return '';
        } catch (e) {
          return lang('Expression syntax error');
        }
      },
      'x-reactions': [
        {
          dependencies: ['dynamic'],
          fulfill: {
            state: {
              visible: '{{$deps[0] === false}}',
            },
          },
        },
        {
          dependencies: ['engine'],
          fulfill: {
            schema: {
              description: '{{renderEngineReference($deps[0])}}',
            },
          },
        },
      ],
      required: true,
    },
    scope: {
      type: 'string',
      title: `{{t("Variable datasource", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        changeOnSelect: true,
        variableOptions: {
          types: [{ type: 'reference', options: { collection: '*', entity: true } }],
        },
      },
      'x-reactions': {
        dependencies: ['dynamic'],
        fulfill: {
          state: {
            visible: '{{$deps[0]}}',
          },
        },
      },
    },
  },
  view: {},
  scope: {
    renderEngineReference,
  },
  components: {
    WorkflowVariableInput,
    WorkflowVariableTextArea,
    RadioWithTooltip,
    DynamicConfig,
    ValueBlock,
  },
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  },
  useInitializers(node): SchemaInitializerItemType {
    return {
      name: node.title ?? `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: ValueBlock.Initializer,
      node,
      resultTitle: lang('Calculation result'),
    };
  },
};
