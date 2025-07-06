/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { evaluators } from '@nocobase/evaluators/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Instruction, NodeDefaultView } from '.';
import { Branch } from '../Branch';
import { RadioWithTooltip, RadioWithTooltipOption } from '../components/RadioWithTooltip';
import { renderEngineReference } from '../components/renderEngineReference';
import { useFlowContext } from '../FlowContext';
import { lang, NAMESPACE } from '../locale';
import useStyles from '../style';
import { useWorkflowVariableOptions, WorkflowVariableTextArea } from '../variable';
import { CalculationConfig } from '../components/Calculation';
import { QuestionCircleOutlined } from '@ant-design/icons';

const BRANCH_INDEX = {
  DEFAULT: null,
  ON_TRUE: 1,
  ON_FALSE: 0,
} as const;

export default class extends Instruction {
  title = `{{t("Condition", { ns: "${NAMESPACE}" })}}`;
  type = 'condition';
  group = 'control';
  description = `{{t('Based on boolean result of the calculation to determine whether to "continue" or "exit" the process, or continue on different branches of "yes" and "no".', { ns: "${NAMESPACE}" })}}`;
  icon = (<QuestionCircleOutlined style={{}} />);
  fieldset = {
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
          ...Array.from(evaluators.getEntities()).filter(([key]) => ['math.js', 'formula.js'].includes(key)),
        ].reduce((result: RadioWithTooltipOption[], [value, options]: any) => result.concat({ value, ...options }), []),
      },
      required: true,
      default: 'basic',
    },
    calculation: {
      type: 'object',
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
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': {
        changeOnSelect: true,
      },
      ['x-validator'](value, rules, { form }) {
        const { values } = form;
        const { evaluate } = evaluators.get(values.engine);
        const exp = value.trim().replace(/{{([^{}]+)}}/g, ' "1" ');
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
  };
  presetFieldset = {
    rejectOnFalse: {
      type: 'boolean',
      title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        {
          label: `{{t('Continue when "Yes"', { ns: "${NAMESPACE}" })}}`,
          value: true,
        },
        {
          label: `{{t('Branch into "Yes" and "No"', { ns: "${NAMESPACE}" })}}`,
          value: false,
        },
      ],
      default: true,
    },
  };

  branching = ({ rejectOnFalse = true } = {}) => {
    return rejectOnFalse
      ? false
      : [
          {
            label: `{{t('After end of branches', { ns: "${NAMESPACE}" })}}`,
            value: false,
          },
          {
            label: `{{t('Inside of "Yes" branch', { ns: "${NAMESPACE}" })}}`,
            value: BRANCH_INDEX.ON_TRUE,
          },
          {
            label: `{{t('Inside of "No" branch', { ns: "${NAMESPACE}" })}}`,
            value: BRANCH_INDEX.ON_FALSE,
          },
        ];
  };

  scope = {
    renderEngineReference,
    useWorkflowVariableOptions,
  };
  components = {
    CalculationConfig,
    WorkflowVariableTextArea,
    RadioWithTooltip,
  };

  Component({ data }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useTranslation();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { nodes } = useFlowContext();
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
          <div className={styles.nodeSubtreeClass}>
            <div className={styles.branchBlockClass}>
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
  }
  testable = true;
}
