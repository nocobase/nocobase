import { PlusOutlined } from '@ant-design/icons';
import { css, useAPIClient, useCompile } from '@nocobase/client';
import { Button, Dropdown, MenuProps } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useFlowContext } from './FlowContext';
import { NAMESPACE } from './locale';
import { Instruction, instructions } from './nodes';
import useStyles from './style';

interface AddButtonProps {
  upstream;
  branchIndex?: number | null;
}

export function AddButton({ upstream, branchIndex = null }: AddButtonProps) {
  const compile = useCompile();
  const api = useAPIClient();
  const { workflow, refresh } = useFlowContext() ?? {};
  const instructionList = Array.from(instructions.getValues()) as Instruction[];
  const { styles } = useStyles();

  const groups = useMemo(() => {
    return [
      { key: 'control', label: `{{t("Control", { ns: "${NAMESPACE}" })}}` },
      { key: 'collection', label: `{{t("Collection operations", { ns: "${NAMESPACE}" })}}` },
      { key: 'manual', label: `{{t("Manual", { ns: "${NAMESPACE}" })}}` },
      { key: 'extended', label: `{{t("Extended types", { ns: "${NAMESPACE}" })}}` },
    ]
      .filter((group) => instructionList.filter((item) => item.group === group.key).length)
      .map((group) => {
        const groupInstructions = instructionList.filter((item) => item.group === group.key);

        return {
          ...group,
          type: 'group',
          children: groupInstructions.map((item) => ({
            key: item.type,
            label: item.title,
            type: item.options ? 'subMenu' : null,
            children: item.options
              ? item.options.map((option) => ({
                  key: option.key,
                  label: option.label,
                }))
              : null,
          })),
        };
      });
  }, [instructionList]);
  const resource = useMemo(() => {
    if (!workflow) {
      return null;
    }
    return api.resource('workflows.nodes', workflow.id);
  }, [workflow?.id]);
  const onCreate = useCallback(
    async ({ keyPath }) => {
      const type = keyPath.pop();
      const config = {};
      const [optionKey] = keyPath;
      const instruction = instructions.get(type);
      if (optionKey) {
        const { value } = instruction.options?.find((item) => item.key === optionKey) ?? {};
        Object.assign(config, value);
      }

      if (resource) {
        await resource.create({
          values: {
            type,
            upstreamId: upstream?.id ?? null,
            branchIndex,
            title: compile(instruction.title),
            config,
          },
        });
        refresh();
      }
    },
    [branchIndex, resource?.create, upstream?.id],
  );

  const menu = useMemo<MenuProps>(() => {
    return {
      onClick: onCreate,
      items: compile(groups),
    };
  }, [groups, onCreate]);

  if (!workflow) {
    return null;
  }

  return (
    <div className={styles.addButtonClass}>
      <Dropdown
        trigger={['click']}
        menu={menu}
        disabled={workflow.executed}
        overlayClassName={css`
          .ant-dropdown-menu-root {
            max-height: 30em;
            overflow-y: auto;
          }
        `}
      >
        <Button shape="circle" icon={<PlusOutlined />} />
      </Dropdown>
    </div>
  );
}
