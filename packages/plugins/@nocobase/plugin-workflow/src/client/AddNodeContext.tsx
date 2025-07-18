/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createForm } from '@formily/core';
import { observer, useForm } from '@formily/react';

import {
  ActionContextProvider,
  css,
  cx,
  SchemaComponent,
  useActionContext,
  useAPIClient,
  useCancelAction,
  useCompile,
  usePlugin,
} from '@nocobase/client';

import WorkflowPlugin, { Instruction, useStyles, useWorkflowExecuted } from '.';
import { useFlowContext } from './FlowContext';
import { lang, NAMESPACE } from './locale';
import { RadioWithTooltip } from './components';
import { uid } from '@nocobase/utils/client';
import { Button, Dropdown } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { MenuItemGroupType } from 'antd/es/menu/interface';

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
  const { onCreate, creating } = useAddNodeContext();
  const groupOptions = engine.useInstructionGroupOptions();
  const executed = useWorkflowExecuted();

  const groups = useMemo(() => {
    return groupOptions
      .map((group): MenuItemGroupType => {
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
            label: compile(item.title),
            icon: item.icon,
          })),
        };
      })
      .filter((group) => group.children.length);
  }, [branchIndex, compile, engine, groupOptions, instructionList, upstream, workflow]);

  const onClick = useCallback(
    async ({ keyPath }) => {
      const [type] = keyPath;
      onCreate({ type, upstream, branchIndex });
    },
    [branchIndex, onCreate, upstream],
  );

  if (!workflow) {
    return null;
  }

  return (
    <div className={cx(styles.addButtonClass, 'workflow-add-node-button')}>
      <Dropdown
        menu={{
          items: groups,
          onClick,
        }}
        disabled={Boolean(executed)}
        overlayClassName={css`
          .ant-dropdown-menu-root {
            max-height: 30em;
            overflow-y: auto;
          }
          .ant-dropdown-menu-item-group-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        `}
      >
        <Button
          aria-label={props['aria-label'] || 'add-button'}
          shape="circle"
          icon={<PlusOutlined />}
          loading={creating?.upstreamId == upstream?.id && creating?.branchIndex === branchIndex}
          size="small"
        />
      </Dropdown>
    </div>
  );
}

function useAddNodeSubmitAction() {
  const form = useForm();
  const api = useAPIClient();
  const { workflow, refresh } = useFlowContext();
  const { presetting, setPresetting, setCreating } = useAddNodeContext();
  const ctx = useActionContext();
  return {
    async run() {
      if (!presetting) {
        return;
      }
      await form.submit();
      setCreating(presetting.data);
      try {
        const {
          data: { data: newNode },
        } = await api.resource('workflows.nodes', workflow.id).create({
          values: {
            ...presetting.data,
            config: {
              ...presetting.data.config,
              ...form.values.config,
            },
          },
        });
        if (typeof form.values.downstreamBranchIndex === 'number' && newNode.downstreamId) {
          await api.resource('flow_nodes').update({
            filterByTk: newNode.downstreamId,
            values: {
              branchIndex: form.values.downstreamBranchIndex,
              upstream: {
                id: newNode.id,
                downstreamId: null,
              },
            },
            updateAssociationValues: ['upstream'],
          });
        }
        ctx.setVisible(false);
        setPresetting(null);
        refresh();
      } catch (err) {
        console.error(err);
      } finally {
        setCreating(null);
      }
    },
  };
}

const AddNodeContext = createContext(null);

export function useAddNodeContext() {
  return useContext(AddNodeContext);
}

const defaultBranchingOptions = [
  {
    label: `{{t('After end of branches', { ns: "${NAMESPACE}" })}}`,
    value: false,
  },
  {
    label: `{{t('Inside of branch', { ns: "${NAMESPACE}" })}}`,
    value: 0,
  },
];

const DownstreamBranchIndex = observer((props) => {
  const { presetting } = useAddNodeContext();
  const { nodes } = useFlowContext();
  const { values } = useForm();
  const options = useMemo(() => {
    if (!presetting?.instruction) {
      return [];
    }
    const { instruction, data } = presetting;
    const downstream = data.upstreamId
      ? nodes.find((item) => item.upstreamId === data.upstreamId && item.branchIndex === data.branchIndex)
      : nodes.find((item) => item.upstreamId === null);
    if (!downstream) {
      return [];
    }
    const branching =
      typeof instruction.branching === 'function' ? instruction.branching(values.config ?? {}) : instruction.branching;
    if (!branching) {
      return [];
    }
    return branching === true ? defaultBranchingOptions : branching;
  }, [presetting, nodes, values.config]);

  if (!options.length) {
    return null;
  }

  const { data } = presetting;

  return (
    <SchemaComponent
      components={{
        RadioWithTooltip,
      }}
      schema={{
        name: `${data.type ?? 'unknown'}-${data.upstreamId ?? 'root'}-${data.branchIndex}`,
        type: 'void',
        properties: {
          downstreamBranchIndex: {
            type: 'number',
            title: lang('Move all downstream nodes to', { ns: NAMESPACE }),
            'x-decorator': 'FormItem',
            'x-component': 'RadioWithTooltip',
            'x-component-props': {
              options,
              direction: 'vertical',
            },
            default: false,
            required: true,
          },
        },
      }}
    />
  );

  // return (
  //   <FormItem label={lang('Move all downstream nodes to', { ns: NAMESPACE })}>
  //     <RadioWithTooltip {...props} options={options} defaultValue={-1} direction="vertical" />
  //   </FormItem>
  // );
});

function PresetFieldset() {
  const { presetting } = useAddNodeContext();
  if (!presetting?.instruction.presetFieldset) {
    return null;
  }
  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          config: {
            type: 'object',
            properties: presetting.instruction.presetFieldset,
          },
        },
      }}
    />
  );
}

export function AddNodeContextProvider(props) {
  const api = useAPIClient();
  const compile = useCompile();
  const engine = usePlugin(WorkflowPlugin);
  const [creating, setCreating] = useState(null);
  const [presetting, setPresetting] = useState(null);
  const [formValueChanged, setFormValueChanged] = useState(false);
  const { workflow, nodes, refresh } = useFlowContext() ?? {};

  const form = useMemo(() => createForm(), []);

  const onModalCancel = useCallback(
    (visible) => {
      if (!visible) {
        form.reset();
        form.clearFormGraph('*');
        setPresetting(null);
      }
    },
    [form],
  );

  const create = useCallback(
    async (data) => {
      setCreating(data);
      try {
        await api.resource('workflows.nodes', workflow.id).create({
          values: data,
        });
        refresh();
      } catch (err) {
        console.error(err);
      } finally {
        setCreating(null);
      }
    },
    [api, refresh, workflow.id],
  );

  const onCreate = useCallback(
    ({ type, upstream, branchIndex }) => {
      const instruction = engine.instructions.get(type);
      if (!instruction) {
        console.error(`Instruction "${type}" not found`);
        return;
      }
      const data = {
        key: uid(),
        type,
        upstreamId: upstream?.id ?? null,
        branchIndex,
        title: compile(instruction.title),
        config: instruction.createDefaultConfig?.() ?? {},
      };
      const downstream = upstream?.id
        ? nodes.find((item) => item.upstreamId === data.upstreamId && item.branchIndex === data.branchIndex)
        : nodes.find((item) => item.upstreamId === null);
      if (
        instruction.presetFieldset ||
        ((typeof instruction.branching === 'function' ? instruction.branching(data.config) : instruction.branching) &&
          downstream)
      ) {
        setPresetting({ data, instruction });
        return;
      }

      create(data);
    },
    [compile, create, engine.instructions],
  );

  return (
    <AddNodeContext.Provider value={{ presetting, setPresetting, onCreate, creating, setCreating }}>
      {props.children}
      <ActionContextProvider
        value={{
          visible: Boolean(presetting),
          setVisible: onModalCancel,
          formValueChanged,
          setFormValueChanged,
          openSize: 'small',
        }}
      >
        <SchemaComponent
          components={{
            DownstreamBranchIndex,
            PresetFieldset,
          }}
          scope={{
            useCancelAction,
            useAddNodeSubmitAction,
          }}
          schema={{
            name: `modal`,
            type: 'void',
            'x-decorator': 'FormV2',
            'x-decorator-props': {
              form,
            },
            'x-component': 'Action.Modal',
            title: `{{ t("Add node", { ns: "${NAMESPACE}" }) }}`,
            properties: {
              config: {
                type: 'void',
                'x-component': 'PresetFieldset',
              },
              downstreamBranchIndex: {
                type: 'void',
                'x-component': 'DownstreamBranchIndex',
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
                          useAction: '{{ useAddNodeSubmitAction }}',
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
    </AddNodeContext.Provider>
  );
}
