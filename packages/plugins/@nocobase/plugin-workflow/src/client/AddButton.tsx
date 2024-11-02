/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Button, Dropdown, MenuProps, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { css, SchemaComponent, useAPIClient, useCompile, usePlugin } from '@nocobase/client';

import WorkflowPlugin from '.';
import { useFlowContext } from './FlowContext';
import { NAMESPACE } from './locale';
import { Instruction } from './nodes';
import useStyles from './style';
import { useAddNodeContext } from './AddNodeContext';

interface AddButtonProps {
  upstream;
  branchIndex?: number | null;
  [key: string]: any;
}

export function AddButton(props: AddButtonProps) {
  const { upstream, branchIndex = null } = props;
  const engine = usePlugin(WorkflowPlugin);
  const compile = useCompile();
  const { workflow } = useFlowContext() ?? {};
  const instructionList = Array.from(engine.instructions.getValues()) as Instruction[];
  const { styles } = useStyles();
  const { onPreset, onCreate, creating } = useAddNodeContext();

  const groups = useMemo(() => {
    const result = [
      { key: 'control', label: `{{t("Control", { ns: "${NAMESPACE}" })}}` },
      { key: 'calculation', label: `{{t("Calculation", { ns: "${NAMESPACE}" })}}` },
      { key: 'collection', label: `{{t("Collection operations", { ns: "${NAMESPACE}" })}}` },
      { key: 'manual', label: `{{t("Manual", { ns: "${NAMESPACE}" })}}` },
      { key: 'extended', label: `{{t("Extended types", { ns: "${NAMESPACE}" })}}` },
    ]
      .map((group) => {
        const groupInstructions = instructionList.filter(
          (item) =>
            item.group === group.key &&
            (item.isAvailable ? item.isAvailable({ engine, workflow, upstream, branchIndex }) : true),
        );

        return {
          ...group,
          type: 'group',
          children: groupInstructions.map((item) => ({
            role: 'button',
            'aria-label': item.type,
            key: item.type,
            label: item.title,
          })),
        };
      })
      .filter((group) => group.children.length);

    return compile(result);
  }, [branchIndex, compile, engine, instructionList, upstream, workflow]);

  const onClick = useCallback(
    async ({ keyPath }) => {
      const [type] = keyPath;
      const instruction = engine.instructions.get(type);
      if (!instruction) {
        return;
      }
      const title = compile(instruction.title);
      const config = instruction.createDefaultConfig?.() ?? {};
      const data = { instruction, type, title, config, upstream, branchIndex };
      if (
        instruction.presetFieldset ||
        (typeof instruction.branching === 'function' ? instruction.branching(config) : instruction.branching)
      ) {
        onPreset(data);
      } else {
        onCreate(data);
      }
    },
    [branchIndex, engine.instructions, onCreate, upstream],
  );

  if (!workflow) {
    return null;
  }

  return (
    <div className={styles.addButtonClass}>
      <Dropdown
        menu={{
          items: groups,
          onClick,
        }}
        disabled={workflow.executed}
        overlayClassName={css`
          .ant-dropdown-menu-root {
            max-height: 30em;
            overflow-y: auto;
          }
        `}
      >
        <Button
          aria-label={props['aria-label'] || 'add-button'}
          shape="circle"
          icon={<PlusOutlined />}
          loading={creating?.upstream === upstream && creating?.branchIndex === branchIndex}
          size="small"
        />
      </Dropdown>
    </div>
  );
}
