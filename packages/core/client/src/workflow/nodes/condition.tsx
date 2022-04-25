import React from "react";
import { css, cx } from "@emotion/css";
import { Button, Select, Tooltip } from "antd";
import { CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Trans } from "react-i18next";

import { NodeDefaultView } from ".";
import { Branch, useFlowContext } from "../WorkflowCanvas";
import { branchBlockClass, nodeSubtreeClass } from "../style";
import { Calculation } from "../calculators";
// import { SchemaComponent } from "../../schema-component";

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
      <Button onClick={onRemove} type="text" icon={<CloseCircleOutlined />} />
    </div>
  );
}

function CalculationGroup({ value, onChange }) {
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
        a:not(:last-child){
          margin-right: 1em;
        }
      `} >
        <a onClick={onAddSingle}>添加条件</a>
        <a onClick={onAddGroup}>添加条件组</a>
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
  title: '条件判断',
  type: 'condition',
  group: 'control',
  fieldset: {
    rejectOnFalse: {
      type: 'boolean',
      name: 'rejectOnFalse',
      title: '模式',
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
        disabled: true,
      },
      enum: [
        {
          value: true,
          label: (
            <Tooltip
              title="判断为“是”时继续"
              placement="bottom"
            >
              通行模式 <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          )
        },
        {
          value: false,
          label: (
            <Tooltip
              title="判断结果分为“是”和“否”两个分支，分别继续"
              placement="bottom"
            >
              分支模式 <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          )
        }
      ],
    },
    calculation: {
      type: 'string',
      name: 'calculation',
      title: '条件配置',
      'x-decorator': 'FormItem',
      'x-component': 'CalculationConfig',
    }
  },
  view: {

  },
  options: [
    { label: '通行模式', key: 'rejectOnFalse', value: { rejectOnFalse: true } },
    { label: '分支模式', key: 'branch', value: { rejectOnFalse: false } }
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

                :before,:after{
                  position: absolute;
                  top: calc(1.5em - 1px);
                  line-height: 1em;
                  color: #999;
                  background-color: #f0f2f5;
                  padding: 1px;
                }

                :before{
                  content: "否";
                  right: 4em;
                }

                :after{
                  content: "是";
                  left: 4em;
                }
              `}
            />
          </div>
        )}
      </NodeDefaultView>
    )
  },
  components: {
    CalculationConfig
  }
};
