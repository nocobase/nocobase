import React from "react";
import { css, cx } from "@emotion/css";
import { NodeDefaultView } from ".";
import { Branch, useFlowContext } from "../WorkflowCanvas";
import { branchBlockClass, nodeSubtreeClass } from "../style";


function Calculation(props) {
  return 123;
}

export default {
  title: '条件判断',
  type: 'condition',
  fieldset: {
    calculation: {
      type: 'string',
      name: 'collection',
      'x-decorator': 'FormItem',
      'x-component': 'Calculation',
    },
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
        { value: true, label: '通行模式' },
        { value: false, label: '分支模式' },
      ],
    }
  },
  view: {

  },
  options: [
    { label: '通行模式', key: 'rejectOnFalse', value: { rejectOnFalse: true } },
    { label: '分支模式', key: 'branch', value: { rejectOnFalse: false } }
  ],
  render(data) {
    const { id, config: { calculation, rejectOnFalse } } = data;
    const { nodes } = useFlowContext();
    const trueEntry = nodes.find(item => item.upstreamId === id && item.branchIndex === 1);
    const falseEntry = nodes.find(item => item.upstreamId === id && item.branchIndex === 0);
    return (
      <NodeDefaultView data={data}>
        {rejectOnFalse ? null : (
          <div className={cx(nodeSubtreeClass)}>
            <div className={cx(branchBlockClass)}>
              <Branch from={data} entry={falseEntry} branchIndex={0}/>
              <Branch from={data} entry={trueEntry} branchIndex={1} />
            </div>
            <div className={css`
              position: relative;
              height: 2em;
              width: 1px;
              overflow: visible;
              background-color: #ddd;

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
            `} />
          </div>
        )}
      </NodeDefaultView>
    )
  },
  components: {
    Calculation
  }
};
