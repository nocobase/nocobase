/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { createForm } from '@formily/core';
import {
  ActionContextProvider,
  SchemaComponent,
  useAPIClient,
  useCancelAction,
  useCompile,
  usePlugin,
} from '@nocobase/client';

import { lang, NAMESPACE } from './locale';
import { Radio, Select, Space } from 'antd';
import { useFlowContext } from './FlowContext';
import { useForm } from '@formily/react';
import PluginWorkflowClient from '.';

const RemoveNodeContext = createContext(null);

export function useRemoveNodeContext() {
  return useContext(RemoveNodeContext);
}

function KeepBranchRadioGroup(props) {
  const { value, onChange } = props;
  const type = typeof value === 'number' ? 1 : 0;
  const { deletingNode, deletingBranches } = useRemoveNodeContext();
  const plugin = usePlugin(PluginWorkflowClient) as PluginWorkflowClient;
  const compile = useCompile();
  const branchOptions = useMemo(() => {
    if (!deletingNode || deletingBranches.length === 0) {
      return [];
    }
    const instruction = plugin.instructions.get(deletingNode?.type);
    const branching =
      typeof instruction.branching === 'function'
        ? instruction.branching(deletingNode.config ?? {})
        : instruction.branching;
    return branching
      ? deletingBranches.map((item, index) => {
          const { label } = Array.isArray(branching)
            ? branching.find((branch) => branch.value === item.branchIndex)
            : {};
          return {
            label: label
              ? lang('"{{branchName}}" branch', { branchName: compile(label) })
              : lang('Branch {{index}}', { index: index + 1 }),
            value: item.branchIndex,
          };
        })
      : [];
  }, [deletingNode, deletingBranches, plugin.instructions, compile]);

  return (
    <>
      <Radio.Group
        value={type}
        onChange={(e) => {
          if (e.target.value === 0) {
            onChange(null);
          } else {
            onChange(deletingBranches[0].branchIndex);
          }
        }}
      >
        <Space direction="vertical">
          <Radio key="0" value={0}>
            {lang('Delete all')}
          </Radio>
          <Space>
            <Radio key="1" value={1}>
              {lang('Keep')}
            </Radio>
            <Select options={branchOptions} onChange={onChange} defaultValue={deletingBranches[0]?.branchIndex} />
          </Space>
        </Space>
      </Radio.Group>
    </>
  );
}

function useRemoveNodeSubmitAction() {
  const api = useAPIClient();
  const { refresh } = useFlowContext() ?? {};
  const { deletingNode, setDeletingNode } = useRemoveNodeContext();
  const { values, clearFormGraph } = useForm();
  const keepBranchValues = values.keepBranch != null ? values : {};
  return {
    async run() {
      await api.resource('flow_nodes').destroy?.({
        filterByTk: deletingNode.id,
        ...keepBranchValues,
      });
      clearFormGraph('*');
      setDeletingNode(null);
      refresh();
    },
  };
}

export function RemoveNodeContextProvider(props) {
  const [deletingNode, setDeletingNode] = useState(null);
  const form = useMemo(() => createForm(), []);
  const { nodes } = useFlowContext();
  const deletingBranches = nodes.filter((item) => item.upstream === deletingNode && item.branchIndex != null);

  return (
    <RemoveNodeContext.Provider value={{ deletingNode, setDeletingNode, deletingBranches }}>
      {props.children}
      <ActionContextProvider
        value={{
          visible: Boolean(deletingBranches.length),
          setVisible() {
            setDeletingNode(null);
          },
          openSize: 'small',
        }}
      >
        <SchemaComponent
          scope={{
            useCancelAction,
            useRemoveNodeSubmitAction,
          }}
          components={{
            KeepBranchRadioGroup,
          }}
          schema={{
            type: 'void',
            name: 'deleteBranchModel',
            'x-decorator': 'FormV2',
            'x-decorator-props': {
              form,
            },
            'x-component': 'Action.Modal',
            title: `{{ t("Delete node", { ns: "${NAMESPACE}" }) }}`,
            properties: {
              keepBranch: {
                type: 'number',
                'x-decorator': 'FormItem',
                title: `{{ t("Branch to keep", { ns: "${NAMESPACE}" }) }}`,
                'x-component': 'KeepBranchRadioGroup',
              },
              footer: {
                'x-component': 'Action.Modal.Footer',
                properties: {
                  actions: {
                    type: 'void',
                    'x-component': 'ActionBar',
                    properties: {
                      cancel: {
                        type: 'void',
                        title: '{{ t("Cancel") }}',
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: '{{ useCancelAction }}',
                        },
                      },
                      submit: {
                        type: 'void',
                        title: `{{ t("Submit") }}`,
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          htmlType: 'submit',
                          useAction: '{{ useRemoveNodeSubmitAction }}',
                        },
                      },
                    },
                  },
                },
              },
            },
          }}
        />
      </ActionContextProvider>
    </RemoveNodeContext.Provider>
  );
}
