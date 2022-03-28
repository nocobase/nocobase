import React, { useState } from "react";
import { css, cx } from "@emotion/css";
import { PlusOutlined } from '@ant-design/icons';

import { NodeDefaultView } from ".";
import { Branch, useFlowContext } from "../WorkflowCanvas";
import { branchBlockClass, nodeSubtreeClass } from "../style";
import { Button, Tooltip } from "antd";
// import { SchemaComponent } from "../../schema-component";

export default {
  title: '并行',
  type: 'parallel',
  fieldset: {
    mode: {
      type: 'string',
      name: 'mode',
      title: '模式',
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
      },
      enum: [
        { value: 'all', label: '全部成功' },
        { value: 'any', label: '任意成功' },
        // { value: 'race', label: '任意退出' },
      ],
      default: 'all'
    }
  },
  view: {

  },
  render(data) {
    const { id, config: { mode } } = data;
    const { nodes } = useFlowContext();
    const branches = nodes.reduce((result, node) => {
      if (node.upstreamId === id && node.branchIndex != null) {
        return result.concat(node);
      }
      return result;
    }, []);
    const [branchCount, setBranchCount] = useState(Math.max(2, branches.length));

    const tempBranches = Array(Math.max(0, branchCount - branches.length)).fill(null);
    const lastBranchHead = branches[branches.length - 1];

    return (
      <NodeDefaultView data={data}>
        <div className={cx(nodeSubtreeClass)}>
          <div className={cx(branchBlockClass)}>
            {branches.map((branch) => (
              <Branch key={branch.id} from={data} entry={branch} branchIndex={branch.branchIndex} />
            ))}
            {tempBranches.map((_, i) => (
              <Branch
                key={`temp_${branches.length + i}`}
                from={data}
                branchIndex={(lastBranchHead ? lastBranchHead.branchIndex : 0) + i + 1}
                controller={
                  branches.length + i > 1
                    ? (
                      <div className={css`
                        padding-top: 2em;

                        > button{
                          .anticon{
                            transform: rotate(45deg)
                          }
                        }
                      `}>
                        <Button
                          shape="circle"
                          icon={<PlusOutlined />}
                          onClick={() => setBranchCount(branchCount - 1)}
                        />
                      </div>
                    )
                    : null
                }
              />
            ))}
          </div>
          <div
            className={css`
              position: relative;
              height: 2em;
            `}
          >
            <Tooltip title="添加分支">
              <Button
                icon={<PlusOutlined />}
                className={css`
                  position: absolute;
                  top: calc(50% - 1px);
                  transform: translateX(-50%) rotate(45deg);

                  .anticon{
                    transform: rotate(-45deg);
                  }
                `}
                onClick={() => setBranchCount(branchCount + 1)}
              />
            </Tooltip>
          </div>
        </div>
      </NodeDefaultView>
    )
  }
};
