import React from "react";
import { css, cx } from "@emotion/css";
import { Button, Select } from "antd";
import { CloseCircleOutlined } from '@ant-design/icons';
import { Trans, useTranslation } from "react-i18next";

import { i18n } from "@nocobase/client";

import { NodeDefaultView } from ".";
import { Branch } from "../Branch";
import { useFlowContext } from '../FlowContext';
import { branchBlockClass, nodeSubtreeClass } from "../style";
import { Calculation } from "../calculators";
import { lang, NAMESPACE } from "../locale";



function CalculationItem({ value, onChange, onRemove }) {
  if (!value) {
    return null;
  }

  const { calculator, operands = [] } = value;

  return (
    <div className={css`
      display: flex;
      position: relative;
      margin: .5em 0;
    `}>
      {value.group
        ? (
          <CalculationGroup
            value={value.group}
            onChange={group => onChange({ ...value, group })}
          />
        )
        : <Calculation operands={operands} calculator={calculator} onChange={onChange} />
      }
      <Button onClick={onRemove} type="link" icon={<CloseCircleOutlined />} />
    </div>
  );
}

function CalculationGroup({ value, onChange }) {
  const { t } = useTranslation();
  const { type = 'and', calculations = [] } = value;

  function onAddSingle() {
    onChange({
      ...value,
      calculations: [...calculations, { not: false, calculator: 'equal' }]
    });
  }

  function onAddGroup() {
    onChange({
      ...value,
      calculations: [...calculations, { not: false, group: { type: 'and', calculations: [] } }]
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
    <div className={cx('node-type-condition-group', css`
      position: relative;
      width: 100%;

      .node-type-condition-group{
        padding: .5em 1em;
        border: 1px dashed #ddd;
      }

      + button{
        position: absolute;
        right: 0;
      }
    `)}>
      <div className={css`
        display: flex;
        align-items: center;
        gap: .5em;

        .ant-select{
          width: auto;
          min-width: 6em;
        }
      `}>
        <Trans>
          {'Meet '}
          <Select value={type} onChange={t => onChange({ ...value, type: t })}>
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
      <div className={css`
        button{
          padding: 0;

          &:not(:last-child){
            margin-right: 1em;
          }
        }
      `} >
        <Button type="link" onClick={onAddSingle}>{t('Add condition')}</Button>
        <Button type="link" onClick={onAddGroup}>{t('Add condition group')}</Button>
      </div>
    </div>
  );
}

function CalculationConfig({ value, onChange }) {
  const rule = value && Object.keys(value).length
    ? value
    : { group: { type: 'and', calculations: [] } };
  return (
    <CalculationGroup value={rule.group} onChange={group => onChange({ ...rule, group })} />
  );
}

export default {
  title: `{{t("Condition", { ns: "${NAMESPACE}" })}}`,
  type: 'condition',
  group: 'control',
  fieldset: {
    'config.rejectOnFalse': {
      type: 'boolean',
      name: 'config.rejectOnFalse',
      title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
        disabled: true,
      },
      enum: [
        {
          value: true,
          label: lang('Continue when "Yes"')
        },
        {
          value: false,
          label: lang('Branch into "Yes" and "No"')
        }
      ],
    },
    'config.calculation': {
      type: 'string',
      name: 'config.calculation',
      title: `{{t("Conditions", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'CalculationConfig',
    }
  },
  view: {

  },
  options: [
    { label: lang('Continue when "Yes"'), key: 'rejectOnFalse', value: { rejectOnFalse: true } },
    { label: lang('Branch into "Yes" and "No"'), key: 'branch', value: { rejectOnFalse: false } }
  ],
  render(data) {
    const { id, config: { rejectOnFalse } } = data;
    const { nodes } = useFlowContext();
    const trueEntry = nodes.find(item => item.upstreamId === id && item.branchIndex === 1);
    const falseEntry = nodes.find(item => item.upstreamId === id && item.branchIndex === 0);
    return (
      <NodeDefaultView data={data}>
        {rejectOnFalse ? null : (
          <div className={cx(nodeSubtreeClass)}>
            <div
              className={cx(branchBlockClass, css`
                > * > .workflow-branch-lines{
                  > button{
                    display: none;
                  }
                }
              `)}
            >
              <Branch from={data} entry={falseEntry} branchIndex={0}/>
              <Branch from={data} entry={trueEntry} branchIndex={1} />
            </div>
            <div
              className={css`
                position: relative;
                height: 2em;
                overflow: visible;

                > span{
                  position: absolute;
                  top: calc(1.5em - 1px);
                  line-height: 1em;
                  color: #999;
                  background-color: #f0f2f5;
                  padding: 1px;
                }
              `}
            >
              <span className={css`right: 4em;`}>{lang('No')}</span>
              <span className={css`left: 4em;`}>{lang('Yes')}</span>
            </div>
          </div>
        )}
      </NodeDefaultView>
    )
  },
  components: {
    CalculationConfig
  }
};
