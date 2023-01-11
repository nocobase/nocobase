import React from 'react';
import { Tag } from 'antd';
import { css } from '@emotion/css';
import parse from 'json-templates';

import { SchemaInitializer, SchemaInitializerItemOptions, useCompile } from '@nocobase/client';

import { useFlowContext } from '../FlowContext';
import { NAMESPACE, useWorkflowTranslation } from '../locale';
import { Calculation } from '../calculators';



function ValueGetter() {
  const { t } = useWorkflowTranslation();
  return <Tag className={css`flex-shrink: 0`}>{t('Calculation result')}</Tag>;
}

export default {
  title: `{{t("Calculation", { ns: "${NAMESPACE}" })}}`,
  type: 'calculation',
  group: 'control',
  fieldset: {
    'config.calculation': {
      type: 'object',
      title: `{{t("Configure calculation", { ns: "${NAMESPACE}" })}}`,
      name: 'config.calculation',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'CalculationConfig',
    }
  },
  view: {

  },
  components: {
    CalculationConfig({ value, onChange }) {
      return (
        <Calculation {...value} onChange={onChange} />
      );
    },
    CalculationResult({ dataSource }) {
      const { t } = useWorkflowTranslation();
      const { execution } = useFlowContext();
      if (!execution) {
        return t('Calculation result');
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
    }
  },
  useValueGetter(node) {
    return ValueGetter;
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
          'x-designer': 'DetailsDesigner',
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
