import React from 'react';
import { cx } from '@emotion/css';
import { Dropdown, Menu, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  useAPIClient,
  useCompile
} from '@nocobase/client';
import { useFlowContext } from './FlowContext';
import { Instruction, instructions } from './nodes';
import { addButtonClass } from './style';
import { NAMESPACE } from './locale';


interface AddButtonProps {
  upstream;
  branchIndex?: number | null;
};

export function AddButton({ upstream, branchIndex = null }: AddButtonProps) {
  const compile = useCompile();
  const api = useAPIClient();
  const { workflow, onNodeAdded } = useFlowContext() ?? {};
  if (!workflow) {
    return null;
  }
  const resource = api.resource('workflows.nodes', workflow.id);

  async function onCreate({ keyPath }) {
    const type = keyPath.pop();
    const config = {};
    const [optionKey] = keyPath;
    const instruction = instructions.get(type);
    if (optionKey) {
      const { value } = instruction.options?.find(item => item.key === optionKey) ?? {};
      Object.assign(config, value);
    }

    const { data: { data: node } } = await resource.create!({
      values: {
        type,
        upstreamId: upstream?.id ?? null,
        branchIndex,
        title: compile(instruction.title),
        config
      }
    });

    onNodeAdded(node);
  }

  const instructionList = (Array.from(instructions.getValues()) as Instruction[]);

  const groups = [
    { key: 'control', label: `{{t("Control", { ns: "${NAMESPACE}" })}}` },
    { key: 'collection', label: `{{t("Collection operations", { ns: "${NAMESPACE}" })}}` },
    { key: 'manual', label: `{{t("Manual", { ns: "${NAMESPACE}" })}}` },
    { key: 'extended', label: `{{t("Extended types", { ns: "${NAMESPACE}" })}}` },
  ]
    .filter(group => instructionList.filter(item => item.group === group.key).length)
    .map(group => {
      const groupInstructions = instructionList.filter(item => item.group === group.key);

      return {
        ...group,
        type: 'group',
        children: groupInstructions.map(item => ({
          key: item.type,
          label: item.title,
          type: item.options ? 'subMenu' : null,
          children: item.options ? item.options.map(option => ({
            key: option.key,
            label: option.label,
          })) : null
        }))
      };
    });

  return (
    <div className={cx(addButtonClass)}>
      <Dropdown
        trigger={['click']}
        overlay={
          <Menu onClick={ev => onCreate(ev)} items={compile(groups)}>
          </Menu>
        }
        disabled={workflow.executed}
      >
        <Button shape="circle" icon={<PlusOutlined />} />
      </Dropdown>
    </div>
  );
};
