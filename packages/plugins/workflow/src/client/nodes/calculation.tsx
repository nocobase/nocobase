import React from 'react';
import { Tag } from 'antd';
import { css } from '@emotion/css';

import { Calculation } from '../calculators';
import { NAMESPACE, useWorkflowTranslation } from '../locale';
import { SchemaInitializer, SchemaInitializerItemOptions } from '@nocobase/client';
import { useFlowContext } from '../FlowContext';

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
    CalculationResult({ nodeId }) {
      const { t } = useWorkflowTranslation();
      const { execution } = useFlowContext();
      if (!execution) {
        return t('Calculation result');
      }
      const job = execution.jobs.find(item => item.nodeId === nodeId);
      return job.result;
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
          'x-designer': 'DetailsDesigner',
          properties: {
            result: {
              type: 'void',
              'x-component': 'CalculationResult',
              'x-component-props': {
                nodeId: node.id
              },
            }
          }
        });
      }}
    />
  )
}
