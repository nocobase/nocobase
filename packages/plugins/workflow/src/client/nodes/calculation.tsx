import React from 'react';
import { css } from '@emotion/css';
import parse from 'json-templates';

import { SchemaInitializer, SchemaInitializerItemOptions } from '@nocobase/client';
import evaluators, { renderReference, Evaluator } from '@nocobase/evaluators/client';

import { useFlowContext } from '../FlowContext';
import { lang, NAMESPACE } from '../locale';
import { TypeSets, useWorkflowVariableOptions } from '../variable';
import { RadioWithTooltip } from '../components/RadioWithTooltip';



export default {
  title: `{{t("Calculation", { ns: "${NAMESPACE}" })}}`,
  type: 'calculation',
  group: 'control',
  fieldset: {
    'config.engine': {
      type: 'string',
      title: `{{t("Calculation engine", { ns: "${NAMESPACE}" })}}`,
      name: 'config.engine',
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: Array.from(evaluators.getEntities()).reduce((result: any[], [value, options]) => result.concat({ value, ...options }), [])
      },
      required: true,
      default: 'math.js'
    },
    'config.expression': {
      type: 'string',
      title: `{{t("Calculation expression", { ns: "${NAMESPACE}" })}}`,
      name: 'config.expression',
      'x-decorator': 'FormItem',
      'x-component': 'Variable.TextArea',
      'x-component-props': {
        scope: '{{useWorkflowVariableOptions}}'
      },
      ['x-validator'](value, rules, { form }) {
        const { values } = form;
        const { evaluate } = evaluators.get(values.config.engine) as Evaluator;
        const exp = value.trim().replace(/{{([^{}]+)}}/g, '1');
        try {
          evaluate(exp);
          return '';
        } catch (e) {
          return lang('Expression syntax error');
        }
      },
      'x-reactions': {
        dependencies: ['config.engine'],
        fulfill: {
          schema: {
            description: '{{renderReference($deps[0])}}',
          }
        }
      },
      required: true
    }
  },
  view: {

  },
  scope: {
    useWorkflowVariableOptions,
    renderReference
  },
  components: {
    CalculationResult({ dataSource }) {
      const { execution } = useFlowContext();
      if (!execution) {
        return lang('Calculation result');
      }
      const result = parse(dataSource)({
        $jobsMapByNodeId: (execution.jobs ?? []).reduce((map, job) => Object.assign(map, { [job.nodeId]: job.result }), {})
      });

      return (
        <pre className={css`
          margin: 0;
        `}>
          {JSON.stringify(result, null, 2)}
        </pre>
      );
    },
    RadioWithTooltip
  },
  getOptions(config, types) {
    if (types && !types.some(type => type in TypeSets || Object.values(TypeSets).some(set => set.has(type)))) {
      return null;
    }
    return [
      // { key: '', value: '', label: lang('Calculation result') }
    ];
  },
  useInitializers(node): SchemaInitializerItemOptions {
    return {
      type: 'item',
      title: node.title ?? `#${node.id}`,
      component: CalculationInitializer,
      node
    };
  }
};

function CalculationInitializer({ node, insert, ...props }) {
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          name: node.id,
          title: node.title,
          'x-component': 'CardItem',
          'x-component-props': {
            title: node.title ?? `#${node.id}`
          },
          'x-designer': 'SimpleDesigner',
          properties: {
            result: {
              type: 'void',
              'x-component': 'CalculationResult',
              'x-component-props': {
                // NOTE: as same format as other reference for migration of revision
                dataSource: `{{$jobsMapByNodeId.${node.id}}}`
              },
            }
          }
        });
      }}
    />
  )
}
